import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and, SQL } from 'drizzle-orm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import { QUEUE_NAMES } from '@autonomous-sales/shared';
import type { CreateLeadDto, UpdateLeadDto, LeadQueryDto } from './dto/lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    @InjectQueue(QUEUE_NAMES.ANALYZE_LEAD_WEBSITE) private readonly analyzeLeadQueue: Queue,
    @InjectQueue(QUEUE_NAMES.CONTACT_FORM_OUTREACH) private readonly contactFormQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateLeadDto) {
    await this.assertProjectAccess(dto.projectId, userId);
    const [lead] = await this.db.insert(schema.leads).values({
      projectId: dto.projectId, companyName: dto.companyName, contactName: dto.contactName,
      contactEmail: dto.contactEmail, contactPhone: dto.contactPhone, contactTitle: dto.contactTitle,
      website: dto.website, linkedinUrl: dto.linkedinUrl,
      source: (dto.source as schema.NewLead['source']) ?? 'manual',
      sourceDetail: dto.sourceDetail, icpProfileId: dto.icpProfileId, status: 'new',
    }).returning();
    return lead;
  }

  async findAll(userId: string, query: LeadQueryDto) {
    await this.assertProjectAccess(query.projectId, userId);
    const conditions: SQL[] = [eq(schema.leads.projectId, query.projectId)];
    if (query.status) conditions.push(eq(schema.leads.status, query.status as schema.Lead['status']));
    if (query.icpProfileId) conditions.push(eq(schema.leads.icpProfileId, query.icpProfileId));
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const rows = await this.db.query.leads.findMany({
      where: and(...conditions), limit, offset: (page - 1) * limit, with: { phoneVerification: true },
    });
    const filtered = query.phoneClassification
      ? rows.filter((l: any) => l.phoneVerification?.aiCallClassification === query.phoneClassification)
      : rows;
    return { data: filtered, page, limit };
  }

  async findOne(id: string, userId: string) {
    const lead = await this.db.query.leads.findFirst({
      where: eq(schema.leads.id, id), with: { phoneVerification: true, enrichment: true },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    await this.assertProjectAccess(lead.projectId, userId);
    return lead;
  }

  async update(id: string, userId: string, dto: UpdateLeadDto) {
    const lead = await this.findOne(id, userId);
    const [updated] = await this.db.update(schema.leads).set({ ...dto, updatedAt: new Date() }).where(eq(schema.leads.id, lead.id)).returning();
    return updated;
  }

  async remove(id: string, userId: string) {
    const lead = await this.findOne(id, userId);
    await this.db.delete(schema.leads).where(eq(schema.leads.id, lead.id));
    return { deleted: true };
  }

  async getEnrichment(leadId: string, userId: string) {
    await this.findOne(leadId, userId);
    const enrichment = await this.db.query.leadEnrichment.findFirst({ where: eq(schema.leadEnrichment.leadId, leadId) });
    if (!enrichment) throw new NotFoundException('No enrichment data for this lead');
    return enrichment;
  }

  async getPhoneVerification(leadId: string, userId: string) {
    await this.findOne(leadId, userId);
    const verification = await this.db.query.phoneVerification.findFirst({ where: eq(schema.phoneVerification.leadId, leadId) });
    if (!verification) throw new NotFoundException('No phone verification data for this lead');
    return verification;
  }

  async getPainPoints(leadId: string, userId: string) {
    const lead = await this.findOne(leadId, userId);
    const enrichment = await this.db.query.leadEnrichment.findFirst({ where: eq(schema.leadEnrichment.leadId, leadId) });
    return {
      lead: { id: leadId, companyName: (lead as any).companyName, website: (lead as any).website },
      painPoints: enrichment?.painPoints ?? [],
      websiteInsights: enrichment?.websiteInsights ?? null,
      websiteAnalyzedAt: enrichment?.websiteAnalyzedAt ?? null,
      analysisAvailable: !!enrichment?.websiteAnalyzedAt,
    };
  }

  async analyzeWebsite(leadId: string, userId: string): Promise<{ queued: boolean; message: string }> {
    const lead = await this.findOne(leadId, userId);
    if (!(lead as any).website) {
      throw new NotFoundException('Bu lead için website bilgisi bulunmuyor');
    }

    await this.analyzeLeadQueue.add(
      {
        leadId,
        projectId: (lead as any).projectId,
        websiteUrl: (lead as any).website,
        agentType: 'analyzer',
      },
      { attempts: 2, backoff: { type: 'exponential', delay: 30_000 } },
    );

    return { queued: true, message: 'Website analizi kuyruğa alındı. Birkaç dakika içinde sonuçlar hazır olacak.' };
  }

  async queueContactForm(
    leadId: string,
    userId: string,
    campaignId?: string,
  ): Promise<{ queued: boolean; message: string }> {
    const lead = await this.findOne(leadId, userId);
    if (!(lead as any).website) {
      throw new NotFoundException('Bu lead için website bilgisi bulunmuyor');
    }

    await this.contactFormQueue.add(
      {
        leadId,
        projectId: (lead as any).projectId,
        campaignId: campaignId ?? null,
        websiteUrl: (lead as any).website,
        agentType: 'communicator',
      },
      { attempts: 2, backoff: { type: 'exponential', delay: 30_000 } },
    );

    return { queued: true, message: 'İletişim formu analizi kuyruğa alındı. AI formu bulacak ve içerik hazırlayacak.' };
  }

  async approveContactForm(
    leadId: string,
    submissionId: string,
    userId: string,
    approvedContent: { name: string; email: string; phone?: string; message: string; company?: string },
  ): Promise<{ queued: boolean }> {
    const lead = await this.findOne(leadId, userId);

    const submission = await this.db.query.contactFormSubmissions.findFirst({
      where: eq(schema.contactFormSubmissions.id, submissionId),
    }) as schema.ContactFormSubmission | null;

    if (!submission || submission.leadId !== leadId) {
      throw new NotFoundException('Contact form submission not found');
    }

    // Mark as approved
    await this.db
      .update(schema.contactFormSubmissions)
      .set({ status: 'approved', approvedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.contactFormSubmissions.id, submissionId));

    // Queue for submission
    await this.contactFormQueue.add(
      {
        leadId,
        projectId: (lead as any).projectId,
        websiteUrl: submission.websiteUrl,
        agentType: 'communicator',
        approvedContent,
      },
      { attempts: 2, backoff: { type: 'exponential', delay: 10_000 } },
    );

    return { queued: true };
  }

  async getContactFormSubmissions(leadId: string, userId: string) {
    await this.findOne(leadId, userId);
    return this.db.query.contactFormSubmissions.findMany({
      where: eq(schema.contactFormSubmissions.leadId, leadId),
      orderBy: (t: any, { desc }: any) => [desc(t.createdAt)],
    });
  }

  async importCsv(userId: string, projectId: string) {
    await this.assertProjectAccess(projectId, userId);
    return { message: 'CSV import not yet implemented' };
  }

  private async assertProjectAccess(projectId: string, userId: string) {
    const project = await this.db.query.projects.findFirst({ where: eq(schema.projects.id, projectId) });
    if (!project) throw new NotFoundException('Project not found');
    const membership = await this.db.query.workspaceMembers.findFirst({
      where: and(eq(schema.workspaceMembers.workspaceId, project.workspaceId), eq(schema.workspaceMembers.userId, userId)),
    });
    if (!membership) throw new ForbiddenException('No access to this project');
    return project;
  }
}
