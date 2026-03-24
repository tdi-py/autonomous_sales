import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
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
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InboxService, type InboxFilter } from './inbox.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

class ApplyActionDto {
  @ApiProperty({ enum: ['schedule_meeting', 'send_info', 'follow_up_later', 'add_to_suppression', 'no_action'] })
  @IsIn(['schedule_meeting', 'send_info', 'follow_up_later', 'add_to_suppression', 'no_action'])
  action: 'schedule_meeting' | 'send_info' | 'follow_up_later' | 'add_to_suppression' | 'no_action';
}

type AuthRequest = { user: { userId: string } };

@ApiTags('Inbox')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inbox')
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  @Get()
  @ApiOperation({ summary: 'List inbox messages for a project' })
  @ApiQuery({ name: 'projectId', required: true })
  @ApiQuery({ name: 'filter', required: false, enum: ['all', 'requires_action', 'positive', 'negative', 'unread'] })
  @ApiQuery({ name: 'campaignId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  listMessages(
    @Request() req: AuthRequest,
    @Query('projectId') projectId: string,
    @Query('filter') filter: InboxFilter = 'all',
    @Query('campaignId') campaignId?: string,
    @Query('limit') limit = 20,
    @Query('offset') offset = 0,
  ) {
    return this.inboxService.listMessages(
      projectId,
      req.user.userId,
      filter,
      campaignId,
      Number(limit),
      Number(offset),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single inbox message with lead history' })
  @ApiParam({ name: 'id' })
  getMessage(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.inboxService.getMessage(id, req.user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiParam({ name: 'id' })
  markAsRead(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.inboxService.markAsRead(id, req.user.userId);
  }

  @Patch(':id/action')
  @ApiOperation({ summary: 'Apply suggested action to a message' })
  @ApiParam({ name: 'id' })
  applyAction(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: ApplyActionDto,
  ) {
    return this.inboxService.applyAction(id, req.user.userId, dto.action);
  }
}