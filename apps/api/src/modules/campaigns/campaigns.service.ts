import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import type {
  CreateCampaignDto,
  UpdateCampaignDto,
  CreateEmailSequenceDto,
  CreateCallScriptDto,
} from './dto/campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  async create(userId: string, dto: CreateCampaignDto) {
    await this.assertProjectAccess(dto.projectId, userId);
    const [campaign] = await this.db
      .insert(schema.campaigns)
      .values({
        projectId: dto.projectId,
        name: dto.name,
        type: (dto.type as schema.NewCampaign['type']) ?? 'cold_email',
        status: 'draft',
      })
      .returning();
    return campaign;
  }

  async findAll(userId: string, projectId: string) {
    await this.assertProjectAccess(projectId, userId);
    return this.db.query.campaigns.findMany({
      where: eq(schema.campaigns.projectId, projectId),
    });
  }

  async findOne(id: string, userId: string) {
    const campaign = await this.db.query.campaigns.findFirst({
      where: eq(schema.campaigns.id, id),
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    await this.assertProjectAccess(campaign.projectId, userId);
    return campaign;
  }

  async update(id: string, userId: string, dto: UpdateCampaignDto) {
    const campaign = await this.findOne(id, userId);
    const [updated] = await this.db
      .update(schema.campaigns)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.campaigns.id, campaign.id))
      .returning();
    return updated;
  }

  async remove(id: string, userId: string) {
    const campaign = await this.findOne(id, userId);
    await this.db.delete(schema.campaigns).where(eq(schema.campaigns.id, campaign.id));
    return { deleted: true };
  }

  // ─── Email Sequences ───────────────────────────────────────────────────────

  async getSequences(campaignId: string, userId: string) {
    await this.findOne(campaignId, userId);
    return this.db.query.emailSequences.findMany({
      where: eq(schema.emailSequences.campaignId, campaignId),
      orderBy: (t: any, { asc }: any) => [asc(t.stepOrder)],
    });
  }

  async createSequenceStep(campaignId: string, userId: string, dto: CreateEmailSequenceDto) {
    await this.findOne(campaignId, userId);
    const [step] = await this.db
      .insert(schema.emailSequences)
      .values({ campaignId, ...dto })
      .returning();
    return step;
  }

  // ─── Call Scripts ──────────────────────────────────────────────────────────

  async getScripts(campaignId: string, userId: string) {
    await this.findOne(campaignId, userId);
    return this.db.query.callScripts.findMany({
      where: eq(schema.callScripts.campaignId, campaignId),
      orderBy: (t: any, { desc }: any) => [desc(t.version)],
    });
  }

  async createScript(campaignId: string, userId: string, dto: CreateCallScriptDto) {
    await this.findOne(campaignId, userId);

    // Auto-increment version
    const existing = await this.db.query.callScripts.findMany({
      where: eq(schema.callScripts.campaignId, campaignId),
    });
    const nextVersion = existing.length + 1;

    const [script] = await this.db
      .insert(schema.callScripts)
      .values({ campaignId, version: nextVersion, ...dto })
      .returning();
    return script;
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