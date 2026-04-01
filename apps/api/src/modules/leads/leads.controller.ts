import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, LeadQueryDto } from './dto/lead.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { QUEUE_NAMES } from '@autonomous-sales/shared';

type AuthRequest = { user: { userId: string } };

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    @InjectQueue(QUEUE_NAMES.ANALYZE_LEAD_WEBSITE) private readonly analyzeLeadWebsiteQueue: Queue,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a single lead' })
  create(@Request() req: AuthRequest, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List leads with filters' })
  findAll(@Request() req: AuthRequest, @Query() query: LeadQueryDto) {
    return this.leadsService.findAll(req.user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single lead' })
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.leadsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lead' })
  update(@Param('id') id: string, @Request() req: AuthRequest, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lead' })
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.leadsService.remove(id, req.user.userId);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import leads from CSV' })
  importCsv(@Request() req: AuthRequest, @Body('projectId') projectId: string) {
    return this.leadsService.importCsv(req.user.userId, projectId);
  }

  @Get(':id/enrichment')
  @ApiOperation({ summary: 'Get enrichment data for a lead' })
  getEnrichment(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.leadsService.getEnrichment(id, req.user.userId);
  }

  @Get(':id/phone-verification')
  @ApiOperation({ summary: 'Get phone verification for a lead' })
  getPhoneVerification(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.leadsService.getPhoneVerification(id, req.user.userId);
  }

  @Post(':id/analyze-website')
  @ApiOperation({ summary: 'Queue AI website analysis for a lead' })
  async analyzeLeadWebsite(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body('projectId') projectId: string,
  ) {
    const lead = await this.leadsService.findOne(id, req.user.userId);
    const websiteUrl = (lead as any).website ?? (lead as any).enrichment?.companyWebsite;
    if (!websiteUrl) return { success: false, message: 'Lead has no website URL configured' };
    const job = await this.analyzeLeadWebsiteQueue.add(
      { leadId: id, projectId, websiteUrl, agentType: 'analyzer' },
      { attempts: 2, backoff: { type: 'exponential', delay: 30_000 } },
    );
    return { success: true, jobId: job.id, message: 'Website analysis queued' };
  }

  @Get(':id/pain-points')
  @ApiOperation({ summary: 'Get AI-extracted pain points for a lead' })
  getPainPoints(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.leadsService.getPainPoints(id, req.user.userId);
  }
}
