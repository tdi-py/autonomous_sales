import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  InviteMemberDto,
} from './dto/workspace.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

type AuthRequest = { user: { userId: string } };

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  create(@Request() req: AuthRequest, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all workspaces for current user' })
  findAll(@Request() req: AuthRequest) {
    return this.workspacesService.findAllForUser(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single workspace' })
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.workspacesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace (admin/owner only)' })
  update(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workspace (owner only)' })
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.workspacesService.remove(id, req.user.userId);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Invite a user to workspace (admin/owner only)' })
  invite(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: InviteMemberDto,
  ) {
    return this.workspacesService.invite(id, req.user.userId, dto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List workspace members' })
  getMembers(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.workspacesService.getMembers(id, req.user.userId);
  }
}