import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request,
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

  // ─── Website analysis ──────────────────────────────────────────────────────

  @Post(':id/analyze-website')
  @ApiOperation({ summary: 'Queue AI website analysis — pain points, challenges, suggested approach' })
  analyzeLeadWebsite(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.leadsService.analyzeWebsite(id, req.user.userId);
  }

  @Get(':id/pain-points')
  @ApiOperation({ summary: 'Get AI-extracted pain points and website insights for a lead' })
  getPainPoints(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.leadsService.getPainPoints(id, req.user.userId);
  }

  // ─── Contact form outreach ──────────────────────────────────────────────────

  @Post(':id/contact-form')
  @ApiOperation({ summary: 'AI ile lead\'s iletişim formunu bul ve içerik hazırla (onay bekler)' })
  queueContactForm(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body('campaignId') campaignId?: string,
  ) {
    return this.leadsService.queueContactForm(id, req.user.userId, campaignId);
  }

  @Post(':id/contact-form/:submissionId/approve')
  @ApiOperation({ summary: 'Onaylanan içerikle contact form submit et' })
  approveContactForm(
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @Request() req: AuthRequest,
    @Body() body: { name: string; email: string; phone?: string; message: string; company?: string },
  ) {
    return this.leadsService.approveContactForm(id, submissionId, req.user.userId, body);
  }

  @Get(':id/contact-form-submissions')
  @ApiOperation({ summary: 'Lead için tüm contact form submission\'larını listele' })
  getContactFormSubmissions(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.leadsService.getContactFormSubmissions(id, req.user.userId);
  }
}
