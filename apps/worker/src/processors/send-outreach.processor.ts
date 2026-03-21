import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';

import * as schema from '@autonomous-sales/database';
import { QUEUE_NAMES, type SendOutreachJobPayload } from '@autonomous-sales/shared';
import { DATABASE_TOKEN, logExecution } from '../database/database.module';

@Processor(QUEUE_NAMES.SEND_OUTREACH)
export class SendOutreachProcessor {
  private readonly logger = new Logger(SendOutreachProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  @Process()
  async handle(job: Job<SendOutreachJobPayload>) {
    const startTime = Date.now();
    const { projectId, leadId, campaignId, sequenceStepId, emailAccountId } = job.data;

    this.logger.log(`[send-outreach] Starting job ${job.id} — lead: ${leadId}`);

    try {
      // ─────────────────────────────────────────────────────────────────────
      // FAZ 3'TE BURAYA EKLENECEKLER:
      //   1. Suppression list kontrolü (email daha önce unsub/bounce?)
      //   2. Compliance check kuyruğunu çalıştır, approved değilse dur
      //   3. Lead verilerini oku, template'i personalize et
      //   4. Email account SMTP credentials'ından gönder (Nodemailer)
      //   5. outreach_events tablosuna 'sent' olarak kaydet
      //   6. Daily send limit kontrolü (email_accounts.daily_send_limit)
      //   7. Open/click tracking için pixel ve link wrap ekle
      // ─────────────────────────────────────────────────────────────────────

      this.logger.log(`[send-outreach] Job ${job.id} completed (placeholder)`);

      await logExecution({
        db: this.db as Parameters<typeof logExecution>[0]['db'],
        projectId,
        agentType: 'communicator',
        trigger: QUEUE_NAMES.SEND_OUTREACH,
        inputPayload: job.data,
        outputPayload: { status: 'placeholder', leadId, campaignId },
        status: 'success',
        durationMs: Date.now() - startTime,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[send-outreach] Job ${job.id} failed: ${err.message}`);

      await logExecution({
        db: this.db as Parameters<typeof logExecution>[0]['db'],
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
}