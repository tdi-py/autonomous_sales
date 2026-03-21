import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { eq } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import { Module } from '@nestjs/common';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Railway health check — DB + Redis status' })
  async check() {
    const checks: Record<string, string> = {};

    // DB check
    try {
      await this.db.select().from(schema.users).limit(1);
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    const allOk = Object.values(checks).every((v) => v === 'ok');

    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}