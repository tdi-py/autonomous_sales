import { Injectable, Logger } from '@nestjs/common';

export type NumberType = 'landline' | 'mobile' | 'voip' | 'unknown';
export type CallClassification = 'can_call_ai' | 'can_call_manual' | 'cannot_call';

export interface PhoneVerificationResult {
  phoneNumber: string;
  numberType: NumberType;
  carrier: string | null;
  countryCode: string | null;
  stateCode: string | null;
  isOnDnc: boolean;
  dncCheckedAt: Date;
  isPubliclyListed: boolean;
  publicSource: string | null;
  publicSourceUrl: string | null;
  aiCallClassification: CallClassification;
  classificationReason: string;
  verifiedAt: Date;
}

// ─── Internal DNC list (seeded — extend as needed) ───────────────────────────
const INTERNAL_DNC_LIST = new Set<string>([
  // Add known do-not-call numbers here
]);

@Injectable()
export class PhoneVerifierService {
  private readonly logger = new Logger(PhoneVerifierService.name);

  /**
   * Full 4-step verification pipeline.
   * Gracefully degrades if external APIs are unavailable.
   */
  async verify(
    phoneNumber: string,
    websiteUrl?: string,
  ): Promise<PhoneVerificationResult> {
    this.logger.log(`[phone-verifier] Verifying: ${this.maskPhone(phoneNumber)}`);

    // Step 1: Number type detection
    const typeResult = await this.detectNumberType(phoneNumber);

    // Step 2: DNC check
    const dncResult = await this.checkDnc(phoneNumber);

    // Step 3: Public listing check
    const publicResult = await this.checkPublicListing(phoneNumber, websiteUrl);

    // Step 4: Classification
    const classification = this.classify({
      numberType: typeResult.numberType,
      isOnDnc: dncResult.isOnDnc,
      isPubliclyListed: publicResult.isPubliclyListed,
    });

    const result: PhoneVerificationResult = {
      phoneNumber,
      numberType: typeResult.numberType,
      carrier: typeResult.carrier,
      countryCode: typeResult.countryCode,
      stateCode: typeResult.stateCode,
      isOnDnc: dncResult.isOnDnc,
      dncCheckedAt: new Date(),
      isPubliclyListed: publicResult.isPubliclyListed,
      publicSource: publicResult.publicSource,
      publicSourceUrl: publicResult.publicSourceUrl,
      aiCallClassification: classification.classification,
      classificationReason: classification.reason,
      verifiedAt: new Date(),
    };

    this.logger.log(
      `[phone-verifier] Result for ${this.maskPhone(phoneNumber)}: ` +
      `type=${result.numberType}, dnc=${result.isOnDnc}, ` +
      `public=${result.isPubliclyListed}, class=${result.aiCallClassification}`,
    );

    return result;
  }

  // ─── Step 1: Number Type Detection ─────────────────────────────────────────

  private async detectNumberType(phoneNumber: string): Promise<{
    numberType: NumberType;
    carrier: string | null;
    countryCode: string | null;
    stateCode: string | null;
  }> {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;

    if (twilioSid && twilioToken) {
      try {
        return await this.twilioLookup(phoneNumber, twilioSid, twilioToken);
      } catch (err) {
        this.logger.warn(
          `[phone-verifier] Twilio lookup failed: ${(err as Error).message} — falling back to unknown`,
        );
      }
    }

    // Fallback: basic heuristics
    return this.heuristicNumberType(phoneNumber);
  }

  private async twilioLookup(
    phoneNumber: string,
    sid: string,
    token: string,
  ): Promise<{
    numberType: NumberType;
    carrier: string | null;
    countryCode: string | null;
    stateCode: string | null;
  }> {
    const encoded = encodeURIComponent(phoneNumber);
    const url = `https://lookups.twilio.com/v1/PhoneNumbers/${encoded}?Type=carrier`;
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');

    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!response.ok) {
      throw new Error(`Twilio returned HTTP ${response.status}`);
    }

    const data = await response.json() as {
      carrier?: { type?: string; name?: string };
      country_code?: string;
      national_format?: string;
    };

    const rawType = data.carrier?.type?.toLowerCase() ?? 'unknown';
    const numberType: NumberType =
      rawType === 'landline' ? 'landline'
      : rawType === 'mobile' ? 'mobile'
      : rawType === 'voip' ? 'voip'
      : 'unknown';

    return {
      numberType,
      carrier: data.carrier?.name ?? null,
      countryCode: data.country_code ?? null,
      stateCode: null, // Twilio basic doesn't return state
    };
  }

  private heuristicNumberType(phoneNumber: string): {
    numberType: NumberType;
    carrier: string | null;
    countryCode: string | null;
    stateCode: string | null;
  } {
    // Very basic: can't determine without lookup API
    const cleaned = phoneNumber.replace(/\D/g, '');
    const countryCode = cleaned.startsWith('1') ? 'US' : null;

    return {
      numberType: 'unknown',
      carrier: null,
      countryCode,
      stateCode: null,
    };
  }

  // ─── Step 2: DNC Registry Check ────────────────────────────────────────────

  private async checkDnc(phoneNumber: string): Promise<{ isOnDnc: boolean }> {
    // Check internal DNC list first
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (INTERNAL_DNC_LIST.has(cleaned) || INTERNAL_DNC_LIST.has(phoneNumber)) {
      return { isOnDnc: true };
    }

    // TODO: Integrate third-party DNC API (Telnyx, Twilio, etc.) in production
    // For now, internal list only
    return { isOnDnc: false };
  }

  /**
   * Add a number to the internal DNC list (e.g. after opt-out detected in call transcript).
   */
  addToDnc(phoneNumber: string): void {
    const cleaned = phoneNumber.replace(/\D/g, '');
    INTERNAL_DNC_LIST.add(cleaned);
    INTERNAL_DNC_LIST.add(phoneNumber);
    this.logger.log(`[phone-verifier] Added to DNC: ${this.maskPhone(phoneNumber)}`);
  }

  // ─── Step 3: Public Listing Check ──────────────────────────────────────────

  private async checkPublicListing(
    phoneNumber: string,
    websiteUrl?: string,
  ): Promise<{
    isPubliclyListed: boolean;
    publicSource: string | null;
    publicSourceUrl: string | null;
  }> {
    if (!websiteUrl) {
      return { isPubliclyListed: false, publicSource: null, publicSourceUrl: null };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(websiteUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SalesBot/1.0)' },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return { isPubliclyListed: false, publicSource: null, publicSourceUrl: null };
      }

      const html = await response.text();
      const normalized = this.normalizePhone(phoneNumber);
      const variations = this.phoneVariations(normalized);

      const found = variations.some((v) => html.includes(v));

      if (found) {
        return {
          isPubliclyListed: true,
          publicSource: 'company_website',
          publicSourceUrl: websiteUrl,
        };
      }

      return { isPubliclyListed: false, publicSource: null, publicSourceUrl: null };
    } catch (err) {
      this.logger.warn(
        `[phone-verifier] Public listing check failed for ${websiteUrl}: ${(err as Error).message}`,
      );
      return { isPubliclyListed: false, publicSource: null, publicSourceUrl: null };
    }
  }

  // ─── Step 4: Classification (Avair Model) ──────────────────────────────────

  classify(params: {
    numberType: NumberType;
    isOnDnc: boolean;
    isPubliclyListed: boolean;
    hasValidAiConsent?: boolean;
  }): { classification: CallClassification; reason: string } {
    const { numberType, isOnDnc, isPubliclyListed, hasValidAiConsent = false } = params;

    // CANNOT_CALL: DNC always blocks
    if (isOnDnc) {
      return {
        classification: 'cannot_call',
        reason: 'Number is on the Do Not Call registry',
      };
    }

    // CAN_CALL_AI: explicit consent
    if (hasValidAiConsent) {
      return {
        classification: 'can_call_ai',
        reason: 'Valid written AI call consent on record',
      };
    }

    // CAN_CALL_AI: landline + publicly listed
    if (numberType === 'landline' && isPubliclyListed) {
      return {
        classification: 'can_call_ai',
        reason: 'Business landline publicly listed — TCPA AI call permitted',
      };
    }

    // CAN_CALL_MANUAL: landline but not publicly listed
    if (numberType === 'landline' && !isPubliclyListed) {
      return {
        classification: 'can_call_manual',
        reason: 'Business landline but not publicly listed — manual call only',
      };
    }

    // CANNOT_CALL: mobile without consent
    if (numberType === 'mobile') {
      return {
        classification: 'cannot_call',
        reason: 'Mobile number — written AI call consent required (TCPA)',
      };
    }

    // VoIP / unknown → manual only (conservative)
    if (numberType === 'voip' || numberType === 'unknown') {
      return {
        classification: 'can_call_manual',
        reason: `Number type is ${numberType} — manual call only until verified`,
      };
    }

    return {
      classification: 'cannot_call',
      reason: 'Unable to determine call eligibility',
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  private phoneVariations(digits: string): string[] {
    const last10 = digits.slice(-10);
    if (last10.length < 10) return [digits];

    const area = last10.slice(0, 3);
    const mid = last10.slice(3, 6);
    const end = last10.slice(6);

    return [
      last10,
      `+1${last10}`,
      `(${area}) ${mid}-${end}`,
      `${area}-${mid}-${end}`,
      `${area}.${mid}.${end}`,
      `${area} ${mid} ${end}`,
      `+1 ${area} ${mid} ${end}`,
    ];
  }

  maskPhone(phone: string): string {
    if (phone.length <= 4) return '****';
    return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
  }
}