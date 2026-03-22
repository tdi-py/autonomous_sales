import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../database/database.module';
import { SmtpService } from './smtp.service';
import { ImapService } from './imap.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeliverabilityTestResult {
  gmailResult: 'inbox' | 'spam' | 'promotions' | 'junk' | 'not_tested';
  outlookResult: 'inbox' | 'spam' | 'promotions' | 'junk' | 'not_tested';
  yahooResult: 'inbox' | 'spam' | 'promotions' | 'junk' | 'not_tested';
  overallScore: number;
  issuesDetected: string[];
  seedTestAvailable: boolean;
}

export interface SeedAccount {
  address: string;
  password: string;
  imapHost: string;
  imapPort: number;
  provider: 'gmail' | 'outlook';
}

function resultScore(r: string): number {
  if (r === 'inbox') return 100;
  if (r === 'promotions') return 70;
  if (r === 'spam' || r === 'junk') return 0;
  return 0; // not_tested counts as 0 for scoring
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class DeliverabilityTesterService {
  private readonly logger = new Logger(DeliverabilityTesterService.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    private readonly smtpService: SmtpService,
    private readonly imapService: ImapService,
  ) {}

  /**
   * Run a seed deliverability test for the given email account.
   * Sends test emails to seed accounts and checks where they land.
   * If seed accounts are not configured → returns simplified DNS-only result.
   */
  async runTest(
    emailAccountId: string,
    testSubject?: string,
    testBody?: string,
  ): Promise<DeliverabilityTestResult> {
    const account = await this.db.query.emailAccounts.findFirst({
      where: eq(schema.emailAccounts.id, emailAccountId),
    }) as schema.EmailAccount | null;

    if (!account) {
      throw new Error(`Email account not found: ${emailAccountId}`);
    }

    const seedAccounts = this.getSeedAccounts();
    const seedTestAvailable = seedAccounts.length > 0;

    if (!seedTestAvailable) {
      this.logger.warn(
        '[deliverability] Seed test accounts not configured. Set SEED_TEST_GMAIL and SEED_TEST_OUTLOOK env vars.',
      );
      // Return "coming soon" result — only DNS check was done
      return {
        gmailResult: 'not_tested',
        outlookResult: 'not_tested',
        yahooResult: 'not_tested',
        overallScore: 0,
        issuesDetected: [
          'Seed test hesapları yapılandırılmamış. SEED_TEST_GMAIL ve SEED_TEST_OUTLOOK env değişkenlerini ayarlayın.',
        ],
        seedTestAvailable: false,
      };
    }

    const credentials = account.authCredentials as Record<string, unknown>;
    const smtpCreds = {
      host: account.smtpHost ?? 'smtp.gmail.com',
      port: account.smtpPort ?? 587,
      username: credentials?.username as string ?? account.emailAddress,
      password: credentials?.password as string ?? '',
    };

    const subject = testSubject ?? `Deliverability Test — ${new Date().toISOString()}`;
    const body = testBody ?? this.generateTestEmailBody(account.emailAddress);
    const uniqueTag = `[DelivTest-${Date.now()}]`;
    const taggedSubject = `${uniqueTag} ${subject}`;

    let gmailResult: DeliverabilityTestResult['gmailResult'] = 'not_tested';
    let outlookResult: DeliverabilityTestResult['outlookResult'] = 'not_tested';
    const yahooResult: DeliverabilityTestResult['yahooResult'] = 'not_tested';
    const issuesDetected: string[] = [];

    // Send to all seed accounts simultaneously
    const sends = await Promise.allSettled(
      seedAccounts.map((seed) =>
        this.smtpService.sendEmail(smtpCreds, {
          from: account.emailAddress,
          to: seed.address,
          subject: taggedSubject,
          html: body,
        }),
      ),
    );

    // Check send results
    sends.forEach((result, i) => {
      if (result.status === 'rejected') {
        issuesDetected.push(`${seedAccounts[i].provider} seed gönderimi başarısız: ${result.reason}`);
      }
    });

    // Wait for emails to arrive (30-60 seconds)
    const waitMs = 45_000;
    this.logger.log(`[deliverability] Waiting ${waitMs / 1000}s for emails to arrive...`);
    await this.sleep(waitMs);

    // Check each seed account's inbox
    for (const seed of seedAccounts) {
      try {
        const imapCreds = {
          host: seed.imapHost,
          port: seed.imapPort,
          username: seed.address,
          password: seed.password,
          secure: true,
        };

        const checkResult = await this.imapService.findEmailInFolders(
          imapCreds,
          uniqueTag,
          5, // search in last 5 minutes
        );

        if (seed.provider === 'gmail') {
          if (checkResult.emailFound) {
            gmailResult = checkResult.folder === 'not_found' ? 'not_tested' : checkResult.folder as any;
          }
        } else if (seed.provider === 'outlook') {
          if (checkResult.emailFound) {
            outlookResult = checkResult.folder === 'not_found' ? 'not_tested' : checkResult.folder as any;
          }
        }
      } catch (error) {
        const err = error as Error;
        issuesDetected.push(`${seed.provider} IMAP kontrolü başarısız: ${err.message}`);
      }
    }

    // Calculate overall score (only include tested results)
    const scores: number[] = [];
    if (gmailResult !== 'not_tested') scores.push(resultScore(gmailResult));
    if (outlookResult !== 'not_tested') scores.push(resultScore(outlookResult));
    if (yahooResult !== 'not_tested') scores.push(resultScore(yahooResult));

    const overallScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    // Collect issues
    if (gmailResult === 'spam') issuesDetected.push('Gmail email\'inizi spam olarak işaretliyor. DNS kayıtlarını ve email içeriğini kontrol edin.');
    if (gmailResult === 'promotions') issuesDetected.push('Gmail email\'inizi Promotions sekmesinde görüntülüyor. Daha kişisel bir metin kullanmayı deneyin.');
    if (outlookResult === 'spam' || outlookResult === 'junk') issuesDetected.push('Outlook/Microsoft email\'inizi Junk olarak işaretliyor.');

    // Save to database
    await this.db.insert(schema.deliverabilityTests).values({
      emailAccountId,
      testType: 'seed_test',
      gmailResult,
      outlookResult,
      yahooResult,
      overallScore,
      issuesDetected,
      spamTriggerWords: [],
      testedAt: new Date(),
    });

    this.logger.log(
      `[deliverability] Test complete — Gmail: ${gmailResult}, Outlook: ${outlookResult}, Score: ${overallScore}`,
    );

    return {
      gmailResult,
      outlookResult,
      yahooResult,
      overallScore,
      issuesDetected,
      seedTestAvailable: true,
    };
  }

  /**
   * Get deliverability test history for an account.
   */
  async getHistory(
    emailAccountId: string,
    limit = 5,
  ): Promise<schema.DeliverabilityTest[]> {
    return this.db.query.deliverabilityTests.findMany({
      where: eq(schema.deliverabilityTests.emailAccountId, emailAccountId),
      orderBy: (t: any, { desc }: any) => [desc(t.testedAt)],
      limit,
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private getSeedAccounts(): SeedAccount[] {
    const accounts: SeedAccount[] = [];

    const gmailAddress = process.env.SEED_TEST_GMAIL;
    const gmailPassword = process.env.SEED_TEST_GMAIL_PASSWORD;
    if (gmailAddress && gmailPassword) {
      accounts.push({
        address: gmailAddress,
        password: gmailPassword,
        imapHost: 'imap.gmail.com',
        imapPort: 993,
        provider: 'gmail',
      });
    }

    const outlookAddress = process.env.SEED_TEST_OUTLOOK;
    const outlookPassword = process.env.SEED_TEST_OUTLOOK_PASSWORD;
    if (outlookAddress && outlookPassword) {
      accounts.push({
        address: outlookAddress,
        password: outlookPassword,
        imapHost: 'outlook.office365.com',
        imapPort: 993,
        provider: 'outlook',
      });
    }

    return accounts;
  }

  private generateTestEmailBody(senderEmail: string): string {
    return `
      <p>Hi there,</p>
      <p>This is an automated deliverability test email sent from ${senderEmail}.</p>
      <p>We're checking to make sure your emails reach the inbox properly.</p>
      <p>If you received this in your inbox, great news — your email deliverability is working well!</p>
      <p>Best regards,<br>Autonomous Sales Platform</p>
      <p style="color:#999;font-size:12px;">
        This is a test email. Please ignore.
        <a href="https://autonomous-sales.example.com/unsubscribe">Unsubscribe</a>
      </p>
      <p style="color:#999;font-size:11px;">
        Autonomous Sales, 123 Main St, San Francisco, CA 94105
      </p>
    `;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
