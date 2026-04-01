import { Module, Controller, Get } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { QUEUE_NAMES } from '@autonomous-sales/shared';

import { AnalyzeUrlProcessor } from './processors/analyze-url.processor';
import { GenerateCampaignProcessor } from './processors/generate-campaign.processor';
import { SendOutreachProcessor } from './processors/send-outreach.processor';
import { WarmupExecuteProcessor } from './processors/warmup-execute.processor';
import { PhoneVerifyProcessor } from './processors/phone-verify.processor';
import { ExecuteCallProcessor } from './processors/execute-call.processor';
import { StrategyReviewProcessor } from './processors/strategy-review.processor';
import { ComplianceCheckProcessor } from './processors/compliance-check.processor';
import { InboxSyncProcessor, InboxSyncCronService } from './processors/inbox-sync.processor';
import { ContactFormProcessor } from './processors/contact-form.processor';
import { AnalyzeLeadWebsiteProcessor } from './processors/analyze-lead-website.processor';
// ── Faz 6 ──────────────────────────────────────────────────────────────────
import {
  AbuseDetectionProcessor,
  AbuseDetectionCronService,
} from './processors/abuse-detection.processor';

import { DatabaseModule } from './database/database.module';
import { ScraperService } from './services/scraper.service';
import { AnalyzerService } from './services/analyzer.service';
import { ContactFormService } from './services/contact-form.service';
import { LeadAnalyzerService } from './services/lead-analyzer.service';
import { CommunicatorService } from './services/communicator.service';
import { ContentCheckerService } from './services/content-checker.service';
import { SmtpService } from './services/smtp.service';
import { ImapService } from './services/imap.service';
import { DnsCheckerService } from './services/dns-checker.service';
import { WarmupService } from './services/warmup.service';
import { DeliverabilityTesterService } from './services/deliverability-tester.service';
import { WarmupCronService } from './services/warmup-cron.service';
// ── Faz 3 ──────────────────────────────────────────────────────────────────
import { TrackingService } from './services/tracking.service';
import { EmailSenderService } from './services/email-sender.service';
import { BounceHandlerService } from './services/bounce-handler.service';
import { InboxSyncService } from './services/inbox-sync.service';
// ── Faz 4 ──────────────────────────────────────────────────────────────────
import { PhoneVerifierService } from './services/phone-verifier.service';
import { VapiCallService } from './services/vapi-call.service';
// ── Faz 6 ──────────────────────────────────────────────────────────────────
import { ComplianceEngineService } from './services/compliance-engine.service';
import { AbuseDetectorService } from './services/abuse-detector.service';

@Controller('health')
class HealthController {
  @Get()
  check() {
    return { status: 'ok', service: 'worker', timestamp: new Date().toISOString() };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.ANALYZE_URL },
      { name: QUEUE_NAMES.GENERATE_CAMPAIGN_CONTENT },
      { name: QUEUE_NAMES.SEND_OUTREACH },
      { name: QUEUE_NAMES.WARMUP_EXECUTE },
      { name: QUEUE_NAMES.PHONE_VERIFY },
      { name: QUEUE_NAMES.STRATEGY_REVIEW },
      { name: QUEUE_NAMES.COMPLIANCE_CHECK },
      { name: QUEUE_NAMES.CONTACT_FORM_OUTREACH },
      { name: QUEUE_NAMES.ANALYZE_LEAD_WEBSITE },
      { name: 'inbox-sync' },
      { name: 'execute-call' },
      // ── Faz 6 ────────────────────────────────────────────────────────────
      { name: 'abuse-detection' },
    ),
    DatabaseModule,
  ],
  controllers: [HealthController],
  providers: [
    // ── Faz 1 ──────────────────────────────────────────────────────────────
    ScraperService,
    AnalyzerService,
    ContactFormService,
    LeadAnalyzerService,
    // ── Faz 2 ──────────────────────────────────────────────────────────────
    CommunicatorService,
    ContentCheckerService,
    // ── Faz 2.5 ─────────────────────────────────────────────────────────────
    SmtpService,
    ImapService,
    DnsCheckerService,
    WarmupService,
    DeliverabilityTesterService,
    WarmupCronService,
    // ── Faz 3 ───────────────────────────────────────────────────────────────
    TrackingService,
    EmailSenderService,
    BounceHandlerService,
    InboxSyncService,
    InboxSyncCronService,
    // ── Faz 4 ───────────────────────────────────────────────────────────────
    PhoneVerifierService,
    VapiCallService,
    // ── Faz 6 ───────────────────────────────────────────────────────────────
    ComplianceEngineService,
    AbuseDetectorService,
    AbuseDetectionCronService,
    // ── Processors ─────────────────────────────────────────────────────────
    AnalyzeUrlProcessor,
    GenerateCampaignProcessor,
    SendOutreachProcessor,
    WarmupExecuteProcessor,
    PhoneVerifyProcessor,
    ExecuteCallProcessor,
    StrategyReviewProcessor,
    ComplianceCheckProcessor,
    InboxSyncProcessor,
    AbuseDetectionProcessor,
    ContactFormProcessor,
    AnalyzeLeadWebsiteProcessor,
  ],
})
export class WorkerModule {}