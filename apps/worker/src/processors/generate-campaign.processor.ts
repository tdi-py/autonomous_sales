import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';

import * as schema from '@autonomous-sales/database';
import { QUEUE_NAMES, type GenerateCampaignContentJobPayload } from '@autonomous-sales/shared';
import { DATABASE_TOKEN, logExecution } from '../database/database.module';

@Processor(QUEUE_NAMES.GENERATE_CAMPAIGN_CONTENT)
export class GenerateCampaignProcessor {
  private readonly logger = new Logger(GenerateCampaignProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  @Process()
  async handle(job: Job<GenerateCampaignContentJobPayload>) {
    const startTime = Date.now();
    const { projectId, campaignId } = job.data;

    this.logger.log(`[generate-campaign] Starting job ${job.id} — campaign: ${campaignId}`);

    try {
      // ─────────────────────────────────────────────────────────────────────
      // FAZ 2'DE BURAYA EKLENECEKLER:
      //   1. project_analysis ve icp_profiles'dan context oku
      //   2. GroqProvider ile Communicator Agent'ı çalıştır (Llama 4 Scout)
      //   3. Çok adımlı email sequence üret (3-5 adım)
      //   4. Call script ve objection handler'ları üret
      //   5. email_sequences ve call_scripts tablolarına yaz
      //   6. Platform learned rules'u prompt'a dahil et
      // ─────────────────────────────────────────────────────────────────────

      this.logger.log(`[generate-campaign] Job ${job.id} completed (placeholder)`);

      await logExecution({
        db: this.db as Parameters<typeof logExecution>[0]['db'],
        projectId,
        agentType: 'communicator',
        trigger: QUEUE_NAMES.GENERATE_CAMPAIGN_CONTENT,
        inputPayload: job.data,
        outputPayload: { status: 'placeholder', campaignId },
        status: 'success',
        durationMs: Date.now() - startTime,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[generate-campaign] Job ${job.id} failed: ${err.message}`);

      await logExecution({
        db: this.db as Parameters<typeof logExecution>[0]['db'],
        projectId,
        agentType: 'communicator',
        trigger: QUEUE_NAMES.GENERATE_CAMPAIGN_CONTENT,
        inputPayload: job.data,
        status: 'error',
        errorMessage: err.message,
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }
}