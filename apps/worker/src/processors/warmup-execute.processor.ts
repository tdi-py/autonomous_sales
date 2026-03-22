import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { eq } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { QUEUE_NAMES, type WarmupExecuteJobPayload } from '@autonomous-sales/shared';
import { DATABASE_TOKEN, logExecution } from '../database/database.module';
import { WarmupService } from '../services/warmup.service';
import { DnsCheckerService } from '../services/dns-checker.service';

@Processor(QUEUE_NAMES.WARMUP_EXECUTE)
export class WarmupExecuteProcessor {
  private readonly logger = new Logger(WarmupExecuteProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    private readonly warmupService: WarmupService,
    private readonly dnsCheckerService: DnsCheckerService,
  ) {}

  @Process()
  async handle(job: Job<WarmupExecuteJobPayload>) {
    const startTime = Date.now();
    const { projectId, emailAccountId } = job.data;

    this.logger.log(`[warmup-execute] Starting job ${job.id} — account: ${emailAccountId}`);

    try {
      // ─── Step 1: Load account ─────────────────────────────────────────────
      const account = await this.db.query.emailAccounts.findFirst({
        where: eq(schema.emailAccounts.id, emailAccountId),
      }) as schema.EmailAccount | null;

      if (!account) {
        throw new Error(`Email account not found: ${emailAccountId}`);
      }

      if (account.warmupStatus !== 'warming') {
        this.logger.log(
          `[warmup-execute] Account ${emailAccountId} is not in warming state — status: ${account.warmupStatus}. Skipping.`,
        );
        return;
      }

      // ─── Step 2: Execute daily warmup sends ───────────────────────────────
      this.logger.log(
        `[warmup-execute] Executing warmup — day: ${account.warmupDay}, limit: ${account.dailySendLimit}`,
      );

      const warmupResult = await this.warmupService.executeDailyWarmup(emailAccountId);

      this.logger.log(
        `[warmup-execute] Daily warmup done — sent: ${warmupResult.sent}, errors: ${warmupResult.errors}, completed: ${warmupResult.completed}`,
      );

      // ─── Step 3: Check for consecutive failures ───────────────────────────
      if (warmupResult.errors > 0 && warmupResult.sent === 0) {
        // Check if we've had 3+ failed days
        const recentSchedule = await this.db.query.warmupSchedule.findMany({
          where: eq(schema.warmupSchedule.emailAccountId, emailAccountId),
          orderBy: (t: any, { desc }: any) => [desc(t.dayNumber)],
          limit: 3,
        }) as schema.WarmupSchedule[];

        const allFailed = recentSchedule.every(
          (s) => s.executedAt !== null && s.actualSends === 0,
        );

        if (allFailed && recentSchedule.length >= 3) {
          this.logger.warn(
            `[warmup-execute] 3 consecutive failed days — pausing warmup for account: ${emailAccountId}`,
          );
          await this.warmupService.pauseWarmup(emailAccountId);
        }
      }

      // ─── Step 4: DNS check (run periodically — every 7 days) ─────────────
      const warmupDay = account.warmupDay ?? 1;
      if (warmupDay % 7 === 1 || warmupDay === 1) {
        this.logger.log(`[warmup-execute] Running DNS check for account: ${emailAccountId}`);
        try {
          const dnsResult = await this.dnsCheckerService.checkDomain(account.emailAddress);

          await this.db
            .update(schema.emailAccounts)
            .set({
              spfValid: dnsResult.spfValid,
              dkimValid: dnsResult.dkimValid,
              dmarcValid: dnsResult.dmarcValid,
              healthScore: dnsResult.healthScore,
              updatedAt: new Date(),
            })
            .where(eq(schema.emailAccounts.id, emailAccountId));

          this.logger.log(
            `[warmup-execute] DNS check complete — SPF: ${dnsResult.spfValid}, DKIM: ${dnsResult.dkimValid}, DMARC: ${dnsResult.dmarcValid}, Score: ${dnsResult.healthScore}`,
          );
        } catch (err) {
          this.logger.warn(`[warmup-execute] DNS check failed: ${(err as Error).message}`);
          // Don't throw — DNS check failure shouldn't stop warmup
        }
      }

      // ─── Step 5: Log execution ────────────────────────────────────────────
      await logExecution({
        db: this.db as Parameters<typeof logExecution>[0]['db'],
        projectId,
        agentType: 'communicator',
        trigger: QUEUE_NAMES.WARMUP_EXECUTE,
        inputPayload: job.data,
        outputPayload: {
          emailAccountId,
          warmupDay: account.warmupDay,
          sent: warmupResult.sent,
          errors: warmupResult.errors,
          warmupCompleted: warmupResult.completed,
        },
        status: 'success',
        durationMs: Date.now() - startTime,
      });

      this.logger.log(`[warmup-execute] Job ${job.id} completed successfully`);
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