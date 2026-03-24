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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CreateEmailSequenceDto,
  UpdateEmailSequenceDto,
  CreateCallScriptDto,
  UpdateCallScriptDto,
} from './dto/campaign.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

class AddLeadsDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  leadIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icpProfileId?: string;
}

type AuthRequest = { user: { userId: string } };

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  // ─── Campaign CRUD ─────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Kampanya oluştur' })
  create(@Request() req: AuthRequest, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Projedeki tüm kampanyaları listele' })
  @ApiQuery({ name: 'projectId', required: true })
  findAll(@Request() req: AuthRequest, @Query('projectId') projectId: string) {
    return this.campaignsService.findAll(req.user.userId, projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Kampanya detayı' })
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Kampanya güncelle' })
  update(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Kampanyayı sil' })
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.remove(id, req.user.userId);
  }

  // ─── Content Status ────────────────────────────────────────────────────────

  @Get(':id/content-status')
  @ApiOperation({ summary: 'İçerik üretim durumunu kontrol et' })
  getContentStatus(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.getContentStatus(id, req.user.userId);
  }

  // ─── Email Sequences ───────────────────────────────────────────────────────

  @Get(':id/sequences')
  @ApiOperation({ summary: 'Email dizilerini getir' })
  getSequences(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.getSequences(id, req.user.userId);
  }

  @Post(':id/sequences')
  @ApiOperation({ summary: 'Email dizisine adım ekle' })
  createSequenceStep(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: CreateEmailSequenceDto,
  ) {
    return this.campaignsService.createSequenceStep(id, req.user.userId, dto);
  }

  @Patch(':id/sequences/:sequenceId')
  @ApiOperation({ summary: 'Email adımını düzenle' })
  updateSequenceStep(
    @Param('id') id: string,
    @Param('sequenceId') sequenceId: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateEmailSequenceDto,
  ) {
    return this.campaignsService.updateSequenceStep(id, sequenceId, req.user.userId, dto);
  }

  // ─── Call Scripts ──────────────────────────────────────────────────────────

  @Get(':id/scripts')
  @ApiOperation({ summary: 'Call script\'lerini getir' })
  getScripts(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.getScripts(id, req.user.userId);
  }

  @Post(':id/scripts')
  @ApiOperation({ summary: 'Yeni call script versiyonu ekle' })
  createScript(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: CreateCallScriptDto,
  ) {
    return this.campaignsService.createScript(id, req.user.userId, dto);
  }

  @Patch(':id/scripts/:scriptId')
  @ApiOperation({ summary: 'Call script\'i düzenle' })
  updateScript(
    @Param('id') id: string,
    @Param('scriptId') scriptId: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateCallScriptDto,
  ) {
    return this.campaignsService.updateScript(id, scriptId, req.user.userId, dto);
  }

  // ─── Regenerate ────────────────────────────────────────────────────────────

  @Post(':id/regenerate')
  @ApiOperation({ summary: 'Tüm içeriği yeniden üret' })
  regenerate(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.regenerate(id, req.user.userId);
  }

  @Post(':id/regenerate-step/:stepOrder')
  @ApiOperation({ summary: 'Belirli bir email adımını yeniden üret' })
  @ApiParam({ name: 'stepOrder', type: Number })
  regenerateStep(
    @Param('id') id: string,
    @Param('stepOrder') stepOrder: number,
    @Request() req: AuthRequest,
  ) {
    return this.campaignsService.regenerateStep(id, Number(stepOrder), req.user.userId);
  }

  // ─── Preflight Check ───────────────────────────────────────────────────────

  @Get(':id/preflight-check')
  @ApiOperation({ summary: 'Kampanya başlatma ön kontrol' })
  preflightCheck(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.preflightCheck(id, req.user.userId);
  }

  // ─── Faz 3: Launch / Pause / Resume / Stop ────────────────────────────────

  @Post(':id/launch')
  @ApiOperation({ summary: 'Kampanyayı başlat — preflight + BullMQ repeatable job' })
  launch(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.launch(id, req.user.userId);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Kampanyayı duraklat' })
  pause(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.pause(id, req.user.userId);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Kampanyayı devam ettir' })
  resume(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.resume(id, req.user.userId);
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Kampanyayı tamamen durdur' })
  stop(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.stop(id, req.user.userId);
  }

  // ─── Faz 3: Leads ──────────────────────────────────────────────────────────

  @Post(':id/leads')
  @ApiOperation({ summary: 'Lead\'leri kampanyaya ekle' })
  addLeads(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: AddLeadsDto,
  ) {
    return this.campaignsService.addLeads(id, req.user.userId, dto);
  }

  @Get(':id/leads')
  @ApiOperation({ summary: 'Kampanyaya atanmış lead\'leri listele' })
  getCampaignLeads(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.getCampaignLeads(id, req.user.userId);
  }

  // ─── Faz 3: Metrics ────────────────────────────────────────────────────────

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Kampanya metrikleri — open/click/reply/bounce rate + A/B' })
  getMetrics(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.getMetrics(id, req.user.userId);
  }
}