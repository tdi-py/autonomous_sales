import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import type { Job } from 'bull';
import { InboxSyncService } from '../services/inbox-sync.service';

@Injectable()
export class InboxSyncCronService {
  private readonly logger = new Logger(InboxSyncCronService.name);

  constructor(
    @InjectQueue('inbox-sync') private readonly inboxSyncQueue: Queue,
  ) {}

  // Every 5 minutes
  @Cron('*/5 * * * *')
  async scheduleInboxSync() {
    this.logger.log('[inbox-sync-cron] Scheduling inbox sync job...');
    await this.inboxSyncQueue.add(
      'sync-inboxes',
      {},
      {
        jobId: 'inbox-sync-global', // Prevent duplicate jobs
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}

@Processor('inbox-sync')
export class InboxSyncProcessor {
  private readonly logger = new Logger(InboxSyncProcessor.name);

  constructor(
    private readonly inboxSyncService: InboxSyncService,
  ) {}

  @Process('sync-inboxes')
  async handle(job: Job) {
    this.logger.log(`[inbox-sync] Processing sync job ${job.id}`);
    try {
      await this.inboxSyncService.syncAllInboxes();
      this.logger.log('[inbox-sync] Sync completed successfully');
    } catch (err) {
      this.logger.error(`[inbox-sync] Sync failed: ${(err as Error).message}`);
      throw err;
    }
  }
}