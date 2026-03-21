import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and, SQL } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import type { CreateLeadDto, UpdateLeadDto, LeadQueryDto } from './dto/lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  async create(userId: string, dto: CreateLeadDto) {
    await this.assertProjectAccess(dto.projectId, userId);
    const [lead] = await this.db
      .insert(schema.leads)
      .values({
        projectId: dto.projectId,
        companyName: dto.companyName,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        contactTitle: dto.contactTitle,
        website: dto.website,
        linkedinUrl: dto.linkedinUrl,
        source: (dto.source as schema.NewLead['source']) ?? 'manual',
        sourceDetail: dto.sourceDetail,
        icpProfileId: dto.icpProfileId,
        status: 'new',
      })
      .returning();
    return lead;
  }

  async findAll(userId: string, query: LeadQueryDto) {
    await this.assertProjectAccess(query.projectId, userId);

    const conditions: SQL[] = [eq(schema.leads.projectId, query.projectId)];
    if (query.status) {
      conditions.push(eq(schema.leads.status, query.status as schema.Lead['status']));
    }
    if (query.icpProfileId) {
      conditions.push(eq(schema.leads.icpProfileId, query.icpProfileId));
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const offset = (page - 1) * limit;

    const rows = await this.db.query.leads.findMany({
      where: and(...conditions),
      limit,
      offset,
      with: {
        phoneVerification: true,
      },
    });

    // Filter by phone classification if requested
    const filtered = query.phoneClassification
      ? rows.filter(
          (l: any) => l.phoneVerification?.aiCallClassification === query.phoneClassification,
        )
      : rows;

    return {
      data: filtered,
      page,
      limit,
    };
  }

  async findOne(id: string, userId: string) {
    const lead = await this.db.query.leads.findFirst({
      where: eq(schema.leads.id, id),
      with: { phoneVerification: true, enrichment: true },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    await this.assertProjectAccess(lead.projectId, userId);
    return lead;
  }

  async update(id: string, userId: string, dto: UpdateLeadDto) {
    const lead = await this.findOne(id, userId);
    const [updated] = await this.db
      .update(schema.leads)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.leads.id, lead.id))
      .returning();
    return updated;
  }

  async remove(id: string, userId: string) {
    const lead = await this.findOne(id, userId);
    await this.db.delete(schema.leads).where(eq(schema.leads.id, lead.id));
    return { deleted: true };
  }

  async getEnrichment(leadId: string, userId: string) {
    await this.findOne(leadId, userId);
    const enrichment = await this.db.query.leadEnrichment.findFirst({
      where: eq(schema.leadEnrichment.leadId, leadId),
    });
    if (!enrichment) throw new NotFoundException('No enrichment data for this lead');
    return enrichment;
  }

  async getPhoneVerification(leadId: string, userId: string) {
    await this.findOne(leadId, userId);
    const verification = await this.db.query.phoneVerification.findFirst({
      where: eq(schema.phoneVerification.leadId, leadId),
    });
    if (!verification) throw new NotFoundException('No phone verification data for this lead');
    return verification;
  }

  /** Placeholder — real CSV parsing in a later phase */
  async importCsv(userId: string, projectId: string) {
    await this.assertProjectAccess(projectId, userId);
    return { message: 'CSV import not yet implemented — coming in Phase 3' };
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
    if (!membership) throw new ForbiddenException('No access to this project');
    return project;
  }
}