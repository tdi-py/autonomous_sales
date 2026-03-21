import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { QUEUE_NAMES } from '@autonomous-sales/shared';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.ANALYZE_URL }),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}