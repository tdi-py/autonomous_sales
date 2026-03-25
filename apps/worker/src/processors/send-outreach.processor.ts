import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { eq, and } from 'drizzle-orm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

import * as schema from '@autonomous-sales/database';
import { QUEUE_NAMES, type SendOutreachJobPayload } from '@autonomous-sales/shared';
import { DATABASE_TOKEN, logExecution } from '../database/database.module';
import { EmailSenderService } from '../services/email-sender.service';
import { BounceHandlerService } from '../services/bounce-handler.service';
import { VapiCallService } from '../services/vapi-call.service';
import { ComplianceEngineService } from '../services/compliance-engine.service';

// ─── Multi-channel sequence step type ────────────────────────────────────────

interface SequenceStep {
  day: number;
  channel: 'email' | 'call';
  step: number;
}

@Processor(QUEUE_NAMES.SEND_OUTREACH)
export class SendOutreachProcessor {
  private readonly logger = new Logger(SendOutreachProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    @InjectQueue(QUEUE_NAMES.SEND_OUTREACH) private readonly sendQueue: Queue,
    @InjectQueue('execute-call') private readonly executeCallQueue: Queue,
    private readonly emailSenderService: EmailSenderService,
    private readonly bounceHandlerService: BounceHandlerService,
    private readonly vapiCallService: VapiCallService,
    private readonly complianceEngine: ComplianceEngineService,
  ) {}

  // ─── Campaign Batch Job ───────────────────────────────────────────────────

  @Process('campaign-batch')
  async handleCampaignBatch(job: Job<{ campaignId: string; projectId: string }>) {
    const { campaignId, projectId } = job.data;
    this.logger.log(`[send-outreach] Campaign batch — campaign: ${campaignId}`);

    // 1. Check campaign still active
    const campaign = await this.db.query.campaigns.findFirst({
      where: eq(schema.campaigns.id, campaignId),
    }) as schema.Campaign | null;

    if (!campaign || campaign.status !== 'active') {
      this.logger.log(`[send-outreach] Campaign ${campaignId} not active — skipping`);
      return;
    }

    const settings = (campaign.settings ?? {}) as Record<string, unknown>;
    const leadIds = (settings.leadIds as string[]) ?? [];
    const isMultiChannel = campaign.type === 'multi_channel';

    if (leadIds.length === 0) {
      this.logger.log(`[send-outreach] No leads for campaign ${campaignId}`);
      return;
    }

    if (isMultiChannel) {
      await this.processMultiChannelBatch(campaignId, projectId, leadIds, campaign, settings);
      return;
    }

    await this.processEmailBatch(campaignId, projectId, leadIds, campaign, settings);
  }

  // ─── Multi-Channel Batch ──────────────────────────────────────────────────

  private async processMultiChannelBatch(
    campaignId: string,
    projectId: string,
    leadIds: string[],
    campaign: schema.Campaign,
    settings: Record<string, unknown>,
  ) {
    const sequence = (settings.sequence as SequenceStep[]) ?? this.getDefaultMultiChannelSequence();
    const BATCH_SIZE = 10;
    let processed = 0;

    for (const leadId of leadIds.slice(0, BATCH_SIZE)) {
      try {
        const nextStep = await this.getNextMultiChannelStep(leadId, campaignId, sequence);

        if (!nextStep) {
          this.logger.log(`[send-outreach] Lead ${leadId} — multi-channel sequence complete`);
          continue;
        }

        if (nextStep.channel === 'email') {
          await this.processLeadEmail({ leadId, campaignId, projectId, campaign });
        } else if (nextStep.channel === 'call') {
          await this.processLeadCall(leadId, campaignId, projectId);
        }

        processed++;

        if (processed < leadIds.length) {
          await this.emailSenderService.randomDelay(30, 90);
        }
      } catch (err) {
        this.logger.error(`[send-outreach] Lead ${leadId} failed: ${(err as Error).message}`);
      }
    }

    this.logger.log(`[send-outreach] Multi-channel batch done — processed: ${processed}`);
  }

  // ─── Determine next multi-channel step ────────────────────────────────────

  private async getNextMultiChannelStep(
    leadId: string,
    campaignId: string,
    sequence: SequenceStep[],
  ): Promise<SequenceStep | null> {
    const previousEvents = await this.db.query.outreachEvents.findMany({
      where: and(
        eq(schema.outreachEvents.leadId, leadId),
        eq(schema.outreachEvents.campaignId, campaignId),
      ),
      orderBy: (t: any, { asc }: any) => [asc(t.sentAt)],
    }) as schema.OutreachEvent[];

    const hasReplied = previousEvents.some((e) => e.status === 'replied');
    if (hasReplied) return null;

    const emailStepsDone = previousEvents.filter((e) => e.channel === 'email').length;
    const callStepsDone = previousEvents.filter((e) => e.channel === 'call').length;

    const sortedSequence = [...sequence].sort((a, b) => a.day - b.day);

    let emailIdx = 0;
    let callIdx = 0;

    for (const step of sortedSequence) {
      if (step.channel === 'email') {
        if (emailIdx >= emailStepsDone) {
          const lastEvent = previousEvents[previousEvents.length - 1];
          if (!lastEvent || step.day === 0) return step;
          const daysSinceLastSend = (Date.now() - new Date(lastEvent.sentAt).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLastSend >= step.day) return step;
          return null;
        }
        emailIdx++;
      } else if (step.channel === 'call') {
        if (callIdx >= callStepsDone) {
          const lastEvent = previousEvents[previousEvents.length - 1];
          if (!lastEvent) return step;
          const daysSinceLastSend = (Date.now() - new Date(lastEvent.sentAt).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLastSend >= step.day) return step;
          return null;
        }
        callIdx++;
      }
    }

    return null;
  }

  // ─── Email-only batch ─────────────────────────────────────────────────────

  private async processEmailBatch(
    campaignId: string,
    projectId: string,
    leadIds: string[],
    campaign: schema.Campaign,
    settings: Record<string, unknown>,
  ) {
    const emailAccounts = await this.db.query.emailAccounts.findMany({
      where: eq(schema.emailAccounts.projectId, projectId),
    }) as schema.EmailAccount[];

    const emailAccount = emailAccounts.find((a) => a.warmupStatus === 'ready')
      ?? emailAccounts.find((a) => a.warmupStatus === 'warming')
      ?? emailAccounts[0];

    if (!emailAccount) {
      this.logger.warn(`[send-outreach] No email account for project ${projectId}`);
      return;
    }

    const sequences = await this.db.query.emailSequences.findMany({
      where: eq(schema.emailSequences.campaignId, campaignId),
      orderBy: (t: any, { asc }: any) => [asc(t.stepOrder), asc(t.variantLabel)],
    }) as schema.EmailSequence[];

    const BATCH_SIZE = 10;
    let processed = 0;

    for (const leadId of leadIds.slice(0, BATCH_SIZE)) {
      try {
        await this.processLead({ leadId, campaignId, projectId, sequences, emailAccount, campaign });
        processed++;

        if (processed < leadIds.length) {
          await this.emailSenderService.randomDelay(30, 90);
        }
      } catch (err) {
        this.logger.error(`[send-outreach] Lead ${leadId} failed: ${(err as Error).message}`);
      }
    }

    this.logger.log(`[send-outreach] Email batch done — processed: ${processed}`);
  }

  // ─── Process single lead email ────────────────────────────────────────────

  private async processLeadEmail(params: {
    leadId: string;
    campaignId: string;
    projectId: string;
    campaign: schema.Campaign;
  }) {
    const { leadId, campaignId, projectId, campaign } = params;

    const emailAccounts = await this.db.query.emailAccounts.findMany({
      where: eq(schema.emailAccounts.projectId, projectId),
    }) as schema.EmailAccount[];

    const emailAccount = emailAccounts.find((a) => a.warmupStatus === 'ready')
      ?? emailAccounts.find((a) => a.warmupStatus === 'warming')
      ?? emailAccounts[0];

    if (!emailAccount) return;

    const sequences = await this.db.query.emailSequences.findMany({
      where: eq(schema.emailSequences.campaignId, campaignId),
      orderBy: (t: any, { asc }: any) => [asc(t.stepOrder), asc(t.variantLabel)],
    }) as schema.EmailSequence[];

    await this.processLead({ leadId, campaignId, projectId, sequences, emailAccount, campaign });
  }

  // ─── Process single lead call ─────────────────────────────────────────────

  private async processLeadCall(leadId: string, campaignId: string, projectId: string) {
    const verification = await this.db.query.phoneVerification.findFirst({
      where: eq(schema.phoneVerification.leadId, leadId),
    }) as schema.PhoneVerification | null;

    if (!verification) {
      this.logger.log(`[send-outreach] Lead ${leadId} — no phone verification, skipping call step`);
      return;
    }

    if (verification.aiCallClassification === 'cannot_call') {
      this.logger.log(`[send-outreach] Lead ${leadId} — CANNOT_CALL, skipping call step`);
      return;
    }

    if (verification.aiCallClassification === 'can_call_manual') {
      this.logger.log(`[send-outreach] Lead ${leadId} — CAN_CALL_MANUAL only, script-only`);
      return;
    }

    await this.executeCallQueue.add(
      { leadId, campaignId, projectId },
      {
        attempts: 2,
        backoff: { type: 'fixed', delay: 60_000 },
        delay: Math.floor(Math.random() * 60_000) + 60_000,
      },
    );

    this.logger.log(`[send-outreach] Queued AI call for lead ${leadId}`);
  }

  // ─── Single Lead Processing (email) ──────────────────────────────────────

  private async processLead(params: {
    leadId: string;
    campaignId: string;
    projectId: string;
    sequences: schema.EmailSequence[];
    emailAccount: schema.EmailAccount;
    campaign: schema.Campaign;
  }) {
    const { leadId, campaignId, projectId, sequences, emailAccount, campaign } = params;

    const lead = await this.db.query.leads.findFirst({
      where: eq(schema.leads.id, leadId),
    }) as schema.Lead | null;

    if (!lead || !lead.contactEmail) return;

    const suppressed = await this.bounceHandlerService.isSuppressed(projectId, lead.contactEmail);
    if (suppressed) return;

    // Determine next email step
    const previousEvents = await this.db.query.outreachEvents.findMany({
      where: and(
        eq(schema.outreachEvents.leadId, leadId),
        eq(schema.outreachEvents.campaignId, campaignId),
        eq(schema.outreachEvents.channel, 'email'),
      ),
      orderBy: (t: any, { asc }: any) => [asc(t.sentAt)],
    }) as schema.OutreachEvent[];

    const hasReplied = previousEvents.some((e) => e.status === 'replied');
    if (hasReplied) return;

    const sentSteps = new Set<number>();
    for (const event of previousEvents) {
      const meta = (event.metadata ?? {}) as Record<string, unknown>;
      if (typeof meta.stepOrder === 'number') sentSteps.add(meta.stepOrder);
    }

    const allStepOrders = [...new Set(sequences.map((s) => s.stepOrder))].sort((a, b) => a - b);
    let nextStepOrder: number | null = null;

    for (const stepOrder of allStepOrders) {
      if (!sentSteps.has(stepOrder)) {
        const stepSeq = sequences.find((s) => s.stepOrder === stepOrder);
        const delayDays = stepSeq?.delayDays ?? 0;

        if (delayDays === 0) { nextStepOrder = stepOrder; break; }

        const lastEvent = previousEvents[previousEvents.length - 1];
        if (lastEvent) {
          const daysSince = (Date.now() - new Date(lastEvent.sentAt).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince >= delayDays) { nextStepOrder = stepOrder; break; }
        }
      }
    }

    if (nextStepOrder === null) return;

    const dailyCheck = await this.emailSenderService.checkDailyLimit(emailAccount.id);
    if (!dailyCheck.allowed) return;

    const variant = this.emailSenderService.selectVariant(leadId);
    const sequence = sequences.find((s) => s.stepOrder === nextStepOrder && s.variantLabel === variant)
      ?? sequences.find((s) => s.stepOrder === nextStepOrder && s.variantLabel === 'A')
      ?? sequences.find((s) => s.stepOrder === nextStepOrder);

    if (!sequence) return;

    // ── Step 3: COMPLIANCE CHECK ────────────────────────────────────────────
    const personalizedSubject = sequence.subjectTemplate
      .replace(/\{\{first_name\}\}/g, lead.contactName?.split(' ')[0] ?? 'there')
      .replace(/\{\{company_name\}\}/g, lead.companyName ?? '');

    const personalizedBody = sequence.bodyTemplate
      .replace(/\{\{first_name\}\}/g, lead.contactName?.split(' ')[0] ?? 'there')
      .replace(/\{\{company_name\}\}/g, lead.companyName ?? '');

    // Create a placeholder outreach event ID for compliance check
    const [outreachEvent] = await this.db
      .insert(schema.outreachEvents)
      .values({
        leadId,
        campaignId,
        channel: 'email',
        sequenceStepId: sequence.id,
        status: 'sent',
        sentAt: new Date(),
        metadata: {
          stepOrder: nextStepOrder,
          variant,
          emailAccountId: emailAccount.id,
          subject: sequence.subjectTemplate.slice(0, 100),
          bodyPreview: personalizedBody.slice(0, 200),
        },
      })
      .returning() as schema.OutreachEvent[];

    const complianceResult = await this.complianceEngine.runComplianceCheck({
      leadId: lead.id,
      campaignId: campaign.id,
      projectId,
      outreachEventId: outreachEvent.id,
      channel: 'email',
      emailContent: { subject: personalizedSubject, body: personalizedBody },
    });

    if (!complianceResult.approved) {
      this.logger.warn(
        `[send-outreach] Compliance blocked lead ${leadId}: ${complianceResult.blockers.join(', ')}`,
      );
      await this.db
        .update(schema.outreachEvents)
        .set({
          status: 'failed',
          metadata: {
            ...(outreachEvent.metadata as Record<string, unknown>),
            blockedBy: 'compliance',
            reasons: complianceResult.blockers,
          },
        })
        .where(eq(schema.outreachEvents.id, outreachEvent.id));
      return;
    }
    // ────────────────────────────────────────────────────────────────────────

    const campaignSettings = (campaign.settings ?? {}) as Record<string, unknown>;
    const result = await this.emailSenderService.sendOutreachEmail({
      lead,
      emailSequence: sequence,
      emailAccount,
      outreachEventId: outreachEvent.id,
      campaignSettings,
    });

    if (result.success) {
      if (lead.status === 'new') {
        await this.db
          .update(schema.leads)
          .set({ status: 'contacted', updatedAt: new Date() })
          .where(eq(schema.leads.id, leadId));
      }
      await this.bounceHandlerService.checkBounceRate(campaignId);
    } else {
      if (result.bounceType) {
        await this.bounceHandlerService.handleBounce(outreachEvent.id, result.bounceType, result.error ?? '');
      } else {
        await this.db
          .update(schema.outreachEvents)
          .set({
            status: 'failed',
            metadata: {
              ...(outreachEvent.metadata as Record<string, unknown>),
              error: result.error,
            },
          })
          .where(eq(schema.outreachEvents.id, outreachEvent.id));
      }
    }
  }

  // ─── Default Handler ──────────────────────────────────────────────────────

  @Process()
  async handle(job: Job<SendOutreachJobPayload>) {
    const startTime = Date.now();
    const { projectId, leadId, campaignId, sequenceStepId, emailAccountId } = job.data;

    this.logger.log(`[send-outreach] Single job ${job.id} — lead: ${leadId}`);

    try {
      const [lead, emailAccount, sequence, campaign] = await Promise.all([
        this.db.query.leads.findFirst({ where: eq(schema.leads.id, leadId) }),
        this.db.query.emailAccounts.findFirst({ where: eq(schema.emailAccounts.id, emailAccountId) }),
        this.db.query.emailSequences.findFirst({ where: eq(schema.emailSequences.id, sequenceStepId) }),
        this.db.query.campaigns.findFirst({ where: eq(schema.campaigns.id, campaignId) }),
      ]) as [schema.Lead | null, schema.EmailAccount | null, schema.EmailSequence | null, schema.Campaign | null];

      if (!lead || !emailAccount || !sequence || !campaign) throw new Error('Missing required entities');

      const sequences = await this.db.query.emailSequences.findMany({
        where: eq(schema.emailSequences.campaignId, campaignId),
      }) as schema.EmailSequence[];

      await this.processLead({ leadId, campaignId, projectId, sequences, emailAccount, campaign });

      await logExecution({
        db: this.db,
        projectId,
        agentType: 'communicator',
        trigger: QUEUE_NAMES.SEND_OUTREACH,
        inputPayload: job.data,
        outputPayload: { leadId, campaignId, status: 'processed' },
        status: 'success',
        durationMs: Date.now() - startTime,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[send-outreach] Job ${job.id} failed: ${err.message}`);
      await logExecution({
        db: this.db,
        projectId,
        agentType: 'communicator',
        trigger: QUEUE_NAMES.SEND_OUTREACH,
        inputPayload: job.data,
        status: 'error',
        errorMessage: err.message,
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private getDefaultMultiChannelSequence(): SequenceStep[] {
    return [
      { day: 0, channel: 'email', step: 1 },
      { day: 3, channel: 'email', step: 2 },
      { day: 5, channel: 'call', step: 1 },
      { day: 7, channel: 'email', step: 3 },
    ];
  }
}