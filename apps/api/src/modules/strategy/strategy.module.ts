import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { StrategyController, PlatformInsightsController } from './strategy.controller';
import { StrategyService } from './strategy.service';
import { QUEUE_NAMES } from '@autonomous-sales/shared';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.STRATEGY_REVIEW }),
  ],
  controllers: [StrategyController, PlatformInsightsController],
  providers: [StrategyService],
  exports: [StrategyService],
})
export class StrategyModule {}