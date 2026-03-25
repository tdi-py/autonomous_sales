import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import type { CreateDataDeletionRequestDto } from './dto/data-deletion.dto';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  // ─── Rules ────────────────────────────────────────────────────────────────

  async getRules(countryCode: string, stateCode?: string) {
    const conditions = [eq(schema.complianceRules.countryCode, countryCode.toUpperCase())];
    if (stateCode) {
      conditions.push(eq(schema.complianceRules.stateCode, stateCode.toUpperCase()));
    }
    return this.db.query.complianceRules.findMany({
      where: and(...conditions),
    });
  }

  async getAllRules() {
    return this.db.query.complianceRules.findMany({
      orderBy: (t: any, { asc }: any) => [asc(t.countryCode), asc(t.stateCode)],
    });
  }

  async getPhoneClassification(leadId: string) {
    const verification = await this.db.query.phoneVerification.findFirst({
      where: eq(schema.phoneVerification.leadId, leadId),
    });
    if (!verification) {
      return {
        leadId,
        classification: 'cannot_call',
        reason: 'No phone verification on record. Queue phone-verify job first.',
      };
    }
    return {
      leadId,
      phoneNumber: verification.phoneNumber,
      numberType: verification.numberType,
      classification: verification.aiCallClassification,
      reason: verification.classificationReason,
      isOnDnc: verification.isOnDnc,
    };
  }

  /** Placeholder — real pre-send compliance check runs in the worker */
  async checkCompliance(outreachEventId: string) {
    return {
      outreachEventId,
      result: 'placeholder',
      message: 'Full compliance check runs in the compliance-check worker queue',
    };
  }

  // ─── GDPR Data Deletion ────────────────────────────────────────────────────

  async createDataDeletionRequest(dto: CreateDataDeletionRequestDto) {
    this.logger.log(
      `[compliance] Deletion request from ${dto.requestedBy} — type: ${dto.requestType}, leads: ${dto.leadIds?.length ?? 0}`,
    );

    const [request] = await this.db
      .insert(schema.dataDeletionRequests)
      .values({
        projectId: dto.projectId,
        requestedBy: dto.requestedBy,
        requestType: dto.requestType,
        status: 'pending',
        leadIds: dto.leadIds ?? [],
      })
      .returning() as schema.DataDeletionRequest[];

    // Auto-process within 7 days — for now trigger immediately for smaller requests
    if ((dto.leadIds?.length ?? 0) <= 50) {
      // Process in background (fire and forget)
      this.processDataDeletionRequest(request.id).catch((err) =>
        this.logger.error(`[compliance] Auto-process deletion failed: ${(err as Error).message}`),
      );
    }

    return {
      requestId: request.id,
      status: 'pending',
      message: 'Deletion request received. Will be processed within 72 hours per GDPR requirements.',
      affectedLeads: dto.leadIds?.length ?? 0,
    };
  }

  async getDataDeletionRequests(projectId: string) {
    return this.db.query.dataDeletionRequests.findMany({
      where: eq(schema.dataDeletionRequests.projectId, projectId),
      orderBy: (t: any, { desc }: any) => [desc(t.createdAt)],
    });
  }

  async processDataDeletionRequest(requestId: string): Promise<{
    processed: number;
    anonymized: number;
    errors: string[];
  }> {
    const request = await this.db.query.dataDeletionRequests.findFirst({
      where: eq(schema.dataDeletionRequests.id, requestId),
    }) as schema.DataDeletionRequest | null;

    if (!request) throw new NotFoundException('Deletion request not found');

    this.logger.log(`[compliance] Processing deletion request ${requestId}`);

    // Update status to processing
    await this.db
      .update(schema.dataDeletionRequests)
      .set({ status: 'processing' })
      .where(eq(schema.dataDeletionRequests.id, requestId));

    const leadIds = (request.leadIds as string[]) ?? [];
    let processed = 0;
    let anonymized = 0;
    const errors: string[] = [];

    for (const leadId of leadIds) {
      try {
        await this.anonymizeLeadData(leadId, request.projectId);
        anonymized++;
        processed++;
      } catch (err) {
        errors.push(`Lead ${leadId}: ${(err as Error).message}`);
        this.logger.error(`[compliance] Failed to anonymize lead ${leadId}: ${(err as Error).message}`);
      }
    }

    // If full_erasure, also handle by requestedBy email
    if (request.requestType === 'full_erasure') {
      try {
        await this.eraseByEmail(request.requestedBy, request.projectId);
        processed++;
      } catch (err) {
        errors.push(`Full erasure for ${request.requestedBy}: ${(err as Error).message}`);
      }
    }

    // Mark as completed
    await this.db
      .update(schema.dataDeletionRequests)
      .set({
        status: errors.length === 0 ? 'completed' : 'processing',
        completedAt: errors.length === 0 ? new Date() : null,
      })
      .where(eq(schema.dataDeletionRequests.id, requestId));

    this.logger.log(
      `[compliance] Deletion request ${requestId} complete — anonymized: ${anonymized}, errors: ${errors.length}`,
    );

    return { processed, anonymized, errors };
  }

  // ─── GDPR Bulk Lead Delete ─────────────────────────────────────────────────

  async bulkDeleteLeads(
    projectId: string,
    leadIds: string[],
  ): Promise<{ deleted: number; suppressionAdded: number }> {
    let deleted = 0;
    let suppressionAdded = 0;

    for (const leadId of leadIds) {
      try {
        const lead = await this.db.query.leads.findFirst({
          where: and(
            eq(schema.leads.id, leadId),
            eq(schema.leads.projectId, projectId),
          ),
        }) as schema.Lead | null;

        if (!lead) continue;

        // Add email hash to suppression list (prevents re-sending)
        if (lead.contactEmail) {
          const existing = await this.db.query.suppressionList.findFirst({
            where: and(
              eq(schema.suppressionList.projectId, projectId),
              eq(schema.suppressionList.email, lead.contactEmail.toLowerCase()),
            ),
          });

          if (!existing) {
            await this.db.insert(schema.suppressionList).values({
              projectId,
              email: lead.contactEmail.toLowerCase(),
              reason: 'manual',
            });
            suppressionAdded++;
          }
        }

        // Delete the lead
        await this.db.delete(schema.leads).where(eq(schema.leads.id, leadId));
        deleted++;
      } catch (err) {
        this.logger.error(`[compliance] Failed to delete lead ${leadId}: ${(err as Error).message}`);
      }
    }

    return { deleted, suppressionAdded };
  }

  // ─── Get Abuse Incidents ───────────────────────────────────────────────────

  async getAbuseIncidents(workspaceId: string, limit = 20) {
    return this.db.query.abuseIncidents.findMany({
      where: eq(schema.abuseIncidents.workspaceId, workspaceId),
      orderBy: (t: any, { desc }: any) => [desc(t.createdAt)],
      limit,
    });
  }

  // ─── Private: Anonymize Lead ───────────────────────────────────────────────

  private async anonymizeLeadData(leadId: string, projectId: string): Promise<void> {
    const lead = await this.db.query.leads.findFirst({
      where: and(
        eq(schema.leads.id, leadId),
        eq(schema.leads.projectId, projectId),
      ),
    }) as schema.Lead | null;

    if (!lead) return;

    // Add to suppression BEFORE anonymizing (keep the hash)
    if (lead.contactEmail) {
      const existing = await this.db.query.suppressionList.findFirst({
        where: and(
          eq(schema.suppressionList.projectId, projectId),
          eq(schema.suppressionList.email, lead.contactEmail.toLowerCase()),
        ),
      });

      if (!existing) {
        await this.db.insert(schema.suppressionList).values({
          projectId,
          email: lead.contactEmail.toLowerCase(),
          reason: 'manual',
        });
      }
    }

    // Anonymize lead personal data
    await this.db
      .update(schema.leads)
      .set({
        contactName: null,
        contactEmail: null,
        contactPhone: null,
        contactTitle: null,
        website: null,
        linkedinUrl: null,
        companyName: '[GDPR ERASED]',
        updatedAt: new Date(),
      })
      .where(eq(schema.leads.id, leadId));

    // Anonymize phone verification
    await this.db
      .update(schema.phoneVerification)
      .set({
        phoneNumber: '[ERASED]',
        carrier: null,
      })
      .where(eq(schema.phoneVerification.leadId, leadId));

    // Anonymize call consent records
    await this.db
      .update(schema.callConsentRecords)
      .set({
        consentText: null,
        consentProofUrl: null,
        consentSource: null,
      })
      .where(eq(schema.callConsentRecords.leadId, leadId));

    // Anonymize inbox messages
    await this.db
      .update(schema.inboxMessages)
      .set({
        bodyText: '[GDPR ERASED]',
        bodyHtml: '[GDPR ERASED]',
        fromEmail: '[ERASED]',
        subject: '[ERASED]',
        aiSummary: null,
      })
      .where(eq(schema.inboxMessages.leadId, leadId));

    this.logger.log(`[compliance] Anonymized lead ${leadId} per GDPR request`);
  }

  private async eraseByEmail(email: string, projectId: string): Promise<void> {
    // Find all leads with this email in the project
    const leads = await this.db.query.leads.findMany({
      where: and(
        eq(schema.leads.projectId, projectId),
        eq(schema.leads.contactEmail, email.toLowerCase()),
      ),
    }) as schema.Lead[];

    for (const lead of leads) {
      await this.anonymizeLeadData(lead.id, projectId);
    }

    this.logger.log(
      `[compliance] Full erasure complete for ${email} — ${leads.length} leads anonymized`,
    );
  }
}