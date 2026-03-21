import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import type {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  InviteMemberDto,
} from './dto/workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  async create(userId: string, dto: CreateWorkspaceDto) {
    const [workspace] = await this.db
      .insert(schema.workspaces)
      .values({ ...dto, ownerId: userId })
      .returning();

    await this.db.insert(schema.workspaceMembers).values({
      workspaceId: workspace.id,
      userId,
      role: 'owner',
      acceptedAt: new Date(),
    });

    return workspace;
  }

  async findAllForUser(userId: string) {
    const memberships = await this.db.query.workspaceMembers.findMany({
      where: eq(schema.workspaceMembers.userId, userId),
      with: { workspace: true },
    });
    return memberships.map((m: any) => ({ ...m.workspace, role: m.role }));
  }

  async findOne(id: string, userId: string) {
    const workspace = await this.db.query.workspaces.findFirst({
      where: eq(schema.workspaces.id, id),
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    await this.assertMember(id, userId);
    return workspace;
  }

  async update(id: string, userId: string, dto: UpdateWorkspaceDto) {
    await this.assertAdminOrOwner(id, userId);
    const [updated] = await this.db
      .update(schema.workspaces)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.workspaces.id, id))
      .returning();
    return updated;
  }

  async remove(id: string, userId: string) {
    await this.assertOwner(id, userId);
    await this.db.delete(schema.workspaces).where(eq(schema.workspaces.id, id));
    return { deleted: true };
  }

  async invite(workspaceId: string, actorId: string, dto: InviteMemberDto) {
    await this.assertAdminOrOwner(workspaceId, actorId);

    // Find invitee user
    const invitee = await this.db.query.users.findFirst({
      where: eq(schema.users.email, dto.email.toLowerCase()),
    });
    if (!invitee) throw new NotFoundException('User with that email not found');

    // Check not already a member
    const existing = await this.db.query.workspaceMembers.findFirst({
      where: and(
        eq(schema.workspaceMembers.workspaceId, workspaceId),
        eq(schema.workspaceMembers.userId, invitee.id),
      ),
    });
    if (existing) throw new ConflictException('User is already a member');

    const [member] = await this.db
      .insert(schema.workspaceMembers)
      .values({
        workspaceId,
        userId: invitee.id,
        role: dto.role ?? 'member',
      })
      .returning();

    return member;
  }

  async getMembers(workspaceId: string, userId: string) {
    await this.assertMember(workspaceId, userId);
    return this.db.query.workspaceMembers.findMany({
      where: eq(schema.workspaceMembers.workspaceId, workspaceId),
      with: { user: true },
    });
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private async assertMember(workspaceId: string, userId: string) {
    const m = await this.db.query.workspaceMembers.findFirst({
      where: and(
        eq(schema.workspaceMembers.workspaceId, workspaceId),
        eq(schema.workspaceMembers.userId, userId),
      ),
    });
    if (!m) throw new ForbiddenException('No access to this workspace');
    return m;
  }

  private async assertAdminOrOwner(workspaceId: string, userId: string) {
    const m = await this.assertMember(workspaceId, userId);
    if (!['owner', 'admin'].includes(m.role)) {
      throw new ForbiddenException('Admin or owner role required');
    }
    return m;
  }

  private async assertOwner(workspaceId: string, userId: string) {
    const m = await this.assertMember(workspaceId, userId);
    if (m.role !== 'owner') throw new ForbiddenException('Owner role required');
    return m;
  }
}