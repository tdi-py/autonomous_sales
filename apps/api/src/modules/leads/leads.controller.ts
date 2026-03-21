import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, LeadQueryDto } from './dto/lead.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

type AuthRequest = { user: { userId: string } };

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a single lead' })
  create(@Request() req: AuthRequest, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List leads with filters (status, phone classification, ICP)' })
  findAll(@Request() req: AuthRequest, @Query() query: LeadQueryDto) {
    return this.leadsService.findAll(req.user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single lead with enrichment + phone data' })
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.leadsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lead' })
  update(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lead' })
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.leadsService.remove(id, req.user.userId);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import leads from CSV (placeholder — Phase 3)' })
  importCsv(
    @Request() req: AuthRequest,
    @Body('projectId') projectId: string,
  ) {
    return this.leadsService.importCsv(req.user.userId, projectId);
  }

  @Get(':id/enrichment')
  @ApiOperation({ summary: 'Get enrichment data for a lead' })
  getEnrichment(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.leadsService.getEnrichment(id, req.user.userId);
  }

  @Get(':id/phone-verification')
  @ApiOperation({ summary: 'Get phone verification + call classification for a lead' })
  getPhoneVerification(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.leadsService.getPhoneVerification(id, req.user.userId);
  }
}