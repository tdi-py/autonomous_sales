import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@autonomous-sales/database';
import { QUEUE_NAMES, type PhoneVerifyJobPayload } from '@autonomous-sales/shared';
import { DATABASE_TOKEN, logExecution } from '../database/database.module';

@Processor(QUEUE_NAMES.PHONE_VERIFY)
export class PhoneVerifyProcessor {
  private readonly logger = new Logger(PhoneVerifyProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  @Process()
  async handle(job: Job<PhoneVerifyJobPayload>) {
    const startTime = Date.now();
    const { projectId, leadId, phoneNumber } = job.data;

    this.logger.log(`[phone-verify] Starting job ${job.id} — lead: ${leadId}, phone: ${phoneNumber}`);

    try {
      // ─────────────────────────────────────────────────────────────────────
      // FAZ 4'TE BURAYA EKLENECEKLER:
      //   1. Numara tipini belirle (landline / mobile / voip)
      //      → Twilio Lookup API veya NumVerify
      //   2. DNC registry kontrolü
      //      → federal-dnc.gov API veya üçüncü parti (Telnyx, Twilio)
      //   3. Numaranın şirket web sitesinde listelenip listelenmediğini kontrol et
      //      → lead.website'yi fetch et, phoneNumber var mı?
      //   4. Sınıflandırma kararını ver:
      //      - landline + NOT dnc + publicly listed → CAN_CALL_AI (yeşil)
      //      - landline + NOT dnc + NOT listed     → CAN_CALL_MANUAL (sarı)
      //      - mobile + herhangi                   → CANNOT_CALL (kırmızı, consent gerek)
      //      - voip                                → CANNOT_CALL (kırmızı)
      //      - dnc listesinde                      → CANNOT_CALL (kırmızı)
      //   5. phone_verification tablosuna yaz
      // ─────────────────────────────────────────────────────────────────────

      // Placeholder: varsayılan olarak CANNOT_CALL yaz (güvenli taraf)
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
          classificationReason: 'Placeholder — phone verification not yet implemented',
        });
      }

      this.logger.log(`[phone-verify] Job ${job.id} completed (placeholder)`);

      await logExecution({
        db: this.db as Parameters<typeof logExecution>[0]['db'],
        projectId,
        agentType: 'analyzer',
        trigger: QUEUE_NAMES.PHONE_VERIFY,
        inputPayload: job.data,
        outputPayload: { status: 'placeholder', leadId, classification: 'cannot_call' },
        status: 'success',
        durationMs: Date.now() - startTime,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[phone-verify] Job ${job.id} failed: ${err.message}`);

      await logExecution({
        db: this.db as Parameters<typeof logExecution>[0]['db'],
        projectId,
        agentType: 'analyzer',
        trigger: QUEUE_NAMES.PHONE_VERIFY,
        inputPayload: job.data,
        status: 'error',
        errorMessage: err.message,
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }
}