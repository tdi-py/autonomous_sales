import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Injectable,
  Inject,
  Module,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { eq, and } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import { createLLMProvider, getModelForAgent } from '@autonomous-sales/shared';

// ─── Vapi Webhook Payload Types ───────────────────────────────────────────────

interface VapiEndOfCallReport {
  type: 'end-of-call-report';
  call: {
    id: string;
    status: string;
    endedReason?: string;
    duration?: number;
    cost?: number;
    metadata?: Record<string, string>;
  };
  transcript?: string;
  summary?: string;
  recordingUrl?: string;
}

interface VapiCallStatusUpdate {
  type: 'call-update';
  call: {
    id: string;
    status: string;
    metadata?: Record<string, string>;
  };
}

type VapiWebhookPayload = VapiEndOfCallReport | VapiCallStatusUpdate | Record<string, unknown>;

// ─── AI Call Analysis Result ─────────────────────────────────────────────────

interface CallAnalysisResult {
  outcome: 'interested' | 'not_interested' | 'callback_requested' | 'meeting_booked' | 'wrong_person';
  sentiment: 'positive' | 'negative' | 'neutral';
  objections_raised: string[];
  meeting_booked: boolean;
  follow_up_needed: boolean;
  lead_quality_score: number;
  summary: string;
}

// ─── Opt-out phrases ──────────────────────────────────────────────────────────
const OPT_OUT_PHRASES = [
  'stop calling',
  'remove me',
  'do not call',
  'take me off',
  'take me off your list',
  "don't call me again",
  'add me to your do not call list',
  'never call me again',
];

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly webhookSecret = process.env.VAPI_WEBHOOK_SECRET;

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
  ) {}

  verifySecret(providedSecret: string | undefined): boolean {
    if (!this.webhookSecret) return true; // No secret configured → allow (dev mode)
    return providedSecret === this.webhookSecret;
  }

  async handleVapiWebhook(payload: VapiWebhookPayload): Promise<{ processed: boolean }> {
    const type = (payload as Record<string, unknown>).type as string;

    switch (type) {
      case 'end-of-call-report':
        await this.handleEndOfCall(payload as VapiEndOfCallReport);
        break;
      case 'call-update':
        await this.handleCallUpdate(payload as VapiCallStatusUpdate);
        break;
      default:
        this.logger.log(`[webhooks-vapi] Unhandled event type: ${type}`);
    }

    return { processed: true };
  }

  // ─── End of Call ────────────────────────────────────────────────────────────

  private async handleEndOfCall(payload: VapiEndOfCallReport): Promise<void> {
    const { call, transcript, summary, recordingUrl } = payload;
    const vapiCallId = call.id;
    const metadata = call.metadata ?? {};
    const leadId = metadata.leadId;
    const campaignId = metadata.campaignId;

    this.logger.log(
      `[webhooks-vapi] End-of-call — vapiCallId: ${vapiCallId}, endedReason: ${call.endedReason}`,
    );

    // Find matching outreach event
    const outreachEvents = await this.db.query.outreachEvents.findMany({
      where: and(
        eq(schema.outreachEvents.leadId, leadId ?? ''),
        eq(schema.outreachEvents.campaignId, campaignId ?? ''),
        eq(schema.outreachEvents.channel, 'call'),
      ),
      orderBy: (t: any, { desc }: any) => [desc(t.sentAt)],
      limit: 1,
    }) as schema.OutreachEvent[];

    const outreachEvent = outreachEvents[0];

    // Determine call status
    let callStatus: schema.OutreachEvent['status'] = 'call_completed';
    const endedReason = call.endedReason?.toLowerCase() ?? '';

    if (endedReason.includes('no-answer') || endedReason.includes('no_answer')) {
      callStatus = 'call_no_answer';
    } else if (endedReason.includes('voicemail')) {
      callStatus = 'call_voicemail';
    } else {
      callStatus = 'call_completed';
    }

    if (outreachEvent) {
      const existingMeta = (outreachEvent.metadata ?? {}) as Record<string, unknown>;

      await this.db
        .update(schema.outreachEvents)
        .set({
          status: callStatus,
          metadata: {
            ...existingMeta,
            vapiCallId,
            endedReason: call.endedReason,
            durationSeconds: call.duration,
            cost: call.cost,
            transcript: transcript?.slice(0, 10000),
            summary,
            recordingUrl,
          },
        })
        .where(eq(schema.outreachEvents.id, outreachEvent.id));
    }

    // ── Opt-out detection ────────────────────────────────────────────────────
    if (transcript && leadId) {
      const hasOptOut = OPT_OUT_PHRASES.some((phrase) =>
        transcript.toLowerCase().includes(phrase),
      );

      if (hasOptOut) {
        await this.handleOptOut(leadId, campaignId ?? '');
      }
    }

    // ── AI Analysis ──────────────────────────────────────────────────────────
    if (transcript && transcript.length > 50 && callStatus === 'call_completed') {
      try {
        const analysis = await this.analyzeCallTranscript(transcript);
        await this.applyCallAnalysis(leadId ?? '', campaignId ?? '', analysis, outreachEvent?.id);
      } catch (err) {
        this.logger.error(`[webhooks-vapi] AI analysis failed: ${(err as Error).message}`);
        // Non-critical — don't throw
      }
    }
  }

  // ─── Call Update ────────────────────────────────────────────────────────────

  private async handleCallUpdate(payload: VapiCallStatusUpdate): Promise<void> {
    this.logger.log(
      `[webhooks-vapi] Call update — callId: ${payload.call.id}, status: ${payload.call.status}`,
    );
    // Could update a real-time dashboard here in future phases
  }

  // ─── Opt-out Handler ────────────────────────────────────────────────────────

  private async handleOptOut(leadId: string, campaignId: string): Promise<void> {
    this.logger.log(`[webhooks-vapi] Opt-out detected — lead: ${leadId}`);

    const lead = await this.db.query.leads.findFirst({
      where: eq(schema.leads.id, leadId),
    }) as schema.Lead | null;

    if (!lead) return;

    // Get campaign to find projectId
    const campaign = await this.db.query.campaigns.findFirst({
      where: eq(schema.campaigns.id, campaignId),
    }) as schema.Campaign | null;

    if (!campaign) return;

    // Add to suppression list (phone-based)
    if (lead.contactPhone) {
      // Add phone to phone verification DNC
      await this.db
        .update(schema.phoneVerification)
        .set({
          isOnDnc: true,
          aiCallClassification: 'cannot_call',
          classificationReason: 'Opt-out detected in call transcript',
        })
        .where(eq(schema.phoneVerification.leadId, leadId));
    }

    // Add email to suppression list if available
    if (lead.contactEmail) {
      try {
        await this.db.insert(schema.suppressionList).values({
          projectId: campaign.projectId,
          email: lead.contactEmail.toLowerCase(),
          reason: 'manual',
        });
      } catch {
        // Ignore duplicate
      }
    }

    // Revoke any AI call consent
    await this.db
      .update(schema.callConsentRecords)
      .set({
        revokedAt: new Date(),
        revocationMethod: 'transcript_opt_out',
        revocationProcessedAt: new Date(),
        isValidForAi: false,
      })
      .where(
        and(
          eq(schema.callConsentRecords.leadId, leadId),
          eq(schema.callConsentRecords.isValidForAi, true),
        ),
      );

    this.logger.log(`[webhooks-vapi] Opt-out processed for lead ${leadId}`);
  }

  // ─── AI Transcript Analysis ─────────────────────────────────────────────────

  private async analyzeCallTranscript(transcript: string): Promise<CallAnalysisResult> {
    const llm = createLLMProvider();
    const model = getModelForAgent('communicator');

    const prompt = `Analyze this B2B sales call transcript and return a JSON assessment.

TRANSCRIPT:
---
${transcript.slice(0, 3000)}
---

Return ONLY valid JSON (no markdown):
{
  "outcome": "interested|not_interested|callback_requested|meeting_booked|wrong_person",
  "sentiment": "positive|negative|neutral",
  "objections_raised": ["string"],
  "meeting_booked": false,
  "follow_up_needed": false,
  "lead_quality_score": 0-100,
  "summary": "1-2 sentence summary of the call"
}`;

    const result = await llm.generateCompletion({
      model,
      prompt,
      temperature: 0.2,
      maxTokens: 500,
    });

    const cleaned = result.content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .trim();

    return JSON.parse(cleaned) as CallAnalysisResult;
  }

  // ─── Apply Analysis Results ─────────────────────────────────────────────────

  private async applyCallAnalysis(
    leadId: string,
    campaignId: string,
    analysis: CallAnalysisResult,
    outreachEventId?: string,
  ): Promise<void> {
    // Update outreach event with AI analysis
    if (outreachEventId) {
      const event = await this.db.query.outreachEvents.findFirst({
        where: eq(schema.outreachEvents.id, outreachEventId),
      }) as schema.OutreachEvent | null;

      if (event) {
        await this.db
          .update(schema.outreachEvents)
          .set({
            metadata: {
              ...(event.metadata as Record<string, unknown>),
              aiAnalysis: analysis,
            },
          })
          .where(eq(schema.outreachEvents.id, outreachEventId));
      }
    }

    // Update lead status based on outcome
    if (analysis.outcome === 'meeting_booked' || analysis.meeting_booked) {
      await this.db
        .update(schema.leads)
        .set({ status: 'qualified', updatedAt: new Date() })
        .where(eq(schema.leads.id, leadId));

      // Add to deal stages
      const lead = await this.db.query.leads.findFirst({
        where: eq(schema.leads.id, leadId),
      }) as schema.Lead | null;

      if (lead) {
        await this.db.insert(schema.dealStages).values({
          projectId: lead.projectId,
          leadId,
          stage: 'meeting_scheduled',
          notes: `Meeting booked via AI call. ${analysis.summary}`,
        });
      }
    } else if (analysis.outcome === 'interested' || analysis.sentiment === 'positive') {
      await this.db
        .update(schema.leads)
        .set({ status: 'responded', updatedAt: new Date() })
        .where(eq(schema.leads.id, leadId));
    }

    this.logger.log(
      `[webhooks-vapi] Analysis applied — lead: ${leadId}, outcome: ${analysis.outcome}, score: ${analysis.lead_quality_score}`,
    );
  }
}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('vapi')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vapi webhook handler (public, secret verified)' })
  async handleVapiWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers('x-vapi-secret') vapiSecret?: string,
  ) {
    // Secret verification
    if (!this.webhooksService.verifySecret(vapiSecret)) {
      this.logger.warn('[webhooks-vapi] Invalid webhook secret — rejecting');
      return { error: 'Invalid secret' };
    }

    return this.webhooksService.handleVapiWebhook(payload);
  }
}

// ─── Module ───────────────────────────────────────────────────────────────────

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}