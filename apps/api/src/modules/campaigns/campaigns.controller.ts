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

type AuthRequest = { user: { userId: string } };

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  // ─── Campaign CRUD ─────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: 'Kampanya oluştur — otomatik olarak içerik üretim job\'ını tetikler',
  })
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
  @ApiOperation({ summary: 'Kampanya detayı — içerik üretildiyse sequence + script dahil' })
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
  @ApiOperation({
    summary: 'İçerik üretim durumunu kontrol et (polling için)',
  })
  getContentStatus(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.getContentStatus(id, req.user.userId);
  }

  // ─── Email Sequences ───────────────────────────────────────────────────────

  @Get(':id/sequences')
  @ApiOperation({ summary: 'Email dizilerini getir — adım+varyant olarak gruplandırılmış' })
  getSequences(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.getSequences(id, req.user.userId);
  }

  @Post(':id/sequences')
  @ApiOperation({ summary: 'Email dizisine manuel adım ekle' })
  createSequenceStep(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: CreateEmailSequenceDto,
  ) {
    return this.campaignsService.createSequenceStep(id, req.user.userId, dto);
  }

  @Patch(':id/sequences/:sequenceId')
  @ApiOperation({ summary: 'Email adımını düzenle (subject + body)' })
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
  @ApiOperation({ summary: 'Call script\'lerini getir (versiyona göre sıralı)' })
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
  @ApiOperation({ summary: 'Tüm içeriği yeniden üret (mevcut içeriği sil, yeni versiyon)' })
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
  @ApiOperation({
    summary: 'Kampanya başlatma ön kontrol — email, DNS, ısındırma, lead, spam testi',
  })
  @ApiParam({ name: 'id' })
  preflightCheck(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.preflightCheck(id, req.user.userId);
  }
}