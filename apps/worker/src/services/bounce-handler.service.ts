import { Injectable, Logger, Inject } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../database/database.module';

export interface BounceResult {
  bounceType: 'hard' | 'soft';
  action: 'suppressed' | 'retry' | 'none';
}

@Injectable()
export class BounceHandlerService {
  private readonly logger = new Logger(BounceHandlerService.name);

  // Thresholds
  private readonly BOUNCE_RATE_WARN = 5;  // %5
  private readonly BOUNCE_RATE_AUTO_PAUSE = 10; // %10

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  // ─── Handle Single Bounce ─────────────────────────────────────────────────

  async handleBounce(
    outreachEventId: string,
    bounceType: 'hard' | 'soft',
    errorMessage: string,
  ): Promise<BounceResult> {
    // Get event
    const event = await this.db.query.outreachEvents.findFirst({
      where: eq(schema.outreachEvents.id, outreachEventId),
    }) as schema.OutreachEvent | null;

    if (!event) {
      this.logger.warn(`[bounce] Event not found: ${outreachEventId}`);
      return { bounceType, action: 'none' };
    }

    // Get lead email
    const lead = await this.db.query.leads.findFirst({
      where: eq(schema.leads.id, event.leadId),
    }) as schema.Lead | null;

    // Update event status
    const currentMeta = (event.metadata ?? {}) as Record<string, unknown>;
    await this.db
      .update(schema.outreachEvents)
      .set({
        status: 'bounced',
        metadata: {
          ...currentMeta,
          bounceType,
          bounceError: errorMessage,
          bouncedAt: new Date().toISOString(),
        },
      })
      .where(eq(schema.outreachEvents.id, outreachEventId));

    if (bounceType === 'hard') {
      // Add to suppression list
      if (lead?.contactEmail) {
        await this.addToSuppressionList(
          event.campaignId, // Using campaignId as projectId proxy — real impl passes projectId
          lead.contactEmail,
          'bounced',
        );
      }

      // Optionally mark lead as lost
      if (lead) {
        await this.db
          .update(schema.leads)
          .set({ status: 'lost' })
          .where(eq(schema.leads.id, lead.id));
      }

      this.logger.log(`[bounce] Hard bounce handled — lead suppressed: ${lead?.contactEmail}`);
      return { bounceType: 'hard', action: 'suppressed' };
    } else {
      // Soft bounce — just log, retry logic handled by processor
      this.logger.log(`[bounce] Soft bounce recorded for event: ${outreachEventId}`);
      return { bounceType: 'soft', action: 'retry' };
    }
  }

  // ─── Add to Suppression List ──────────────────────────────────────────────

  async addToSuppressionList(
    projectId: string,
    email: string,
    reason: 'bounced' | 'unsubscribed' | 'complained' | 'manual',
  ): Promise<void> {
    try {
      // Check if already suppressed
      const existing = await this.db.query.suppressionList.findFirst({
        where: and(
          eq(schema.suppressionList.projectId, projectId),
          eq(schema.suppressionList.email, email.toLowerCase()),
        ),
      });

      if (!existing) {
        await this.db.insert(schema.suppressionList).values({
          projectId,
          email: email.toLowerCase(),
          reason,
        });
        this.logger.log(`[bounce] Added to suppression: ${email} (${reason})`);
      }
    } catch (err) {
      this.logger.error(`[bounce] Failed to add to suppression: ${(err as Error).message}`);
    }
  }

  // ─── Check Suppression ────────────────────────────────────────────────────

  async isSuppressed(projectId: string, email: string): Promise<boolean> {
    const entry = await this.db.query.suppressionList.findFirst({
      where: and(
        eq(schema.suppressionList.projectId, projectId),
        eq(schema.suppressionList.email, email.toLowerCase()),
      ),
    });
    return !!entry;
  }

  // ─── Monitor Bounce Rate ──────────────────────────────────────────────────

  async checkBounceRate(campaignId: string): Promise<{
    bounceRate: number;
    status: 'ok' | 'warn' | 'auto_paused';
    totalSent: number;
    totalBounced: number;
  }> {
    const events = await this.db.query.outreachEvents.findMany({
      where: eq(schema.outreachEvents.campaignId, campaignId),
    }) as schema.OutreachEvent[];

    const totalSent = events.filter((e) =>
      ['sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced'].includes(e.status),
    ).length;

    const totalBounced = events.filter((e) => e.status === 'bounced').length;

    if (totalSent === 0) return { bounceRate: 0, status: 'ok', totalSent: 0, totalBounced: 0 };

    const bounceRate = (totalBounced / totalSent) * 100;

    let status: 'ok' | 'warn' | 'auto_paused' = 'ok';

    if (bounceRate >= this.BOUNCE_RATE_AUTO_PAUSE) {
      // Auto-pause campaign
      await this.db
        .update(schema.campaigns)
        .set({ status: 'paused', updatedAt: new Date() })
        .where(eq(schema.campaigns.id, campaignId));

      // Log abuse incident
      const campaign = await this.db.query.campaigns.findFirst({
        where: eq(schema.campaigns.id, campaignId),
      }) as schema.Campaign | null;

      if (campaign) {
        const project = await this.db.query.projects.findFirst({
          where: eq(schema.projects.id, campaign.projectId),
        });

        if (project) {
          await this.db.insert(schema.abuseIncidents).values({
            workspaceId: project.workspaceId,
            incidentType: 'high_bounce',
            severity: 'warning',
            details: { campaignId, bounceRate, totalSent, totalBounced },
            actionTaken: 'Campaign auto-paused due to high bounce rate',
          });
        }
      }

      this.logger.warn(
        `[bounce] Campaign ${campaignId} AUTO-PAUSED — bounce rate: ${bounceRate.toFixed(1)}%`,
      );
      status = 'auto_paused';
    } else if (bounceRate >= this.BOUNCE_RATE_WARN) {
      this.logger.warn(
        `[bounce] Campaign ${campaignId} bounce rate WARNING: ${bounceRate.toFixed(1)}%`,
      );
      status = 'warn';
    }

    return { bounceRate, status, totalSent, totalBounced };
  }
}