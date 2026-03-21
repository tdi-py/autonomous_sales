import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('rules')
  @ApiOperation({ summary: 'Get compliance rules for a country/state' })
  @ApiQuery({ name: 'country', required: true, example: 'US' })
  @ApiQuery({ name: 'state', required: false, example: 'FL' })
  getRules(@Query('country') country: string, @Query('state') state?: string) {
    return this.complianceService.getRules(country, state);
  }

  @Get('phone/:leadId')
  @ApiOperation({ summary: 'Get phone call classification for a lead' })
  getPhoneClassification(@Param('leadId') leadId: string) {
    return this.complianceService.getPhoneClassification(leadId);
  }

  @Post('check')
  @ApiOperation({ summary: 'Run compliance check (placeholder — runs in worker)' })
  check(@Query('outreachEventId') outreachEventId: string) {
    return this.complianceService.checkCompliance(outreachEventId);
  }
}