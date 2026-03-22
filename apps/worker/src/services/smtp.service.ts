import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter, TransportOptions } from 'nodemailer';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SmtpCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  secure?: boolean; // true = SSL/TLS (port 465), false = STARTTLS (port 587)
}

export interface SmtpTestResult {
  success: boolean;
  error?: string;
  latencyMs?: number;
}

export interface SendEmailOptions {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

// ─── SMTP Provider defaults ───────────────────────────────────────────────────

export const SMTP_DEFAULTS = {
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
  },
  outlook: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
  },
} as const;

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class SmtpService {
  private readonly logger = new Logger(SmtpService.name);

  /**
   * Test SMTP connection by verifying credentials.
   * Opens a transporter, verifies it, then destroys it.
   */
  async testConnection(credentials: SmtpCredentials): Promise<SmtpTestResult> {
    const start = Date.now();
    let transporter: Transporter | null = null;

    try {
      transporter = this.createTransporter(credentials);

      await Promise.race([
        transporter.verify(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('SMTP connection timeout (10s)')), 10_000),
        ),
      ]);

      this.logger.log(`[smtp] Connection OK — ${credentials.host}:${credentials.port}`);
      return { success: true, latencyMs: Date.now() - start };
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`[smtp] Connection failed — ${credentials.host}: ${err.message}`);
      return { success: false, error: this.friendlyError(err.message) };
    } finally {
      if (transporter) transporter.close();
    }
  }

  /**
   * Send a single email via SMTP.
   * Credentials password is masked in logs.
   */
  async sendEmail(
    credentials: SmtpCredentials,
    options: SendEmailOptions,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let transporter: Transporter | null = null;

    try {
      transporter = this.createTransporter(credentials);

      const info = await transporter.sendMail({
        from: options.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text ?? options.html.replace(/<[^>]*>/g, ''),
        replyTo: options.replyTo,
      });

      this.logger.log(
        `[smtp] Sent OK — to: ${options.to} | messageId: ${info.messageId}`,
      );
      return { success: true, messageId: info.messageId as string };
    } catch (error) {
      const err = error as Error;
      // Never log password — only show host
      this.logger.error(
        `[smtp] Send failed — host: ${credentials.host} | error: ${err.message}`,
      );
      return { success: false, error: this.friendlyError(err.message) };
    } finally {
      if (transporter) transporter.close();
    }
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private createTransporter(credentials: SmtpCredentials): Transporter {
    const secure = credentials.secure ?? (credentials.port === 465);

    return nodemailer.createTransport({
      host: credentials.host,
      port: credentials.port,
      secure,
      auth: {
        user: credentials.username,
        pass: credentials.password,
      },
      tls: {
        // Accept self-signed certs in development but reject invalid in prod
        rejectUnauthorized: process.env.NODE_ENV === 'production',
        minVersion: 'TLSv1.2',
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    } as TransportOptions);
  }

  private friendlyError(message: string): string {
    if (message.includes('535') || message.includes('534') || message.includes('Username and Password')) {
      return 'Kimlik doğrulama başarısız. Gmail kullanıyorsanız "App Password" gereklidir (2FA aktifse normal şifre çalışmaz).';
    }
    if (message.includes('ECONNREFUSED')) {
      return 'SMTP sunucusuna bağlanılamadı. Host veya port bilgilerini kontrol edin.';
    }
    if (message.includes('ETIMEDOUT') || message.includes('timeout')) {
      return 'SMTP bağlantısı zaman aşımına uğradı. Güvenlik duvarı veya port engeliyle karşılaşmış olabilirsiniz.';
    }
    if (message.includes('ENOTFOUND')) {
      return 'SMTP sunucu adresi bulunamadı. Host bilgisini kontrol edin.';
    }
    if (message.includes('certificate')) {
      return 'SSL/TLS sertifika hatası. Port veya güvenlik ayarlarını gözden geçirin.';
    }
    return `SMTP hatası: ${message}`;
  }
}
