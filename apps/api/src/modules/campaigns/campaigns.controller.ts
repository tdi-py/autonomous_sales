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
import { CampaignsService } from './campaigns.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CreateEmailSequenceDto,
  CreateCallScriptDto,
} from './dto/campaign.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

type AuthRequest = { user: { userId: string } };

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  create(@Request() req: AuthRequest, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all campaigns in a project' })
  @ApiQuery({ name: 'projectId', required: true })
  findAll(@Request() req: AuthRequest, @Query('projectId') projectId: string) {
    return this.campaignsService.findAll(req.user.userId, projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single campaign' })
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update campaign' })
  update(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete campaign' })
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.remove(id, req.user.userId);
  }

  @Get(':id/sequences')
  @ApiOperation({ summary: 'Get email sequences for a campaign (ordered by step)' })
  getSequences(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.getSequences(id, req.user.userId);
  }

  @Post(':id/sequences')
  @ApiOperation({ summary: 'Add an email sequence step to a campaign' })
  createSequenceStep(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: CreateEmailSequenceDto,
  ) {
    return this.campaignsService.createSequenceStep(id, req.user.userId, dto);
  }

  @Get(':id/scripts')
  @ApiOperation({ summary: 'Get call scripts for a campaign' })
  getScripts(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.campaignsService.getScripts(id, req.user.userId);
  }

  @Post(':id/scripts')
  @ApiOperation({ summary: 'Create a new call script version for a campaign' })
  createScript(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: CreateCallScriptDto,
  ) {
    return this.campaignsService.createScript(id, req.user.userId, dto);
  }
}