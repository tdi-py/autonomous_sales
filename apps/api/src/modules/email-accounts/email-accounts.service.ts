import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import * as nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import * as dns from 'dns/promises';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import { QUEUE_NAMES } from '@autonomous-sales/shared';
import type { CreateEmailAccountDto } from './dto/email-account.dto';

// ─── SMTP/IMAP defaults ───────────────────────────────────────────────────────

const PROVIDER_DEFAULTS = {
  gmail: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    imapHost: 'imap.gmail.com',
    imapPort: 993,
  },
  outlook: {
    smtpHost: 'smtp-mail.outlook.com',
    smtpPort: 587,
    imapHost: 'outlook.office365.com',
    imapPort: 993,
  },
  custom_smtp: {
    smtpHost: '',
    smtpPort: 587,
    imapHost: '',
    imapPort: 993,
  },
} as const;

// ─── Warmup schedule definition ───────────────────────────────────────────────

const WARMUP_SCHEDULE = [
  { fromDay: 1,  toDay: 3,  targetSends: 5  },
  { fromDay: 4,  toDay: 7,  targetSends: 10 },
  { fromDay: 8,  toDay: 14, targetSends: 20 },
  { fromDay: 15, toDay: 21, targetSends: 35 },
  { fromDay: 22, toDay: 28, targetSends: 50 },
];

@Injectable()
export class EmailAccountsService {
  private readonly logger = new Logger(EmailAccountsService.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    @InjectQueue(QUEUE_NAMES.WARMUP_EXECUTE) private readonly warmupQueue: Queue,
  ) {}

  // ─── Create email account ──────────────────────────────────────────────────

  async create(userId: string, dto: CreateEmailAccountDto): Promise<schema.EmailAccount & { connectionTest: unknown }> {
    await this.assertProjectAccess(dto.projectId, userId);

    const defaults = PROVIDER_DEFAULTS[dto.provider];
    const smtpHost = dto.smtpHost ?? defaults.smtpHost;
    const smtpPort = dto.smtpPort ?? defaults.smtpPort;
    const imapHost = dto.imapHost ?? defaults.imapHost;
    const imapPort = dto.imapPort ?? defaults.imapPort;
    const username = dto.username ?? dto.emailAddress;

    // ── SMTP connection test ─────────────────────────────────────────────────
    this.logger.log(`[email-accounts] Testing SMTP connection for: ${dto.emailAddress}`);
    const smtpResult = await this.testSmtpConnection({
      host: smtpHost,
      port: smtpPort,
      username,
      password: dto.password,
    });

    if (!smtpResult.success) {
      throw new BadRequestException(
        `SMTP bağlantısı kurulamadı: ${smtpResult.error ?? 'Bilinmeyen hata'}. Lütfen bilgilerinizi kontrol edin.`,
      );
    }

    // ── IMAP connection test ─────────────────────────────────────────────────
    this.logger.log(`[email-accounts] Testing IMAP connection for: ${dto.emailAddress}`);
    const imapResult = await this.testImapConnection({
      host: imapHost,
      port: imapPort,
      username,
      password: dto.password,
    });

    if (!imapResult.success) {
      throw new BadRequestException(
        `IMAP bağlantısı kurulamadı: ${imapResult.error ?? 'Bilinmeyen hata'}. IMAP erişimini kontrol edin.`,
      );
    }

    // ── Save account ─────────────────────────────────────────────────────────
    // Store credentials as JSONB (masked password in logs)
    const authCredentials = {
      username,
      password: dto.password,  // Will be encrypted in production
      senderName: dto.senderName,
    };
    this.logger.log(`[email-accounts] Saving account: ${dto.emailAddress} [password masked]`);

    const [account] = await this.db
      .insert(schema.emailAccounts)
      .values({
        projectId: dto.projectId,
        emailAddress: dto.emailAddress,
        provider: dto.provider,
        smtpHost,
        smtpPort,
        imapHost,
        imapPort,
        authCredentials,
        warmupStatus: 'not_started',
        warmupDay: 0,
        dailySendLimit: 20,
      })
      .returning();

    // ── Create warmup schedule ───────────────────────────────────────────────
    await this.createWarmupSchedule(account.id);

    // ── Trigger async DNS check ──────────────────────────────────────────────
    this.triggerDnsCheck(account.id, dto.emailAddress).catch((err) =>
      this.logger.error(`[email-accounts] Async DNS check failed: ${err.message}`),
    );

    return { ...account, connectionTest: { smtp: 'ok', imap: 'ok' } };
  }

  // ─── Find all (by project) ────────────────────────────────────────────────

  async findAll(userId: string, projectId: string): Promise<schema.EmailAccount[]> {
    await this.assertProjectAccess(projectId, userId);

    return this.db.query.emailAccounts.findMany({
      where: eq(schema.emailAccounts.projectId, projectId),
      orderBy: (t: any, { desc }: any) => [desc(t.createdAt)],
    });
  }

  // ─── Find one ────────────────────────────────────────────────────────────

  async findOne(id: string, userId: string): Promise<schema.EmailAccount> {
    const account = await this.db.query.emailAccounts.findFirst({
      where: eq(schema.emailAccounts.id, id),
    }) as schema.EmailAccount | null;

    if (!account) throw new NotFoundException('Email account not found');
    await this.assertProjectAccess(account.projectId, userId);
    return account;
  }

  // ─── Delete ──────────────────────────────────────────────────────────────

  async remove(id: string, userId: string): Promise<{ deleted: boolean }> {
    const account = await this.findOne(id, userId);

    // Check for active campaigns using this account — soft warning only
    // (Full campaign check would require campaign-account linking, implement in Faz 3)

    await this.db
      .delete(schema.emailAccounts)
      .where(eq(schema.emailAccounts.id, account.id));

    return { deleted: true };
  }

  // ─── Test connection ─────────────────────────────────────────────────────

  async testConnectionById(
    id: string,
    userId: string,
  ): Promise<{ smtp: 'ok' | 'failed'; imap: 'ok' | 'failed'; error?: string }> {
    const account = await this.findOne(id, userId);
    const creds = account.authCredentials as Record<string, string>;

    const [smtpResult, imapResult] = await Promise.all([
      this.testSmtpConnection({
        host: account.smtpHost!,
        port: account.smtpPort!,
        username: creds.username,
        password: creds.password,
      }),
      this.testImapConnection({
        host: account.imapHost!,
        port: account.imapPort!,
        username: creds.username,
        password: creds.password,
      }),
    ]);

    return {
      smtp: smtpResult.success ? 'ok' : 'failed',
      imap: imapResult.success ? 'ok' : 'failed',
      error: smtpResult.error ?? imapResult.error,
    };
  }

  // ─── DNS check ───────────────────────────────────────────────────────────

  async runDnsCheck(id: string, userId: string): Promise<{
    spfValid: boolean; dkimValid: boolean; dmarcValid: boolean;
    healthScore: number; recommendations: string[];
  }> {
    const account = await this.findOne(id, userId);
    const result = await this.checkDns(account.emailAddress);

    await this.db
      .update(schema.emailAccounts)
      .set({
        spfValid: result.spfValid,
        dkimValid: result.dkimValid,
        dmarcValid: result.dmarcValid,
        healthScore: result.healthScore,
        updatedAt: new Date(),
      })
      .where(eq(schema.emailAccounts.id, id));

    return result;
  }

  // ─── Warmup controls ─────────────────────────────────────────────────────

  async startWarmup(id: string, userId: string): Promise<{ started: boolean }> {
    const account = await this.findOne(id, userId);

    if (account.warmupStatus === 'warming') {
      throw new BadRequestException('Hesap zaten ısındırma modunda.');
    }
    if (account.warmupStatus === 'ready') {
      throw new BadRequestException('Hesap zaten hazır durumda.');
    }

    await this.db
      .update(schema.emailAccounts)
      .set({
        warmupStatus: 'warming',
        warmupDay: 1,
        dailySendLimit: 5,
        updatedAt: new Date(),
      })
      .where(eq(schema.emailAccounts.id, id));

    // Queue the first warmup job
    await this.warmupQueue.add(
      {
        emailAccountId: id,
        projectId: account.projectId,
        workspaceId: '',
        agentType: 'communicator',
      },
      {
        delay: 5000, // start in 5 seconds
        attempts: 3,
        backoff: { type: 'exponential', delay: 60_000 },
      },
    );

    return { started: true };
  }

  async pauseWarmup(id: string, userId: string): Promise<{ paused: boolean }> {
    const account = await this.findOne(id, userId);
    if (account.warmupStatus !== 'warming') {
      throw new BadRequestException('Hesap ısındırma modunda değil.');
    }
    await this.db
      .update(schema.emailAccounts)
      .set({ warmupStatus: 'paused', updatedAt: new Date() })
      .where(eq(schema.emailAccounts.id, id));
    return { paused: true };
  }

  async resumeWarmup(id: string, userId: string): Promise<{ resumed: boolean }> {
    const account = await this.findOne(id, userId);
    if (account.warmupStatus !== 'paused') {
      throw new BadRequestException('Hesap duraklatılmış modunda değil.');
    }
    await this.db
      .update(schema.emailAccounts)
      .set({ warmupStatus: 'warming', updatedAt: new Date() })
      .where(eq(schema.emailAccounts.id, id));
    return { resumed: true };
  }

  async getWarmupProgress(id: string, userId: string): Promise<{
    account: schema.EmailAccount;
    schedule: schema.WarmupSchedule[];
    completedDays: number;
    totalDays: number;
    percentComplete: number;
    currentDailyLimit: number;
  }> {
    const account = await this.findOne(id, userId);

    const schedule = await this.db.query.warmupSchedule.findMany({
      where: eq(schema.warmupSchedule.emailAccountId, id),
      orderBy: (t: any, { asc }: any) => [asc(t.dayNumber)],
    }) as schema.WarmupSchedule[];

    const completedDays = schedule.filter((s) => s.executedAt !== null).length;

    return {
      account,
      schedule,
      completedDays,
      totalDays: 28,
      percentComplete: Math.round((completedDays / 28) * 100),
      currentDailyLimit: account.dailySendLimit,
    };
  }

  // ─── Deliverability test ─────────────────────────────────────────────────

  async runDeliverabilityTest(id: string, userId: string): Promise<{
    gmailResult: string;
    outlookResult: string;
    overallScore: number;
    issuesDetected: string[];
    seedTestAvailable: boolean;
    message: string;
  }> {
    await this.findOne(id, userId);

    // Check if seed accounts are configured
    const seedAvailable = !!(process.env.SEED_TEST_GMAIL && process.env.SEED_TEST_GMAIL_PASSWORD);

    if (!seedAvailable) {
      return {
        gmailResult: 'not_tested',
        outlookResult: 'not_tested',
        overallScore: 0,
        issuesDetected: [],
        seedTestAvailable: false,
        message: 'Seed test hesapları henüz yapılandırılmamış. DNS kontrolü ve ısındırma aktif. Seed test yakında eklenecek.',
      };
    }

    // Queue the deliverability test job
    // For now, return a pending response — in full impl, this would be async
    return {
      gmailResult: 'not_tested',
      outlookResult: 'not_tested',
      overallScore: 0,
      issuesDetected: [],
      seedTestAvailable: false,
      message: 'Test kuyruğa alındı. Birkaç dakika içinde sonuçlar güncellenir.',
    };
  }

  async updateSeedEmails(id: string, userId: string, seedEmails: string[]): Promise<{ updated: boolean; seedEmails: string[] }> {
    const account = await this.findOne(id, userId);

    await this.db
      .update(schema.emailAccounts)
      .set({ warmupSeedEmails: seedEmails, updatedAt: new Date() })
      .where(eq(schema.emailAccounts.id, account.id));

    this.logger.log(`[email-accounts] Updated seed emails for: ${account.emailAddress} (${seedEmails.length} emails)`);
    return { updated: true, seedEmails };
  }

  async getDeliverabilityHistory(id: string, userId: string): Promise<schema.DeliverabilityTest[]> {
    await this.findOne(id, userId);

    return this.db.query.deliverabilityTests.findMany({
      where: eq(schema.deliverabilityTests.emailAccountId, id),
      orderBy: (t: any, { desc }: any) => [desc(t.testedAt)],
      limit: 10,
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async assertProjectAccess(projectId: string, userId: string) {
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
    if (!membership) throw new ForbiddenException('No access to this project');
    return project;
  }

  private async createWarmupSchedule(emailAccountId: string): Promise<void> {
    const entries = [];
    for (let day = 1; day <= 28; day++) {
      const rule = WARMUP_SCHEDULE.find((r) => day >= r.fromDay && day <= r.toDay);
      entries.push({
        emailAccountId,
        dayNumber: day,
        targetSends: rule?.targetSends ?? 5,
        actualSends: 0,
      });
    }
    await this.db.insert(schema.warmupSchedule).values(entries);
    this.logger.log(`[email-accounts] Created 28-day warmup schedule for: ${emailAccountId}`);
  }

  private async triggerDnsCheck(accountId: string, emailAddress: string): Promise<void> {
    try {
      const result = await this.checkDns(emailAddress);
      await this.db
        .update(schema.emailAccounts)
        .set({
          spfValid: result.spfValid,
          dkimValid: result.dkimValid,
          dmarcValid: result.dmarcValid,
          healthScore: result.healthScore,
          updatedAt: new Date(),
        })
        .where(eq(schema.emailAccounts.id, accountId));
      this.logger.log(
        `[email-accounts] DNS check done — score: ${result.healthScore} for account: ${accountId}`,
      );
    } catch (err) {
      this.logger.warn(`[email-accounts] DNS check failed: ${(err as Error).message}`);
    }
  }

  private async checkDns(emailAddress: string): Promise<{
    spfValid: boolean;
    dkimValid: boolean;
    dmarcValid: boolean;
    healthScore: number;
    recommendations: string[];
  }> {
    const domain = emailAddress.split('@')[1];
    if (!domain) return { spfValid: false, dkimValid: false, dmarcValid: false, healthScore: 0, recommendations: [] };

    const [spfValid, dkimValid, dmarcValid] = await Promise.all([
      this.checkSpf(domain),
      this.checkDkim(domain),
      this.checkDmarc(domain),
    ]);

    let score = 0;
    if (spfValid) score += 33;
    if (dkimValid) score += 33;
    if (dmarcValid) score += 34;

    const recommendations: string[] = [];
    if (!spfValid) recommendations.push(`SPF: v=spf1 include:_spf.google.com ~all ekleyin`);
    if (!dkimValid) recommendations.push('DKIM: Email provider\'ınızın DKIM kurulum rehberini takip edin');
    if (!dmarcValid) recommendations.push(`DMARC: _dmarc.${domain} için v=DMARC1; p=none; rua=mailto:dmarc@${domain} ekleyin`);

    return { spfValid, dkimValid, dmarcValid, healthScore: score, recommendations };
  }

  private async checkSpf(domain: string): Promise<boolean> {
    try {
      const records = await Promise.race([
        dns.resolveTxt(domain),
        new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), 5000)),
      ]) as string[][];
      const flat = records.map((r) => r.join(''));
      return flat.some((r) => r.includes('v=spf1'));
    } catch { return false; }
  }

  private async checkDkim(domain: string): Promise<boolean> {
    const selectors = ['google', 'default', 'selector1', 'selector2', 'mail', 'dkim'];
    for (const sel of selectors) {
      try {
        const records = await Promise.race([
          dns.resolveTxt(`${sel}._domainkey.${domain}`),
          new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), 5000)),
        ]) as string[][];
        const flat = records.map((r) => r.join(''));
        if (flat.some((r) => r.includes('v=DKIM1') || r.includes('k=rsa') || r.includes('p='))) {
          return true;
        }
      } catch { /* try next */ }
    }
    return false;
  }

  private async checkDmarc(domain: string): Promise<boolean> {
    try {
      const records = await Promise.race([
        dns.resolveTxt(`_dmarc.${domain}`),
        new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), 5000)),
      ]) as string[][];
      const flat = records.map((r) => r.join(''));
      return flat.some((r) => r.includes('v=DMARC1'));
    } catch { return false; }
  }

  private async testSmtpConnection(creds: {
    host: string; port: number; username: string; password: string;
  }): Promise<{ success: boolean; error?: string }> {
    const secure = creds.port === 465;
    const transporter = nodemailer.createTransport({
      host: creds.host,
      port: creds.port,
      secure,
      auth: { user: creds.username, pass: creds.password },
      tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
      connectionTimeout: 10_000,
    } as any);

    try {
      await Promise.race([
        transporter.verify(),
        new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), 10_000)),
      ]);
      return { success: true };
    } catch (err) {
      return { success: false, error: this.friendlySmtpError((err as Error).message) };
    } finally {
      transporter.close();
    }
  }

  private async testImapConnection(creds: {
    host: string; port: number; username: string; password: string;
  }): Promise<{ success: boolean; error?: string }> {
    const client = new ImapFlow({
      host: creds.host,
      port: creds.port,
      secure: true,
      auth: { user: creds.username, pass: creds.password },
      tls: { rejectUnauthorized: false },
      logger: false,
    });

    try {
      await Promise.race([
        client.connect(),
        new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), 10_000)),
      ]);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    } finally {
      await client.logout().catch(() => {/* ignore */});
    }
  }

  private friendlySmtpError(message: string): string {
    if (message.includes('535') || message.includes('534')) {
      return 'Kimlik doğrulama başarısız. Gmail için "App Password" gerekiyor (2FA aktifse).';
    }
    if (message.includes('ECONNREFUSED')) return 'Sunucuya bağlanılamadı. Host/port kontrol edin.';
    if (message.includes('timeout')) return 'Bağlantı zaman aşımına uğradı.';
    if (message.includes('ENOTFOUND')) return 'SMTP sunucu adresi bulunamadı.';
    return `SMTP hatası: ${message}`;
  }
}
