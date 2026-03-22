import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns/promises';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DnsCheckResult {
  domain: string;
  spfValid: boolean;
  spfRecord?: string;
  spfMessage: string;
  dkimValid: boolean;
  dkimSelector?: string;
  dkimMessage: string;
  dmarcValid: boolean;
  dmarcRecord?: string;
  dmarcPolicy?: string;
  dmarcMessage: string;
  healthScore: number; // 0-100
  overallStatus: 'excellent' | 'good' | 'warning' | 'critical';
  recommendations: string[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class DnsCheckerService {
  private readonly logger = new Logger(DnsCheckerService.name);

  // Common DKIM selectors to check
  private readonly DKIM_SELECTORS = [
    'google',
    'default',
    'selector1',
    'selector2',
    'mail',
    'dkim',
    'email',
    'k1',
    'smtp',
    'mimecast',
    'pm',
  ];

  /**
   * Run full DNS check (SPF + DKIM + DMARC) for the given email domain.
   */
  async checkDomain(emailAddress: string): Promise<DnsCheckResult> {
    const domain = emailAddress.split('@')[1];
    if (!domain) {
      return this.buildResult(domain ?? emailAddress, false, false, false);
    }

    this.logger.log(`[dns] Starting check for domain: ${domain}`);

    const [spfCheck, dkimCheck, dmarcCheck] = await Promise.all([
      this.checkSpf(domain),
      this.checkDkim(domain),
      this.checkDmarc(domain),
    ]);

    return this.buildResult(domain, spfCheck, dkimCheck, dmarcCheck);
  }

  // ─── SPF ──────────────────────────────────────────────────────────────────

  private async checkSpf(domain: string): Promise<{
    valid: boolean;
    record?: string;
    message: string;
  }> {
    try {
      const records = await this.resolveTxt(domain);
      const spfRecord = records.find((r) => r.includes('v=spf1'));

      if (!spfRecord) {
        return {
          valid: false,
          message: `SPF kaydı bulunamadı. DNS yöneticinize şu TXT kaydını ekleyin:\n\`v=spf1 include:_spf.google.com ~all\``,
        };
      }

      // Basic SPF validation — has authorization block
      const hasAuthMechanism =
        spfRecord.includes('include:') ||
        spfRecord.includes('ip4:') ||
        spfRecord.includes('ip6:') ||
        spfRecord.includes('a:') ||
        spfRecord.includes('mx');

      if (!hasAuthMechanism) {
        return {
          valid: false,
          record: spfRecord,
          message: 'SPF kaydı var ancak geçerli bir yetkilendirme mekanizması içermiyor. Kaydınızı gözden geçirin.',
        };
      }

      return {
        valid: true,
        record: spfRecord,
        message: 'SPF kaydı geçerli ✅',
      };
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENODATA' || err.code === 'ENOTFOUND') {
        return {
          valid: false,
          message: `SPF kaydı bulunamadı. DNS'e şu TXT kaydını ekleyin:\n\`v=spf1 include:_spf.google.com ~all\``,
        };
      }
      this.logger.warn(`[dns] SPF check failed for ${domain}: ${err.message}`);
      return { valid: false, message: 'SPF kontrolü yapılamadı — DNS sorgusu başarısız.' };
    }
  }

  // ─── DKIM ────────────────────────────────────────────────────────────────

  private async checkDkim(domain: string): Promise<{
    valid: boolean;
    selector?: string;
    message: string;
  }> {
    for (const selector of this.DKIM_SELECTORS) {
      try {
        const dkimDomain = `${selector}._domainkey.${domain}`;
        const records = await this.resolveTxt(dkimDomain);
        const dkimRecord = records.find(
          (r) => r.includes('v=DKIM1') || r.includes('k=rsa') || r.includes('p='),
        );

        if (dkimRecord) {
          this.logger.log(`[dns] DKIM found — selector: ${selector}._domainkey.${domain}`);
          return {
            valid: true,
            selector: `${selector}._domainkey`,
            message: `DKIM kaydı bulundu (selector: ${selector}) ✅`,
          };
        }
      } catch {
        // Selector not found — try next
      }
    }

    return {
      valid: false,
      message:
        'DKIM kaydı bulunamadı. Email provider\'ınızın DKIM kurulum rehberini takip edin. ' +
        'Gmail için: Google Admin > Apps > Gmail > Authenticate email > Generate new record.',
    };
  }

  // ─── DMARC ───────────────────────────────────────────────────────────────

  private async checkDmarc(domain: string): Promise<{
    valid: boolean;
    record?: string;
    policy?: string;
    message: string;
  }> {
    try {
      const dmarcDomain = `_dmarc.${domain}`;
      const records = await this.resolveTxt(dmarcDomain);
      const dmarcRecord = records.find((r) => r.includes('v=DMARC1'));

      if (!dmarcRecord) {
        return {
          valid: false,
          message:
            `DMARC kaydı bulunamadı. DNS'e şu TXT kaydını ekleyin:\n` +
            `Hostname: \`_dmarc.${domain}\`\n` +
            `Değer: \`v=DMARC1; p=none; rua=mailto:dmarc@${domain}\``,
        };
      }

      // Extract policy
      const policyMatch = dmarcRecord.match(/p=(\w+)/);
      const policy = policyMatch ? policyMatch[1] : 'unknown';

      let message = `DMARC kaydı geçerli (policy: ${policy}) ✅`;
      if (policy === 'none') {
        message += ' — "none" policy izleme modundadır. Güvenlik için "quarantine" veya "reject" öneririz.';
      }

      return { valid: true, record: dmarcRecord, policy, message };
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENODATA' || err.code === 'ENOTFOUND') {
        return {
          valid: false,
          message:
            `DMARC kaydı bulunamadı. DNS'e şu TXT kaydını ekleyin:\n` +
            `Hostname: \`_dmarc.${domain}\`\n` +
            `Değer: \`v=DMARC1; p=none; rua=mailto:dmarc@${domain}\``,
        };
      }
      this.logger.warn(`[dns] DMARC check failed for ${domain}: ${err.message}`);
      return { valid: false, message: 'DMARC kontrolü yapılamadı — DNS sorgusu başarısız.' };
    }
  }

  // ─── Result Builder ──────────────────────────────────────────────────────

  private buildResult(
    domain: string,
    spfResult: { valid: boolean; record?: string; message: string } | boolean,
    dkimResult: { valid: boolean; selector?: string; message: string } | boolean,
    dmarcResult: { valid: boolean; record?: string; policy?: string; message: string } | boolean,
  ): DnsCheckResult {
    // Handle boolean shorthand
    const spf = typeof spfResult === 'boolean'
      ? { valid: spfResult, message: spfResult ? 'SPF geçerli ✅' : 'SPF geçersiz ❌' }
      : spfResult;
    const dkim = typeof dkimResult === 'boolean'
      ? { valid: dkimResult, message: dkimResult ? 'DKIM geçerli ✅' : 'DKIM geçersiz ❌' }
      : dkimResult;
    const dmarc = typeof dmarcResult === 'boolean'
      ? { valid: dmarcResult, message: dmarcResult ? 'DMARC geçerli ✅' : 'DMARC geçersiz ❌' }
      : dmarcResult;

    // Health score calculation
    let score = 0;
    if (spf.valid) score += 33;
    if (dkim.valid) score += 33;
    if (dmarc.valid) score += 34;

    const overallStatus =
      score === 100 ? 'excellent' :
      score >= 66  ? 'good' :
      score >= 33  ? 'warning' :
      'critical';

    // Recommendations
    const recommendations: string[] = [];
    if (!spf.valid) recommendations.push(`🔴 SPF: ${spf.message}`);
    if (!dkim.valid) recommendations.push(`🔴 DKIM: ${dkim.message}`);
    if (!dmarc.valid) recommendations.push(`🟡 DMARC: ${dmarc.message}`);
    if (score === 100) {
      recommendations.push('🎉 Email yapılandırmanız mükemmel! Tüm DNS kayıtları geçerli.');
    }

    return {
      domain,
      spfValid: spf.valid,
      spfRecord: (spf as any).record,
      spfMessage: spf.message,
      dkimValid: dkim.valid,
      dkimSelector: (dkim as any).selector,
      dkimMessage: dkim.message,
      dmarcValid: dmarc.valid,
      dmarcRecord: (dmarc as any).record,
      dmarcPolicy: (dmarc as any).policy,
      dmarcMessage: dmarc.message,
      healthScore: score,
      overallStatus,
      recommendations,
    };
  }

  // ─── DNS helper ──────────────────────────────────────────────────────────

  private async resolveTxt(domain: string): Promise<string[]> {
    const records = await Promise.race([
      dns.resolveTxt(domain),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DNS query timeout')), 5_000),
      ),
    ]);
    // resolveTxt returns string[][] — flatten each record
    return (records as string[][]).map((chunks) => chunks.join(''));
  }
}
