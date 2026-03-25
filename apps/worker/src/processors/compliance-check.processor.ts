import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { eq } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { QUEUE_NAMES, type ComplianceCheckJobPayload } from '@autonomous-sales/shared';
import { DATABASE_TOKEN, logExecution } from '../database/database.module';
import { ComplianceEngineService } from '../services/compliance-engine.service';

@Processor(QUEUE_NAMES.COMPLIANCE_CHECK)
export class ComplianceCheckProcessor {
  private readonly logger = new Logger(ComplianceCheckProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    private readonly complianceEngine: ComplianceEngineService,
  ) {}

  @Process()
  async handle(job: Job<ComplianceCheckJobPayload>) {
    const startTime = Date.now();
    const { projectId, outreachEventId, leadId, channel, targetCountry, targetState } = job.data;

    this.logger.log(
      `[compliance-check] Job ${job.id} — event: ${outreachEventId}, channel: ${channel}, country: ${targetCountry}`,
    );

    try {
      // Load outreach event to get email content if needed
      const outreachEvent = await this.db.query.outreachEvents.findFirst({
        where: eq(schema.outreachEvents.id, outreachEventId),
      }) as schema.OutreachEvent | null;

      // Extract email content from metadata if available
      let emailContent: { subject: string; body: string } | undefined;
      if (channel === 'email' && outreachEvent) {
        const meta = (outreachEvent.metadata ?? {}) as Record<string, unknown>;
        if (meta.subject) {
          emailContent = {
            subject: String(meta.subject),
            body: String(meta.bodyPreview ?? ''),
          };
        }
      }

      // Run compliance check
      const result = await this.complianceEngine.runComplianceCheck({
        leadId,
        campaignId: outreachEvent?.campaignId ?? '',
        projectId,
        outreachEventId,
        channel: channel as 'email' | 'call',
        emailContent,
      });

      const resultLabel = result.approved ? 'pass' : 'fail';
      this.logger.log(
        `[compliance-check] Job ${job.id} — result: ${result.overallResult}, blockers: ${result.blockers.length}`,
      );

      // If blocked, update outreach event status
      if (!result.approved && outreachEvent) {
        await this.db
          .update(schema.outreachEvents)
          .set({
            status: 'failed',
            metadata: {
              ...(outreachEvent.metadata as Record<string, unknown>),
              blockedBy: 'compliance',
              complianceResult: result.overallResult,
              complianceBlockers: result.blockers,
            },
          })
          .where(eq(schema.outreachEvents.id, outreachEventId));
      }

      await logExecution({
        db: this.db as Parameters<typeof logExecution>[0]['db'],
        projectId,
        agentType: 'analyzer',
        trigger: QUEUE_NAMES.COMPLIANCE_CHECK,
        inputPayload: job.data,
        outputPayload: {
          result: resultLabel,
          overallResult: result.overallResult,
          blockers: result.blockers,
          warnings: result.warnings,
          checksCount: result.checks.length,
        },
        status: 'success',
        durationMs: Date.now() - startTime,
      });

      return {
        result: resultLabel,
        approved: result.approved,
        blockers: result.blockers,
        warnings: result.warnings,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[compliance-check] Job ${job.id} failed: ${err.message}`);

      // On error, update outreach event to failed
      try {
        await this.db
          .update(schema.outreachEvents)
          .set({
            status: 'failed',
            metadata: { complianceError: err.message },
          })
          .where(eq(schema.outreachEvents.id, outreachEventId));
      } catch {
        // ignore secondary failure
      }

      await logExecution({
        db: this.db as Parameters<typeof logExecution>[0]['db'],
        projectId,
        agentType: 'analyzer',
        trigger: QUEUE_NAMES.COMPLIANCE_CHECK,
        inputPayload: job.data,
        status: 'error',
        errorMessage: err.message,
        durationMs: Date.now() - startTime,
      });

      // COMPLIANCE_CHECK — no retry, just log
    }
  }
}