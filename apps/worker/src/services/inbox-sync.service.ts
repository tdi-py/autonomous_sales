import { Injectable, Logger, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { ImapFlow } from 'imapflow';
import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../database/database.module';
import { createLLMProvider, getModelForAgent } from '@autonomous-sales/shared';
import { BounceHandlerService } from './bounce-handler.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'objection' | 'unsubscribe' | 'out_of_office';
  confidence: number;
  summary: string;
  detected_objection: string | null;
  suggested_action: 'schedule_meeting' | 'send_info' | 'follow_up_later' | 'add_to_suppression' | 'no_action';
}

interface ParsedEmail {
  from: string;
  subject: string;
  text: string;
  html: string;
  inReplyTo?: string;
  references?: string;
  date: Date;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class InboxSyncService {
  private readonly logger = new Logger(InboxSyncService.name);
  // Track last sync time per account: accountId → Date
  private lastSyncTimes = new Map<string, Date>();

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    private readonly bounceHandlerService: BounceHandlerService,
  ) {}

  // ─── Sync All Accounts ────────────────────────────────────────────────────

  async syncAllInboxes(): Promise<void> {
    this.logger.log('[inbox-sync] Starting sync for all active accounts...');

    const accounts = await this.db.query.emailAccounts.findMany({
      where: eq(schema.emailAccounts.warmupStatus, 'ready'),
    }) as schema.EmailAccount[];

    // Also sync accounts that are warming (to catch replies)
    const warmingAccounts = await this.db.query.emailAccounts.findMany({
      where: eq(schema.emailAccounts.warmupStatus, 'warming'),
    }) as schema.EmailAccount[];

    const allAccounts = [...accounts, ...warmingAccounts];

    this.logger.log(`[inbox-sync] Found ${allAccounts.length} account(s) to sync`);

    for (const account of allAccounts) {
      try {
        await this.syncAccount(account);
      } catch (err) {
        this.logger.error(
          `[inbox-sync] Failed to sync account ${account.emailAddress}: ${(err as Error).message}`,
        );
      }
    }
  }

  // ─── Sync Single Account ──────────────────────────────────────────────────

  async syncAccount(account: schema.EmailAccount): Promise<void> {
    const credentials = account.authCredentials as Record<string, string> | null;
    if (!credentials?.password) {
      this.logger.warn(`[inbox-sync] No credentials for account ${account.emailAddress}`);
      return;
    }

    const lastSync = this.lastSyncTimes.get(account.id) ?? new Date(Date.now() - 10 * 60 * 1000);
    this.logger.log(`[inbox-sync] Syncing ${account.emailAddress} since ${lastSync.toISOString()}`);

    const client = new ImapFlow({
      host: account.imapHost ?? 'imap.gmail.com',
      port: account.imapPort ?? 993,
      secure: true,
      auth: {
        user: credentials.username ?? account.emailAddress,
        pass: credentials.password,
      },
      tls: { rejectUnauthorized: false },
      logger: false,
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');

      try {
        // Search for emails since last sync
        const uids = await client.search({ since: lastSync });

        if (!uids || uids.length === 0) {
          this.logger.log(`[inbox-sync] No new messages for ${account.emailAddress}`);
          return;
        }

        this.logger.log(`[inbox-sync] Found ${uids.length} new message(s) for ${account.emailAddress}`);

        // Fetch messages
        for await (const message of client.fetch(uids as any, {
          envelope: true,
          bodyStructure: true,
          source: true,
        })) {
          try {
            await this.processMessage(message, account);
          } catch (err) {
            this.logger.error(`[inbox-sync] Failed to process message: ${(err as Error).message}`);
          }
        }
      } finally {
        lock.release();
      }

      // Update last sync time
      this.lastSyncTimes.set(account.id, new Date());
    } catch (err) {
      this.logger.error(`[inbox-sync] IMAP error for ${account.emailAddress}: ${(err as Error).message}`);
    } finally {
      await client.logout().catch(() => {});
    }
  }

  // ─── Process Single Message ───────────────────────────────────────────────

  private async processMessage(message: any, account: schema.EmailAccount): Promise<void> {
    const envelope = message.envelope;
    if (!envelope) return;

    const fromAddress = envelope.from?.[0]?.address ?? '';
    const subject = envelope.subject ?? '';
    const inReplyTo = envelope.inReplyTo ?? '';

    // Extract body text from source
    let bodyText = '';
    let bodyHtml = '';
    try {
      const source = message.source?.toString('utf-8') ?? '';
      // Simple extraction: find text between blank line and next boundary
      const bodyMatch = source.match(/\r\n\r\n([\s\S]+)/);
      if (bodyMatch) {
        bodyText = bodyMatch[1].slice(0, 3000).replace(/[^\S\n]+/g, ' ');
      }
    } catch {
      bodyText = '';
    }

    // Try to match to an outreach event
    const matchedEvent = await this.findMatchingOutreachEvent(
      fromAddress,
      subject,
      inReplyTo,
      account.projectId,
    );

    if (!matchedEvent) {
      this.logger.log(`[inbox-sync] No outreach match for reply from ${fromAddress}`);
      return;
    }

    // Check if we already saved this message
    const existing = await this.db.query.inboxMessages.findFirst({
      where: and(
        eq(schema.inboxMessages.outreachEventId, matchedEvent.id),
        eq(schema.inboxMessages.fromEmail, fromAddress),
      ),
    });

    if (existing) {
      this.logger.log(`[inbox-sync] Message already processed for event ${matchedEvent.id}`);
      return;
    }

    // AI Sentiment Analysis
    const sentimentResult = await this.analyzeSentiment(bodyText || subject);

    // Find lead
    const lead = await this.db.query.leads.findFirst({
      where: eq(schema.leads.id, matchedEvent.leadId),
    }) as schema.Lead | null;

    // Save to inbox_messages
    await this.db.insert(schema.inboxMessages).values({
      projectId: account.projectId,
      leadId: matchedEvent.leadId,
      outreachEventId: matchedEvent.id,
      fromEmail: fromAddress,
      subject,
      bodyText: bodyText.slice(0, 5000),
      bodyHtml: bodyHtml.slice(0, 10000),
      sentiment: sentimentResult.sentiment,
      sentimentScore: sentimentResult.confidence,
      aiSummary: sentimentResult.summary,
      isRead: false,
      requiresAction: ['positive', 'objection'].includes(sentimentResult.sentiment),
      receivedAt: envelope.date ? new Date(envelope.date) : new Date(),
    });

    // Update outreach event status
    await this.db
      .update(schema.outreachEvents)
      .set({ status: 'replied' })
      .where(eq(schema.outreachEvents.id, matchedEvent.id));

    // Update lead status
    if (lead) {
      await this.db
        .update(schema.leads)
        .set({ status: 'responded', updatedAt: new Date() })
        .where(eq(schema.leads.id, lead.id));
    }

    // Handle special sentiments
    if (sentimentResult.sentiment === 'unsubscribe') {
      if (lead?.contactEmail) {
        await this.bounceHandlerService.addToSuppressionList(
          account.projectId,
          lead.contactEmail,
          'unsubscribed',
        );
      }
    }

    if (sentimentResult.sentiment === 'out_of_office') {
      // Could schedule a delayed follow-up here
      this.logger.log(`[inbox-sync] Out-of-office detected for lead ${matchedEvent.leadId}`);
    }

    this.logger.log(
      `[inbox-sync] ✅ Saved reply from ${fromAddress} — sentiment: ${sentimentResult.sentiment}`,
    );
  }

  // ─── Find Matching Outreach Event ─────────────────────────────────────────

  private async findMatchingOutreachEvent(
    fromEmail: string,
    subject: string,
    inReplyTo: string,
    projectId: string,
  ): Promise<schema.OutreachEvent | null> {
    // Strategy 1: Find by lead email + project
    const lead = await this.db.query.leads.findFirst({
      where: and(
        eq(schema.leads.projectId, projectId),
        eq(schema.leads.contactEmail, fromEmail.toLowerCase()),
      ),
    }) as schema.Lead | null;

    if (!lead) return null;

    // Find most recent outreach event for this lead
    const events = await this.db.query.outreachEvents.findMany({
      where: eq(schema.outreachEvents.leadId, lead.id),
      orderBy: (t: any, { desc }: any) => [desc(t.sentAt)],
      limit: 1,
    }) as schema.OutreachEvent[];

    return events[0] ?? null;
  }

  // ─── AI Sentiment Analysis ────────────────────────────────────────────────

  async analyzeSentiment(replyText: string): Promise<SentimentResult> {
    if (!replyText || replyText.trim().length < 5) {
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        summary: 'Empty or very short reply',
        detected_objection: null,
        suggested_action: 'no_action',
      };
    }

    try {
      const llm = createLLMProvider();
      const model = getModelForAgent('communicator'); // Fast model for classification

      const prompt = `Bu email bir B2B cold email'e gelen yanıttır. Yanıtı analiz et ve sınıfla.

Yanıt metni:
---
${replyText.slice(0, 1000)}
---

Sınıflandırma seçenekleri:
- positive: İlgili, meeting istiyor, daha fazla bilgi istiyor
- negative: İlgisiz, ret, kaba
- neutral: Belirsiz, soru soruyor ama ilgi belli değil
- objection: Spesifik bir itiraz var (fiyat, zamanlama, rakip vb.)
- unsubscribe: Listeden çıkmak istiyor
- out_of_office: Otomatik tatil/dışarıda yanıtı

SADECE JSON döndür, başka hiçbir şey yazma:
{"sentiment":"positive|negative|neutral|objection|unsubscribe|out_of_office","confidence":0.0-1.0,"summary":"1 cümlelik özet","detected_objection":"string veya null","suggested_action":"schedule_meeting|send_info|follow_up_later|add_to_suppression|no_action"}`;

      const result = await llm.generateCompletion({
        model,
        prompt,
        temperature: 0.2,
        maxTokens: 500,
      });

      const cleaned = result.content
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(cleaned) as SentimentResult;
    } catch (err) {
      this.logger.error(`[inbox-sync] Sentiment analysis failed: ${(err as Error).message}`);
      // Fallback — human should review
      return {
        sentiment: 'neutral',
        confidence: 0.3,
        summary: 'Sentiment analysis failed — please review manually',
        detected_objection: null,
        suggested_action: 'no_action',
      };
    }
  }
}