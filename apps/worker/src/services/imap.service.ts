import { Injectable, Logger } from '@nestjs/common';
import { ImapFlow } from 'imapflow';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImapCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  secure?: boolean; // default true (SSL/TLS)
}

export interface ImapTestResult {
  success: boolean;
  error?: string;
  messageCount?: number;
}

export interface InboxCheckResult {
  emailFound: boolean;
  folder: 'inbox' | 'spam' | 'promotions' | 'junk' | 'not_found';
  subject?: string;
}

// ─── IMAP Provider defaults ───────────────────────────────────────────────────

export const IMAP_DEFAULTS = {
  gmail: {
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
  },
  outlook: {
    host: 'outlook.office365.com',
    port: 993,
    secure: true,
  },
} as const;

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class ImapService {
  private readonly logger = new Logger(ImapService.name);

  /**
   * Test IMAP connection by attempting to open inbox.
   */
  async testConnection(credentials: ImapCredentials): Promise<ImapTestResult> {
    const client = this.createClient(credentials);

    try {
      await Promise.race([
        client.connect(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('IMAP connection timeout (10s)')), 10_000),
        ),
      ]);

      // Select inbox to verify access
      const mailbox = await client.getMailboxLock('INBOX');
      const count = client.mailbox ? (client.mailbox as any).exists ?? 0 : 0;
      mailbox.release();

      this.logger.log(
        `[imap] Connection OK — ${credentials.host}:${credentials.port} | messages: ${count}`,
      );
      return { success: true, messageCount: count };
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`[imap] Connection failed — ${credentials.host}: ${err.message}`);
      return { success: false, error: this.friendlyError(err.message) };
    } finally {
      await client.logout().catch(() => {/* ignore */});
    }
  }

  /**
   * Search for an email by subject in various folders (inbox, spam, promotions, junk).
   * Returns which folder the email was found in.
   */
  async findEmailInFolders(
    credentials: ImapCredentials,
    searchSubject: string,
    sinceMinutes = 5,
  ): Promise<InboxCheckResult> {
    const client = this.createClient(credentials);
    const foldersToCheck = [
      { name: 'INBOX', result: 'inbox' as const },
      { name: '[Gmail]/Spam', result: 'spam' as const },
      { name: 'Spam', result: 'spam' as const },
      { name: '[Gmail]/All Mail', result: 'inbox' as const },
      { name: 'Junk', result: 'junk' as const },
      { name: 'Junk Email', result: 'junk' as const },
    ];

    try {
      await client.connect();
      const since = new Date(Date.now() - sinceMinutes * 60 * 1000);

      for (const folder of foldersToCheck) {
        try {
          const lock = await client.getMailboxLock(folder.name);
          try {
            const messages = await client.search({
              subject: searchSubject,
              since,
            });

            if (messages && messages.length > 0) {
              this.logger.log(`[imap] Found email in folder: ${folder.name}`);
              return {
                emailFound: true,
                folder: folder.result,
                subject: searchSubject,
              };
            }
          } catch {
            // Folder doesn't exist or search failed — try next
          } finally {
            lock.release();
          }
        } catch {
          // Folder lock failed — try next
        }
      }

      return { emailFound: false, folder: 'not_found' };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[imap] findEmailInFolders failed: ${err.message}`);
      return { emailFound: false, folder: 'not_found' };
    } finally {
      await client.logout().catch(() => {/* ignore */});
    }
  }

  /**
   * Move recent warmup emails to inbox (simulate engagement).
   * This tells providers that emails from the warmup partner are welcome.
   */
  async moveSpamToInbox(
    credentials: ImapCredentials,
    subjectContains: string,
  ): Promise<{ moved: number }> {
    const client = this.createClient(credentials);

    try {
      await client.connect();
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24h

      const spamFolders = ['[Gmail]/Spam', 'Spam', 'Junk', 'Junk Email'];

      let movedTotal = 0;
      for (const folder of spamFolders) {
        try {
          const lock = await client.getMailboxLock(folder);
          try {
            const uids = await client.search({ subject: subjectContains, since });
            if (uids && uids.length > 0) {
              await client.messageMove(uids as any, 'INBOX');
              movedTotal += uids.length;
              this.logger.log(`[imap] Moved ${uids.length} emails from ${folder} to INBOX`);
            }
          } finally {
            lock.release();
          }
        } catch {
          // Folder doesn't exist — skip
        }
      }

      return { moved: movedTotal };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[imap] moveSpamToInbox failed: ${err.message}`);
      return { moved: 0 };
    } finally {
      await client.logout().catch(() => {/* ignore */});
    }
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private createClient(credentials: ImapCredentials): ImapFlow {
    const tls = credentials.secure ?? true;

    return new ImapFlow({
      host: credentials.host,
      port: credentials.port,
      secure: tls,
      auth: {
        user: credentials.username,
        pass: credentials.password,
      },
      tls: {
        rejectUnauthorized: false, // tolerate self-signed in dev
        minVersion: 'TLSv1.2',
      },
      logger: false, // suppress verbose imapflow logs
    });
  }

  private friendlyError(message: string): string {
    if (message.includes('AUTHENTICATIONFAILED') || message.includes('Invalid credentials')) {
      return 'IMAP kimlik doğrulama başarısız. Gmail için "App Password" gerekebilir.';
    }
    if (message.includes('ECONNREFUSED')) {
      return 'IMAP sunucusuna bağlanılamadı. Host veya port bilgilerini kontrol edin.';
    }
    if (message.includes('timeout')) {
      return 'IMAP bağlantısı zaman aşımına uğradı.';
    }
    return `IMAP hatası: ${message}`;
  }
}
