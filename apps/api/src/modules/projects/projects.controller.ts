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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, CreateIcpProfileDto } from './dto/project.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

type AuthRequest = { user: { userId: string } };

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project inside a workspace' })
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

  @Get(':id/analysis')
  @ApiOperation({ summary: 'Get AI analysis for a project' })
  getAnalysis(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.projectsService.getAnalysis(id, req.user.userId);
  }

  @Get(':id/icp-profiles')
  @ApiOperation({ summary: 'List ICP profiles for a project' })
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
}