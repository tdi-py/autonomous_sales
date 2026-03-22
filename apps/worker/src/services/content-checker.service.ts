import { Injectable } from '@nestjs/common';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Kara liste — bu dosyayı genişletmek için buraya ekle.
 * Faz 5'te Strategist Agent bu listeyi otomatik güncelleyebilir.
 */
export const SPAM_WORD_LIST: string[] = [
  // Klasik spam tetikleyiciler
  'free', 'limited time', 'act now', 'guaranteed', 'click here',
  'buy now', 'urgent', 'winner', 'congratulations', '100%',
  'no cost', 'risk-free', 'risk free', 'no obligation',
  // Para / kazanç
  'earn money', 'make money', 'cash', 'prize', 'reward',
  'million dollars', 'billion dollars',
  // Acele / baskı
  'don\'t delete', 'don\'t miss', 'expires', 'expiring',
  'final notice', 'last chance', 'now only',
  // Medikal / legal gri alan
  'miracle', 'cure', 'doctor approved', 'clinically proven',
  // Phishing benzeri
  'verify your account', 'confirm your email', 'update your billing',
  'your account has been', 'dear friend',
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpamCheckResult {
  passed: boolean;
  spamWords: string[];
  warningMessage?: string;
}

export interface LengthCheckResult {
  subjectOk: boolean;
  bodyOk: boolean;
  subjectLength: number;
  bodyWordCount: number;
  warnings: string[];
}

export interface PlaceholderCheckResult {
  hasFirstName: boolean;
  hasCompanyName: boolean;
  hasUnsubscribeLink: boolean;
  hasPhysicalAddress: boolean;
  warnings: string[];
}

export interface PersonalizationScore {
  score: number; // 0-100
  reasons: string[];
}

// ─── Faz 2.5 yeni tipler ──────────────────────────────────────────────────────

export interface LinkRatioCheckResult {
  linkCount: number;
  wordCount: number;
  ratio: number; // links per 100 words
  passed: boolean;
  warnings: string[];
}

export interface HtmlComplexityCheckResult {
  tagCount: number;
  passed: boolean;
  warnings: string[];
}

export interface SubjectLineCheckResult {
  hasAllCaps: boolean;
  excessiveExclamation: boolean;
  excessiveQuestion: boolean;
  length: number;
  passed: boolean;
  warnings: string[];
}

export interface SenderCheckResult {
  hasSenderName: boolean;
  passed: boolean;
  warnings: string[];
}

export interface ContentQualityReport {
  spam: SpamCheckResult;
  length: LengthCheckResult;
  placeholders: PlaceholderCheckResult;
  personalization: PersonalizationScore;
  // ── Faz 2.5 yeni alanlar ──────────────────────────────────────────────────
  linkRatio: LinkRatioCheckResult;
  htmlComplexity: HtmlComplexityCheckResult;
  subjectLine: SubjectLineCheckResult;
  sender: SenderCheckResult;
  overallWarnings: string[];
  overallScore: number; // 0-100 composite
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ContentCheckerService {
  /**
   * Bir email step'ini kontrol et (subject + body).
   */
  checkEmail(
    subject: string,
    body: string,
    senderName?: string,
  ): ContentQualityReport {
    const spam = this.checkSpamWords(subject + ' ' + body);
    const length = this.checkLength(subject, body);
    const placeholders = this.checkPlaceholders(body);
    const personalization = this.scorePersonalization(subject, body);
    // ── Faz 2.5 yeni kontroller ───────────────────────────────────────────
    const linkRatio = this.checkLinkRatio(body);
    const htmlComplexity = this.checkHtmlComplexity(body);
    const subjectLine = this.checkSubjectLine(subject);
    const sender = this.checkSenderName(senderName);

    const overallWarnings: string[] = [
      ...spam.spamWords.length > 0
        ? [`Spam kelimesi tespit edildi: ${spam.spamWords.join(', ')}`]
        : [],
      ...length.warnings,
      ...placeholders.warnings,
      ...linkRatio.warnings,
      ...htmlComplexity.warnings,
      ...subjectLine.warnings,
      ...sender.warnings,
    ];

    // Composite score
    const scoreFactors = [
      spam.passed ? 25 : 0,
      placeholders.hasUnsubscribeLink && placeholders.hasPhysicalAddress ? 20 : 0,
      linkRatio.passed ? 15 : 5,
      subjectLine.passed ? 20 : 5,
      sender.passed ? 10 : 0,
      htmlComplexity.passed ? 10 : 5,
    ];
    const overallScore = Math.min(100, scoreFactors.reduce((a, b) => a + b, 0));

    return {
      spam,
      length,
      placeholders,
      personalization,
      linkRatio,
      htmlComplexity,
      subjectLine,
      sender,
      overallWarnings,
      overallScore,
    };
  }

  /**
   * Spam kelimelerini tara.
   */
  checkSpamWords(text: string): SpamCheckResult {
    const lower = text.toLowerCase();
    const found = SPAM_WORD_LIST.filter((word) => lower.includes(word.toLowerCase()));

    return {
      passed: found.length === 0,
      spamWords: found,
      warningMessage:
        found.length > 0
          ? `Bu email spam filtresine takılabilir. Şu kelimeleri değiştirmeyi düşün: ${found.join(', ')}`
          : undefined,
    };
  }

  /**
   * Subject + body uzunluk kontrolleri.
   */
  checkLength(subject: string, body: string): LengthCheckResult {
    const subjectLength = subject.length;
    const bodyWordCount = body
      .replace(/<[^>]*>/g, '')
      .split(/\s+/)
      .filter(Boolean).length;

    const warnings: string[] = [];
    if (subjectLength > 60) {
      warnings.push(`Subject çok uzun (${subjectLength} karakter). 60 karakterin altında tutun.`);
    }
    if (bodyWordCount > 300) {
      warnings.push(`Body çok uzun (${bodyWordCount} kelime). 150-200 kelime idealdir.`);
    }
    if (bodyWordCount < 20) {
      warnings.push(`Body çok kısa (${bodyWordCount} kelime). En az 30 kelime önerilir.`);
    }

    return {
      subjectOk: subjectLength <= 60,
      bodyOk: bodyWordCount <= 300,
      subjectLength,
      bodyWordCount,
      warnings,
    };
  }

  /**
   * Zorunlu placeholder kontrolü.
   */
  checkPlaceholders(body: string): PlaceholderCheckResult {
    const hasFirstName = body.includes('{{first_name}}');
    const hasCompanyName = body.includes('{{company_name}}');
    const hasUnsubscribeLink = body.includes('{{unsubscribe_link}}') || body.toLowerCase().includes('unsubscribe');
    const hasPhysicalAddress = body.includes('{{physical_address}}') || this.hasAddressPattern(body);

    const warnings: string[] = [];
    if (!hasFirstName) warnings.push('{{first_name}} placeholder eksik. Kişiselleştirme düşük.');
    if (!hasCompanyName) warnings.push('{{company_name}} placeholder eksik.');
    if (!hasUnsubscribeLink) warnings.push('{{unsubscribe_link}} eksik — CAN-SPAM zorunlu!');
    if (!hasPhysicalAddress) warnings.push('{{physical_address}} eksik — CAN-SPAM zorunlu!');

    return { hasFirstName, hasCompanyName, hasUnsubscribeLink, hasPhysicalAddress, warnings };
  }

  /**
   * Basit kişiselleştirme skoru (0-100).
   */
  scorePersonalization(subject: string, body: string): PersonalizationScore {
    const text = subject + ' ' + body;
    let score = 0;
    const reasons: string[] = [];

    if (text.includes('{{first_name}}')) { score += 20; reasons.push('First name kullanılmış (+20)'); }
    if (text.includes('{{company_name}}')) { score += 20; reasons.push('Company name kullanılmış (+20)'); }
    if (text.includes('{{job_title}}')) { score += 15; reasons.push('Job title kullanılmış (+15)'); }
    if (text.includes('{{industry}}')) { score += 10; reasons.push('Industry kullanılmış (+10)'); }
    if (text.includes('{{pain_point}}') || text.includes('{{challenge}}')) {
      score += 15;
      reasons.push('Pain point placeholder kullanılmış (+15)');
    }

    // Soru işareti (merak uyandırıcı soru)
    if ((text.match(/\?/g) ?? []).length >= 1) { score += 10; reasons.push('Soru içeriyor (+10)'); }

    // Kısa subject bonus
    if (subject.length <= 40) { score += 10; reasons.push('Kısa subject (+10)'); }

    return { score: Math.min(score, 100), reasons };
  }

  // ─── Faz 2.5 Yeni Kontroller ──────────────────────────────────────────────────

  /**
   * Link/metin oranını kontrol et.
   * Çok fazla link → spam riski.
   */
  checkLinkRatio(body: string): LinkRatioCheckResult {
    const linkMatches = body.match(/<a\s[^>]*>/gi) ?? [];
    const linkCount = linkMatches.length;

    const plainText = body.replace(/<[^>]*>/g, '').trim();
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;

    const ratio = wordCount > 0 ? (linkCount / wordCount) * 100 : 0;
    const warnings: string[] = [];
    let passed = true;

    if (linkCount > 5) {
      warnings.push(`Çok fazla link (${linkCount}). 3'ten fazla link spam riskini artırır.`);
      passed = false;
    } else if (ratio > 10) {
      warnings.push(`Link/metin oranı yüksek (%${ratio.toFixed(1)}). Daha az link kullanın.`);
      passed = false;
    }

    return { linkCount, wordCount, ratio, passed, warnings };
  }

  /**
   * HTML karmaşıklığını kontrol et.
   * Çok fazla HTML tag → spam gibi görünür.
   */
  checkHtmlComplexity(body: string): HtmlComplexityCheckResult {
    const tagMatches = body.match(/<[^>]+>/g) ?? [];
    const tagCount = tagMatches.length;
    const warnings: string[] = [];
    let passed = true;

    if (tagCount > 50) {
      warnings.push(`HTML çok karmaşık (${tagCount} tag). Basit, düz metin ağırlıklı email tercih edin.`);
      passed = false;
    } else if (tagCount > 30) {
      warnings.push(`HTML biraz karmaşık (${tagCount} tag). Cold email için daha sade bir format önerilir.`);
    }

    return { tagCount, passed, warnings };
  }

  /**
   * Subject satırını kontrol et.
   * ALL CAPS, aşırı ! veya ? → spam sinyali.
   */
  checkSubjectLine(subject: string): SubjectLineCheckResult {
    const warnings: string[] = [];

    // ALL CAPS kontrolü (tüm harflerin büyük olduğu kelimeler)
    const words = subject.split(/\s+/);
    const capsWords = words.filter((w) => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w));
    const hasAllCaps = capsWords.length >= 2;

    // Aşırı ünlem işareti
    const exclamationCount = (subject.match(/!/g) ?? []).length;
    const excessiveExclamation = exclamationCount >= 2;

    // Aşırı soru işareti
    const questionCount = (subject.match(/\?/g) ?? []).length;
    const excessiveQuestion = questionCount >= 2;

    const passed = !hasAllCaps && !excessiveExclamation;

    if (hasAllCaps) {
      warnings.push(`Subject'te büyük harf kelimeler var (${capsWords.join(', ')}). Spam algısı yaratır.`);
    }
    if (excessiveExclamation) {
      warnings.push(`Subject'te çok fazla ünlem işareti (${exclamationCount} adet). Spam gibi görünür.`);
    }
    if (excessiveQuestion) {
      warnings.push(`Subject'te çok fazla soru işareti (${questionCount} adet). Tek bir soru yeterli.`);
    }

    return {
      hasAllCaps,
      excessiveExclamation,
      excessiveQuestion,
      length: subject.length,
      passed,
      warnings,
    };
  }

  /**
   * Gönderici adını kontrol et — boş olmamalı.
   */
  checkSenderName(senderName?: string): SenderCheckResult {
    const hasSenderName = !!(senderName && senderName.trim().length > 0);
    const warnings: string[] = [];

    if (!hasSenderName) {
      warnings.push('Gönderici adı (sender name) boş. Gerçek bir isim eklemek teslim oranını artırır.');
    }

    return { hasSenderName, passed: hasSenderName, warnings };
  }

  /**
   * Call script'i kontrol et.
   */
  checkCallScript(
    openingScript: string,
    objectionHandlers: Array<{ objection: string; response: string }>,
  ): {
    hasAiDisclosure: boolean;
    objectionCount: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const hasAiDisclosure =
      openingScript.toLowerCase().includes('ai') ||
      openingScript.toLowerCase().includes('automated') ||
      openingScript.toLowerCase().includes('artificial intelligence');

    if (!hasAiDisclosure) {
      warnings.push('AI araması için açılışta AI açıklaması önerilir (bazı eyaletlerde zorunlu).');
    }

    if (objectionHandlers.length < 5) {
      warnings.push(`Sadece ${objectionHandlers.length} itiraz tanımlanmış. En az 5 önerilir.`);
    }

    return { hasAiDisclosure, objectionCount: objectionHandlers.length, warnings };
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private hasAddressPattern(body: string): boolean {
    // Basic check for address-like patterns (street, city, state, zip)
    return /\d{1,5}\s+\w+\s+(st|ave|blvd|rd|dr|ln|way|ct|pl)/i.test(body) ||
      /\b[A-Z]{2}\s+\d{5}\b/.test(body);
  }
}