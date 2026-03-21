import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { QUEUE_NAMES } from '@autonomous-sales/shared';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_NAMES.ANALYZE_URL },
      { name: QUEUE_NAMES.GENERATE_CAMPAIGN_CONTENT },
    ),
  ],
  controllers: [AgentsController],
  providers: [AgentsService],
})
export class AgentsModule {}