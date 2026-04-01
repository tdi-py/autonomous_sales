import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QUEUE_NAMES } from '@autonomous-sales/shared';
import { OutreachController } from './outreach.controller';
import { OutreachService } from './outreach.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue(
      { name: QUEUE_NAMES.CONTACT_FORM_OUTREACH },
      { name: QUEUE_NAMES.ANALYZE_LEAD_WEBSITE },
    ),
  ],
  controllers: [OutreachController],
  providers: [OutreachService],
  exports: [OutreachService],
})
export class OutreachModule {}
