import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { QUEUE_NAMES } from '@autonomous-sales/shared';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_NAMES.GENERATE_CAMPAIGN_CONTENT },
    ),
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}