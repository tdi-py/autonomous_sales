import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { eq, and, isNull, ne } from 'drizzle-orm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

import * as schema from '@autonomous-sales/database';
import { QUEUE_NAMES, type SendOutreachJobPayload } from '@autonomous-sales/shared';
import { DATABASE_TOKEN, logExecution } from '../database/database.module';
import { EmailSenderService } from '../services/email-sender.service';
import { BounceHandlerService } from '../services/bounce-handler.service';

@Processor(QUEUE_NAMES.SEND_OUTREACH)
export class SendOutreachProcessor {
  private readonly logger = new Logger(SendOutreachProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    @InjectQueue(QUEUE_NAMES.SEND_OUTREACH) private readonly sendQueue: Queue,
    private readonly emailSenderService: EmailSenderService,
    private readonly bounceHandlerService: BounceHandlerService,
  ) {}

  // ─── Campaign Batch Job ───────────────────────────────────────────────────

  @Process('campaign-batch')
  async handleCampaignBatch(job: Job<{ campaignId: string; projectId: string }>) {
    const { campaignId, projectId } = job.data;
    this.logger.log(`[send-outreach] Campaign batch — campaign: ${campaignId}`);

    // 1. Check campaign still active
    const campaign = await this.db.query.campaigns.findFirst({
      where: eq(schema.campaigns.id, campaignId),
    }) as schema.Campaign | null;

    if (!campaign || campaign.status !== 'active') {
      this.logger.log(`[send-outreach] Campaign ${campaignId} is not active (${campaign?.status}) — skipping`);
      return;
    }

    const settings = (campaign.settings ?? {}) as Record<string, unknown>;
    const leadIds = (settings.leadIds as string[]) ?? [];

    if (leadIds.length === 0) {
      this.logger.log(`[send-outreach] No leads assigned to campaign ${campaignId}`);
      return;
    }

    // 2. Get email account
    const emailAccounts = await this.db.query.emailAccounts.findMany({
      where: eq(schema.emailAccounts.projectId, projectId),
    }) as schema.EmailAccount[];

    const emailAccount = emailAccounts.find((a) => a.warmupStatus === 'ready')
      ?? emailAccounts.find((a) => a.warmupStatus === 'warming')
      ?? emailAccounts[0];

    if (!emailAccount) {
      this.logger.warn(`[send-outreach] No email account found for project ${projectId}`);
      return;
    }

    // 3. Get email sequences
    const sequences = await this.db.query.emailSequences.findMany({
      where: eq(schema.emailSequences.campaignId, campaignId),
      orderBy: (t: any, { asc }: any) => [asc(t.stepOrder), asc(t.variantLabel)],
    }) as schema.EmailSequence[];

    if (sequences.length === 0) {
      this.logger.warn(`[send-outreach] No email sequences for campaign ${campaignId}`);
      return;
    }

    // 4. Process batch of leads (10-20 at a time)
    const BATCH_SIZE = 10;
    let processed = 0;

    for (const leadId of leadIds.slice(0, BATCH_SIZE)) {
      try {
        await this.processLead({
          leadId,
          campaignId,
          projectId,
          sequences,
          emailAccount,
          campaign,
        });
        processed++;

        // Delay between leads: 30-90 seconds
        if (processed < leadIds.length) {
          await this.emailSenderService.randomDelay(30, 90);
        }
      } catch (err) {
        this.logger.error(`[send-outreach] Lead ${leadId} failed: ${(err as Error).message}`);
      }
    }

    this.logger.log(`[send-outreach] Batch done — processed: ${processed}`);
  }

  // ─── Single Lead Processing (9-step pipeline) ─────────────────────────────

  private async processLead(params: {
    leadId: string;
    campaignId: string;
    projectId: string;
    sequences: schema.EmailSequence[];
    emailAccount: schema.EmailAccount;
    campaign: schema.Campaign;
  }) {
    const { leadId, campaignId, projectId, sequences, emailAccount, campaign } = params;

    // ── Step 1: Load lead ─────────────────────────────────────────────────
    const lead = await this.db.query.leads.findFirst({
      where: eq(schema.leads.id, leadId),
    }) as schema.Lead | null;

    if (!lead || !lead.contactEmail) {
      this.logger.warn(`[send-outreach] Lead ${leadId} not found or no email`);
      return;
    }

    // ── Step 2: Suppression list check ────────────────────────────────────
    const suppressed = await this.bounceHandlerService.isSuppressed(projectId, lead.contactEmail);
    if (suppressed) {
      this.logger.log(`[send-outreach] Lead ${leadId} is suppressed — skipping`);
      return;
    }

    // ── Step 3: Determine which step to send ──────────────────────────────
    const previousEvents = await this.db.query.outreachEvents.findMany({
      where: and(
        eq(schema.outreachEvents.leadId, leadId),
        eq(schema.outreachEvents.campaignId, campaignId),
      ),
      orderBy: (t: any, { asc }: any) => [asc(t.sentAt)],
    }) as schema.OutreachEvent[];

    // Check if lead already replied — stop sequence
    const hasReplied = previousEvents.some((e) => e.status === 'replied');
    if (hasReplied) {
      this.logger.log(`[send-outreach] Lead ${leadId} already replied — stopping sequence`);
      return;
    }

    // Determine next step
    const sentSteps = new Set<number>();
    for (const event of previousEvents) {
      const meta = (event.metadata ?? {}) as Record<string, unknown>;
      if (typeof meta.stepOrder === 'number') {
        sentSteps.add(meta.stepOrder);
      }
    }

    // Get unique step orders from sequences
    const allStepOrders = [...new Set(sequences.map((s) => s.stepOrder))].sort((a, b) => a - b);

    let nextStepOrder: number | null = null;
    for (const stepOrder of allStepOrders) {
      if (!sentSteps.has(stepOrder)) {
        // Check delay: is it time to send?
        const stepSeq = sequences.find((s) => s.stepOrder === stepOrder);
        const delayDays = stepSeq?.delayDays ?? 0;

        if (delayDays === 0) {
          nextStepOrder = stepOrder;
          break;
        }

        // Find last sent step
        const lastEvent = previousEvents[previousEvents.length - 1];
        if (lastEvent) {
          const daysSinceLastSend = (Date.now() - new Date(lastEvent.sentAt).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLastSend >= delayDays) {
            nextStepOrder = stepOrder;
            break;
          } else {
            this.logger.log(
              `[send-outreach] Lead ${leadId} step ${stepOrder} not ready — ${(delayDays - daysSinceLastSend).toFixed(1)} days remaining`,
            );
          }
        }
      }
    }

    if (nextStepOrder === null) {
      this.logger.log(`[send-outreach] Lead ${leadId} — no pending steps`);
      return;
    }

    // ── Step 4: Daily limit check ──────────────────────────────────────────
    const dailyCheck = await this.emailSenderService.checkDailyLimit(emailAccount.id);
    if (!dailyCheck.allowed) {
      this.logger.log(`[send-outreach] Daily limit reached for account ${emailAccount.id}`);
      return;
    }

    // ── Step 5: Select A/B variant ─────────────────────────────────────────
    const variant = this.emailSenderService.selectVariant(leadId);
    const sequence = sequences.find(
      (s) => s.stepOrder === nextStepOrder && s.variantLabel === variant,
    ) ?? sequences.find((s) => s.stepOrder === nextStepOrder && s.variantLabel === 'A')
      ?? sequences.find((s) => s.stepOrder === nextStepOrder);

    if (!sequence) {
      this.logger.warn(`[send-outreach] No sequence found for step ${nextStepOrder}`);
      return;
    }

    // ── Step 6: Create outreach event (pre-send) ───────────────────────────
    const [outreachEvent] = await this.db
      .insert(schema.outreachEvents)
      .values({
        leadId,
        campaignId,
        channel: 'email',
        sequenceStepId: sequence.id,
        status: 'sent',
        sentAt: new Date(),
        metadata: {
          stepOrder: nextStepOrder,
          variant,
          emailAccountId: emailAccount.id,
          subject: sequence.subjectTemplate.slice(0, 100),
        },
      })
      .returning() as schema.OutreachEvent[];

    // ── Step 7: Send email ────────────────────────────────────────────────
    const campaignSettings = (campaign.settings ?? {}) as Record<string, unknown>;
    const result = await this.emailSenderService.sendOutreachEmail({
      lead,
      emailSequence: sequence,
      emailAccount,
      outreachEventId: outreachEvent.id,
      campaignSettings,
    });

    // ── Step 8: Handle result ─────────────────────────────────────────────
    if (result.success) {
      this.logger.log(
        `[send-outreach] ✅ Sent to ${lead.contactEmail} — step ${nextStepOrder} variant ${variant}`,
      );

      // Update lead status to 'contacted'
      if (lead.status === 'new') {
        await this.db
          .update(schema.leads)
          .set({ status: 'contacted', updatedAt: new Date() })
          .where(eq(schema.leads.id, leadId));
      }

      // Check bounce rate after send
      await this.bounceHandlerService.checkBounceRate(campaignId);
    } else {
      this.logger.warn(`[send-outreach] ❌ Send failed for ${lead.contactEmail}: ${result.error}`);

      // Handle bounce
      if (result.bounceType) {
        await this.bounceHandlerService.handleBounce(
          outreachEvent.id,
          result.bounceType,
          result.error ?? '',
        );
      } else {
        // Mark as failed
        await this.db
          .update(schema.outreachEvents)
          .set({
            status: 'failed',
            metadata: {
              ...((outreachEvent.metadata ?? {}) as Record<string, unknown>),
              error: result.error,
              failedAt: new Date().toISOString(),
            },
          })
          .where(eq(schema.outreachEvents.id, outreachEvent.id));
      }
    }
  }

  // ─── Default Process Handler (single lead job) ────────────────────────────

  @Process()
  async handle(job: Job<SendOutreachJobPayload>) {
    const startTime = Date.now();
    const { projectId, leadId, campaignId, sequenceStepId, emailAccountId } = job.data;

    this.logger.log(`[send-outreach] Single job ${job.id} — lead: ${leadId}`);

    try {
      const [lead, emailAccount, sequence, campaign] = await Promise.all([
        this.db.query.leads.findFirst({ where: eq(schema.leads.id, leadId) }),
        this.db.query.emailAccounts.findFirst({ where: eq(schema.emailAccounts.id, emailAccountId) }),
        this.db.query.emailSequences.findFirst({ where: eq(schema.emailSequences.id, sequenceStepId) }),
        this.db.query.campaigns.findFirst({ where: eq(schema.campaigns.id, campaignId) }),
      ]) as [schema.Lead | null, schema.EmailAccount | null, schema.EmailSequence | null, schema.Campaign | null];

      if (!lead || !emailAccount || !sequence || !campaign) {
        throw new Error('Missing required entities for send');
      }

      const sequences = await this.db.query.emailSequences.findMany({
        where: eq(schema.emailSequences.campaignId, campaignId),
      }) as schema.EmailSequence[];

      await this.processLead({
        leadId,
        campaignId,
        projectId,
        sequences,
        emailAccount,
        campaign,
      });

      await logExecution({
        db: this.db,
        projectId,
        agentType: 'communicator',
        trigger: QUEUE_NAMES.SEND_OUTREACH,
        inputPayload: job.data,
        outputPayload: { leadId, campaignId, status: 'processed' },
        status: 'success',
        durationMs: Date.now() - startTime,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[send-outreach] Job ${job.id} failed: ${err.message}`);

      await logExecution({
        db: this.db,
        projectId,
        agentType: 'communicator',
        trigger: QUEUE_NAMES.SEND_OUTREACH,
        inputPayload: job.data,
        status: 'error',
        errorMessage: err.message,
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }
}