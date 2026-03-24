import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../database/database.module';

export interface CampaignMetrics {
  campaignId: string;
  projectId: string;
  email: {
    totalSent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
    unsubscribed: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
    bounceRate: number;
    unsubscribeRate: number;
    byVariant: {
      A: VariantMetrics;
      B: VariantMetrics;
    };
    byStep: Record<number, StepMetrics>;
  };
  call: {
    totalCalls: number;
    completed: number;
    noAnswer: number;
    voicemail: number;
    meetingsBooked: number;
    interested: number;
    notInterested: number;
    avgDuration: number;
    connectionRate: number;
    meetingRate: number;
  };
  inbox: {
    totalReplies: number;
    positive: number;
    negative: number;
    objection: number;
    neutral: number;
    outOfOffice: number;
    unsubscribe: number;
    topObjections: string[];
  };
  deliverability: {
    lastTestScore: number;
    spamRate: number;
    inboxRate: number;
  };
  dailyTrend: DailyTrend[];
}

interface VariantMetrics {
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  openRate: number;
  replyRate: number;
}

interface StepMetrics {
  sent: number;
  opened: number;
  replied: number;
  openRate: number;
  replyRate: number;
}

interface DailyTrend {
  date: string;
  sent: number;
  opened: number;
  replied: number;
}

export interface ObjectionDistribution {
  topObjections: Array<{ text: string; count: number }>;
  total: number;
}

export interface IndustryBenchmark {
  industry: string;
  avgOpenRate: number;
  avgReplyRate: number;
  avgBounceRate: number;
  rules: schema.PlatformLearnedRule[];
}

export interface SendTimeAnalysis {
  bestDayOfWeek: string;
  bestHour: number;
  heatmap: Array<{ day: number; hour: number; count: number; openRate: number }>;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(@Inject(DATABASE_TOKEN) private readonly db: any) {}

  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    const campaign = await this.db.query.campaigns.findFirst({
      where: eq(schema.campaigns.id, campaignId),
    }) as schema.Campaign | null;

    if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);

    const events = await this.db.query.outreachEvents.findMany({
      where: eq(schema.outreachEvents.campaignId, campaignId),
    }) as schema.OutreachEvent[];

    const emailEvents = events.filter((e) => e.channel === 'email');
    const callEvents = events.filter((e) => e.channel === 'call');

    // ── Email metrics ────────────────────────────────────────────────────────
    const sent = emailEvents.filter((e) =>
      ['sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced'].includes(e.status),
    ).length;
    const delivered = emailEvents.filter((e) =>
      ['delivered', 'opened', 'clicked', 'replied'].includes(e.status),
    ).length;
    const opened = emailEvents.filter((e) =>
      ['opened', 'clicked', 'replied'].includes(e.status),
    ).length;
    const clicked = emailEvents.filter((e) =>
      ['clicked', 'replied'].includes(e.status),
    ).length;
    const replied = emailEvents.filter((e) => e.status === 'replied').length;
    const bounced = emailEvents.filter((e) => e.status === 'bounced').length;
    const unsubscribed = emailEvents.filter(
      (e) => !!(e.metadata as Record<string, unknown>)?.unsubscribed_at,
    ).length;

    const pct = (n: number, d: number) => (d > 0 ? n / d : 0);

    // Variant breakdown
    const varA = emailEvents.filter((e) => (e.metadata as Record<string, unknown>)?.variant === 'A');
    const varB = emailEvents.filter((e) => (e.metadata as Record<string, unknown>)?.variant === 'B');

    const variantStats = (events: schema.OutreachEvent[]): VariantMetrics => {
      const s = events.length;
      const o = events.filter((e) => ['opened', 'clicked', 'replied'].includes(e.status)).length;
      const c = events.filter((e) => ['clicked', 'replied'].includes(e.status)).length;
      const r = events.filter((e) => e.status === 'replied').length;
      return { sent: s, opened: o, clicked: c, replied: r, openRate: pct(o, s), replyRate: pct(r, s) };
    };

    // Step breakdown
    const stepOrders = [
      ...new Set(
        emailEvents.map(
          (e) => ((e.metadata as Record<string, unknown>)?.stepOrder as number) ?? 1,
        ),
      ),
    ].sort((a, b) => a - b);

    const byStep: Record<number, StepMetrics> = {};
    for (const step of stepOrders) {
      const se = emailEvents.filter(
        (e) => ((e.metadata as Record<string, unknown>)?.stepOrder) === step,
      );
      const so = se.filter((e) => ['opened', 'clicked', 'replied'].includes(e.status)).length;
      const sr = se.filter((e) => e.status === 'replied').length;
      byStep[step] = {
        sent: se.length,
        opened: so,
        replied: sr,
        openRate: pct(so, se.length),
        replyRate: pct(sr, se.length),
      };
    }

    // ── Call metrics ─────────────────────────────────────────────────────────
    const callCompleted = callEvents.filter((e) => e.status === 'call_completed').length;
    const callNoAnswer = callEvents.filter((e) => e.status === 'call_no_answer').length;
    const callVoicemail = callEvents.filter((e) => e.status === 'call_voicemail').length;

    const aiAnalyses = callEvents
      .map((e) => (e.metadata as Record<string, unknown>)?.aiAnalysis as Record<string, unknown> | undefined)
      .filter(Boolean);

    const meetingsBooked = aiAnalyses.filter((a) => a?.meeting_booked === true).length;
    const interested = aiAnalyses.filter(
      (a) => a?.outcome === 'interested' || a?.outcome === 'meeting_booked',
    ).length;
    const notInterested = aiAnalyses.filter((a) => a?.outcome === 'not_interested').length;

    const durations = callEvents
      .map((e) => (e.metadata as Record<string, unknown>)?.durationSeconds as number ?? 0)
      .filter((d) => d > 0);
    const avgDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    // ── Inbox metrics ─────────────────────────────────────────────────────────
    const messages = await this.db.query.inboxMessages.findMany({
      where: eq(schema.inboxMessages.projectId, campaign.projectId),
    }) as schema.InboxMessage[];

    const inboxMetrics = {
      totalReplies: messages.length,
      positive: messages.filter((m) => m.sentiment === 'positive').length,
      negative: messages.filter((m) => m.sentiment === 'negative').length,
      objection: messages.filter((m) => m.sentiment === 'objection').length,
      neutral: messages.filter((m) => m.sentiment === 'neutral').length,
      outOfOffice: messages.filter((m) => m.sentiment === 'out_of_office').length,
      unsubscribe: messages.filter((m) => m.sentiment === 'unsubscribe').length,
      topObjections: [] as string[],
    };

    // ── Deliverability ────────────────────────────────────────────────────────
    const emailAccounts = await this.db.query.emailAccounts.findMany({
      where: eq(schema.emailAccounts.projectId, campaign.projectId),
    }) as schema.EmailAccount[];

    let lastTestScore = 0;
    if (emailAccounts.length > 0) {
      const lastTest = await this.db.query.deliverabilityTests.findFirst({
        where: eq(schema.deliverabilityTests.emailAccountId, emailAccounts[0].id),
        orderBy: (t: any, { desc }: any) => [desc(t.testedAt)],
      }) as schema.DeliverabilityTest | null;
      lastTestScore = lastTest?.overallScore ?? 0;
    }

    // ── Daily trend (last 30 days) ────────────────────────────────────────────
    const dailyTrend = this.computeDailyTrend(emailEvents, 30);

    return {
      campaignId,
      projectId: campaign.projectId,
      email: {
        totalSent: sent,
        delivered,
        opened,
        clicked,
        replied,
        bounced,
        unsubscribed,
        openRate: pct(opened, sent),
        clickRate: pct(clicked, sent),
        replyRate: pct(replied, sent),
        bounceRate: pct(bounced, sent),
        unsubscribeRate: pct(unsubscribed, sent),
        byVariant: { A: variantStats(varA), B: variantStats(varB) },
        byStep,
      },
      call: {
        totalCalls: callEvents.length,
        completed: callCompleted,
        noAnswer: callNoAnswer,
        voicemail: callVoicemail,
        meetingsBooked,
        interested,
        notInterested,
        avgDuration,
        connectionRate: pct(callCompleted, callEvents.length),
        meetingRate: pct(meetingsBooked, callCompleted),
      },
      inbox: inboxMetrics,
      deliverability: {
        lastTestScore,
        spamRate: 0,
        inboxRate: lastTestScore / 100,
      },
      dailyTrend,
    };
  }

  async getVariantComparison(campaignId: string) {
    const metrics = await this.getCampaignMetrics(campaignId);
    const { A, B } = metrics.email.byVariant;

    return {
      campaignId,
      winner: A.openRate > B.openRate ? 'A' : B.openRate > A.openRate ? 'B' : 'tie',
      confidence: this.calculateConfidence(A, B),
      A,
      B,
      recommendation:
        Math.abs(A.openRate - B.openRate) > 0.05
          ? `Variant ${A.openRate > B.openRate ? 'A' : 'B'} is performing significantly better`
          : 'Not enough difference to declare a winner yet',
    };
  }

  async getStepFunnel(campaignId: string) {
    const metrics = await this.getCampaignMetrics(campaignId);
    const steps = Object.entries(metrics.email.byStep)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([step, data]) => ({
        step: Number(step),
        ...data,
        dropOffRate: 0,
      }));

    // Calculate drop-off between steps
    for (let i = 1; i < steps.length; i++) {
      const prev = steps[i - 1];
      const curr = steps[i];
      steps[i].dropOffRate = prev.sent > 0 ? 1 - curr.sent / prev.sent : 0;
    }

    return { campaignId, steps };
  }

  async getDailyTrend(campaignId: string, days: number): Promise<DailyTrend[]> {
    const events = await this.db.query.outreachEvents.findMany({
      where: and(
        eq(schema.outreachEvents.campaignId, campaignId),
        eq(schema.outreachEvents.channel, 'email'),
      ),
    }) as schema.OutreachEvent[];

    return this.computeDailyTrend(events, days);
  }

  async getObjectionDistribution(projectId: string): Promise<ObjectionDistribution> {
    const messages = await this.db.query.inboxMessages.findMany({
      where: and(
        eq(schema.inboxMessages.projectId, projectId),
        eq(schema.inboxMessages.sentiment, 'objection'),
      ),
    }) as schema.InboxMessage[];

    const objectionCounts: Record<string, number> = {};
    for (const msg of messages) {
      const text = (msg.aiSummary ?? msg.subject ?? '').toLowerCase().trim();
      if (text) {
        objectionCounts[text] = (objectionCounts[text] ?? 0) + 1;
      }
    }

    const topObjections = Object.entries(objectionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([text, count]) => ({ text, count }));

    return { topObjections, total: messages.length };
  }

  async getIndustryBenchmark(industry: string): Promise<IndustryBenchmark> {
    const rules = await this.db.query.platformLearnedRules.findMany({
      where: and(
        eq(schema.platformLearnedRules.industry, industry),
        eq(schema.platformLearnedRules.isActive, true),
      ),
    }) as schema.PlatformLearnedRule[];

    return {
      industry,
      avgOpenRate: 0.22,
      avgReplyRate: 0.05,
      avgBounceRate: 0.02,
      rules,
    };
  }

  async getBestSendTimes(projectId: string): Promise<SendTimeAnalysis> {
    const events = await this.db.query.outreachEvents.findMany({
      where: and(
        eq(schema.outreachEvents.campaignId, projectId), // approximation
        eq(schema.outreachEvents.channel, 'email'),
      ),
    }) as schema.OutreachEvent[];

    const heatmap: Array<{ day: number; hour: number; count: number; openRate: number }> = [];

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const eventsAtTime = events.filter((e) => {
          const d = new Date(e.sentAt);
          return d.getDay() === day && d.getHours() === hour;
        });

        if (eventsAtTime.length > 0) {
          const openedCount = eventsAtTime.filter((e) =>
            ['opened', 'clicked', 'replied'].includes(e.status),
          ).length;
          heatmap.push({
            day,
            hour,
            count: eventsAtTime.length,
            openRate: openedCount / eventsAtTime.length,
          });
        }
      }
    }

    const best = heatmap.sort((a, b) => b.openRate - a.openRate)[0];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      bestDayOfWeek: best ? days[best.day] : 'Tuesday',
      bestHour: best?.hour ?? 10,
      heatmap,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private computeDailyTrend(events: schema.OutreachEvent[], days: number): DailyTrend[] {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recent = events.filter((e) => new Date(e.sentAt) >= cutoff);

    const byDate: Record<string, { sent: number; opened: number; replied: number }> = {};
    for (const event of recent) {
      const date = new Date(event.sentAt).toISOString().split('T')[0];
      if (!byDate[date]) byDate[date] = { sent: 0, opened: 0, replied: 0 };
      byDate[date].sent++;
      if (['opened', 'clicked', 'replied'].includes(event.status)) byDate[date].opened++;
      if (event.status === 'replied') byDate[date].replied++;
    }

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));
  }

  private calculateConfidence(A: VariantMetrics, B: VariantMetrics): number {
    const totalA = A.sent;
    const totalB = B.sent;
    if (totalA < 20 || totalB < 20) return 0;

    const diff = Math.abs(A.openRate - B.openRate);
    const avgRate = (A.openRate + B.openRate) / 2;
    const stdErr = Math.sqrt((avgRate * (1 - avgRate)) * (1 / totalA + 1 / totalB));
    if (stdErr === 0) return 0;

    const z = diff / stdErr;
    // Approximate confidence from z-score
    if (z > 2.58) return 0.99;
    if (z > 1.96) return 0.95;
    if (z > 1.64) return 0.90;
    if (z > 1.28) return 0.80;
    return Math.min(0.75, z / 2);
  }
}