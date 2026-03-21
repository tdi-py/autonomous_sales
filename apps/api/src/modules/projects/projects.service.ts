import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import { QUEUE_NAMES } from '@autonomous-sales/shared';
import type {
  CreateProjectDto,
  UpdateProjectDto,
  CreateIcpProfileDto,
  UpdateIcpProfileDto,
  ConfirmAnalysisDto,
} from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    @InjectQueue(QUEUE_NAMES.ANALYZE_URL) private analyzeUrlQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateProjectDto) {
    await this.assertWorkspaceMember(dto.workspaceId, userId);

    const [project] = await this.db
      .insert(schema.projects)
      .values({
        workspaceId: dto.workspaceId,
        name: dto.name,
        websiteUrl: dto.websiteUrl,
        industry: dto.industry,
        businessType: (dto.businessType as schema.NewProject['businessType']) ?? 'other',
        targetGeography: dto.targetGeography ?? [],
        defaultLanguage: dto.defaultLanguage ?? 'en',
        status: 'onboarding',
      })
      .returning();

    // Seed empty analysis record
    await this.db.insert(schema.projectAnalysis).values({ projectId: project.id });

    let analysisStatus = 'no_url';
    if (dto.websiteUrl) {
      await this.analyzeUrlQueue.add(
        { projectId: project.id, websiteUrl: dto.websiteUrl, agentType: 'analyzer', workspaceId: dto.workspaceId },
        { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
      );
      analysisStatus = 'pending';
    }

    return { ...project, analysis_status: analysisStatus };
  }

  async findAll(userId: string, workspaceId: string) {
    await this.assertWorkspaceMember(workspaceId, userId);
    const projects = await this.db.query.projects.findMany({
      where: eq(schema.projects.workspaceId, workspaceId),
    });

    // Attach analysis status to each project
    const result = await Promise.all(
      projects.map(async (p: schema.Project) => {
        const analysis = await this.db.query.projectAnalysis.findFirst({
          where: eq(schema.projectAnalysis.projectId, p.id),
        });
        return {
          ...p,
          analysis_status: analysis?.analyzedAt
            ? 'completed'
            : analysis?.rawScrapedData && (analysis.rawScrapedData as { error?: string }).error
              ? 'failed'
              : 'pending',
        };
      }),
    );

    return result;
  }

  async findOne(id: string, userId: string) {
    const project = await this.db.query.projects.findFirst({
      where: eq(schema.projects.id, id),
    });
    if (!project) throw new NotFoundException('Project not found');
    await this.assertWorkspaceMember(project.workspaceId, userId);
    return project;
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    const project = await this.findOne(id, userId);
    const [updated] = await this.db
      .update(schema.projects)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.projects.id, project.id))
      .returning();
    return updated;
  }

  async remove(id: string, userId: string) {
    const project = await this.findOne(id, userId);
    await this.db.delete(schema.projects).where(eq(schema.projects.id, project.id));
    return { deleted: true };
  }

  // ── Analysis ─────────────────────────────────────────────────────────────

  async getAnalysis(projectId: string, userId: string) {
    await this.findOne(projectId, userId);
    const analysis = await this.db.query.projectAnalysis.findFirst({
      where: eq(schema.projectAnalysis.projectId, projectId),
    });
    if (!analysis) throw new NotFoundException('Analysis not found');

    if (!analysis.analyzedAt) {
      const failed = (analysis.rawScrapedData as { error?: string } | null)?.error;
      return {
        status: failed ? 'failed' : 'pending',
        error: failed ?? null,
      };
    }

    const icpProfiles = await this.db.query.icpProfiles.findMany({
      where: and(
        eq(schema.icpProfiles.projectId, projectId),
        eq(schema.icpProfiles.isActive, true),
      ),
    });

    return { status: 'completed', ...analysis, icpProfiles };
  }

  async confirmAnalysis(projectId: string, userId: string, dto: ConfirmAnalysisDto) {
    await this.findOne(projectId, userId);

    const updateFields: Record<string, unknown> = {
      userConfirmed: true,
      userEdits: dto.edits ?? null,
    };

    // Apply user edits to main fields
    if (dto.edits) {
      if (dto.edits.valueProposition) updateFields.valueProposition = dto.edits.valueProposition;
      if (dto.edits.productDescription) updateFields.productDescription = dto.edits.productDescription;
      if (dto.edits.targetMarket) updateFields.targetMarket = dto.edits.targetMarket;
      if (dto.edits.keyFeatures) updateFields.keyFeatures = dto.edits.keyFeatures;
      if (dto.edits.toneOfVoice) updateFields.toneOfVoice = dto.edits.toneOfVoice;
    }

    await this.db
      .update(schema.projectAnalysis)
      .set(updateFields)
      .where(eq(schema.projectAnalysis.projectId, projectId));

    // Mark project as active
    const [updated] = await this.db
      .update(schema.projects)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(schema.projects.id, projectId))
      .returning();

    return { success: true, project: updated };
  }

  async retryAnalysis(projectId: string, userId: string) {
    const project = await this.findOne(projectId, userId);
    if (!project.websiteUrl) {
      throw new BadRequestException('Project has no website URL to analyze');
    }

    await this.analyzeUrlQueue.add(
      {
        projectId,
        websiteUrl: project.websiteUrl,
        agentType: 'analyzer',
        workspaceId: project.workspaceId,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );

    return { queued: true, projectId };
  }

  // ── ICP Profiles ──────────────────────────────────────────────────────────

  async getIcpProfiles(projectId: string, userId: string) {
    await this.findOne(projectId, userId);
    return this.db.query.icpProfiles.findMany({
      where: and(
        eq(schema.icpProfiles.projectId, projectId),
        eq(schema.icpProfiles.isActive, true),
      ),
    });
  }

  async createIcpProfile(projectId: string, userId: string, dto: CreateIcpProfileDto) {
    await this.findOne(projectId, userId);
    const [profile] = await this.db
      .insert(schema.icpProfiles)
      .values({ projectId, ...dto, isActive: true })
      .returning();
    return profile;
  }

  async updateIcpProfile(
    projectId: string,
    icpId: string,
    userId: string,
    dto: UpdateIcpProfileDto,
  ) {
    await this.findOne(projectId, userId);
    const icp = await this.db.query.icpProfiles.findFirst({
      where: and(
        eq(schema.icpProfiles.id, icpId),
        eq(schema.icpProfiles.projectId, projectId),
      ),
    });
    if (!icp) throw new NotFoundException('ICP profile not found');

    const [updated] = await this.db
      .update(schema.icpProfiles)
      .set(dto)
      .where(eq(schema.icpProfiles.id, icpId))
      .returning();
    return updated;
  }

  async deleteIcpProfile(projectId: string, icpId: string, userId: string) {
    await this.findOne(projectId, userId);
    const icp = await this.db.query.icpProfiles.findFirst({
      where: and(
        eq(schema.icpProfiles.id, icpId),
        eq(schema.icpProfiles.projectId, projectId),
      ),
    });
    if (!icp) throw new NotFoundException('ICP profile not found');

    await this.db
      .update(schema.icpProfiles)
      .set({ isActive: false })
      .where(eq(schema.icpProfiles.id, icpId));
    return { deleted: true };
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async assertWorkspaceMember(workspaceId: string, userId: string) {
    const m = await this.db.query.workspaceMembers.findFirst({
      where: and(
        eq(schema.workspaceMembers.workspaceId, workspaceId),
        eq(schema.workspaceMembers.userId, userId),
      ),
    });
    if (!m) throw new ForbiddenException('No access to this workspace');
    return m;
  }
}