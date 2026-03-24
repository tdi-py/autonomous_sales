import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { eq } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { QUEUE_NAMES } from '@autonomous-sales/shared';
import { DATABASE_TOKEN } from '../database/database.module';

/**
 * WarmupCronService — fires daily at 09:00 UTC.
 * Finds all accounts in 'warming' state and queues warmup-execute jobs.
 *
 * This service is the cron scheduler; the actual work is done by
 * WarmupExecuteProcessor (BullMQ) and WarmupService.
 */
@Injectable()
export class WarmupCronService {
  private readonly logger = new Logger(WarmupCronService.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    @InjectQueue(QUEUE_NAMES.WARMUP_EXECUTE) private readonly warmupQueue: Queue,
  ) {}

  /**
   * Every day at 09:00 UTC — queue warmup jobs for all warming accounts.
   * CronExpression.EVERY_DAY_AT_9AM = '0 9 * * *'
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async runDailyWarmup() {
    this.logger.log('[warmup-cron] Daily warmup cron triggered');

    try {
      // Find all accounts currently in warming state
      const warmingAccounts = await this.db.query.emailAccounts.findMany({
        where: eq(schema.emailAccounts.warmupStatus, 'warming'),
      }) as schema.EmailAccount[];

      if (warmingAccounts.length === 0) {
        this.logger.log('[warmup-cron] No accounts currently in warming state');
        return;
      }

      this.logger.log(`[warmup-cron] Found ${warmingAccounts.length} account(s) to warm`);

      // Queue a warmup-execute job for each account
      // Jobs run serially per account (the processor handles delays between emails)
      for (const account of warmingAccounts) {
        await this.warmupQueue.add(
          {
            emailAccountId: account.id,
            projectId: account.projectId,
            workspaceId: '', // resolved by the processor via DB
            agentType: 'communicator',
          },
          {
            attempts: 2,
            backoff: { type: 'fixed', delay: 60_000 }, // retry after 1 min on failure
            removeOnComplete: true,
            removeOnFail: false,
          },
        );

        this.logger.log(
          `[warmup-cron] Queued warmup for: ${account.emailAddress} (day ${account.warmupDay})`,
        );
      }

      this.logger.log(`[warmup-cron] Queued ${warmingAccounts.length} warmup job(s)`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[warmup-cron] Failed to queue warmup jobs: ${err.message}`);
    }
  }
}
