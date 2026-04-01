import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { eq, and } from 'drizzle-orm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../database/database.module';
import { QUEUE_NAMES } from '@autonomous-sales/shared';
import { SmtpService } from './smtp.service';

// ─── Warmup Schedule ─────────────────────────────────────────────────────────

const WARMUP_SCHEDULE: Array<{ fromDay: number; toDay: number; targetSends: number }> = [
  { fromDay: 1,  toDay: 3,  targetSends: 5  },
  { fromDay: 4,  toDay: 7,  targetSends: 10 },
  { fromDay: 8,  toDay: 14, targetSends: 20 },
  { fromDay: 15, toDay: 21, targetSends: 35 },
  { fromDay: 22, toDay: 28, targetSends: 50 },
  { fromDay: 29, toDay: 999, targetSends: 0 },
];

const WARMUP_TOTAL_DAYS = 28;

// ─── Warmup Email Templates ───────────────────────────────────────────────────

const WARMUP_SUBJECTS = [
  'Quick question about our upcoming project',
  'Following up on our collaboration',
  'Wanted to share something with you',
  'Meeting recap and next steps',
  'A few thoughts on your proposal',
  'Checking in — how are things going?',
  'Your feedback would be valuable here',
  'Exciting update I wanted to share',
  'Brief update from our team',
  'Around 10 minutes of your time?',
  'I came across something you might find useful',
  'Following up from our last conversation',
  'Can we schedule a quick sync?',
  'Resource I thought you might appreciate',
  'Circling back on our discussion',
];

const WARMUP_BODIES = [
  `<p>Hi,</p><p>Hope you're having a great week. I wanted to follow up on our earlier conversation and see if you had any thoughts or questions. Looking forward to hearing from you.</p><p>Best,<br>Team</p>`,
  `<p>Hello,</p><p>Just reaching out to share a quick update on our project. Things are moving along well and I think we're on track to meet our goals. Let me know if you'd like to connect for a quick sync.</p><p>Regards</p>`,
  `<p>Hi there,</p><p>I came across an article this morning that made me think of our last discussion. Would love to get your perspective on it when you have a moment.</p><p>Thanks!</p>`,
  `<p>Good morning,</p><p>Quick note to say that the proposal you sent over looks great. I have a few minor questions but overall it's exactly what we were hoping for. Can we find 15 minutes this week?</p><p>Best wishes</p>`,
  `<p>Hello,</p><p>Following up on my previous message — no pressure at all, just wanted to make sure it didn't get buried. Happy to connect whenever works best for you.</p><p>Warm regards</p>`,
  `<p>Hi,</p><p>Hope the week is treating you well. I wanted to share a few thoughts on the proposal we discussed. Overall the direction looks promising and I think the timing could work well for both parties.</p><p>Let me know your thoughts. Thanks!</p>`,
  `<p>Hello,</p><p>Just a quick check-in. We've been making progress on our end and wanted to keep you in the loop. Everything is looking good so far. Looking forward to our next catch-up.</p><p>Best,<br>Team</p>`,
];

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class WarmupService {
  private readonly logger = new Logger(WarmupService.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    private readonly smtpService: SmtpService,
    @InjectQueue(QUEUE_NAMES.WARMUP_EXECUTE) private readonly warmupQueue: Queue,
  ) {}

  // ─── Cron: Her gün 09:00 UTC tüm "warming" hesapları kuyruğa ekle ─────────

  @Cron('0 9 * * *')
  async scheduleDailyWarmups(): Promise<void> {
    this.logger.log('[warmup-cron] Running daily warmup scheduler...');

    const warmingAccounts = await this.db.query.emailAccounts.findMany({
      where: eq(schema.emailAccounts.warmupStatus, 'warming'),
    }) as schema.EmailAccount[];

    if (warmingAccounts.length === 0) {
      this.logger.log('[warmup-cron] No accounts in warming state.');
      return;
    }

    for (const account of warmingAccounts) {
      await this.warmupQueue.add(
        {
          emailAccountId: account.id,
          projectId: account.projectId,
          workspaceId: '',
          agentType: 'communicator',
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 60_000 },
        },
      );
      this.logger.log(`[warmup-cron] Queued warmup job for account: ${account.id}`);
    }

    this.logger.log(`[warmup-cron] Queued ${warmingAccounts.length} warmup jobs.`);
  }

  // ─── Mevcut metodlar (değiştirilmedi) ────────────────────────────────────────

  async createSchedule(emailAccountId: string): Promise<void> {
    this.logger.log(`[warmup] Creating 28-day schedule for account: ${emailAccountId}`);

    const scheduleEntries = [];
    for (let day = 1; day <= WARMUP_TOTAL_DAYS; day++) {
      const rule = WARMUP_SCHEDULE.find(
        (r) => day >= r.fromDay && day <= r.toDay,
      );
      scheduleEntries.push({
        emailAccountId,
        dayNumber: day,
        targetSends: rule?.targetSends ?? 5,
        actualSends: 0,
      });
    }

    await this.db.insert(schema.warmupSchedule).values(scheduleEntries);
    this.logger.log(`[warmup] Created ${scheduleEntries.length} schedule entries`);
  }

  async startWarmup(emailAccountId: string): Promise<void> {
    await this.db
      .update(schema.emailAccounts)
      .set({
        warmupStatus: 'warming',
        warmupDay: 1,
        dailySendLimit: 5,
        updatedAt: new Date(),
      })
      .where(eq(schema.emailAccounts.id, emailAccountId));

    this.logger.log(`[warmup] Warmup started for account: ${emailAccountId}`);
  }

  async executeDailyWarmup(emailAccountId: string): Promise<{
    sent: number;
    errors: number;
    completed: boolean;
  }> {
    const account = await this.db.query.emailAccounts.findFirst({
      where: eq(schema.emailAccounts.id, emailAccountId),
    }) as schema.EmailAccount | null;

    if (!account) {
      throw new Error(`Email account not found: ${emailAccountId}`);
    }

    if (account.warmupStatus !== 'warming') {
      this.logger.log(`[warmup] Account ${emailAccountId} is not in warming state (${account.warmupStatus}) — skipping`);
      return { sent: 0, errors: 0, completed: false };
    }

    const currentDay = account.warmupDay ?? 1;

    const scheduleEntry = await this.db.query.warmupSchedule.findFirst({
      where: and(
        eq(schema.warmupSchedule.emailAccountId, emailAccountId),
        eq(schema.warmupSchedule.dayNumber, currentDay),
      ),
    });

    if (!scheduleEntry) {
      this.logger.warn(`[warmup] No schedule entry for day ${currentDay} — account: ${emailAccountId}`);
      return { sent: 0, errors: 0, completed: false };
    }

    const targetSends = scheduleEntry.targetSends;
    const credentials = account.authCredentials as Record<string, unknown>;

    const smtpCreds = {
      host: account.smtpHost ?? 'smtp.gmail.com',
      port: account.smtpPort ?? 587,
      username: credentials?.username as string ?? account.emailAddress,
      password: credentials?.password as string ?? '',
    };

    const accountSeedEmails = Array.isArray(account.warmupSeedEmails) && (account.warmupSeedEmails as string[]).length > 0
      ? account.warmupSeedEmails as string[]
      : null;
    let sent = 0;
    let errors = 0;

    for (let i = 0; i < targetSends; i++) {
      try {
        const subject = this.pickRandom(WARMUP_SUBJECTS);
        const body = this.pickRandom(WARMUP_BODIES);
        const seedRecipient = accountSeedEmails
          ? accountSeedEmails[i % accountSeedEmails.length]
          : this.getSeedRecipient();

        const result = await this.smtpService.sendEmail(smtpCreds, {
          from: account.emailAddress,
          to: seedRecipient,
          subject: `[Warmup Day ${currentDay}] ${subject}`,
          html: body,
        });

        if (result.success) {
          sent++;
          this.logger.log(`[warmup] Sent warmup email ${i + 1}/${targetSends} for account: ${emailAccountId}`);
        } else {
          errors++;
          this.logger.warn(`[warmup] Failed to send warmup email: ${result.error}`);
        }
      } catch (error) {
        errors++;
        const err = error as Error;
        this.logger.error(`[warmup] Error sending warmup email: ${err.message}`);
      }

      if (i < targetSends - 1) {
        const delayMs = (30 + Math.random() * 90) * 1000;
        await this.sleep(delayMs);
      }
    }

    await this.db
      .update(schema.warmupSchedule)
      .set({ actualSends: sent, executedAt: new Date() })
      .where(eq(schema.warmupSchedule.id, scheduleEntry.id));

    const isLastDay = currentDay >= WARMUP_TOTAL_DAYS;
    const nextDay = currentDay + 1;
    const nextRule = WARMUP_SCHEDULE.find((r) => nextDay >= r.fromDay && nextDay <= r.toDay);
    const nextDailyLimit = nextRule && nextRule.targetSends > 0 ? nextRule.targetSends : 200;

    if (isLastDay) {
      await this.db
        .update(schema.emailAccounts)
        .set({ warmupStatus: 'ready', warmupDay: currentDay, dailySendLimit: 200, updatedAt: new Date() })
        .where(eq(schema.emailAccounts.id, emailAccountId));

      this.logger.log(`[warmup] ✅ Warmup COMPLETE for account: ${emailAccountId}`);
      return { sent, errors, completed: true };
    } else {
      await this.db
        .update(schema.emailAccounts)
        .set({ warmupDay: nextDay, dailySendLimit: nextDailyLimit, updatedAt: new Date() })
        .where(eq(schema.emailAccounts.id, emailAccountId));

      this.logger.log(`[warmup] Day ${currentDay} complete — advancing to day ${nextDay} (${nextDailyLimit} emails/day)`);
      return { sent, errors, completed: false };
    }
  }

  async updateSeedEmails(emailAccountId: string, seedEmails: string[]): Promise<void> {
    await this.db
      .update(schema.emailAccounts)
      .set({ warmupSeedEmails: seedEmails, updatedAt: new Date() })
      .where(eq(schema.emailAccounts.id, emailAccountId));
    this.logger.log(`[warmup] Updated seed emails for account: ${emailAccountId} — ${seedEmails.length} emails`);
  }

  async pauseWarmup(emailAccountId: string): Promise<void> {
    await this.db
      .update(schema.emailAccounts)
      .set({ warmupStatus: 'paused', updatedAt: new Date() })
      .where(eq(schema.emailAccounts.id, emailAccountId));
  }

  async resumeWarmup(emailAccountId: string): Promise<void> {
    await this.db
      .update(schema.emailAccounts)
      .set({ warmupStatus: 'warming', updatedAt: new Date() })
      .where(eq(schema.emailAccounts.id, emailAccountId));
  }

  async getProgress(emailAccountId: string): Promise<{
    account: schema.EmailAccount | null;
    schedule: schema.WarmupSchedule[];
    completedDays: number;
    totalDays: number;
    percentComplete: number;
    currentDailyLimit: number;
    today: schema.WarmupSchedule | null;
  }> {
    const account = await this.db.query.emailAccounts.findFirst({
      where: eq(schema.emailAccounts.id, emailAccountId),
    }) as schema.EmailAccount | null;

    const schedule = await this.db.query.warmupSchedule.findMany({
      where: eq(schema.warmupSchedule.emailAccountId, emailAccountId),
      orderBy: (t: any, { asc }: any) => [asc(t.dayNumber)],
    }) as schema.WarmupSchedule[];

    const completedDays = schedule.filter((s) => s.executedAt !== null).length;
    const currentDay = account?.warmupDay ?? 0;
    const today = schedule.find((s) => s.dayNumber === currentDay) ?? null;

    return {
      account,
      schedule,
      completedDays,
      totalDays: WARMUP_TOTAL_DAYS,
      percentComplete: Math.round((completedDays / WARMUP_TOTAL_DAYS) * 100),
      currentDailyLimit: account?.dailySendLimit ?? 0,
      today,
    };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private getSeedRecipient(): string {
    return process.env.SEED_TEST_GMAIL ?? 'warmup-seed@autonomous-sales.internal';
  }

  private pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}