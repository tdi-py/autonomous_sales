import { Injectable, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { eq } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import { QUEUE_NAMES } from '@autonomous-sales/shared';

@Injectable()
export class AgentsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    @InjectQueue(QUEUE_NAMES.ANALYZE_URL) private analyzeUrlQueue: Queue,
    @InjectQueue(QUEUE_NAMES.GENERATE_CAMPAIGN_CONTENT) private generateQueue: Queue,
  ) {}

  async triggerAnalyzeUrl(projectId: string, websiteUrl: string) {
    const job = await this.analyzeUrlQueue.add(
      { projectId, websiteUrl, agentType: 'analyzer' },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );
    return { jobId: job.id, queue: QUEUE_NAMES.ANALYZE_URL, status: 'queued' };
  }

  async triggerGenerateContent(projectId: string, campaignId: string) {
    const job = await this.generateQueue.add(
      { projectId, campaignId, agentType: 'communicator' },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );
    return { jobId: job.id, queue: QUEUE_NAMES.GENERATE_CAMPAIGN_CONTENT, status: 'queued' };
  }

  async getExecutions(projectId: string, limit = 50) {
    return this.db.query.agentExecutions.findMany({
      where: eq(schema.agentExecutions.projectId, projectId),
      orderBy: (t: any, { desc }: any) => [desc(t.createdAt)],
      limit,
    });
  }
}