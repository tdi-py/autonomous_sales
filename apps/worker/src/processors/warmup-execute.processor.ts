import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';

import * as schema from '@autonomous-sales/database';
import { QUEUE_NAMES, type WarmupExecuteJobPayload } from '@autonomous-sales/shared';
import { DATABASE_TOKEN, logExecution } from '../database/database.module';

@Processor(QUEUE_NAMES.WARMUP_EXECUTE)
export class WarmupExecuteProcessor {
  private readonly logger = new Logger(WarmupExecuteProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  @Process()
  async handle(job: Job<WarmupExecuteJobPayload>) {
    const startTime = Date.now();
    const { projectId, emailAccountId } = job.data;

    this.logger.log(`[warmup-execute] Starting job ${job.id} — account: ${emailAccountId}`);

    try {
      // ─────────────────────────────────────────────────────────────────────
      // FAZ 2.5'TA BURAYA EKLENECEKLER:
      //   1. email_accounts tablosundan warmup_day ve daily_send_limit oku
      //   2. warmup_schedule tablosundan bugünkü target_sends hedefini al
      //   3. Warmup partner havuzuna (internal seed addresses) email gönder
      //   4. Gelen warmup emaillerini inbox'a taşı (IMAP MOVE)
      //   5. warmup_schedule.actual_sends'i güncelle
      //   6. email_accounts.warmup_day'i +1 artır
      //   7. warmup_day >= 30 ise status'ü 'ready'ye al
      //   8. SPF/DKIM/DMARC DNS kontrolü yap, health_score hesapla
      // ─────────────────────────────────────────────────────────────────────

      this.logger.log(`[warmup-execute] Job ${job.id} completed (placeholder)`);

      await logExecution({
        db: this.db as Parameters<typeof logExecution>[0]['db'],
        projectId,
        agentType: 'communicator',
        trigger: QUEUE_NAMES.WARMUP_EXECUTE,
        inputPayload: job.data,
        outputPayload: { status: 'placeholder', emailAccountId },
        status: 'success',
        durationMs: Date.now() - startTime,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[warmup-execute] Job ${job.id} failed: ${err.message}`);

      await logExecution({
        db: this.db as Parameters<typeof logExecution>[0]['db'],
        projectId,
        agentType: 'communicator',
        trigger: QUEUE_NAMES.WARMUP_EXECUTE,
        inputPayload: job.data,
        status: 'error',
        errorMessage: err.message,
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }
}