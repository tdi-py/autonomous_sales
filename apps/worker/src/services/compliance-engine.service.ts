import { Injectable, Logger, Inject } from '@nestjs/common';
import { eq, and, gte } from 'drizzle-orm';
import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../database/database.module';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckResult {
  name: string;
  passed: boolean;
  reason?: string;
}

export interface ContentCheckResult {
  checks: CheckResult[];
  blockers: string[];
  warnings: string[];
}

export interface CallCheckResult {
  checks: CheckResult[];
  blockers: string[];
  warnings: string[];
}

export interface FrequencyCheckResult {
  check: CheckResult;
  reason: string;
}

export interface ComplianceCheckResult {
  approved: boolean;
  checks: CheckResult[];
  blockers: string[];
  warnings: string[];
  overallResult: 'approved' | 'warning' | 'blocked';
}

export interface RunComplianceCheckParams {
  leadId: string;
  campaignId: string;
  projectId: string;
  outreachEventId?: string;
  channel: 'email' | 'call';
  emailContent?: { subject: string; body: string };
  callType?: 'ai_voice' | 'human_manual';
}

// ─── Spam words list ─────────────────────────────────────────────────────────

const SPAM_WORDS = [
  'free', 'limited time', 'act now', 'guaranteed', 'click here',
  'buy now', 'urgent', 'winner', 'congratulations', '100%',
  'no cost', 'risk-free', 'earn money', 'make money',
];

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class ComplianceEngineService {
  private readonly logger = new Logger(ComplianceEngineService.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  // ─── Main Entry Point ──────────────────────────────────────────────────────

  async runComplianceCheck(params: RunComplianceCheckParams): Promise<ComplianceCheckResult> {
    const { leadId, campaignId, projectId, outreachEventId, channel } = params;

    const checks: CheckResult[] = [];
    const blockers: string[] = [];
    const warnings: string[] = [];

    try {
      // Load lead, campaign
      const [lead, campaign] = await Promise.all([
        this.db.query.leads.findFirst({ where: eq(schema.leads.id, leadId) }) as Promise<schema.Lead | null>,
        this.db.query.campaigns.findFirst({ where: eq(schema.campaigns.id, campaignId) }) as Promise<schema.Campaign | null>,
      ]);

      if (!lead) {
        blockers.push('Lead not found');
        return this.buildResult(checks, blockers, warnings, outreachEventId);
      }

      // ── 1. Geography detection ──────────────────────────────────────────
      const countryCode = this.detectCountry(lead);
      const stateCode = this.detectState(lead);
      const rules = await this.getComplianceRules(countryCode, stateCode);

      // ── 2. Suppression list check ───────────────────────────────────────
      const isSuppressed = await this.checkSuppressionList(projectId, lead.contactEmail);
      if (isSuppressed) {
        blockers.push('Lead is on suppression list (unsubscribed/bounced/complained)');
        checks.push({ name: 'suppression_list', passed: false, reason: 'Suppressed' });
      } else {
        checks.push({ name: 'suppression_list', passed: true });
      }

      // ── 3. Channel-specific checks ──────────────────────────────────────
      if (channel === 'email' && params.emailContent) {
        const contentResult = await this.checkEmailContent(params.emailContent, rules);
        checks.push(...contentResult.checks);
        blockers.push(...contentResult.blockers);
        warnings.push(...contentResult.warnings);
      }

      if (channel === 'call') {
        const callResult = await this.checkCallCompliance(lead, params.callType ?? 'human_manual', rules);
        checks.push(...callResult.checks);
        blockers.push(...callResult.blockers);
        warnings.push(...callResult.warnings);
      }

      // ── 4. Frequency check ──────────────────────────────────────────────
      const frequencyResult = await this.checkFrequency(lead, channel, rules);
      checks.push(frequencyResult.check);
      if (!frequencyResult.check.passed) {
        blockers.push(frequencyResult.reason);
      }

      // ── 5. Send time check ──────────────────────────────────────────────
      const timeResult = this.checkSendTime(lead, rules);
      checks.push(timeResult.check);
      if (!timeResult.check.passed) {
        blockers.push(timeResult.reason);
      }

      // ── 6. Daily limit check ────────────────────────────────────────────
      const limitResult = await this.checkDailyLimit(campaignId, channel);
      checks.push(limitResult.check);
      if (!limitResult.check.passed) {
        warnings.push(limitResult.reason);
      }

    } catch (err) {
      this.logger.error(`[compliance-engine] Check failed: ${(err as Error).message}`);
      warnings.push(`Compliance check error: ${(err as Error).message}`);
    }

    return this.buildResult(checks, blockers, warnings, outreachEventId);
  }

  // ─── Email Content Checks ──────────────────────────────────────────────────

  async checkEmailContent(
    content: { subject: string; body: string },
    rules: schema.ComplianceRule | null,
  ): Promise<ContentCheckResult> {
    const checks: CheckResult[] = [];
    const blockers: string[] = [];
    const warnings: string[] = [];

    const regulationName = rules?.regulationName ?? 'CAN-SPAM';

    // 1. Unsubscribe link
    const hasUnsubscribe =
      content.body.includes('{{unsubscribe_link}}') ||
      content.body.toLowerCase().includes('unsubscribe') ||
      content.body.toLowerCase().includes('opt out') ||
      content.body.toLowerCase().includes('opt-out');

    if (!hasUnsubscribe && (rules?.requiresUnsubscribe ?? true)) {
      blockers.push(`Missing unsubscribe mechanism (required by ${regulationName})`);
      checks.push({ name: 'unsubscribe_link', passed: false, reason: 'Missing' });
    } else {
      checks.push({ name: 'unsubscribe_link', passed: true });
    }

    // 2. Physical address
    const hasAddress =
      content.body.includes('{{physical_address}}') ||
      this.containsPhysicalAddress(content.body);

    if (!hasAddress && (rules?.requiresPhysicalAddress ?? true)) {
      blockers.push(`Missing physical address (required by ${regulationName})`);
      checks.push({ name: 'physical_address', passed: false, reason: 'Missing' });
    } else {
      checks.push({ name: 'physical_address', passed: true });
    }

    // 3. Sender identity
    const hasSenderName =
      content.body.includes('{{sender_name}}') ||
      content.body.includes('{{sender_title}}');
    checks.push({
      name: 'sender_identity',
      passed: hasSenderName,
      reason: hasSenderName ? 'Present' : 'Missing sender identification',
    });
    if (!hasSenderName) warnings.push('Sender identity not clearly identified');

    // 4. Subject line — ALL CAPS
    const words = content.subject.split(/\s+/);
    const capsWords = words.filter((w) => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w));
    if (capsWords.length >= 2) {
      warnings.push('Subject line has ALL CAPS words — high spam risk');
      checks.push({ name: 'subject_caps', passed: false, reason: 'ALL CAPS' });
    } else {
      checks.push({ name: 'subject_caps', passed: true });
    }

    // 5. Deceptive subject
    const subjectLower = content.subject.toLowerCase();
    if (subjectLower.startsWith('re:') || subjectLower.startsWith('fwd:')) {
      blockers.push('Deceptive subject line — "Re:" or "Fwd:" on first-touch email is illegal');
      checks.push({ name: 'deceptive_subject', passed: false, reason: 'Fake Re:/Fwd:' });
    } else {
      checks.push({ name: 'deceptive_subject', passed: true });
    }

    // 6. Spam word scan
    const spamFound = this.scanForSpamWords(content.subject + ' ' + content.body);
    if (spamFound.length > 0) {
      warnings.push(`Spam trigger words detected: ${spamFound.join(', ')}`);
      checks.push({ name: 'spam_words', passed: false, reason: spamFound.join(', ') });
    } else {
      checks.push({ name: 'spam_words', passed: true });
    }

    // 7. AI disclosure (EU AI Act)
    if (rules?.aiDisclosureRequired) {
      const hasAiDisclosure =
        content.body.toLowerCase().includes('ai') ||
        content.body.toLowerCase().includes('automated') ||
        content.body.toLowerCase().includes('artificial intelligence');
      if (!hasAiDisclosure) {
        warnings.push('AI disclosure may be required in this jurisdiction');
        checks.push({ name: 'ai_disclosure', passed: false, reason: 'Missing AI disclosure' });
      }
    }

    return { checks, blockers, warnings };
  }

  // ─── Call Compliance Checks ────────────────────────────────────────────────

  async checkCallCompliance(
    lead: schema.Lead,
    callType: 'ai_voice' | 'human_manual',
    rules: schema.ComplianceRule | null,
  ): Promise<CallCheckResult> {
    const checks: CheckResult[] = [];
    const blockers: string[] = [];
    const warnings: string[] = [];

    // 1. Phone verification
    const phoneVerification = await this.db.query.phoneVerification.findFirst({
      where: eq(schema.phoneVerification.leadId, lead.id),
    }) as schema.PhoneVerification | null;

    if (!phoneVerification) {
      blockers.push('Phone number not verified — verify before calling');
      checks.push({ name: 'phone_verified', passed: false });
      return { checks, blockers, warnings };
    }

    // 2. Classification check
    if (phoneVerification.aiCallClassification === 'cannot_call') {
      blockers.push(`Cannot call: ${phoneVerification.classificationReason ?? 'Classification blocked'}`);
      checks.push({ name: 'call_classification', passed: false, reason: phoneVerification.classificationReason ?? undefined });
    } else if (phoneVerification.aiCallClassification === 'can_call_manual' && callType === 'ai_voice') {
      blockers.push('AI calling not allowed for this number — manual call only');
      checks.push({ name: 'call_classification', passed: false, reason: 'Manual only' });
    } else {
      checks.push({ name: 'call_classification', passed: true });
    }

    // 3. DNC check
    if (phoneVerification.isOnDnc) {
      blockers.push('Number is on Do Not Call registry');
      checks.push({ name: 'dnc_check', passed: false });
    } else {
      checks.push({ name: 'dnc_check', passed: true });
    }

    // 4. Consent for AI calls to mobile
    if (callType === 'ai_voice' && phoneVerification.numberType === 'mobile') {
      const consent = await this.db.query.callConsentRecords.findFirst({
        where: and(
          eq(schema.callConsentRecords.leadId, lead.id),
          eq(schema.callConsentRecords.isValidForAi, true),
        ),
      }) as schema.CallConsentRecord | null;

      const hasValidConsent = consent && !consent.revokedAt;
      if (!hasValidConsent) {
        blockers.push('AI call to mobile number requires prior written consent');
        checks.push({ name: 'consent_check', passed: false });
      } else {
        checks.push({ name: 'consent_check', passed: true });
      }
    }

    // 5. Calling hours
    if (rules?.callingHoursStart && rules?.callingHoursEnd) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const start = rules.callingHoursStart;
      const end = rules.callingHoursEnd;

      if (currentTime < start || currentTime > end) {
        blockers.push(`Outside calling hours: ${start}-${end} (${rules.regulationName})`);
        checks.push({
          name: 'calling_hours',
          passed: false,
          reason: `Current: ${currentTime}, Allowed: ${start}-${end}`,
        });
      } else {
        checks.push({ name: 'calling_hours', passed: true });
      }
    }

    // 6. Daily call limit
    if (rules?.maxCallsPerDayPerNumber) {
      const todayCalls = await this.getTodayCallCount(lead.id);
      if (todayCalls >= rules.maxCallsPerDayPerNumber) {
        blockers.push(
          `Daily call limit reached: ${todayCalls}/${rules.maxCallsPerDayPerNumber} (${rules.regulationName})`,
        );
        checks.push({ name: 'daily_call_limit', passed: false });
      } else {
        checks.push({ name: 'daily_call_limit', passed: true });
      }
    }

    // 7. Two-party consent warning (California)
    if (rules?.requiresTwoPartyConsent) {
      warnings.push('Two-party consent required — call recording must be disclosed at start');
      checks.push({
        name: 'two_party_consent',
        passed: true,
        reason: 'Warning: disclosure required',
      });
    }

    return { checks, blockers, warnings };
  }

  // ─── Frequency Check ──────────────────────────────────────────────────────

  async checkFrequency(
    lead: schema.Lead,
    channel: 'email' | 'call',
    rules: schema.ComplianceRule | null,
  ): Promise<FrequencyCheckResult> {
    const last24h = await this.getRecentOutreachCount(lead.id, channel, 24);
    const last7d = await this.getRecentOutreachCount(lead.id, channel, 168);

    const maxPer24h = channel === 'email' ? 1 : (rules?.maxCallsPerDayPerNumber ?? 3);
    const maxPer7d = channel === 'email' ? 3 : 5;

    if (last24h >= maxPer24h) {
      return {
        check: {
          name: 'frequency_24h',
          passed: false,
          reason: `${last24h}/${maxPer24h} in 24h`,
        },
        reason: `Already contacted ${last24h} times in 24 hours (limit: ${maxPer24h})`,
      };
    }

    if (last7d >= maxPer7d) {
      return {
        check: {
          name: 'frequency_7d',
          passed: false,
          reason: `${last7d}/${maxPer7d} in 7d`,
        },
        reason: `Already contacted ${last7d} times in 7 days (limit: ${maxPer7d})`,
      };
    }

    return {
      check: { name: 'frequency', passed: true },
      reason: 'OK',
    };
  }

  // ─── Send Time Check ───────────────────────────────────────────────────────

  checkSendTime(
    lead: schema.Lead,
    rules: schema.ComplianceRule | null,
  ): { check: CheckResult; reason: string } {
    // For email, check business hours (9-18 UTC as default)
    const now = new Date();
    const hour = now.getUTCHours();

    if (hour < 7 || hour >= 21) {
      return {
        check: {
          name: 'send_time',
          passed: false,
          reason: `Hour ${hour} UTC is outside allowed window`,
        },
        reason: `Send time ${hour}:00 UTC is outside recommended hours (07:00-21:00 UTC)`,
      };
    }

    return {
      check: { name: 'send_time', passed: true },
      reason: 'OK',
    };
  }

  // ─── Daily Limit Check ─────────────────────────────────────────────────────

  async checkDailyLimit(
    campaignId: string,
    channel: 'email' | 'call',
  ): Promise<{ check: CheckResult; reason: string }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = await this.db.query.outreachEvents.findMany({
      where: and(
        eq(schema.outreachEvents.campaignId, campaignId),
        eq(schema.outreachEvents.channel, channel),
        gte(schema.outreachEvents.sentAt, today),
      ),
    }) as schema.OutreachEvent[];

    const dailyLimit = channel === 'email' ? 200 : 50;
    const sentToday = events.length;

    if (sentToday >= dailyLimit) {
      return {
        check: {
          name: 'daily_campaign_limit',
          passed: false,
          reason: `${sentToday}/${dailyLimit} today`,
        },
        reason: `Daily campaign limit reached: ${sentToday}/${dailyLimit}`,
      };
    }

    return {
      check: { name: 'daily_campaign_limit', passed: true },
      reason: 'OK',
    };
  }

  // ─── Helper Methods ────────────────────────────────────────────────────────

  private detectCountry(lead: schema.Lead): string {
    // Try lead enrichment, phone number prefix, or default to US
    const enrichment = lead.enrichmentData as Record<string, unknown> | null;
    if (enrichment?.countryCode) return String(enrichment.countryCode);
    if (lead.contactPhone?.startsWith('+44')) return 'GB';
    if (lead.contactPhone?.startsWith('+49')) return 'DE';
    if (lead.contactPhone?.startsWith('+33')) return 'FR';
    if (lead.contactPhone?.startsWith('+90')) return 'TR';
    return 'US'; // Default — safest
  }

  private detectState(lead: schema.Lead): string | null {
    const enrichment = lead.enrichmentData as Record<string, unknown> | null;
    if (enrichment?.stateCode) return String(enrichment.stateCode);
    return null;
  }

  private async getComplianceRules(
    countryCode: string,
    stateCode: string | null,
  ): Promise<schema.ComplianceRule | null> {
    // Try state-specific first
    if (stateCode) {
      const stateRule = await this.db.query.complianceRules.findFirst({
        where: and(
          eq(schema.complianceRules.countryCode, countryCode),
          eq(schema.complianceRules.stateCode, stateCode),
        ),
      }) as schema.ComplianceRule | null;
      if (stateRule) return stateRule;
    }

    // Fall back to country-level
    const countryRule = await this.db.query.complianceRules.findFirst({
      where: eq(schema.complianceRules.countryCode, countryCode),
    }) as schema.ComplianceRule | null;

    return countryRule;
  }

  private async checkSuppressionList(projectId: string, email: string | null | undefined): Promise<boolean> {
    if (!email) return false;
    const entry = await this.db.query.suppressionList.findFirst({
      where: and(
        eq(schema.suppressionList.projectId, projectId),
        eq(schema.suppressionList.email, email.toLowerCase()),
      ),
    });
    return !!entry;
  }

  private async getRecentOutreachCount(
    leadId: string,
    channel: 'email' | 'call',
    hoursBack: number,
  ): Promise<number> {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const events = await this.db.query.outreachEvents.findMany({
      where: and(
        eq(schema.outreachEvents.leadId, leadId),
        eq(schema.outreachEvents.channel, channel),
        gte(schema.outreachEvents.sentAt, since),
      ),
    }) as schema.OutreachEvent[];
    return events.length;
  }

  private async getTodayCallCount(leadId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const events = await this.db.query.outreachEvents.findMany({
      where: and(
        eq(schema.outreachEvents.leadId, leadId),
        eq(schema.outreachEvents.channel, 'call'),
        gte(schema.outreachEvents.sentAt, today),
      ),
    }) as schema.OutreachEvent[];
    return events.length;
  }

  private containsPhysicalAddress(text: string): boolean {
    return /\d{1,5}\s+\w+\s+(st|ave|blvd|rd|dr|ln|way|ct|pl)/i.test(text) ||
      /\b[A-Z]{2}\s+\d{5}\b/.test(text);
  }

  private scanForSpamWords(text: string): string[] {
    const lower = text.toLowerCase();
    return SPAM_WORDS.filter((w) => lower.includes(w.toLowerCase()));
  }

  private async saveComplianceCheck(params: {
    outreachEventId?: string;
    checksPassed: CheckResult[];
    overallResult: 'pass' | 'fail' | 'warning';
    blockedReason: string | null;
  }): Promise<void> {
    if (!params.outreachEventId) return;
    try {
      await this.db.insert(schema.complianceChecks).values({
        outreachEventId: params.outreachEventId,
        checksPassed: params.checksPassed,
        overallResult: params.overallResult === 'pass' ? 'pass'
          : params.overallResult === 'warning' ? 'warning' : 'fail',
        blockedReason: params.blockedReason,
      });
    } catch (err) {
      this.logger.warn(`[compliance-engine] Failed to save compliance check: ${(err as Error).message}`);
    }
  }

  private buildResult(
    checks: CheckResult[],
    blockers: string[],
    warnings: string[],
    outreachEventId?: string,
  ): ComplianceCheckResult {
    const overallResult = blockers.length > 0 ? 'blocked'
      : warnings.length > 0 ? 'warning'
      : 'approved';

    // Log to DB (fire and forget)
    this.saveComplianceCheck({
      outreachEventId,
      checksPassed: checks,
      overallResult: overallResult === 'blocked' ? 'fail'
        : overallResult === 'warning' ? 'warning' : 'pass',
      blockedReason: blockers.join('; ') || null,
    }).catch(() => {});

    return {
      approved: blockers.length === 0,
      checks,
      blockers,
      warnings,
      overallResult,
    };
  }
}