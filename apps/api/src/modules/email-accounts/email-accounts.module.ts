import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailAccountsController } from './email-accounts.controller';
import { EmailAccountsService } from './email-accounts.service';
import { QUEUE_NAMES } from '@autonomous-sales/shared';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_NAMES.WARMUP_EXECUTE },
    ),
  ],
  controllers: [EmailAccountsController],
  providers: [EmailAccountsService],
  exports: [EmailAccountsService],
})
export class EmailAccountsModule {}
