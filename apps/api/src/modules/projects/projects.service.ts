import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import type { CreateProjectDto, UpdateProjectDto, CreateIcpProfileDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
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

    return project;
  }

  async findAll(userId: string, workspaceId: string) {
    await this.assertWorkspaceMember(workspaceId, userId);
    return this.db.query.projects.findMany({
      where: eq(schema.projects.workspaceId, workspaceId),
    });
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

  async getAnalysis(projectId: string, userId: string) {
    await this.findOne(projectId, userId); // access check
    const analysis = await this.db.query.projectAnalysis.findFirst({
      where: eq(schema.projectAnalysis.projectId, projectId),
    });
    if (!analysis) throw new NotFoundException('Analysis not found');
    return analysis;
  }

  async getIcpProfiles(projectId: string, userId: string) {
    await this.findOne(projectId, userId);
    return this.db.query.icpProfiles.findMany({
      where: eq(schema.icpProfiles.projectId, projectId),
    });
  }

  async createIcpProfile(projectId: string, userId: string, dto: CreateIcpProfileDto) {
    await this.findOne(projectId, userId);
    const [profile] = await this.db
      .insert(schema.icpProfiles)
      .values({ projectId, ...dto })
      .returning();
    return profile;
  }

  // ─── Private ──────────────────────────────────────────────────────────────

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