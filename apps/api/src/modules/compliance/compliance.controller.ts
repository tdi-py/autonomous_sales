import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { IsArray, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { CreateDataDeletionRequestDto } from './dto/data-deletion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

class BulkDeleteLeadsDto {
  @ApiProperty({ example: 'project-uuid' })
  @IsString()
  projectId: string;

  @ApiProperty({ type: [String], description: 'Lead UUIDs to delete' })
  @IsArray()
  @IsUUID(undefined, { each: true })
  leadIds: string[];
}

type AuthRequest = { user: { userId: string } };

@ApiTags('Compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  // ─── Rules ────────────────────────────────────────────────────────────────

  @Get('rules')
  @ApiOperation({ summary: 'Get compliance rules for a country/state' })
  @ApiQuery({ name: 'country', required: false, example: 'US' })
  @ApiQuery({ name: 'state', required: false, example: 'FL' })
  getRules(@Query('country') country?: string, @Query('state') state?: string) {
    if (country) {
      return this.complianceService.getRules(country, state);
    }
    return this.complianceService.getAllRules();
  }

  @Get('phone/:leadId')
  @ApiOperation({ summary: 'Get phone call classification for a lead' })
  @ApiParam({ name: 'leadId' })
  getPhoneClassification(@Param('leadId') leadId: string) {
    return this.complianceService.getPhoneClassification(leadId);
  }

  @Post('check')
  @ApiOperation({ summary: 'Run compliance check (placeholder — runs in worker)' })
  check(@Query('outreachEventId') outreachEventId: string) {
    return this.complianceService.checkCompliance(outreachEventId);
  }

  // ─── GDPR Data Deletion ────────────────────────────────────────────────────

  @Post('data-deletion-request')
  @ApiOperation({
    summary: 'GDPR Right to be Forgotten — create a data deletion request',
  })
  createDeletionRequest(@Body() dto: CreateDataDeletionRequestDto) {
    return this.complianceService.createDataDeletionRequest(dto);
  }

  @Get('data-deletion-requests')
  @ApiOperation({ summary: 'List data deletion requests for a project' })
  @ApiQuery({ name: 'projectId', required: true })
  getDeletionRequests(@Query('projectId') projectId: string) {
    return this.complianceService.getDataDeletionRequests(projectId);
  }

  @Post('data-deletion-request/:id/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger processing of a pending deletion request' })
  @ApiParam({ name: 'id', description: 'Deletion request UUID' })
  processDeletionRequest(@Param('id') id: string) {
    return this.complianceService.processDataDeletionRequest(id);
  }

  // ─── Bulk Delete (non-GDPR, user-initiated cleanup) ───────────────────────

  @Post('bulk-delete-leads')
  @ApiOperation({
    summary: 'Bulk delete leads (adds to suppression list + removes personal data)',
  })
  bulkDeleteLeads(@Body() dto: BulkDeleteLeadsDto) {
    return this.complianceService.bulkDeleteLeads(dto.projectId, dto.leadIds);
  }

  // ─── Abuse Incidents ──────────────────────────────────────────────────────

  @Get('abuse-incidents')
  @ApiOperation({ summary: 'Get abuse incidents for a workspace' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiQuery({ name: 'limit', required: false })
  getAbuseIncidents(
    @Query('workspaceId') workspaceId: string,
    @Query('limit') limit?: number,
  ) {
    return this.complianceService.getAbuseIncidents(workspaceId, limit ? Number(limit) : 20);
  }
}