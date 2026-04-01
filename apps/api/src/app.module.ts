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
import { EmailAccountsModule } from './modules/email-accounts/email-accounts.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { PhoneVerificationModule } from './modules/phone-verification/phone-verification.module';
import { ConsentModule } from './modules/consent/consent.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { StrategyModule } from './modules/strategy/strategy.module';
import { OutreachModule } from './modules/outreach/outreach.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    BullModule.forRoot({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    ProjectsModule,
    CampaignsModule,
    LeadsModule,
    AgentsModule,
    ComplianceModule,
    HealthModule,
    EmailAccountsModule,
    TrackingModule,
    InboxModule,
    PhoneVerificationModule,
    ConsentModule,
    WebhooksModule,
    StrategyModule,
    OutreachModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
