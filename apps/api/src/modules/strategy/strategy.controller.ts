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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StrategyService } from './strategy.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

class RejectDecisionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

type AuthRequest = { user: { userId: string } };

@ApiTags('Strategy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:id/strategy')
export class StrategyController {
  constructor(private readonly strategyService: StrategyService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Strategy overview — health score, pending decisions, learned rules count' })
  @ApiParam({ name: 'id' })
  getOverview(@Param('id') projectId: string, @Request() req: AuthRequest) {
    return this.strategyService.getOverview(projectId, req.user.userId);
  }

  @Get('decisions')
  @ApiOperation({ summary: 'List strategy decisions (pending/applied)' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'filter', required: false, enum: ['applied', 'pending'] })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  getDecisions(
    @Param('id') projectId: string,
    @Request() req: AuthRequest,
    @Query('filter') filter?: 'applied' | 'pending',
    @Query('limit') limit = 20,
    @Query('offset') offset = 0,
  ) {
    return this.strategyService.getDecisions(
      projectId,
      req.user.userId,
      filter,
      Number(limit),
      Number(offset),
    );
  }

  @Post('decisions/:decisionId/apply')
  @ApiOperation({ summary: 'Manually apply a pending decision' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'decisionId' })
  applyDecision(
    @Param('id') projectId: string,
    @Param('decisionId') decisionId: string,
    @Request() req: AuthRequest,
  ) {
    return this.strategyService.applyDecision(projectId, decisionId, req.user.userId);
  }

  @Post('decisions/:decisionId/reject')
  @ApiOperation({ summary: 'Reject a pending decision' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'decisionId' })
  rejectDecision(
    @Param('id') projectId: string,
    @Param('decisionId') decisionId: string,
    @Request() req: AuthRequest,
    @Body() dto: RejectDecisionDto,
  ) {
    return this.strategyService.rejectDecision(
      projectId,
      decisionId,
      req.user.userId,
      dto.reason,
    );
  }

  @Post('run-now')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger strategy analysis now' })
  @ApiParam({ name: 'id' })
  runNow(@Param('id') projectId: string, @Request() req: AuthRequest) {
    return this.strategyService.runNow(projectId, req.user.userId);
  }

  @Get('learned-rules')
  @ApiOperation({ summary: 'Get project + platform learned rules' })
  @ApiParam({ name: 'id' })
  getLearnedRules(@Param('id') projectId: string, @Request() req: AuthRequest) {
    return this.strategyService.getLearnedRules(projectId, req.user.userId);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Strategy analytics dashboard data' })
  @ApiParam({ name: 'id' })
  getAnalytics(@Param('id') projectId: string, @Request() req: AuthRequest) {
    return this.strategyService.getAnalytics(projectId, req.user.userId);
  }
}

@ApiTags('Strategy')
@Controller('platform/insights')
export class PlatformInsightsController {
  constructor(private readonly strategyService: StrategyService) {}

  @Get()
  @ApiOperation({ summary: 'Platform-wide learned rules (public collective intelligence)' })
  @ApiQuery({ name: 'industry', required: false })
  getPlatformInsights(@Query('industry') industry?: string) {
    return this.strategyService.getPlatformInsights(industry);
  }
}