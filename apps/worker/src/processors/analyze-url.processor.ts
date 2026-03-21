import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';

import * as schema from '@autonomous-sales/database';
import { QUEUE_NAMES, type AnalyzeUrlJobPayload } from '@autonomous-sales/shared';
import { DATABASE_TOKEN, logExecution } from '../database/database.module';

@Processor(QUEUE_NAMES.ANALYZE_URL)
export class AnalyzeUrlProcessor {
  private readonly logger = new Logger(AnalyzeUrlProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  @Process()
  async handle(job: Job<AnalyzeUrlJobPayload>) {
    const startTime = Date.now();
    const { projectId, websiteUrl } = job.data;

    this.logger.log(`[analyze-url] Starting job ${job.id} — project: ${projectId}, url: ${websiteUrl}`);

    try {
      // ─────────────────────────────────────────────────────────────────────
      // FAZ 1'DE BURAYA EKLENECEKLER:
      //   1. Playwright ile websiteUrl'i scrape et
      //   2. GroqProvider ile Analyzer Agent'ı çalıştır (Qwen3-32B)
      //   3. ICP profili çıkar, value proposition belirle
      //   4. project_analysis tablosunu güncelle
      //   5. icp_profiles tablosuna yaz
      // ─────────────────────────────────────────────────────────────────────

      this.logger.log(`[analyze-url] Job ${job.id} completed (placeholder)`);

      await logExecution({
        db: this.db as Parameters<typeof logExecution>[0]['db'],
        projectId,
        agentType: 'analyzer',
        trigger: QUEUE_NAMES.ANALYZE_URL,
        inputPayload: job.data,
        outputPayload: { status: 'placeholder', message: 'Analyzer Agent not yet implemented' },
        status: 'success',
        durationMs: Date.now() - startTime,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[analyze-url] Job ${job.id} failed: ${err.message}`);

      await logExecution({
        db: this.db as Parameters<typeof logExecution>[0]['db'],
        projectId,
        agentType: 'analyzer',
        trigger: QUEUE_NAMES.ANALYZE_URL,
        inputPayload: job.data,
        status: 'error',
        errorMessage: err.message,
        durationMs: Date.now() - startTime,
      });

      throw error; // BullMQ retry mekanizması devreye girsin
    }
  }
}