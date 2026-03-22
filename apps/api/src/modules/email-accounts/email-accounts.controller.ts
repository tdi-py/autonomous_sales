import {
  Controller,
  Get,
  Post,
  Delete,
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
import { EmailAccountsService } from './email-accounts.service';
import { CreateEmailAccountDto } from './dto/email-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

type AuthRequest = { user: { userId: string } };

@ApiTags('Email Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('email-accounts')
export class EmailAccountsController {
  constructor(private readonly service: EmailAccountsService) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: 'Email hesabı bağla — SMTP/IMAP test yapar, DNS kontrol eder',
  })
  create(@Request() req: AuthRequest, @Body() dto: CreateEmailAccountDto) {
    return this.service.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Projenin bağlı email hesaplarını listele' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project UUID' })
  findAll(@Request() req: AuthRequest, @Query('projectId') projectId: string) {
    return this.service.findAll(req.user.userId, projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Email hesabı detayı' })
  @ApiParam({ name: 'id', description: 'Email account UUID' })
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.service.findOne(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Email hesabını kaldır' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.service.remove(id, req.user.userId);
  }

  // ─── Connection test ───────────────────────────────────────────────────────

  @Post(':id/test-connection')
  @ApiOperation({ summary: 'SMTP ve IMAP bağlantısını yeniden test et' })
  @ApiParam({ name: 'id' })
  testConnection(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.service.testConnectionById(id, req.user.userId);
  }

  // ─── DNS check ─────────────────────────────────────────────────────────────

  @Post(':id/check-dns')
  @ApiOperation({ summary: 'SPF/DKIM/DMARC DNS kontrolünü tetikle' })
  @ApiParam({ name: 'id' })
  checkDns(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.service.runDnsCheck(id, req.user.userId);
  }

  // ─── Warmup controls ───────────────────────────────────────────────────────

  @Post(':id/start-warmup')
  @ApiOperation({ summary: 'Hesap ısındırmasını başlat' })
  @ApiParam({ name: 'id' })
  startWarmup(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.service.startWarmup(id, req.user.userId);
  }

  @Post(':id/pause-warmup')
  @ApiOperation({ summary: 'Hesap ısındırmasını duraklat' })
  @ApiParam({ name: 'id' })
  pauseWarmup(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.service.pauseWarmup(id, req.user.userId);
  }

  @Post(':id/resume-warmup')
  @ApiOperation({ summary: 'Hesap ısındırmasını devam ettir' })
  @ApiParam({ name: 'id' })
  resumeWarmup(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.service.resumeWarmup(id, req.user.userId);
  }

  @Get(':id/warmup-progress')
  @ApiOperation({ summary: 'Isındırma durumu ve schedule' })
  @ApiParam({ name: 'id' })
  getWarmupProgress(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.service.getWarmupProgress(id, req.user.userId);
  }

  // ─── Deliverability ────────────────────────────────────────────────────────

  @Post(':id/run-deliverability-test')
  @ApiOperation({ summary: 'Deliverability (spam) testi çalıştır' })
  @ApiParam({ name: 'id' })
  runDeliverabilityTest(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.service.runDeliverabilityTest(id, req.user.userId);
  }

  @Get(':id/deliverability-history')
  @ApiOperation({ summary: 'Son deliverability test sonuçları' })
  @ApiParam({ name: 'id' })
  getDeliverabilityHistory(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.service.getDeliverabilityHistory(id, req.user.userId);
  }
}
