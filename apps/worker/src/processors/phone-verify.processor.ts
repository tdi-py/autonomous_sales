import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { eq } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { QUEUE_NAMES, type PhoneVerifyJobPayload } from '@autonomous-sales/shared';
import { DATABASE_TOKEN, logExecution } from '../database/database.module';
import { PhoneVerifierService } from '../services/phone-verifier.service';

@Processor(QUEUE_NAMES.PHONE_VERIFY)
export class PhoneVerifyProcessor {
  private readonly logger = new Logger(PhoneVerifyProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    private readonly phoneVerifierService: PhoneVerifierService,
  ) {}

  @Process()
  async handle(job: Job<PhoneVerifyJobPayload>) {
    const startTime = Date.now();
    const { projectId, leadId, phoneNumber } = job.data;

    this.logger.log(
      `[phone-verify] Starting job ${job.id} — lead: ${leadId}, phone: ${this.phoneVerifierService.maskPhone(phoneNumber)}`,
    );

    try {
      // ── Load lead to get website URL for public listing check ─────────────
      const lead = await this.db.query.leads.findFirst({
        where: eq(schema.leads.id, leadId),
      }) as schema.Lead | null;

      if (!lead) {
        this.logger.warn(`[phone-verify] Lead ${leadId} not found — skipping`);
        return { skipped: true, reason: 'lead_not_found' };
      }

      // ── Check if consent exists (affects classification) ──────────────────
      const consentRecord = await this.db.query.callConsentRecords.findFirst({
        where: eq(schema.callConsentRecords.leadId, leadId),
      }) as schema.CallConsentRecord | null;

      const hasValidAiConsent = consentRecord?.isValidForAi === true && !consentRecord.revokedAt;

      // ── Run 4-step verification ────────────────────────────────────────────
      const result = await this.phoneVerifierService.verify(
        phoneNumber,
        lead.website ?? undefined,
      );

      // Override classification if consent exists
      let finalClassification = result.aiCallClassification;
      let finalReason = result.classificationReason;

      if (hasValidAiConsent && result.aiCallClassification === 'cannot_call') {
        // Re-classify with consent
        const withConsent = this.phoneVerifierService.classify({
          numberType: result.numberType,
          isOnDnc: result.isOnDnc,
          isPubliclyListed: result.isPubliclyListed,
          hasValidAiConsent: true,
        });
        finalClassification = withConsent.classification;
        finalReason = withConsent.reason;
      }

      // ── Upsert phone_verification record ─────────────────────────────────
      const existing = await this.db.query.phoneVerification.findFirst({
        where: eq(schema.phoneVerification.leadId, leadId),
      });

      if (existing) {
        await this.db
          .update(schema.phoneVerification)
          .set({
            phoneNumber,
            numberType: result.numberType,
            carrier: result.carrier,
            isOnDnc: result.isOnDnc,
            dncCheckedAt: result.dncCheckedAt,
            isPubliclyListed: result.isPubliclyListed,
            publicSource: result.publicSource,
            publicSourceUrl: result.publicSourceUrl,
            countryCode: result.countryCode,
            stateCode: result.stateCode,
            aiCallEligible: finalClassification === 'can_call_ai',
            aiCallClassification: finalClassification,
            classificationReason: finalReason,
            verifiedAt: result.verifiedAt,
          })
          .where(eq(schema.phoneVerification.leadId, leadId));
      } else {
        await this.db.insert(schema.phoneVerification).values({
          leadId,
          phoneNumber,
          numberType: result.numberType,
          carrier: result.carrier,
          isOnDnc: result.isOnDnc,
          dncCheckedAt: result.dncCheckedAt,
          isPubliclyListed: result.isPubliclyListed,
          publicSource: result.publicSource,
          publicSourceUrl: result.publicSourceUrl,
          countryCode: result.countryCode,
          stateCode: result.stateCode,
          aiCallEligible: finalClassification === 'can_call_ai',
          aiCallClassification: finalClassification,
          classificationReason: finalReason,
          verifiedAt: result.verifiedAt,
        });
      }

      this.logger.log(
        `[phone-verify] Job ${job.id} complete — classification: ${finalClassification}`,
      );

      await logExecution({
        db: this.db,
        projectId,
        agentType: 'analyzer',
        trigger: QUEUE_NAMES.PHONE_VERIFY,
        inputPayload: { ...job.data, phoneNumber: this.phoneVerifierService.maskPhone(phoneNumber) },
        outputPayload: {
          leadId,
          numberType: result.numberType,
          isOnDnc: result.isOnDnc,
          isPubliclyListed: result.isPubliclyListed,
          classification: finalClassification,
        },
        status: 'success',
        durationMs: Date.now() - startTime,
      });

      return {
        success: true,
        leadId,
        classification: finalClassification,
        numberType: result.numberType,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[phone-verify] Job ${job.id} failed: ${err.message}`);

      // On error: write a safe fallback record
      try {
        const existing = await this.db.query.phoneVerification.findFirst({
          where: eq(schema.phoneVerification.leadId, leadId),
        });

        if (!existing) {
          await this.db.insert(schema.phoneVerification).values({
            leadId,
            phoneNumber,
            numberType: 'unknown',
            isOnDnc: false,
            aiCallEligible: false,
            aiCallClassification: 'cannot_call',
            classificationReason: `Verification failed: ${err.message}`,
          });
        }
      } catch {
        // ignore secondary failure
      }

      await logExecution({
        db: this.db,
        projectId,
        agentType: 'analyzer',
        trigger: QUEUE_NAMES.PHONE_VERIFY,
        inputPayload: { ...job.data, phoneNumber: this.phoneVerifierService.maskPhone(phoneNumber) },
        status: 'error',
        errorMessage: err.message,
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }
}