import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import { QUEUE_NAMES } from '@autonomous-sales/shared';
import type { CreateConsentDto, RevokeConsentDto } from './dto/consent.dto';

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    @InjectQueue(QUEUE_NAMES.PHONE_VERIFY) private readonly phoneVerifyQueue: Queue,
  ) {}

  // ─── Create Consent ────────────────────────────────────────────────────────

  async createConsent(leadId: string, userId: string, dto: CreateConsentDto) {
    const lead = await this.assertLeadAccess(leadId, userId);

    const isValidForAi =
      dto.consentScope === 'ai_call' || dto.consentScope === 'all_channels';

    const [consent] = await this.db
      .insert(schema.callConsentRecords)
      .values({
        projectId: lead.projectId,
        leadId,
        consentType: dto.consentType,
        consentScope: dto.consentScope,
        consentSource: dto.consentSource,
        consentProofUrl: dto.consentProofUrl,
        consentText: dto.consentText,
        consentedToCompany: dto.consentedToCompany,
        grantedAt: new Date(),
        isValidForAi,
      })
      .returning();

    this.logger.log(
      `[consent] Created consent for lead ${leadId} — scope: ${dto.consentScope}, validForAi: ${isValidForAi}`,
    );

    // Re-trigger phone verification to update classification
    if (lead.contactPhone) {
      await this.phoneVerifyQueue.add(
        {
          leadId,
          projectId: lead.projectId,
          phoneNumber: lead.contactPhone,
          agentType: 'analyzer',
        },
        { attempts: 2, backoff: { type: 'fixed', delay: 5000 } },
      );
    }

    return { ...consent, isValidForAi, reclassificationQueued: !!lead.contactPhone };
  }

  // ─── Revoke Consent ────────────────────────────────────────────────────────

  async revokeConsent(leadId: string, consentId: string, userId: string, dto: RevokeConsentDto) {
    const lead = await this.assertLeadAccess(leadId, userId);

    const consent = await this.db.query.callConsentRecords.findFirst({
      where: and(
        eq(schema.callConsentRecords.id, consentId),
        eq(schema.callConsentRecords.leadId, leadId),
      ),
    }) as schema.CallConsentRecord | null;

    if (!consent) throw new NotFoundException('Consent record not found');

    if (consent.revokedAt) {
      return { ...consent, alreadyRevoked: true };
    }

    const [updated] = await this.db
      .update(schema.callConsentRecords)
      .set({
        revokedAt: new Date(),
        revocationMethod: dto.revocationMethod ?? 'manual',
        revocationProcessedAt: new Date(),
        isValidForAi: false,
      })
      .where(eq(schema.callConsentRecords.id, consentId))
      .returning();

    this.logger.log(`[consent] Revoked consent ${consentId} for lead ${leadId}`);

    // Re-trigger phone verification to downgrade classification
    if (lead.contactPhone) {
      await this.phoneVerifyQueue.add(
        {
          leadId,
          projectId: lead.projectId,
          phoneNumber: lead.contactPhone,
          agentType: 'analyzer',
        },
        { attempts: 2, backoff: { type: 'fixed', delay: 5000 } },
      );
    }

    return { ...updated, reclassificationQueued: !!lead.contactPhone };
  }

  // ─── List Consents ─────────────────────────────────────────────────────────

  async listConsents(leadId: string, userId: string) {
    await this.assertLeadAccess(leadId, userId);

    const records = await this.db.query.callConsentRecords.findMany({
      where: eq(schema.callConsentRecords.leadId, leadId),
      orderBy: (t: any, { desc }: any) => [desc(t.grantedAt)],
    }) as schema.CallConsentRecord[];

    const activeConsent = records.find((r) => r.isValidForAi && !r.revokedAt);

    return {
      consents: records,
      hasActiveAiConsent: !!activeConsent,
      activeConsent: activeConsent ?? null,
    };
  }

  // ─── Call Eligibility Report ───────────────────────────────────────────────

  async getCallEligibility(leadId: string, userId: string) {
    const lead = await this.assertLeadAccess(leadId, userId);

    const [verification, consents] = await Promise.all([
      this.db.query.phoneVerification.findFirst({
        where: eq(schema.phoneVerification.leadId, leadId),
      }) as Promise<schema.PhoneVerification | null>,
      this.db.query.callConsentRecords.findMany({
        where: eq(schema.callConsentRecords.leadId, leadId),
      }) as Promise<schema.CallConsentRecord[]>,
    ]);

    const activeConsent = consents.find((c) => c.isValidForAi && !c.revokedAt);

    if (!verification) {
      return {
        leadId,
        classification: 'not_verified',
        reason: 'Phone number has not been verified yet',
        numberType: null,
        isOnDnc: null,
        isPubliclyListed: null,
        hasConsent: !!activeConsent,
        stateRules: null,
        canCallAi: false,
      };
    }

    return {
      leadId,
      classification: verification.aiCallClassification,
      reason: verification.classificationReason,
      numberType: verification.numberType,
      carrier: verification.carrier,
      countryCode: verification.countryCode,
      stateCode: verification.stateCode,
      isOnDnc: verification.isOnDnc,
      isPubliclyListed: verification.isPubliclyListed,
      publicSource: verification.publicSource,
      hasConsent: !!activeConsent,
      activeConsent: activeConsent ?? null,
      verifiedAt: verification.verifiedAt,
      canCallAi: verification.aiCallClassification === 'can_call_ai',
      canCallManual: ['can_call_ai', 'can_call_manual'].includes(verification.aiCallClassification),
      stateRules: verification.stateCode ? this.getStateInfo(verification.stateCode) : null,
    };
  }

  // ─── Trigger Bulk Verification ─────────────────────────────────────────────

  async triggerBulkVerification(projectId: string, userId: string) {
    // Assert user has access to project
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

    // Find all leads with a phone but no verification
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
        {
          attempts: 2,
          backoff: { type: 'fixed', delay: 3000 },
        },
      );
      queued++;
    }

    return { queued, total: leadsWithPhone.length };
  }

  // ─── Private ──────────────────────────────────────────────────────────────

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
    if (!membership) throw new ForbiddenException('No access to this lead');

    return lead;
  }

  private getStateInfo(stateCode: string) {
    const rules: Record<string, { callingHours: string; maxCallsPerDay: number; twoPartyConsent: boolean }> = {
      FL: { callingHours: '8:00 AM – 8:00 PM', maxCallsPerDay: 3, twoPartyConsent: false },
      CA: { callingHours: '8:00 AM – 9:00 PM', maxCallsPerDay: 3, twoPartyConsent: true },
      TX: { callingHours: '8:00 AM – 9:00 PM', maxCallsPerDay: 3, twoPartyConsent: false },
      NY: { callingHours: '8:00 AM – 9:00 PM', maxCallsPerDay: 3, twoPartyConsent: false },
    };
    return rules[stateCode.toUpperCase()] ?? { callingHours: '8:00 AM – 9:00 PM', maxCallsPerDay: 3, twoPartyConsent: false };
  }
}