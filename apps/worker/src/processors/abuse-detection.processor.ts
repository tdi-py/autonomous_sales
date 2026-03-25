import { Injectable, Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { AbuseDetectorService } from '../services/abuse-detector.service';

// ─── Cron Scheduler ───────────────────────────────────────────────────────────

@Injectable()
export class AbuseDetectionCronService {
  private readonly logger = new Logger(AbuseDetectionCronService.name);

  constructor(
    @InjectQueue('abuse-detection') private readonly abuseQueue: Queue,
  ) {}

  // Every hour
  @Cron('0 * * * *')
  async scheduleAbuseDetection(): Promise<void> {
    this.logger.log('[abuse-detection-cron] Scheduling hourly abuse detection...');
    await this.abuseQueue.add(
      'detect',
      {},
      {
        jobId: 'abuse-detection-hourly',
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}

// ─── Processor ────────────────────────────────────────────────────────────────

@Processor('abuse-detection')
export class AbuseDetectionProcessor {
  private readonly logger = new Logger(AbuseDetectionProcessor.name);

  constructor(
    private readonly abuseDetector: AbuseDetectorService,
  ) {}

  @Process('detect')
  async handle(job: Job): Promise<void> {
    this.logger.log(`[abuse-detection] Processing job ${job.id}`);
    try {
      await this.abuseDetector.detectAbuse();
      this.logger.log('[abuse-detection] Detection complete');
    } catch (err) {
      this.logger.error(`[abuse-detection] Failed: ${(err as Error).message}`);
      // Don't throw — abuse detection failures should NOT stop the platform
      // Just log and move on (false positive prevention)
    }
  }
}