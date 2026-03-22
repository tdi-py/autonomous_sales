import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import type { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  async findById(id: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash: _pw, ...safe } = user;
    return safe;
  }

  async update(id: string, dto: UpdateUserDto) {
    const [updated] = await this.db
      .update(schema.users)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    if (!updated) throw new NotFoundException('User not found');
    const { passwordHash: _pw, ...safe } = updated;
    return safe;
  }

  async getWorkspaces(userId: string) {
  // with: { workspace: true } kaldır, relation yok
  const memberships = await this.db.query.workspaceMembers.findMany({
    where: eq(schema.workspaceMembers.userId, userId),
  });

  // workspaceId'leri al, workspace'leri ayrı çek
  const workspaces = await Promise.all(
    memberships.map((m: any) =>
      this.db.query.workspaces.findFirst({
        where: eq(schema.workspaces.id, m.workspaceId),
      })
    )
  );

  return workspaces.filter(Boolean);
  }
}