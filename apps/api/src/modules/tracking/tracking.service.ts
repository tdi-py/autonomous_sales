import { Injectable, Logger, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  // ─── Record Open ──────────────────────────────────────────────────────────

  async recordOpen(outreachEventId: string): Promise<void> {
    const event = await this.db.query.outreachEvents.findFirst({
      where: eq(schema.outreachEvents.id, outreachEventId),
    }) as schema.OutreachEvent | null;

    if (!event) return;

    const meta = (event.metadata ?? {}) as Record<string, unknown>;
    const openCount = ((meta.open_count as number) ?? 0) + 1;
    const isFirstOpen = event.status === 'sent' || event.status === 'delivered';

    await this.db
      .update(schema.outreachEvents)
      .set({
        status: isFirstOpen ? 'opened' : event.status,
        metadata: {
          ...meta,
          open_count: openCount,
          opened_at: meta.opened_at ?? new Date().toISOString(),
          last_opened_at: new Date().toISOString(),
        },
      })
      .where(eq(schema.outreachEvents.id, outreachEventId));
  }

  // ─── Record Click ─────────────────────────────────────────────────────────

  async recordClick(
    outreachEventId: string,
    originalUrl: string,
    linkHash: string,
  ): Promise<void> {
    const event = await this.db.query.outreachEvents.findFirst({
      where: eq(schema.outreachEvents.id, outreachEventId),
    }) as schema.OutreachEvent | null;

    if (!event) return;

    const meta = (event.metadata ?? {}) as Record<string, unknown>;
    const clickCount = ((meta.click_count as number) ?? 0) + 1;
    const isFirstClick = !['clicked', 'replied'].includes(event.status);

    await this.db
      .update(schema.outreachEvents)
      .set({
        status: isFirstClick ? 'clicked' : event.status,
        metadata: {
          ...meta,
          click_count: clickCount,
          clicked_at: meta.clicked_at ?? new Date().toISOString(),
          last_clicked_at: new Date().toISOString(),
          clicked_url: originalUrl,
        },
      })
      .where(eq(schema.outreachEvents.id, outreachEventId));
  }

  // ─── Process Unsubscribe ──────────────────────────────────────────────────

  async processUnsubscribe(outreachEventId: string): Promise<{ success: boolean }> {
    const event = await this.db.query.outreachEvents.findFirst({
      where: eq(schema.outreachEvents.id, outreachEventId),
    }) as schema.OutreachEvent | null;

    if (!event) return { success: false };

    // Get lead email
    const lead = await this.db.query.leads.findFirst({
      where: eq(schema.leads.id, event.leadId),
    }) as schema.Lead | null;

    if (!lead?.contactEmail) return { success: false };

    // Get campaign → project
    const campaign = await this.db.query.campaigns.findFirst({
      where: eq(schema.campaigns.id, event.campaignId),
    }) as schema.Campaign | null;

    if (!campaign) return { success: false };

    // Add to suppression list
    const existing = await this.db.query.suppressionList.findFirst({
      where: and(
        eq(schema.suppressionList.projectId, campaign.projectId),
        eq(schema.suppressionList.email, lead.contactEmail.toLowerCase()),
      ),
    });

    if (!existing) {
      await this.db.insert(schema.suppressionList).values({
        projectId: campaign.projectId,
        email: lead.contactEmail.toLowerCase(),
        reason: 'unsubscribed',
      });
    }

    // Update event metadata
    const meta = (event.metadata ?? {}) as Record<string, unknown>;
    await this.db
      .update(schema.outreachEvents)
      .set({
        metadata: {
          ...meta,
          unsubscribed_at: new Date().toISOString(),
        },
      })
      .where(eq(schema.outreachEvents.id, outreachEventId));

    this.logger.log(`[tracking] Unsubscribed: ${lead.contactEmail}`);
    return { success: true };
  }

  // ─── Decode Link Hash ─────────────────────────────────────────────────────

  decodeLinkHash(linkHash: string): string {
    try {
      return Buffer.from(linkHash, 'base64url').toString('utf-8');
    } catch {
      return '';
    }
  }
}