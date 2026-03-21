import { Module, Controller, Get } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { QUEUE_NAMES } from '@autonomous-sales/shared';

import { AnalyzeUrlProcessor } from './processors/analyze-url.processor';
import { GenerateCampaignProcessor } from './processors/generate-campaign.processor';
import { SendOutreachProcessor } from './processors/send-outreach.processor';
import { WarmupExecuteProcessor } from './processors/warmup-execute.processor';
import { PhoneVerifyProcessor } from './processors/phone-verify.processor';
import { StrategyReviewProcessor } from './processors/strategy-review.processor';
import { ComplianceCheckProcessor } from './processors/compliance-check.processor';
import { DatabaseModule } from './database/database.module';
import { ScraperService } from './services/scraper.service';
import { AnalyzerService } from './services/analyzer.service';

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
    ),
    DatabaseModule,
  ],
  controllers: [HealthController],
  providers: [
    ScraperService,
    AnalyzerService,
    AnalyzeUrlProcessor,
    GenerateCampaignProcessor,
    SendOutreachProcessor,
    WarmupExecuteProcessor,
    PhoneVerifyProcessor,
    StrategyReviewProcessor,
    ComplianceCheckProcessor,
  ],
})
export class WorkerModule {}