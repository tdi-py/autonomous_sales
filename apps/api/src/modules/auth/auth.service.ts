import { Injectable, ConflictException, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check email uniqueness
    const existing = await this.db.query.users.findFirst({
      where: eq(schema.users.email, dto.email.toLowerCase()),
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user
    const [user] = await this.db
      .insert(schema.users)
      .values({
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        companyName: dto.companyName,
      })
      .returning();

    // Create default workspace for this user
    const [workspace] = await this.db
      .insert(schema.workspaces)
      .values({
        name: dto.companyName ?? `${dto.name}'s Workspace`,
        ownerId: user.id,
      })
      .returning();

    // Add user as workspace owner
    await this.db.insert(schema.workspaceMembers).values({
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
      acceptedAt: new Date(),
    });

    const token = this.signToken(user.id, user.email, workspace.id, user.role);

    return {
      token,
      user: this.sanitizeUser(user),
      workspace,
    };
  }

  async login(dto: LoginDto) {
  const user = await this.db.query.users.findFirst({
    where: eq(schema.users.email, dto.email.toLowerCase()),
  });

  if (!user || !user.passwordHash) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) throw new UnauthorizedException('Invalid credentials');

  // with: { workspace: true } kaldırıldı — relation tanımlı değil
  const membership = await this.db.query.workspaceMembers.findFirst({
    where: eq(schema.workspaceMembers.userId, user.id),
  });

  const workspaceId = membership?.workspaceId ?? '';
  const token = this.signToken(user.id, user.email, workspaceId, user.role);

  return {
    token,
    user: this.sanitizeUser(user),
  };
}

  async getMe(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) throw new UnauthorizedException();
    return this.sanitizeUser(user);
  }

  private signToken(userId: string, email: string, workspaceId: string, role: string) {
    return this.jwtService.sign({ sub: userId, email, workspaceId, role });
  }

  private sanitizeUser(user: schema.User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _pw, ...safe } = user;
    return safe;
  }
}