import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QUEUE_NAMES } from '@autonomous-sales/shared';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_NAMES.ANALYZE_LEAD_WEBSITE },
      { name: QUEUE_NAMES.CONTACT_FORM_OUTREACH },
    ),
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
