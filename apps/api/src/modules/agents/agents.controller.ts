import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

class AnalyzeUrlDto {
  @ApiProperty() @IsString() projectId: string;
  @ApiProperty() @IsUrl() websiteUrl: string;
}
class GenerateContentDto {
  @ApiProperty() @IsString() projectId: string;
  @ApiProperty() @IsString() campaignId: string;
}

@ApiTags('Agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post('analyze-url')
  @ApiOperation({ summary: 'Queue Analyzer Agent to scrape & analyse a website' })
  analyzeUrl(@Body() dto: AnalyzeUrlDto) {
    return this.agentsService.triggerAnalyzeUrl(dto.projectId, dto.websiteUrl);
  }

  @Post('generate-content')
  @ApiOperation({ summary: 'Queue Communicator Agent to generate campaign content' })
  generateContent(@Body() dto: GenerateContentDto) {
    return this.agentsService.triggerGenerateContent(dto.projectId, dto.campaignId);
  }

  @Get('executions')
  @ApiOperation({ summary: 'List agent execution logs for a project' })
  getExecutions(@Query('projectId') projectId: string, @Query('limit') limit?: number) {
    return this.agentsService.getExecutions(projectId, limit);
  }
}