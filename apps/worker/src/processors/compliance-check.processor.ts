import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { eq } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { QUEUE_NAMES, type ComplianceCheckJobPayload } from '@autonomous-sales/shared';
import { DATABASE_TOKEN, logExecution } from '../database/database.module';

@Processor(QUEUE_NAMES.COMPLIANCE_CHECK)
export class ComplianceCheckProcessor {
  private readonly logger = new Logger(ComplianceCheckProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  @Process()
  async handle(job: Job<ComplianceCheckJobPayload>) {
    const startTime = Date.now();
    const { projectId, outreachEventId, leadId, channel, targetCountry, targetState } = job.data;

    this.logger.log(
      `[compliance-check] Starting job ${job.id} — event: ${outreachEventId}, channel: ${channel}, country: ${targetCountry}`,
    );

    try {
      // ─────────────────────────────────────────────────────────────────────
      // FAZ 6'DA BURAYA EKLENECEKLER (EMAIL):
      //   1. compliance_rules'dan ülke/eyalet kurallarını çek
      //   2. Suppression list kontrolü
      //   3. CAN-SPAM zorunlulukları: fiziksel adres var mı? unsubscribe linki var mı?
      //   4. GDPR: hedef AB ülkesiyse legitimate interest dokümantasyonu var mı?
      //   5. CASL: hedef CA ise consent kaydı var mı?
      //
      // FAZ 6'DA BURAYA EKLENECEKLER (CALL):
      //   1. phone_verification tablosundan sınıflandırmayı oku
      //   2. call_consent_records tablosundan consent durumunu kontrol et
      //   3. Arama saati kuralları (Florida: 8-20, max 3/gün)
      //   4. California iki taraflı kayıt rızası kontrolü
      //   5. DNC listesi son kontrol
      //
      // ÖNEMLİ: Bu processor retry OLMADAN çalışır.
      // Başarısız olursa outreach_events.status = 'failed' olarak işaretlenir.
      // ─────────────────────────────────────────────────────────────────────

      // Placeholder: varsayılan olarak 'pass' döndür
      await this.db.insert(schema.complianceChecks).values({
        outreachEventId,
        checksPassed: ['placeholder_check'],
        overallResult: 'pass',
        blockedReason: null,
      });

      this.logger.log(`[compliance-check] Job ${job.id} completed — result: pass (placeholder)`);

      await logExecution({
        db: this.db as Parameters<typeof logExecution>[0]['db'],
        projectId,
        agentType: 'analyzer',
        trigger: QUEUE_NAMES.COMPLIANCE_CHECK,
        inputPayload: job.data,
        outputPayload: { result: 'pass', status: 'placeholder' },
        status: 'success',
        durationMs: Date.now() - startTime,
      });

      return { result: 'pass' };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[compliance-check] Job ${job.id} failed: ${err.message}`);

      // Compliance başarısız → outreach event'i 'failed' olarak işaretle
      try {
        await this.db
          .update(schema.outreachEvents)
          .set({ status: 'failed', metadata: { complianceError: err.message } })
          .where(eq(schema.outreachEvents.id, outreachEventId));
      } catch {
        // ignore secondary failure
      }

      await logExecution({
        db: this.db as Parameters<typeof logExecution>[0]['db'],
        projectId,
        agentType: 'analyzer',
        trigger: QUEUE_NAMES.COMPLIANCE_CHECK,
        inputPayload: job.data,
        status: 'error',
        errorMessage: err.message,
        durationMs: Date.now() - startTime,
      });

      // COMPLIANCE_CHECK kuyruğunda retry YOK — throw etmeyiz, sadece loglarız
      // Böylece BullMQ failed job olarak işaretler ama retry denemez
    }
  }
}