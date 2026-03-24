import {
  Controller,
  Get,
  Post,
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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import { QUEUE_NAMES } from '@autonomous-sales/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

// ─── DTO ─────────────────────────────────────────────────────────────────────

class TriggerVerifyDto {
  @ApiProperty({ example: 'proj-uuid' })
  @IsString()
  projectId: string;
}

type AuthRequest = { user: { userId: string } };

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class PhoneVerificationService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    @InjectQueue(QUEUE_NAMES.PHONE_VERIFY) private readonly phoneVerifyQueue: Queue,
  ) {}

  async getVerification(leadId: string, userId: string) {
    await this.assertLeadAccess(leadId, userId);

    const verification = await this.db.query.phoneVerification.findFirst({
      where: eq(schema.phoneVerification.leadId, leadId),
    }) as schema.PhoneVerification | null;

    if (!verification) throw new NotFoundException('No phone verification data for this lead');
    return verification;
  }

  async triggerVerification(leadId: string, userId: string) {
    const lead = await this.assertLeadAccess(leadId, userId);

    if (!lead.contactPhone) {
      throw new NotFoundException('Lead has no phone number to verify');
    }

    const job = await this.phoneVerifyQueue.add(
      {
        leadId,
        projectId: lead.projectId,
        phoneNumber: lead.contactPhone,
        agentType: 'analyzer',
      },
      { attempts: 2, backoff: { type: 'fixed', delay: 5000 } },
    );

    return { queued: true, jobId: job.id, leadId, phone: `****${lead.contactPhone.slice(-4)}` };
  }

  async triggerBulkVerification(projectId: string, userId: string) {
    const project = await this.db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
    });
    if (!project) throw new NotFoundException('Project not found');

    const membership = await this.db.query.workspaceMembers.findFirst({
      where: and(
        eq(schema.workspaceMembers.workspaceId, project.workspaceId),
        eq(schema.workspaceMembers.userId, userId),
      ),
    });
    if (!membership) throw new ForbiddenException('No access');

    const leads = await this.db.query.leads.findMany({
      where: eq(schema.leads.projectId, projectId),
    }) as schema.Lead[];

    const leadsWithPhone = leads.filter((l) => l.contactPhone);
    let queued = 0;

    for (const lead of leadsWithPhone) {
      await this.phoneVerifyQueue.add(
        {
          leadId: lead.id,
          projectId,
          phoneNumber: lead.contactPhone!,
          agentType: 'analyzer',
        },
        { attempts: 2, backoff: { type: 'fixed', delay: 3000 } },
      );
      queued++;
    }

    return {
      queued,
      total: leads.length,
      withPhone: leadsWithPhone.length,
    };
  }

  async getProjectClassifications(projectId: string, userId: string) {
    const project = await this.db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
    });
    if (!project) throw new NotFoundException('Project not found');

    const membership = await this.db.query.workspaceMembers.findFirst({
      where: and(
        eq(schema.workspaceMembers.workspaceId, project.workspaceId),
        eq(schema.workspaceMembers.userId, userId),
      ),
    });
    if (!membership) throw new ForbiddenException('No access');

    const leads = await this.db.query.leads.findMany({
      where: eq(schema.leads.projectId, projectId),
    }) as schema.Lead[];

    const verifications = await Promise.all(
      leads.map(async (lead) => {
        const v = await this.db.query.phoneVerification.findFirst({
          where: eq(schema.phoneVerification.leadId, lead.id),
        }) as schema.PhoneVerification | null;

        return {
          leadId: lead.id,
          contactName: lead.contactName,
          companyName: lead.companyName,
          hasPhone: !!lead.contactPhone,
          classification: v?.aiCallClassification ?? 'not_verified',
          numberType: v?.numberType ?? null,
          isOnDnc: v?.isOnDnc ?? null,
          verifiedAt: v?.verifiedAt ?? null,
        };
      }),
    );

    const stats = {
      total: verifications.length,
      notVerified: verifications.filter((v) => v.classification === 'not_verified').length,
      canCallAi: verifications.filter((v) => v.classification === 'can_call_ai').length,
      canCallManual: verifications.filter((v) => v.classification === 'can_call_manual').length,
      cannotCall: verifications.filter((v) => v.classification === 'cannot_call').length,
    };

    return { stats, leads: verifications };
  }

  private async assertLeadAccess(leadId: string, userId: string) {
    const lead = await this.db.query.leads.findFirst({
      where: eq(schema.leads.id, leadId),
    }) as schema.Lead | null;
    if (!lead) throw new NotFoundException('Lead not found');

    const project = await this.db.query.projects.findFirst({
      where: eq(schema.projects.id, lead.projectId),
    });
    if (!project) throw new NotFoundException('Project not found');

    const membership = await this.db.query.workspaceMembers.findFirst({
      where: and(
        eq(schema.workspaceMembers.workspaceId, project.workspaceId),
        eq(schema.workspaceMembers.userId, userId),
      ),
    });
    if (!membership) throw new ForbiddenException('No access');
    return lead;
  }
}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Phone Verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('phone-verification')
export class PhoneVerificationController {
  constructor(private readonly service: PhoneVerificationService) {}

  @Get('project')
  @ApiOperation({ summary: 'Get classification summary for all leads in a project' })
  @ApiQuery({ name: 'projectId', required: true })
  getProjectClassifications(
    @Query('projectId') projectId: string,
    @Request() req: AuthRequest,
  ) {
    return this.service.getProjectClassifications(projectId, req.user.userId);
  }

  @Post('bulk-verify')
  @ApiOperation({ summary: 'Trigger bulk phone verification for all project leads' })
  bulkVerify(@Request() req: AuthRequest, @Body() dto: TriggerVerifyDto) {
    return this.service.triggerBulkVerification(dto.projectId, req.user.userId);
  }

  @Get('leads/:leadId')
  @ApiOperation({ summary: 'Get phone verification data for a lead' })
  @ApiParam({ name: 'leadId' })
  getVerification(@Param('leadId') leadId: string, @Request() req: AuthRequest) {
    return this.service.getVerification(leadId, req.user.userId);
  }

  @Post('leads/:leadId/verify')
  @ApiOperation({ summary: 'Trigger phone verification for a specific lead' })
  @ApiParam({ name: 'leadId' })
  triggerVerification(@Param('leadId') leadId: string, @Request() req: AuthRequest) {
    return this.service.triggerVerification(leadId, req.user.userId);
  }
}

// ─── Module ───────────────────────────────────────────────────────────────────

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.PHONE_VERIFY }),
  ],
  controllers: [PhoneVerificationController],
  providers: [PhoneVerificationService],
  exports: [PhoneVerificationService],
})
export class PhoneVerificationModule {}