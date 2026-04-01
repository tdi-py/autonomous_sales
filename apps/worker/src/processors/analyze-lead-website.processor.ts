import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';

import { QUEUE_NAMES, type AnalyzeLeadWebsiteJobPayload } from '@autonomous-sales/shared';
import { DATABASE_TOKEN, logExecution } from '../database/database.module';
import { LeadAnalyzerService } from '../services/lead-analyzer.service';

@Processor(QUEUE_NAMES.ANALYZE_LEAD_WEBSITE)
export class AnalyzeLeadWebsiteProcessor {
  private readonly logger = new Logger(AnalyzeLeadWebsiteProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    private readonly leadAnalyzerService: LeadAnalyzerService,
  ) {}

  @Process()
  async handle(job: Job<AnalyzeLeadWebsiteJobPayload>) {
    const startTime = Date.now();
    const { leadId, projectId } = job.data;

    this.logger.log(`[analyze-lead-website] Job ${job.id} — lead: ${leadId}`);

    try {
      const { result, tokensUsed, durationMs } = await this.leadAnalyzerService.analyzeLeadWebsite(
        leadId,
        projectId,
      );

      await logExecution({
        db: this.db,
        projectId,
        agentType: 'analyzer',
        trigger: QUEUE_NAMES.ANALYZE_LEAD_WEBSITE,
        inputPayload: job.data,
        outputPayload: {
          leadId,
          painPointsCount: result.painPoints.length,
          suggestedApproach: result.suggestedApproach,
        },
        tokensUsed,
        status: 'success',
        durationMs,
      });

      this.logger.log(`[analyze-lead-website] ✅ Job ${job.id} complete — ${result.painPoints.length} pain points found`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[analyze-lead-website] Job ${job.id} failed: ${err.message}`);

      await logExecution({
        db: this.db,
        projectId,
        agentType: 'analyzer',
        trigger: QUEUE_NAMES.ANALYZE_LEAD_WEBSITE,
        inputPayload: job.data,
        status: 'error',
        errorMessage: err.message,
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }
}
