import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { eq, and } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN, logExecution } from '../database/database.module';
import { VapiCallService } from '../services/vapi-call.service';

export interface ExecuteCallJobPayload {
  leadId: string;
  campaignId: string;
  projectId: string;
}

@Processor('execute-call')
export class ExecuteCallProcessor {
  private readonly logger = new Logger(ExecuteCallProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    private readonly vapiCallService: VapiCallService,
  ) {}

  @Process()
  async handle(job: Job<ExecuteCallJobPayload>) {
    const startTime = Date.now();
    const { leadId, campaignId, projectId } = job.data;

    this.logger.log(`[execute-call] Job ${job.id} — lead: ${leadId}, campaign: ${campaignId}`);

    try {
      // ── Step 1: Phone verification check ─────────────────────────────────
      const verification = await this.db.query.phoneVerification.findFirst({
        where: eq(schema.phoneVerification.leadId, leadId),
      }) as schema.PhoneVerification | null;

      if (!verification) {
        this.logger.warn(`[execute-call] No phone verification for lead ${leadId} — skipping`);
        return { skipped: true, reason: 'no_phone_verification' };
      }

      // HARD BLOCK: cannot_call leads are never called
      if (verification.aiCallClassification === 'cannot_call') {
        this.logger.log(`[execute-call] Lead ${leadId} is CANNOT_CALL — blocked at code level`);
        return { skipped: true, reason: 'cannot_call_classification' };
      }

      // ── Step 2: Compliance check (timezone + state rules) ─────────────────
      const timeCheck = this.vapiCallService.isCallTimeAllowed(verification.stateCode);
      if (!timeCheck.allowed) {
        this.logger.log(
          `[execute-call] Call time not allowed for lead ${leadId}: ${timeCheck.reason}`,
        );
        // Re-queue for next allowed time
        return { skipped: true, reason: 'calling_hours_restriction', nextAllowedAt: timeCheck.nextAllowedAt };
      }

      // Daily call limit check
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const callsToday = await this.db.query.outreachEvents.findMany({
        where: and(
          eq(schema.outreachEvents.leadId, leadId),
          eq(schema.outreachEvents.channel, 'call'),
        ),
      }) as schema.OutreachEvent[];

      const stateRule = this.vapiCallService.getStateRule(verification.stateCode ?? 'US');
      const callsTodayCount = callsToday.filter((e) => {
        return new Date(e.sentAt) >= today;
      }).length;

      if (callsTodayCount >= stateRule.maxCallsPerDay) {
        this.logger.log(
          `[execute-call] Daily call limit reached for lead ${leadId} (${callsTodayCount}/${stateRule.maxCallsPerDay})`,
        );
        return { skipped: true, reason: 'daily_call_limit_reached' };
      }

      // ── Step 3: Consent verification (mobile = requires AI consent) ───────
      if (verification.numberType === 'mobile' || verification.aiCallClassification !== 'can_call_ai') {
        const consentRecord = await this.db.query.callConsentRecords.findFirst({
          where: and(
            eq(schema.callConsentRecords.leadId, leadId),
            eq(schema.callConsentRecords.isValidForAi, true),
          ),
        }) as schema.CallConsentRecord | null;

        const hasValidConsent = consentRecord && !consentRecord.revokedAt;

        if (!hasValidConsent) {
          this.logger.log(
            `[execute-call] Mobile/non-AI lead ${leadId} without consent — marking script-only`,
          );
          return { skipped: true, reason: 'no_ai_consent_for_mobile', scriptOnly: true };
        }
      }

      // ── Step 4: Load required entities ────────────────────────────────────
      const [lead, campaign, callScript, projectAnalysis] = await Promise.all([
        this.db.query.leads.findFirst({ where: eq(schema.leads.id, leadId) }),
        this.db.query.campaigns.findFirst({ where: eq(schema.campaigns.id, campaignId) }),
        this.db.query.callScripts.findFirst({
          where: eq(schema.callScripts.campaignId, campaignId),
          orderBy: (t: any, { desc }: any) => [desc(t.version)],
        }),
        this.db.query.projectAnalysis.findFirst({
          where: eq(schema.projectAnalysis.projectId, projectId),
        }),
      ]) as [
        schema.Lead | null,
        schema.Campaign | null,
        schema.CallScript | null,
        schema.ProjectAnalysis | null,
      ];

      if (!lead || !campaign || !callScript) {
        this.logger.warn(
          `[execute-call] Missing entities — lead: ${!!lead}, campaign: ${!!campaign}, script: ${!!callScript}`,
        );
        return { skipped: true, reason: 'missing_required_entities' };
      }

      if (!lead.contactPhone) {
        this.logger.warn(`[execute-call] Lead ${leadId} has no phone number`);
        return { skipped: true, reason: 'no_phone_number' };
      }

      // ── Step 5: Create outreach event ─────────────────────────────────────
      const [outreachEvent] = await this.db
        .insert(schema.outreachEvents)
        .values({
          leadId,
          campaignId,
          channel: 'call',
          callScriptId: callScript.id,
          status: 'sent',
          sentAt: new Date(),
          metadata: {
            callType: 'ai_voice',
            phoneNumber: `****${lead.contactPhone.slice(-4)}`, // masked
            scriptVersion: callScript.version,
            classification: verification.aiCallClassification,
          },
        })
        .returning() as schema.OutreachEvent[];

      // ── Step 6: Initiate Vapi call ────────────────────────────────────────
      const callResult = await this.vapiCallService.initiateCall({
        leadId,
        campaignId,
        projectId,
        phoneNumber: lead.contactPhone,
        contactName: lead.contactName ?? 'there',
        companyName: lead.companyName ?? '',
        callScript,
        projectAnalysis: projectAnalysis ? {
          valueProposition: projectAnalysis.valueProposition ?? undefined,
          productDescription: projectAnalysis.productDescription ?? undefined,
          toneOfVoice: projectAnalysis.toneOfVoice ?? undefined,
        } : undefined,
      });

      if (!callResult.success) {
        if (callResult.scriptOnly) {
          // Update event to script-only mode
          await this.db
            .update(schema.outreachEvents)
            .set({
              status: 'failed',
              metadata: {
                ...(outreachEvent.metadata as Record<string, unknown>),
                scriptOnly: true,
                reason: 'vapi_not_configured',
              },
            })
            .where(eq(schema.outreachEvents.id, outreachEvent.id));

          return { success: false, scriptOnly: true, reason: 'vapi_not_configured' };
        }

        // Retry-able failure
        throw new Error(`Vapi call failed: ${callResult.error}`);
      }

      // Update event with Vapi call ID
      await this.db
        .update(schema.outreachEvents)
        .set({
          metadata: {
            ...(outreachEvent.metadata as Record<string, unknown>),
            vapiCallId: callResult.callId,
          },
        })
        .where(eq(schema.outreachEvents.id, outreachEvent.id));

      // Update lead status
      if (lead.status === 'new') {
        await this.db
          .update(schema.leads)
          .set({ status: 'contacted', updatedAt: new Date() })
          .where(eq(schema.leads.id, leadId));
      }

      // ── Step 7: Random delay before next call (60–180s) ───────────────────
      // (handled by the batch caller — not here)

      this.logger.log(
        `[execute-call] ✅ Call initiated — vapiCallId: ${callResult.callId}, lead: ${leadId}`,
      );

      await logExecution({
        db: this.db,
        projectId,
        agentType: 'communicator',
        trigger: 'execute-call',
        inputPayload: job.data,
        outputPayload: {
          vapiCallId: callResult.callId,
          classification: verification.aiCallClassification,
          outreachEventId: outreachEvent.id,
        },
        status: 'success',
        durationMs: Date.now() - startTime,
      });

      return {
        success: true,
        vapiCallId: callResult.callId,
        outreachEventId: outreachEvent.id,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[execute-call] Job ${job.id} failed: ${err.message}`);

      await logExecution({
        db: this.db,
        projectId,
        agentType: 'communicator',
        trigger: 'execute-call',
        inputPayload: job.data,
        status: 'error',
        errorMessage: err.message,
        durationMs: Date.now() - startTime,
      });

      throw error; // BullMQ will retry (max 2 attempts configured in worker.module)
    }
  }
}