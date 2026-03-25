import { Injectable, Logger, Inject } from '@nestjs/common';
import { eq, and, gte } from 'drizzle-orm';
import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../database/database.module';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AbuseMetrics {
  bounceRate: number;
  spamComplaintRate: number;
  unsubscribeRate: number;
  dailySendVolume: number;
  rapidFireSending: boolean;
  unusualHours: boolean;
  singleRecipientFlood: boolean;
  highSpamScore: boolean;
  missingCompliance: boolean;
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const THRESHOLDS = {
  BOUNCE_WARN: 5,
  BOUNCE_SUSPEND: 10,
  SPAM_COMPLAINT_WARN: 0.1,
  SPAM_COMPLAINT_SUSPEND: 0.3,
  UNSUBSCRIBE_WARN: 2,
  RATE_LIMIT_SUSPEND_MULTIPLIER: 1.5,
} as const;

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class AbuseDetectorService {
  private readonly logger = new Logger(AbuseDetectorService.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  // ─── Main: Detect Abuse for all workspaces ─────────────────────────────────

  async detectAbuse(): Promise<void> {
    this.logger.log('[abuse-detector] Starting hourly abuse detection...');

    const workspaces = await this.getActiveWorkspaces();
    this.logger.log(`[abuse-detector] Checking ${workspaces.length} workspace(s)`);

    for (const workspace of workspaces) {
      try {
        await this.checkWorkspace(workspace);
      } catch (err) {
        this.logger.error(
          `[abuse-detector] Error checking workspace ${workspace.id}: ${(err as Error).message}`,
        );
      }
    }

    this.logger.log('[abuse-detector] Hourly check complete');
  }

  // ─── Check Single Workspace ────────────────────────────────────────────────

  async checkWorkspace(workspace: schema.Workspace): Promise<void> {
    const metrics = await this.calculateAbuseMetrics(workspace.id);

    // Bounce rate
    if (metrics.bounceRate > THRESHOLDS.BOUNCE_SUSPEND) {
      await this.triggerAbuse(workspace.id, 'high_bounce', 'suspension', {
        bounceRate: metrics.bounceRate,
        message: `Bounce rate ${metrics.bounceRate.toFixed(1)}% — all campaigns paused`,
      });
      await this.pauseAllCampaigns(workspace.id);
    } else if (metrics.bounceRate > THRESHOLDS.BOUNCE_WARN) {
      await this.triggerAbuse(workspace.id, 'high_bounce', 'warning', {
        bounceRate: metrics.bounceRate,
        message: `Bounce rate ${metrics.bounceRate.toFixed(1)}% — clean your email list`,
      });
    }

    // Spam complaint rate
    if (metrics.spamComplaintRate > THRESHOLDS.SPAM_COMPLAINT_SUSPEND) {
      await this.triggerAbuse(workspace.id, 'spam_complaint', 'suspension', {
        rate: metrics.spamComplaintRate,
        message: `Spam complaint rate ${metrics.spamComplaintRate.toFixed(2)}% — all campaigns stopped`,
      });
      await this.stopAllCampaigns(workspace.id);
    } else if (metrics.spamComplaintRate > THRESHOLDS.SPAM_COMPLAINT_WARN) {
      await this.triggerAbuse(workspace.id, 'spam_complaint', 'warning', {
        rate: metrics.spamComplaintRate,
        message: `Spam complaint rate ${metrics.spamComplaintRate.toFixed(2)}% — review content`,
      });
    }

    // Unsubscribe rate
    if (metrics.unsubscribeRate > THRESHOLDS.UNSUBSCRIBE_WARN) {
      await this.triggerAbuse(workspace.id, 'high_bounce', 'warning', {
        unsubscribeRate: metrics.unsubscribeRate,
        message: `Unsubscribe rate ${metrics.unsubscribeRate.toFixed(1)}% — review targeting`,
      });
    }

    // Daily send volume exceeds plan limit
    const maxSendsPerDay = workspace.maxSendsPerDay ?? 50;
    if (metrics.dailySendVolume > maxSendsPerDay * THRESHOLDS.RATE_LIMIT_SUSPEND_MULTIPLIER) {
      await this.triggerAbuse(workspace.id, 'rate_limit_exceeded', 'suspension', {
        sent: metrics.dailySendVolume,
        limit: maxSendsPerDay,
        message: `Daily send volume ${metrics.dailySendVolume} exceeds plan limit ${maxSendsPerDay} by 50%+`,
      });
    }
  }

  // ─── Calculate Metrics ─────────────────────────────────────────────────────

  async calculateAbuseMetrics(workspaceId: string): Promise<AbuseMetrics> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get all projects for this workspace
    const projects = await this.db.query.projects.findMany({
      where: eq(schema.projects.workspaceId, workspaceId),
    }) as schema.Project[];

    if (projects.length === 0) {
      return this.emptyMetrics();
    }

    // Aggregate outreach events across all projects
    let totalSent = 0;
    let totalBounced = 0;
    let totalUnsubscribed = 0;
    let dailySendVolume = 0;

    for (const project of projects) {
      // Get campaigns for this project
      const campaigns = await this.db.query.campaigns.findMany({
        where: eq(schema.campaigns.projectId, project.id),
      }) as schema.Campaign[];

      for (const campaign of campaigns) {
        const events = await this.db.query.outreachEvents.findMany({
          where: and(
            eq(schema.outreachEvents.campaignId, campaign.id),
            gte(schema.outreachEvents.sentAt, last7d),
          ),
        }) as schema.OutreachEvent[];

        const sent7d = events.filter((e) =>
          ['sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced'].includes(e.status),
        ).length;

        const bounced = events.filter((e) => e.status === 'bounced').length;

        const unsubscribed = events.filter(
          (e) => !!(e.metadata as Record<string, unknown>)?.unsubscribed_at,
        ).length;

        // Daily volume (last 24h)
        const sent24h = events.filter(
          (e) => new Date(e.sentAt) >= last24h &&
            ['sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced'].includes(e.status),
        ).length;

        totalSent += sent7d;
        totalBounced += bounced;
        totalUnsubscribed += unsubscribed;
        dailySendVolume += sent24h;
      }
    }

    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    const unsubscribeRate = totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0;

    // Spam complaint rate — check abuse_incidents table for recent complaints
    const recentComplaints = await this.db.query.abuseIncidents.findMany({
      where: and(
        eq(schema.abuseIncidents.workspaceId, workspaceId),
        eq(schema.abuseIncidents.incidentType, 'spam_complaint'),
        gte(schema.abuseIncidents.createdAt, last7d),
      ),
    }) as schema.AbuseIncident[];

    const spamComplaintRate = totalSent > 0
      ? (recentComplaints.length / totalSent) * 100
      : 0;

    return {
      bounceRate,
      spamComplaintRate,
      unsubscribeRate,
      dailySendVolume,
      rapidFireSending: false, // TODO: detect < 5s intervals
      unusualHours: false,     // TODO: detect 2AM bulk sending
      singleRecipientFlood: false,
      highSpamScore: false,
      missingCompliance: false,
    };
  }

  // ─── Trigger Abuse Incident ────────────────────────────────────────────────

  async triggerAbuse(
    workspaceId: string,
    incidentType: schema.AbuseIncident['incidentType'],
    severity: schema.AbuseIncident['severity'],
    details: Record<string, unknown>,
  ): Promise<void> {
    // Avoid duplicate incidents — check if same type created in last hour
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const existing = await this.db.query.abuseIncidents.findFirst({
      where: and(
        eq(schema.abuseIncidents.workspaceId, workspaceId),
        eq(schema.abuseIncidents.incidentType, incidentType),
        gte(schema.abuseIncidents.createdAt, lastHour),
      ),
    }) as schema.AbuseIncident | null;

    if (existing) {
      this.logger.log(
        `[abuse-detector] Skipping duplicate incident: ${incidentType} for workspace ${workspaceId}`,
      );
      return;
    }

    await this.db.insert(schema.abuseIncidents).values({
      workspaceId,
      incidentType,
      severity,
      details,
      actionTaken: severity === 'suspension'
        ? 'All active campaigns paused'
        : severity === 'termination'
          ? 'Account terminated'
          : 'Warning issued',
      resolved: false,
    });

    this.logger.warn(
      `[abuse-detector] Incident triggered — workspace: ${workspaceId}, type: ${incidentType}, severity: ${severity}`,
    );
  }

  // ─── Pause All Campaigns ───────────────────────────────────────────────────

  async pauseAllCampaigns(workspaceId: string): Promise<number> {
    const projects = await this.db.query.projects.findMany({
      where: eq(schema.projects.workspaceId, workspaceId),
    }) as schema.Project[];

    let paused = 0;
    for (const project of projects) {
      const campaigns = await this.db.query.campaigns.findMany({
        where: and(
          eq(schema.campaigns.projectId, project.id),
          eq(schema.campaigns.status, 'active'),
        ),
      }) as schema.Campaign[];

      for (const campaign of campaigns) {
        await this.db
          .update(schema.campaigns)
          .set({ status: 'paused', updatedAt: new Date() })
          .where(eq(schema.campaigns.id, campaign.id));
        paused++;
      }
    }

    this.logger.warn(`[abuse-detector] Paused ${paused} campaign(s) for workspace ${workspaceId}`);
    return paused;
  }

  // ─── Stop All Campaigns ────────────────────────────────────────────────────

  async stopAllCampaigns(workspaceId: string): Promise<number> {
    const projects = await this.db.query.projects.findMany({
      where: eq(schema.projects.workspaceId, workspaceId),
    }) as schema.Project[];

    let stopped = 0;
    for (const project of projects) {
      const campaigns = await this.db.query.campaigns.findMany({
        where: and(
          eq(schema.campaigns.projectId, project.id),
        ),
      }) as schema.Campaign[];

      for (const campaign of campaigns) {
        if (campaign.status === 'active' || campaign.status === 'paused') {
          await this.db
            .update(schema.campaigns)
            .set({ status: 'completed', updatedAt: new Date() })
            .where(eq(schema.campaigns.id, campaign.id));
          stopped++;
        }
      }
    }

    this.logger.warn(`[abuse-detector] Stopped ${stopped} campaign(s) for workspace ${workspaceId}`);
    return stopped;
  }

  // ─── Get Abuse History ─────────────────────────────────────────────────────

  async getAbuseHistory(workspaceId: string, limit = 20): Promise<schema.AbuseIncident[]> {
    return this.db.query.abuseIncidents.findMany({
      where: eq(schema.abuseIncidents.workspaceId, workspaceId),
      orderBy: (t: any, { desc }: any) => [desc(t.createdAt)],
      limit,
    });
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private async getActiveWorkspaces(): Promise<schema.Workspace[]> {
    return this.db.query.workspaces.findMany({
      limit: 500, // process up to 500 workspaces per run
    });
  }

  private emptyMetrics(): AbuseMetrics {
    return {
      bounceRate: 0,
      spamComplaintRate: 0,
      unsubscribeRate: 0,
      dailySendVolume: 0,
      rapidFireSending: false,
      unusualHours: false,
      singleRecipientFlood: false,
      highSpamScore: false,
      missingCompliance: false,
    };
  }
}