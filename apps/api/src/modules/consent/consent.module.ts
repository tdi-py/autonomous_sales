import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';
import { QUEUE_NAMES } from '@autonomous-sales/shared';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.PHONE_VERIFY }),
  ],
  controllers: [ConsentController],
  providers: [ConsentService],
  exports: [ConsentService],
})
export class ConsentModule {}