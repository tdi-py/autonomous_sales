import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { LeadsModule } from './modules/leads/leads.module';
import { AgentsModule } from './modules/agents/agents.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { HealthModule } from './modules/health/health.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    // ─── Config ─────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),

    // ─── Rate Limiting ───────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,  // 1 minute window
        limit: 100,   // 100 requests per window
      },
    ]),

    // ─── BullMQ / Redis ──────────────────────────────────────────────────────
    BullModule.forRoot({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    }),

    // ─── Database ────────────────────────────────────────────────────────────
    DatabaseModule,

    // ─── Feature Modules ─────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    WorkspacesModule,
    ProjectsModule,
    CampaignsModule,
    LeadsModule,
    AgentsModule,
    ComplianceModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}