import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId: string };

    // workspaceId comes from route param or query string
    const workspaceId =
      request.params?.workspaceId ??
      request.query?.workspaceId ??
      request.body?.workspaceId;

    if (!workspaceId) return true; // no workspace scope on this route

    const membership = await this.db.query.workspaceMembers.findFirst({
      where: and(
        eq(schema.workspaceMembers.workspaceId, workspaceId),
        eq(schema.workspaceMembers.userId, user.userId),
      ),
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    // Attach membership info to request for downstream use
    request.workspaceMembership = membership;
    return true;
  }
}