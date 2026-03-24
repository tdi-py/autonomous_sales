import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { eq } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { QUEUE_NAMES, type StrategyReviewJobPayload } from '@autonomous-sales/shared';
import { DATABASE_TOKEN, logExecution } from '../database/database.module';
import { StrategistService } from '../services/strategist.service';

@Processor(QUEUE_NAMES.STRATEGY_REVIEW)
export class StrategyReviewProcessor {
  private readonly logger = new Logger(StrategyReviewProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    @InjectQueue(QUEUE_NAMES.STRATEGY_REVIEW) private readonly strategyQueue: Queue,
    private readonly strategistService: StrategistService,
  ) {}

  // ─── Cron: Every day at 06:00 UTC ─────────────────────────────────────────

  @Cron('0 6 * * *')
  async scheduleAllProjects(): Promise<void> {
    this.logger.log('[strategy-cron] Scheduling daily strategy review for all active projects');

    try {
      const projects = await this.db.query.projects.findMany({
        where: eq(schema.projects.status, 'active'),
      }) as schema.Project[];

      if (projects.length === 0) {
        this.logger.log('[strategy-cron] No active projects to review');
        return;
      }

      // Queue with staggered delays to avoid Groq rate limits
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        await this.strategyQueue.add(
          {
            projectId: project.id,
            workspaceId: project.workspaceId,
            agentType: 'strategist',
          },
          {
            delay: i * 5000, // 5s between each project
            attempts: 2,
            backoff: { type: 'fixed', delay: 60_000 },
            jobId: `strategy-review-${project.id}-${Date.now()}`,
          },
        );
      }

      this.logger.log(`[strategy-cron] Queued ${projects.length} strategy review jobs`);
    } catch (err) {
      this.logger.error(`[strategy-cron] Failed to schedule: ${(err as Error).message}`);
    }
  }

  // ─── Process job ──────────────────────────────────────────────────────────

  @Process()
  async handle(job: Job<StrategyReviewJobPayload>) {
    const startTime = Date.now();
    const { projectId } = job.data;

    this.logger.log(`[strategy-review] Job ${job.id} — project: ${projectId}`);

    // Create an execution log entry
    let executionId: string = '';
    try {
      const [execution] = await (this.db as any)
        .insert(schema.agentExecutions)
        .values({
          projectId,
          agentType: 'strategist',
          trigger: QUEUE_NAMES.STRATEGY_REVIEW,
          inputPayload: job.data,
          outputPayload: {},
          status: 'running',
          tokensUsed: 0,
          durationMs: 0,
        })
        .returning();
      executionId = execution.id;
    } catch (err) {
      this.logger.warn(`[strategy-review] Failed to create execution log: ${(err as Error).message}`);
      executionId = `fallback-${Date.now()}`;
    }

    try {
      // Check if project has enough data to analyze
      const campaigns = await this.db.query.campaigns.findMany({
        where: eq(schema.campaigns.projectId, projectId),
      }) as schema.Campaign[];

      const activeCampaigns = campaigns.filter((c) => c.status === 'active');

      if (activeCampaigns.length === 0) {
        this.logger.log(`[strategy-review] No active campaigns for project ${projectId} — skipping`);

        await logExecution({
          db: this.db as Parameters<typeof logExecution>[0]['db'],
          projectId,
          agentType: 'strategist',
          trigger: QUEUE_NAMES.STRATEGY_REVIEW,
          inputPayload: job.data,
          outputPayload: { status: 'skipped', reason: 'no_active_campaigns' },
          status: 'success',
          durationMs: Date.now() - startTime,
        });
        return { skipped: true, reason: 'no_active_campaigns' };
      }

      // Run strategy review
      await this.strategistService.runStrategyReview(projectId, executionId);

      const durationMs = Date.now() - startTime;
      this.logger.log(`[strategy-review] Job ${job.id} completed in ${durationMs}ms`);

      // Update execution log
      await (this.db as any)
        .update(schema.agentExecutions)
        .set({
          status: 'success',
          durationMs,
          outputPayload: { campaignsAnalyzed: activeCampaigns.length },
        })
        .where(eq(schema.agentExecutions.id, executionId));

      return { success: true, projectId, campaignsAnalyzed: activeCampaigns.length };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[strategy-review] Job ${job.id} failed: ${err.message}`);

      await logExecution({
        db: this.db as Parameters<typeof logExecution>[0]['db'],
        projectId,
        agentType: 'strategist',
        trigger: QUEUE_NAMES.STRATEGY_REVIEW,
        inputPayload: job.data,
        status: 'error',
        errorMessage: err.message,
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }
}