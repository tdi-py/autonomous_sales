import { Injectable, Logger, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../database/database.module';
import { SmtpService } from './smtp.service';
import { TrackingService } from './tracking.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PersonalizeContext {
  lead: schema.Lead;
  emailAccount: schema.EmailAccount;
  senderTitle?: string;
  senderCompany?: string;
  physicalAddress?: string;
  outreachEventId: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  bounceType?: 'hard' | 'soft';
}

// ─── Hard bounce SMTP codes ───────────────────────────────────────────────────

const HARD_BOUNCE_CODES = ['550', '551', '552', '553', '554', '521', '556'];
const SOFT_BOUNCE_CODES = ['421', '450', '451', '452'];

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    private readonly smtpService: SmtpService,
    private readonly trackingService: TrackingService,
  ) {}

  // ─── Personalize Template ─────────────────────────────────────────────────

  personalizeTemplate(template: string, ctx: PersonalizeContext): string {
    const { lead, emailAccount, senderTitle, senderCompany, outreachEventId } = ctx;

    const credentials = emailAccount.authCredentials as Record<string, string> | null;
    const senderName = credentials?.senderName ?? emailAccount.emailAddress.split('@')[0];

    // Split contact name
    const nameParts = (lead.contactName ?? '').trim().split(/\s+/);
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') ?? '';

    let result = template;

    // Contact placeholders
    result = result.replace(/\{\{first_name\}\}/g, firstName || 'there');
    result = result.replace(/\{\{last_name\}\}/g, lastName);
    result = result.replace(/\{\{company_name\}\}/g, lead.companyName ?? '');
    result = result.replace(/\{\{job_title\}\}/g, lead.contactTitle ?? '');
    result = result.replace(/\{\{contact_email\}\}/g, lead.contactEmail ?? '');

    // Sender placeholders
    result = result.replace(/\{\{sender_name\}\}/g, senderName);
    result = result.replace(/\{\{sender_title\}\}/g, senderTitle ?? '');
    result = result.replace(/\{\{sender_company\}\}/g, senderCompany ?? '');

    // Clean up any remaining unfilled placeholders
    result = result.replace(/\{\{[^}]+\}\}/g, '');

    return result;
  }

  // ─── Build HTML Email Body ────────────────────────────────────────────────

  buildHtmlBody(plainTextTemplate: string): string {
    // If already has HTML tags, return as is
    if (plainTextTemplate.includes('<html') || plainTextTemplate.includes('<div')) {
      return plainTextTemplate;
    }

    // Convert plain text with line breaks to simple HTML
    const paragraphs = plainTextTemplate
      .split(/\n{2,}/)
      .map((para) => para.replace(/\n/g, '<br>'))
      .map((para) => `<p style="margin:0 0 16px 0;line-height:1.6;">${para}</p>`)
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:Arial,sans-serif;font-size:14px;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  ${paragraphs}
</body>
</html>`;
  }

  // ─── Select A/B Variant ───────────────────────────────────────────────────

  selectVariant(leadId: string, abSplit = 50): 'A' | 'B' {
    // Deterministic split based on lead ID last char code
    const charCode = leadId.charCodeAt(leadId.length - 1);
    return charCode % 100 < abSplit ? 'A' : 'B';
  }

  // ─── Send Outreach Email ──────────────────────────────────────────────────

  async sendOutreachEmail(params: {
    lead: schema.Lead;
    emailSequence: schema.EmailSequence;
    emailAccount: schema.EmailAccount;
    outreachEventId: string;
    campaignSettings?: Record<string, unknown>;
    physicalAddress?: string;
  }): Promise<SendEmailResult> {
    const {
      lead,
      emailSequence,
      emailAccount,
      outreachEventId,
      campaignSettings,
      physicalAddress = '123 Main St, San Francisco, CA 94105',
    } = params;

    const credentials = emailAccount.authCredentials as Record<string, string>;
    const senderName = credentials?.senderName ?? emailAccount.emailAddress.split('@')[0];

    const ctx: PersonalizeContext = {
      lead,
      emailAccount,
      senderTitle: campaignSettings?.senderTitle as string | undefined,
      senderCompany: campaignSettings?.senderCompany as string | undefined,
      physicalAddress,
      outreachEventId,
    };

    // 1. Personalize subject and body
    const subject = this.personalizeTemplate(emailSequence.subjectTemplate, ctx);
    const bodyRaw = this.personalizeTemplate(emailSequence.bodyTemplate, ctx);

    // 2. Build HTML
    let bodyHtml = this.buildHtmlBody(bodyRaw);

    // 3. Inject all tracking (pixel, link wrapping, unsubscribe, address)
    bodyHtml = this.trackingService.injectAllTracking(
      bodyHtml,
      outreachEventId,
      physicalAddress,
    );

    // 4. Plain text version
    const bodyText = this.trackingService.htmlToPlainText(bodyHtml);

    // 5. List-Unsubscribe headers
    const unsubHeaders = this.trackingService.getListUnsubscribeHeaders(outreachEventId);

    // 6. SMTP credentials
    const smtpCreds = {
      host: emailAccount.smtpHost ?? 'smtp.gmail.com',
      port: emailAccount.smtpPort ?? 587,
      username: credentials?.username ?? emailAccount.emailAddress,
      password: credentials?.password ?? '',
    };

    this.logger.log(
      `[email-sender] Sending to: ${lead.contactEmail} | subject: "${subject}" | event: ${outreachEventId}`,
    );

    // 7. Send via SMTP
    try {
      const result = await this.smtpService.sendEmail(smtpCreds, {
        from: `"${senderName}" <${emailAccount.emailAddress}>`,
        to: lead.contactEmail!,
        subject,
        html: bodyHtml,
        text: bodyText,
        replyTo: emailAccount.emailAddress,
      });

      if (result.success) {
        return { success: true, messageId: result.messageId };
      } else {
        const bounceType = this.detectBounceType(result.error ?? '');
        return { success: false, error: result.error, bounceType };
      }
    } catch (err) {
      const error = (err as Error).message;
      const bounceType = this.detectBounceType(error);
      this.logger.error(`[email-sender] Send failed: ${error}`);
      return { success: false, error, bounceType };
    }
  }

  // ─── Bounce Detection ─────────────────────────────────────────────────────

  detectBounceType(errorMessage: string): 'hard' | 'soft' | undefined {
    const msg = errorMessage.toLowerCase();

    for (const code of HARD_BOUNCE_CODES) {
      if (msg.includes(code)) return 'hard';
    }
    if (
      msg.includes('user not found') ||
      msg.includes('no such user') ||
      msg.includes('invalid recipient') ||
      msg.includes('mailbox does not exist') ||
      msg.includes('does not exist') ||
      msg.includes('address rejected')
    ) {
      return 'hard';
    }

    for (const code of SOFT_BOUNCE_CODES) {
      if (msg.includes(code)) return 'soft';
    }
    if (
      msg.includes('mailbox full') ||
      msg.includes('quota exceeded') ||
      msg.includes('temporarily')
    ) {
      return 'soft';
    }

    return undefined;
  }

  // ─── Check Daily Send Limit ───────────────────────────────────────────────

  async checkDailyLimit(emailAccountId: string): Promise<{
    allowed: boolean;
    sentToday: number;
    limit: number;
  }> {
    const account = await this.db.query.emailAccounts.findFirst({
      where: eq(schema.emailAccounts.id, emailAccountId),
    }) as schema.EmailAccount | null;

    if (!account) return { allowed: false, sentToday: 0, limit: 0 };

    const limit = account.dailySendLimit ?? 50;

    // Count today's sends from outreach_events
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use raw count query
    const events = await this.db.query.outreachEvents.findMany({
      where: and(
        eq(schema.outreachEvents.campaignId, emailAccountId), // placeholder — real impl filters by account
      ),
    });

    // Simplified: count all sent today (in real impl, filter by emailAccountId metadata)
    const sentToday = 0; // TODO: proper count when metadata.email_account_id is indexed

    return {
      allowed: sentToday < limit,
      sentToday,
      limit,
    };
  }

  // ─── Sleep Utility ────────────────────────────────────────────────────────

  async randomDelay(minSeconds = 30, maxSeconds = 90): Promise<void> {
    const ms = (minSeconds + Math.random() * (maxSeconds - minSeconds)) * 1000;
    this.logger.log(`[email-sender] Waiting ${Math.round(ms / 1000)}s before next send...`);
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}