import { Injectable, Logger } from '@nestjs/common';
import type * as schema from '@autonomous-sales/database';

// ─── Vapi API types ───────────────────────────────────────────────────────────

export interface VapiCallOptions {
  leadId: string;
  campaignId: string;
  projectId: string;
  phoneNumber: string;
  contactName: string;
  companyName: string;
  callScript: schema.CallScript;
  projectAnalysis?: {
    valueProposition?: string;
    productDescription?: string;
    toneOfVoice?: string;
  };
}

export interface VapiCallResult {
  success: boolean;
  callId?: string;
  error?: string;
  scriptOnly?: boolean;
}

export interface VapiCallStatus {
  callId: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended';
  endedReason?: string;
  durationSeconds?: number;
  transcript?: string;
  recordingUrl?: string;
  cost?: number;
}

// ─── MANDATORY phrases that trigger opt-out ──────────────────────────────────
const END_CALL_PHRASES = [
  'not interested',
  'remove me',
  'stop calling',
  'do not call',
  'take me off',
  'take me off your list',
  "don't call me",
  'please stop',
  'no thank you',
];

// ─── Compliance timezone rules ────────────────────────────────────────────────
interface StateRule {
  startHour: number; // local time
  endHour: number;
  maxCallsPerDay: number;
  twoPartyConsent: boolean;
}

const STATE_RULES: Record<string, StateRule> = {
  FL: { startHour: 8, endHour: 20, maxCallsPerDay: 3, twoPartyConsent: false },
  CA: { startHour: 8, endHour: 21, maxCallsPerDay: 3, twoPartyConsent: true },
  TX: { startHour: 8, endHour: 21, maxCallsPerDay: 3, twoPartyConsent: false },
  NY: { startHour: 8, endHour: 21, maxCallsPerDay: 3, twoPartyConsent: false },
};

const DEFAULT_STATE_RULE: StateRule = {
  startHour: 8,
  endHour: 21,
  maxCallsPerDay: 3,
  twoPartyConsent: false,
};

@Injectable()
export class VapiCallService {
  private readonly logger = new Logger(VapiCallService.name);
  private readonly apiKey: string | null;
  private readonly phoneNumberId: string | null;
  private readonly webhookSecret: string | null;
  private readonly vapiAvailable: boolean;

  private readonly VAPI_BASE_URL = 'https://api.vapi.ai';
  private readonly MAX_DURATION_SECONDS = 300; // 5 minutes

  constructor() {
    this.apiKey = process.env.VAPI_API_KEY ?? null;
    this.phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID ?? null;
    this.webhookSecret = process.env.VAPI_WEBHOOK_SECRET ?? null;
    this.vapiAvailable = !!(this.apiKey && this.phoneNumberId);

    if (!this.vapiAvailable) {
      this.logger.warn(
        '[vapi] VAPI_API_KEY or VAPI_PHONE_NUMBER_ID not set — AI calls disabled, script-only mode active',
      );
    }
  }

  isAvailable(): boolean {
    return this.vapiAvailable;
  }

  // ─── Initiate Call ─────────────────────────────────────────────────────────

  async initiateCall(options: VapiCallOptions): Promise<VapiCallResult> {
    if (!this.vapiAvailable) {
      this.logger.log('[vapi] Script-only mode — call not initiated');
      return { success: false, scriptOnly: true, error: 'Vapi not configured — script-only mode' };
    }

    const systemPrompt = this.buildSystemPrompt(options);
    const firstMessage = this.buildFirstMessage(options.contactName, options.companyName);

    const payload = {
      phoneNumberId: this.phoneNumberId,
      customer: {
        number: options.phoneNumber,
        name: options.contactName,
      },
      assistant: {
        firstMessage,
        model: {
          provider: 'groq',
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          systemPrompt,
          temperature: 0.7,
        },
        voice: {
          provider: 'playht',
          voiceId: 'jennifer',
        },
        endCallPhrases: END_CALL_PHRASES,
        maxDurationSeconds: this.MAX_DURATION_SECONDS,
        backgroundSound: 'office',
        backgroundDenoisingEnabled: true,
      },
      metadata: {
        leadId: options.leadId,
        campaignId: options.campaignId,
        projectId: options.projectId,
      },
    };

    try {
      const response = await fetch(`${this.VAPI_BASE_URL}/call/phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Vapi API returned ${response.status}: ${errorBody}`);
      }

      const data = await response.json() as { id: string };
      this.logger.log(`[vapi] Call initiated — callId: ${data.id}, lead: ${options.leadId}`);

      return { success: true, callId: data.id };
    } catch (err) {
      this.logger.error(`[vapi] Call initiation failed: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  // ─── Get Call Status ───────────────────────────────────────────────────────

  async getCallStatus(callId: string): Promise<VapiCallStatus | null> {
    if (!this.vapiAvailable) return null;

    try {
      const response = await fetch(`${this.VAPI_BASE_URL}/call/${callId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (!response.ok) return null;

      const data = await response.json() as VapiCallStatus;
      return data;
    } catch (err) {
      this.logger.error(`[vapi] getCallStatus failed: ${(err as Error).message}`);
      return null;
    }
  }

  // ─── System Prompt Builder ─────────────────────────────────────────────────

  buildSystemPrompt(options: VapiCallOptions): string {
    const script = options.callScript;
    const objections = (script.objectionHandlers as Array<{ objection: string; response: string }>) ?? [];
    const dialogueTree = (script.dialogueTree as Record<string, unknown>) ?? {};

    const objectionText = objections
      .map((o, i) => `${i + 1}. If they say "${o.objection}", respond: "${o.response}"`)
      .join('\n');

    const valueProposition = options.projectAnalysis?.valueProposition ?? '';
    const tone = options.projectAnalysis?.toneOfVoice ?? 'professional';

    return `You are an AI sales assistant making a business development call on behalf of a company.

## MANDATORY DISCLOSURE — ALWAYS FOLLOW:
- You MUST disclose you are an AI at the beginning of every call
- Never deny being an AI if asked directly
- If the person says they're not interested, respect it immediately and end the call politely
- Never be pushy, aggressive, or use high-pressure tactics
- Maximum call duration: 5 minutes

## OPENING SCRIPT:
${script.openingScript ?? 'Hi, this is an AI assistant calling on behalf of our company.'}

## VALUE PROPOSITION:
${valueProposition}

## CONVERSATION STYLE:
- Tone: ${tone}
- Be natural, conversational — not robotic
- Listen actively and respond to what they say
- Keep responses concise (2-3 sentences max per turn)

## DIALOGUE FLOW:
${script.closingScript ? `Closing: ${script.closingScript}` : ''}

## OBJECTION HANDLING:
${objectionText || 'Be empathetic, acknowledge their concern, and pivot to value.'}

## OPT-OUT RULES (NON-NEGOTIABLE):
- If the person uses any phrase indicating they want to stop: "not interested", "remove me", "stop calling", "do not call", "take me off your list" — immediately say: "Of course, I completely understand. I've noted that and you will not receive any more calls from us. Thank you for your time and have a wonderful day!" then end the call.
- Do not try to overcome opt-out objections.

## GOAL:
Schedule a brief discovery meeting or collect contact info for follow-up. Do NOT pressure them into a decision on this call.`;
  }

  // ─── First Message (MANDATORY AI Disclosure) ────────────────────────────────

  buildFirstMessage(contactName: string, companyName: string): string {
    const firstName = contactName.split(' ')[0] ?? contactName;
    return `Hi ${firstName}, this is an AI assistant calling on behalf of ${companyName || 'our team'}. This call is AI-powered — I want to be transparent about that upfront. I'm reaching out to briefly introduce how we might be able to help your business. Is this a good time for just 2 minutes?`;
  }

  // ─── Compliance: Call Time Check ───────────────────────────────────────────

  isCallTimeAllowed(stateCode?: string | null): {
    allowed: boolean;
    reason?: string;
    nextAllowedAt?: Date;
  } {
    const rule = stateCode ? (STATE_RULES[stateCode.toUpperCase()] ?? DEFAULT_STATE_RULE) : DEFAULT_STATE_RULE;

    const now = new Date();
    const currentHour = now.getHours(); // Simplified: uses server time, production should use lead's timezone

    if (currentHour < rule.startHour || currentHour >= rule.endHour) {
      const nextAllowed = new Date(now);
      if (currentHour >= rule.endHour) {
        nextAllowed.setDate(nextAllowed.getDate() + 1);
      }
      nextAllowed.setHours(rule.startHour, 0, 0, 0);

      return {
        allowed: false,
        reason: `Calling hours for ${stateCode ?? 'this state'}: ${rule.startHour}:00 – ${rule.endHour}:00`,
        nextAllowedAt: nextAllowed,
      };
    }

    return { allowed: true };
  }

  getStateRule(stateCode: string): StateRule {
    return STATE_RULES[stateCode.toUpperCase()] ?? DEFAULT_STATE_RULE;
  }

  // ─── Webhook Secret Verification ──────────────────────────────────────────

  verifyWebhookSecret(providedSecret: string): boolean {
    if (!this.webhookSecret) return false;
    return providedSecret === this.webhookSecret;
  }

  // ─── Transcript Opt-out Detection ─────────────────────────────────────────

  detectOptOut(transcript: string): boolean {
    const lower = transcript.toLowerCase();
    return END_CALL_PHRASES.some((phrase) => lower.includes(phrase));
  }
}