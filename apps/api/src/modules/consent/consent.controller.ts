import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ConsentService } from './consent.service';
import { CreateConsentDto, RevokeConsentDto } from './dto/consent.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

type AuthRequest = { user: { userId: string } };

@ApiTags('Consent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads/:leadId/consent')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post()
  @ApiOperation({ summary: 'Create consent record for a lead' })
  @ApiParam({ name: 'leadId' })
  createConsent(
    @Param('leadId') leadId: string,
    @Request() req: AuthRequest,
    @Body() dto: CreateConsentDto,
  ) {
    return this.consentService.createConsent(leadId, req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List consent records for a lead' })
  @ApiParam({ name: 'leadId' })
  listConsents(@Param('leadId') leadId: string, @Request() req: AuthRequest) {
    return this.consentService.listConsents(leadId, req.user.userId);
  }

  @Post(':consentId/revoke')
  @ApiOperation({ summary: 'Revoke a consent record' })
  @ApiParam({ name: 'leadId' })
  @ApiParam({ name: 'consentId' })
  revokeConsent(
    @Param('leadId') leadId: string,
    @Param('consentId') consentId: string,
    @Request() req: AuthRequest,
    @Body() dto: RevokeConsentDto,
  ) {
    return this.consentService.revokeConsent(leadId, consentId, req.user.userId, dto);
  }

  @Get('eligibility')
  @ApiOperation({ summary: 'Get full call eligibility report for a lead' })
  @ApiParam({ name: 'leadId' })
  getCallEligibility(@Param('leadId') leadId: string, @Request() req: AuthRequest) {
    return this.consentService.getCallEligibility(leadId, req.user.userId);
  }
}