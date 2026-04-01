import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OutreachService } from './outreach.service';

type AuthRequest = { user: { userId: string } };

@ApiTags('Outreach')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/outreach')
export class OutreachController {
  constructor(private readonly outreachService: OutreachService) {}

  @Get()
  @ApiOperation({ summary: 'Get outreach dashboard with events and stats' })
  @ApiParam({ name: 'projectId', type: String })
  @ApiQuery({ name: 'channel', required: false, enum: ['email','call','contact_form','linkedin'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getDashboard(
    @Param('projectId') projectId: string,
    @Request() req: AuthRequest,
    @Query('channel') channel?: 'email' | 'call' | 'contact_form' | 'linkedin',
    @Query('status') status?: string,
    @Query('campaignId') campaignId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.outreachService.getDashboard(projectId, req.user.userId, {
      channel, status, campaignId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated outreach stats' })
  getStats(@Param('projectId') projectId: string, @Request() req: AuthRequest) {
    return this.outreachService.getStats(projectId, req.user.userId);
  }

  @Get('next-suggestion')
  @ApiOperation({ summary: 'Get AI suggestion for next outreach action' })
  getNextSuggestion(@Param('projectId') projectId: string, @Request() req: AuthRequest) {
    return this.outreachService.getNextSuggestion(projectId, req.user.userId);
  }

  @Get('template-performance')
  @ApiOperation({ summary: 'Get template performance stats by industry and ICP' })
  getTemplatePerformance(@Param('projectId') projectId: string, @Request() req: AuthRequest) {
    return this.outreachService.getTemplatePerformance(projectId, req.user.userId);
  }

  @Post('contact-form/:leadId')
  @ApiOperation({ summary: 'Queue contact form outreach for a lead' })
  queueContactFormOutreach(
    @Param('projectId') projectId: string,
    @Param('leadId') leadId: string,
    @Request() req: AuthRequest,
    @Body() body: { campaignId: string },
  ) {
    return this.outreachService.queueContactFormOutreach(leadId, projectId, body.campaignId, req.user.userId);
  }

  @Post('contact-form/:leadId/approve')
  @ApiOperation({ summary: 'Approve and submit contact form after user review' })
  approveContactForm(
    @Param('projectId') projectId: string,
    @Param('leadId') leadId: string,
    @Request() req: AuthRequest,
    @Body() approvedContent: any,
  ) {
    return this.outreachService.approveContactForm(leadId, approvedContent, projectId, req.user.userId);
  }

  @Post('analyze-lead/:leadId')
  @ApiOperation({ summary: 'Queue lead website analysis' })
  queueLeadWebsiteAnalysis(
    @Param('projectId') projectId: string,
    @Param('leadId') leadId: string,
    @Request() req: AuthRequest,
  ) {
    return this.outreachService.queueLeadWebsiteAnalysis(leadId, projectId, req.user.userId);
  }

  // ─── Contact form submissions panel ───────────────────────────────────────

  @Get('contact-form-submissions')
  @ApiOperation({ summary: 'Proje için tüm contact form submission\'larını listele' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending_approval','approved','submitted','failed','rejected'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getContactFormSubmissions(
    @Param('projectId') projectId: string,
    @Request() req: AuthRequest,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.outreachService.getContactFormSubmissions(projectId, req.user.userId, {
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // ─── Platform template insights ────────────────────────────────────────────

  @Get('platform-insights')
  @ApiOperation({ summary: 'AI öğrenilen kurallar ve template performansı (segment bazlı)' })
  getPlatformTemplateInsights(@Param('projectId') projectId: string, @Request() req: AuthRequest) {
    return this.outreachService.getPlatformTemplateInsights(projectId, req.user.userId);
  }
}
