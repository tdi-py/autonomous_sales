import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { eq } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { QUEUE_NAMES, type AnalyzeUrlJobPayload } from '@autonomous-sales/shared';
import { DATABASE_TOKEN, logExecution } from '../database/database.module';
import { ScraperService } from '../services/scraper.service';
import { AnalyzerService } from '../services/analyzer.service';

// Simple in-memory cooldown: projectId → last job timestamp
const cooldowns = new Map<string, number>();
const COOLDOWN_MS = 30_000;

@Processor(QUEUE_NAMES.ANALYZE_URL)
export class AnalyzeUrlProcessor {
  private readonly logger = new Logger(AnalyzeUrlProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    private readonly scraperService: ScraperService,
    private readonly analyzerService: AnalyzerService,
  ) {}

  @Process()
  async handle(job: Job<AnalyzeUrlJobPayload>) {
    const startTime = Date.now();
    const { projectId, websiteUrl } = job.data;

    this.logger.log(`[analyze-url] Job ${job.id} — project: ${projectId}, url: ${websiteUrl}`);

    // Cooldown check
    const lastRun = cooldowns.get(projectId);
    if (lastRun && Date.now() - lastRun < COOLDOWN_MS) {
      this.logger.warn(`[analyze-url] Cooldown active for project ${projectId}, skipping`);
      return { skipped: true, reason: 'cooldown' };
    }
    cooldowns.set(projectId, Date.now());

    try {
      // ── Step 0: Verify project exists (avoid FK violation on deleted projects) ──
      const projectExists = await this.db.query.projects.findFirst({
        where: eq(schema.projects.id, projectId),
        columns: { id: true },
      });
      if (!projectExists) {
        this.logger.warn(`[analyze-url] Project ${projectId} not found in DB — discarding job ${job.id}`);
        return { skipped: true, reason: 'project_not_found' };
      }

      // ── Step 1: Validate URL ────────────────────────────────────────────
      try {
        this.scraperService.validateUrl(websiteUrl);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await this.markAnalysisFailed(projectId, `URL validation failed: ${msg}`);
        throw err;
      }

      // ── Step 2: Scrape ──────────────────────────────────────────────────
      this.logger.log(`[analyze-url] Scraping ${websiteUrl}...`);
      let scrapedData: Awaited<ReturnType<ScraperService['scrape']>>;
      try {
        scrapedData = await this.scraperService.scrape(websiteUrl);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`[analyze-url] Scraping failed: ${msg}`);
        await this.markAnalysisFailed(projectId, `Scraping failed: ${msg}`);
        await logExecution({
          db: this.db,
          projectId,
          agentType: 'analyzer',
          trigger: QUEUE_NAMES.ANALYZE_URL,
          inputPayload: job.data,
          status: 'error',
          errorMessage: msg,
          durationMs: Date.now() - startTime,
        });
        throw err;
      }

      // Save raw scraped data
      await this.db
        .update(schema.projectAnalysis)
        .set({ rawScrapedData: scrapedData })
        .where(eq(schema.projectAnalysis.projectId, projectId));

      // ── Step 3: LLM Analysis ────────────────────────────────────────────
      this.logger.log(`[analyze-url] Running LLM analysis...`);
      const { result, tokensUsed, durationMs: llmDuration, model } =
        await this.analyzerService.analyze(projectId, scrapedData);

      // ── Step 4: Save to DB ──────────────────────────────────────────────
      this.logger.log(`[analyze-url] Saving results to DB...`);
      await this.analyzerService.saveToDatabase(projectId, result, model);

      const totalDuration = Date.now() - startTime;
      this.logger.log(
        `[analyze-url] Job ${job.id} completed in ${totalDuration}ms. Tokens: ${tokensUsed}`,
      );

      await logExecution({
        db: this.db,
        projectId,
        agentType: 'analyzer',
        trigger: QUEUE_NAMES.ANALYZE_URL,
        inputPayload: job.data,
        outputPayload: { industry: result.industry, businessType: result.business_type },
        status: 'success',
        tokensUsed,
        modelUsed: model,
        durationMs: totalDuration,
      });

      return { success: true, industry: result.industry };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[analyze-url] Job ${job.id} failed: ${err.message}`);

      await logExecution({
        db: this.db,
        projectId,
        agentType: 'analyzer',
        trigger: QUEUE_NAMES.ANALYZE_URL,
        inputPayload: job.data,
        status: 'error',
        errorMessage: err.message,
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }

  private async markAnalysisFailed(projectId: string, reason: string): Promise<void> {
    try {
      await this.db
        .update(schema.projectAnalysis)
        .set({ rawScrapedData: { error: reason, failedAt: new Date().toISOString() } })
        .where(eq(schema.projectAnalysis.projectId, projectId));
    } catch {
      // ignore secondary failure
    }
  }
}