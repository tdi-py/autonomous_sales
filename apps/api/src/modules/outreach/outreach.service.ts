import { Injectable, Inject, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import { QUEUE_NAMES } from '@autonomous-sales/shared';

export interface OutreachEventWithDetails {
  id: string; channel: string; status: string; sentAt: Date;
  leadName: string; leadEmail: string; companyName: string; campaignName: string;
  metadata: Record<string, unknown>;
}

export interface OutreachStats {
  totalSent: number;
  byChannel: { email: number; call: number; contact_form: number; linkedin: number };
  responseRate: number; openRate: number; replyCount: number; contactFormCount: number; last7Days: number;
}

export interface TemplatePerformanceResult {
  industry: string; icpLabel: string; subjectSnippet: string; variantLabel: string;
  openRate: number; replyRate: number; sampleSize: number;
}

@Injectable()
export class OutreachService {
  private readonly logger = new Logger(OutreachService.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    @InjectQueue(QUEUE_NAMES.CONTACT_FORM_OUTREACH) private readonly contactFormQueue: Queue,
    @InjectQueue(QUEUE_NAMES.ANALYZE_LEAD_WEBSITE) private readonly analyzeLeadWebsiteQueue: Queue,
  ) {}

  async getDashboard(projectId: string, userId: string, filters?: { channel?: any; status?: string; campaignId?: string; page?: number; limit?: number }) {
    await this.assertProjectAccess(projectId, userId);
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const projectLeads = await this.db.query.leads.findMany({ where: eq(schema.leads.projectId, projectId), columns: { id: true } });
    const leadIds = projectLeads.map((l: any) => l.id);
    if (leadIds.length === 0) {
      const stats = await this.getStats(projectId, userId);
      return { events: [], stats, total: 0 };
    }
    const eventConditions: any[] = [inArray(schema.outreachEvents.leadId, leadIds)];
    if (filters?.channel) eventConditions.push(eq(schema.outreachEvents.channel, filters.channel));
    if (filters?.status) eventConditions.push(eq(schema.outreachEvents.status, filters.status as any));
    if (filters?.campaignId) eventConditions.push(eq(schema.outreachEvents.campaignId, filters.campaignId));
    const whereClause = eventConditions.length === 1 ? eventConditions[0] : and(...eventConditions);
    const allEvents = await this.db.query.outreachEvents.findMany({ where: whereClause });
    const total = allEvents.length;
    const rawEvents = await this.db.query.outreachEvents.findMany({
      where: whereClause, orderBy: [desc(schema.outreachEvents.sentAt)], limit, offset: (page - 1) * limit,
    });
    const events: OutreachEventWithDetails[] = await Promise.all(
      rawEvents.map(async (event: schema.OutreachEvent) => {
        const lead = await this.db.query.leads.findFirst({ where: eq(schema.leads.id, event.leadId) });
        const campaign = await this.db.query.campaigns.findFirst({ where: eq(schema.campaigns.id, event.campaignId) });
        return { id: event.id, channel: event.channel, status: event.status, sentAt: event.sentAt, leadName: lead?.contactName ?? '', leadEmail: lead?.contactEmail ?? '', companyName: lead?.companyName ?? '', campaignName: campaign?.name ?? '', metadata: (event.metadata ?? {}) as Record<string, unknown> };
      }),
    );
    const stats = await this.getStats(projectId, userId);
    return { events, stats, total };
  }

  async getStats(projectId: string, userId: string): Promise<OutreachStats> {
    await this.assertProjectAccess(projectId, userId);
    const projectLeads = await this.db.query.leads.findMany({ where: eq(schema.leads.projectId, projectId), columns: { id: true } });
    const leadIds = projectLeads.map((l: any) => l.id);
    if (leadIds.length === 0) return { totalSent: 0, byChannel: { email: 0, call: 0, contact_form: 0, linkedin: 0 }, responseRate: 0, openRate: 0, replyCount: 0, contactFormCount: 0, last7Days: 0 };
    const allEvents: schema.OutreachEvent[] = await this.db.query.outreachEvents.findMany({ where: inArray(schema.outreachEvents.leadId, leadIds) });
    const sentStatuses = ['sent','delivered','opened','clicked','replied','bounced'];
    const totalSent = allEvents.filter(e => sentStatuses.includes(e.status)).length;
    const byChannel = { email: allEvents.filter(e => e.channel === 'email').length, call: allEvents.filter(e => e.channel === 'call').length, contact_form: allEvents.filter(e => e.channel === 'contact_form').length, linkedin: allEvents.filter(e => e.channel === 'linkedin').length };
    const replyCount = allEvents.filter(e => e.status === 'replied').length;
    const openedCount = allEvents.filter(e => ['opened','clicked','replied'].includes(e.status)).length;
    const contactFormCount = allEvents.filter(e => e.channel === 'contact_form').length;
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7Days = allEvents.filter(e => new Date(e.sentAt) >= sevenDaysAgo).length;
    return { totalSent, byChannel, responseRate: parseFloat(((replyCount / (totalSent || 1)) * 100).toFixed(2)), openRate: parseFloat(((openedCount / (totalSent || 1)) * 100).toFixed(2)), replyCount, contactFormCount, last7Days };
  }

  async getNextSuggestion(projectId: string, userId: string) {
    const stats = await this.getStats(projectId, userId);
    if (stats.totalSent > 0 && stats.responseRate < 5) return { suggestedAction: 'change_subject', priority: 'high', suggestion: 'Change your email subject lines to improve reply rate.', reasoning: `Current reply rate is ${stats.responseRate.toFixed(1)}%, below 5% threshold.` };
    if (stats.byChannel.contact_form === 0) return { suggestedAction: 'try_contact_form', priority: 'medium', suggestion: 'Try reaching out via website contact forms.', reasoning: 'No contact form outreach sent yet.' };
    return { suggestedAction: 'increase_volume', priority: 'low', suggestion: 'Increase outreach volume by adding more leads.', reasoning: 'Current metrics are healthy. Scale up volume.' };
  }

  async queueContactFormOutreach(leadId: string, projectId: string, campaignId: string, userId: string) {
    await this.assertProjectAccess(projectId, userId);
    const lead = await this.db.query.leads.findFirst({ where: eq(schema.leads.id, leadId) });
    if (!lead) throw new NotFoundException('Lead not found');
    const job = await this.contactFormQueue.add({ leadId, projectId, campaignId, userId }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    return { jobId: String(job.id), pending: true };
  }

  async approveContactForm(leadId: string, approvedContent: any, projectId: string, userId: string) {
    await this.assertProjectAccess(projectId, userId);
    const lead = await this.db.query.leads.findFirst({ where: eq(schema.leads.id, leadId) });
    if (!lead) throw new NotFoundException('Lead not found');
    await this.contactFormQueue.add({ leadId, projectId, userId, approvedContent, action: 'submit' }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    return { success: true };
  }

  async queueLeadWebsiteAnalysis(leadId: string, projectId: string, userId: string) {
    await this.assertProjectAccess(projectId, userId);
    const lead = await this.db.query.leads.findFirst({ where: eq(schema.leads.id, leadId) });
    if (!lead) throw new NotFoundException('Lead not found');
    const job = await this.analyzeLeadWebsiteQueue.add({ leadId, projectId, userId }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    return { jobId: String(job.id) };
  }

  async getTemplatePerformance(projectId: string, userId: string): Promise<TemplatePerformanceResult[]> {
    await this.assertProjectAccess(projectId, userId);
    const stats: schema.EmailTemplateStats[] = await this.db.query.emailTemplateStats.findMany({
      where: eq(schema.emailTemplateStats.projectId, projectId),
      orderBy: [desc(schema.emailTemplateStats.replyRate)],
    });
    return stats.map(s => ({ industry: s.industry ?? '', icpLabel: s.icpLabel ?? '', subjectSnippet: s.subjectSnippet ?? '', variantLabel: s.variantLabel ?? '', openRate: s.openRate, replyRate: s.replyRate, sampleSize: s.sampleSize }));
  }

  async getContactFormSubmissions(projectId: string, userId: string, filters?: { status?: string; page?: number; limit?: number }) {
    await this.assertProjectAccess(projectId, userId);
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;

    const projectLeads = await this.db.query.leads.findMany({
      where: eq(schema.leads.projectId, projectId),
      columns: { id: true },
    });
    const leadIds = projectLeads.map((l: any) => l.id);

    if (leadIds.length === 0) return { submissions: [], total: 0 };

    const allSubmissions = await this.db.query.contactFormSubmissions.findMany({
      where: inArray(schema.contactFormSubmissions.leadId, leadIds),
    });

    const filtered = filters?.status
      ? allSubmissions.filter((s: any) => s.status === filters.status)
      : allSubmissions;

    const total = filtered.length;
    const paged = filtered
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice((page - 1) * limit, page * limit);

    const submissions = await Promise.all(
      paged.map(async (sub: any) => {
        const lead = await this.db.query.leads.findFirst({ where: eq(schema.leads.id, sub.leadId) });
        return {
          ...sub,
          leadCompanyName: lead?.companyName ?? '',
          leadContactName: lead?.contactName ?? '',
          leadWebsite: lead?.website ?? '',
        };
      }),
    );

    return { submissions, total };
  }

  async getPlatformTemplateInsights(projectId: string, userId: string) {
    await this.assertProjectAccess(projectId, userId);

    // Get learned rules for this project enriched with platform rules
    const projectRules = await this.db.query.strategyLearnedRules.findMany({
      where: and(
        eq(schema.strategyLearnedRules.projectId, projectId),
        eq(schema.strategyLearnedRules.isActive, true),
      ),
      orderBy: [desc(schema.strategyLearnedRules.confidenceScore)],
    });

    const platformRules = await this.db.query.platformLearnedRules.findMany({
      where: eq(schema.platformLearnedRules.isActive, true),
      orderBy: [desc(schema.platformLearnedRules.confidenceScore)],
      limit: 20,
    });

    // Get template stats for this project grouped by businessCategory
    const templateStats = await this.db.query.emailTemplateStats.findMany({
      where: eq(schema.emailTemplateStats.projectId, projectId),
      orderBy: [desc(schema.emailTemplateStats.replyRate)],
    });

    // Group template stats by business category
    const byCategory: Record<string, typeof templateStats> = {};
    for (const stat of templateStats) {
      const key = stat.businessCategory ?? stat.industry ?? 'general';
      if (!byCategory[key]) byCategory[key] = [];
      byCategory[key].push(stat);
    }

    const categoryInsights = Object.entries(byCategory).map(([category, stats]) => ({
      category,
      bestTemplate: stats.sort((a: any, b: any) => b.replyRate - a.replyRate)[0],
      worstTemplate: stats.sort((a: any, b: any) => a.replyRate - b.replyRate)[0],
      avgReplyRate: stats.reduce((sum: number, s: any) => sum + s.replyRate, 0) / stats.length,
      totalSamples: stats.reduce((sum: number, s: any) => sum + s.sampleSize, 0),
    }));

    return {
      projectRules: projectRules.slice(0, 10),
      platformRules: platformRules.slice(0, 10),
      categoryInsights,
    };
  }

  private async assertProjectAccess(projectId: string, userId: string) {
    const project = await this.db.query.projects.findFirst({ where: eq(schema.projects.id, projectId) });
    if (!project) throw new NotFoundException('Project not found');
    const member = await this.db.query.workspaceMembers.findFirst({ where: and(eq(schema.workspaceMembers.workspaceId, project.workspaceId), eq(schema.workspaceMembers.userId, userId)) });
    const workspace = await this.db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, project.workspaceId) });
    if (!member && workspace?.ownerId !== userId) throw new ForbiddenException('Access denied');
  }
}
