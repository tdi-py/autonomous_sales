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
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Observable, interval, map, takeWhile } from 'rxjs';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  CreateIcpProfileDto,
  UpdateIcpProfileDto,
  ConfirmAnalysisDto,
} from './dto/project.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

type AuthRequest = { user: { userId: string } };

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project — triggers analyze-url job if websiteUrl provided' })
  create(@Request() req: AuthRequest, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all projects in a workspace' })
  @ApiQuery({ name: 'workspaceId', required: true })
  findAll(@Request() req: AuthRequest, @Query('workspaceId') workspaceId: string) {
    return this.projectsService.findAll(req.user.userId, workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single project' })
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.projectsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  update(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.projectsService.remove(id, req.user.userId);
  }

  // ── Analysis endpoints ───────────────────────────────────────────────────

  @Get(':id/analysis')
  @ApiOperation({ summary: 'Get AI analysis for a project. Returns { status: pending } if not done.' })
  getAnalysis(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.projectsService.getAnalysis(id, req.user.userId);
  }

  @Patch(':id/analysis/confirm')
  @ApiOperation({ summary: 'Confirm (and optionally edit) analysis results. Marks project active.' })
  confirmAnalysis(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: ConfirmAnalysisDto,
  ) {
    return this.projectsService.confirmAnalysis(id, req.user.userId, dto);
  }

  @Post(':id/analysis/retry')
  @ApiOperation({ summary: 'Re-trigger URL analysis for a project' })
  retryAnalysis(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.projectsService.retryAnalysis(id, req.user.userId);
  }

  // ── ICP Profile endpoints ────────────────────────────────────────────────

  @Get(':id/icp-profiles')
  @ApiOperation({ summary: 'List active ICP profiles for a project' })
  getIcpProfiles(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.projectsService.getIcpProfiles(id, req.user.userId);
  }

  @Post(':id/icp-profiles')
  @ApiOperation({ summary: 'Create a new ICP profile for a project' })
  createIcpProfile(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: CreateIcpProfileDto,
  ) {
    return this.projectsService.createIcpProfile(id, req.user.userId, dto);
  }

  @Patch(':id/icp-profiles/:icpId')
  @ApiOperation({ summary: 'Update an ICP profile' })
  updateIcpProfile(
    @Param('id') id: string,
    @Param('icpId') icpId: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateIcpProfileDto,
  ) {
    return this.projectsService.updateIcpProfile(id, icpId, req.user.userId, dto);
  }

  @Delete(':id/icp-profiles/:icpId')
  @ApiOperation({ summary: 'Soft-delete an ICP profile (sets isActive=false)' })
  deleteIcpProfile(
    @Param('id') id: string,
    @Param('icpId') icpId: string,
    @Request() req: AuthRequest,
  ) {
    return this.projectsService.deleteIcpProfile(id, icpId, req.user.userId);
  }
}