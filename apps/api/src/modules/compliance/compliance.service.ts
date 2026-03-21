import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class ComplianceService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  async getRules(countryCode: string, stateCode?: string) {
    const conditions = [eq(schema.complianceRules.countryCode, countryCode.toUpperCase())];
    if (stateCode) {
      conditions.push(eq(schema.complianceRules.stateCode, stateCode.toUpperCase()));
    }
    return this.db.query.complianceRules.findMany({
      where: and(...conditions),
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
}