import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';

export type InboxFilter = 'all' | 'requires_action' | 'positive' | 'negative' | 'unread';

@Injectable()
export class InboxService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  // ─── List Messages ────────────────────────────────────────────────────────

  async listMessages(
    projectId: string,
    userId: string,
    filter: InboxFilter = 'all',
    campaignId?: string,
    limit = 20,
    offset = 0,
  ) {
    await this.assertProjectAccess(projectId, userId);

    let messages = await this.db.query.inboxMessages.findMany({
      where: eq(schema.inboxMessages.projectId, projectId),
      orderBy: (t: any, { desc }: any) => [desc(t.receivedAt)],
      limit: limit + offset,
    }) as schema.InboxMessage[];

    // Apply filters
    if (filter === 'requires_action') {
      messages = messages.filter((m) => m.requiresAction && !m.isRead);
    } else if (filter === 'positive') {
      messages = messages.filter((m) => m.sentiment === 'positive');
    } else if (filter === 'negative') {
      messages = messages.filter((m) => m.sentiment === 'negative');
    } else if (filter === 'unread') {
      messages = messages.filter((m) => !m.isRead);
    }

    // Apply offset
    messages = messages.slice(offset, offset + limit);

    // Enrich with lead and campaign info
    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const [lead, event] = await Promise.all([
          msg.leadId
            ? this.db.query.leads.findFirst({ where: eq(schema.leads.id, msg.leadId) })
            : null,
          msg.outreachEventId
            ? this.db.query.outreachEvents.findFirst({
                where: eq(schema.outreachEvents.id, msg.outreachEventId),
              })
            : null,
        ]);

        let campaign = null;
        if (event) {
          campaign = await this.db.query.campaigns.findFirst({
            where: eq(schema.campaigns.id, event.campaignId),
          });
        }

        // Filter by campaignId if provided
        if (campaignId && campaign?.id !== campaignId) return null;

        return {
          ...msg,
          lead: lead
            ? {
                id: lead.id,
                contactName: lead.contactName,
                companyName: lead.companyName,
                contactEmail: lead.contactEmail,
                status: lead.status,
              }
            : null,
          campaign: campaign ? { id: campaign.id, name: campaign.name } : null,
        };
      }),
    );

    return enriched.filter(Boolean);
  }

  // ─── Get Single Message ───────────────────────────────────────────────────

  async getMessage(messageId: string, userId: string) {
    const message = await this.db.query.inboxMessages.findFirst({
      where: eq(schema.inboxMessages.id, messageId),
    }) as schema.InboxMessage | null;

    if (!message) throw new NotFoundException('Message not found');
    await this.assertProjectAccess(message.projectId, userId);

    // Get related entities
    const [lead, event] = await Promise.all([
      message.leadId
        ? this.db.query.leads.findFirst({ where: eq(schema.leads.id, message.leadId) })
        : null,
      message.outreachEventId
        ? this.db.query.outreachEvents.findFirst({
            where: eq(schema.outreachEvents.id, message.outreachEventId),
          })
        : null,
    ]);

    // Lead outreach history (timeline)
    const history = lead
      ? await this.db.query.outreachEvents.findMany({
          where: eq(schema.outreachEvents.leadId, lead.id),
          orderBy: (t: any, { asc }: any) => [asc(t.sentAt)],
        })
      : [];

    let campaign = null;
    if (event) {
      campaign = await this.db.query.campaigns.findFirst({
        where: eq(schema.campaigns.id, event.campaignId),
      });
    }

    return {
      ...message,
      lead,
      campaign,
      outreachHistory: history,
    };
  }

  // ─── Mark as Read ─────────────────────────────────────────────────────────

  async markAsRead(messageId: string, userId: string) {
    const message = await this.getMessage(messageId, userId);
    await this.db
      .update(schema.inboxMessages)
      .set({ isRead: true })
      .where(eq(schema.inboxMessages.id, messageId));
    return { success: true };
  }

  // ─── Apply Action ─────────────────────────────────────────────────────────

  async applyAction(
    messageId: string,
    userId: string,
    action: 'schedule_meeting' | 'send_info' | 'follow_up_later' | 'add_to_suppression' | 'no_action',
  ) {
    const message = await this.getMessage(messageId, userId);
    const lead = message.lead as schema.Lead | null;

    switch (action) {
      case 'schedule_meeting':
        if (lead) {
          await this.db
            .update(schema.leads)
            .set({ status: 'qualified', updatedAt: new Date() })
            .where(eq(schema.leads.id, lead.id));

          await this.db.insert(schema.dealStages).values({
            projectId: message.projectId,
            leadId: lead.id,
            stage: 'meeting_scheduled',
            notes: `Scheduled from inbox message ${messageId}`,
          });
        }
        break;

      case 'add_to_suppression':
        if (lead?.contactEmail) {
          await this.db.insert(schema.suppressionList).values({
            projectId: message.projectId,
            email: lead.contactEmail.toLowerCase(),
            reason: 'manual',
          }).onConflictDoNothing?.();
        }
        break;

      case 'no_action':
      case 'send_info':
      case 'follow_up_later':
        // Mark as read and handled
        break;
    }

    await this.db
      .update(schema.inboxMessages)
      .set({ isRead: true, requiresAction: false })
      .where(eq(schema.inboxMessages.id, messageId));

    return { success: true, action };
  }

  // ─── Unread Count (for badge) ─────────────────────────────────────────────

  async getUnreadCount(projectId: string): Promise<number> {
    const messages = await this.db.query.inboxMessages.findMany({
      where: and(
        eq(schema.inboxMessages.projectId, projectId),
        eq(schema.inboxMessages.isRead, false),
        eq(schema.inboxMessages.requiresAction, true),
      ),
    }) as schema.InboxMessage[];
    return messages.length;
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private async assertProjectAccess(projectId: string, userId: string) {
    const project = await this.db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
    });
    if (!project) throw new NotFoundException('Project not found');

    const membership = await this.db.query.workspaceMembers.findFirst({
      where: and(
        eq(schema.workspaceMembers.workspaceId, project.workspaceId),
        eq(schema.workspaceMembers.userId, userId),
      ),
    });
    if (!membership) throw new ForbiddenException('No access');
    return project;
  }
}