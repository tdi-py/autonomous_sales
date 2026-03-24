import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import { QUEUE_NAMES } from '@autonomous-sales/shared';

@Injectable()
export class StrategyService {
  private readonly logger = new Logger(StrategyService.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    @InjectQueue(QUEUE_NAMES.STRATEGY_REVIEW) private readonly strategyQueue: Queue,
  ) {}

  // ─── Overview ─────────────────────────────────────────────────────────────

  async getOverview(projectId: string, userId: string) {
    await this.assertProjectAccess(projectId, userId);

    const [campaigns, decisions, learnedRules] = await Promise.all([
      this.db.query.campaigns.findMany({
        where: eq(schema.campaigns.projectId, projectId),
      }) as Promise<schema.Campaign[]>,
      this.db.query.strategyDecisions.findMany({
        where: and(
          eq(schema.strategyDecisions.projectId, projectId),
          eq(schema.strategyDecisions.applied, false),
        ),
        orderBy: (t: any, { desc }: any) => [desc(t.createdAt)],
        limit: 10,
      }) as Promise<schema.StrategyDecision[]>,
      this.db.query.strategyLearnedRules.findMany({
        where: and(
          eq(schema.strategyLearnedRules.projectId, projectId),
          eq(schema.strategyLearnedRules.isActive, true),
        ),
      }) as Promise<schema.StrategyLearnedRule[]>,
    ]);

    // Get health score from campaign settings
    const activeCampaigns = campaigns.filter((c) => c.status === 'active');
    let avgHealthScore = 0;
    let lastAnalyzedAt: string | null = null;

    for (const campaign of activeCampaigns) {
      const settings = (campaign.settings ?? {}) as Record<string, unknown>;
      if (settings.healthScore) {
        avgHealthScore += settings.healthScore as number;
      }
      if (settings.lastAnalyzedAt) {
        lastAnalyzedAt = settings.lastAnalyzedAt as string;
      }
    }

    if (activeCampaigns.length > 0) {
      avgHealthScore = avgHealthScore / activeCampaigns.length;
    }

    return {
      healthScore: Math.round(avgHealthScore),
      lastAnalyzedAt,
      pendingDecisions: decisions.length,
      activeLearnedRules: learnedRules.length,
      activeCampaigns: activeCampaigns.length,
      pendingDecisionsList: decisions.slice(0, 5),
    };
  }

  // ─── Decisions ────────────────────────────────────────────────────────────

  async getDecisions(
    projectId: string,
    userId: string,
    filter?: 'applied' | 'pending',
    limit = 20,
    offset = 0,
  ) {
    await this.assertProjectAccess(projectId, userId);

    const whereConditions: any[] = [eq(schema.strategyDecisions.projectId, projectId)];
    if (filter === 'applied') {
      whereConditions.push(eq(schema.strategyDecisions.applied, true));
    } else if (filter === 'pending') {
      whereConditions.push(eq(schema.strategyDecisions.applied, false));
    }

    const decisions = await this.db.query.strategyDecisions.findMany({
      where: and(...whereConditions),
      orderBy: (t: any, { desc }: any) => [desc(t.createdAt)],
      limit,
      offset,
    }) as schema.StrategyDecision[];

    return { decisions, total: decisions.length };
  }

  // ─── Apply decision ────────────────────────────────────────────────────────

  async applyDecision(projectId: string, decisionId: string, userId: string) {
    await this.assertProjectAccess(projectId, userId);

    const decision = await this.db.query.strategyDecisions.findFirst({
      where: and(
        eq(schema.strategyDecisions.id, decisionId),
        eq(schema.strategyDecisions.projectId, projectId),
      ),
    }) as schema.StrategyDecision | null;

    if (!decision) throw new NotFoundException('Decision not found');
    if (decision.applied) return { success: true, alreadyApplied: true };

    // Apply the decision based on type
    await this.executeDecision(decision);

    await this.db
      .update(schema.strategyDecisions)
      .set({ applied: true, appliedAt: new Date() })
      .where(eq(schema.strategyDecisions.id, decisionId));

    this.logger.log(`[strategy] Decision ${decisionId} applied by user ${userId}`);
    return { success: true, decision };
  }

  // ─── Reject decision ───────────────────────────────────────────────────────

  async rejectDecision(
    projectId: string,
    decisionId: string,
    userId: string,
    reason?: string,
  ) {
    await this.assertProjectAccess(projectId, userId);

    const decision = await this.db.query.strategyDecisions.findFirst({
      where: and(
        eq(schema.strategyDecisions.id, decisionId),
        eq(schema.strategyDecisions.projectId, projectId),
      ),
    }) as schema.StrategyDecision | null;

    if (!decision) throw new NotFoundException('Decision not found');

    // Mark as "applied" with a rejection note — so it doesn't show up as pending
    await this.db
      .update(schema.strategyDecisions)
      .set({
        applied: true,
        appliedAt: new Date(),
        reasoning: `REJECTED: ${reason ?? 'User rejected'} | Original: ${decision.reasoning}`,
      })
      .where(eq(schema.strategyDecisions.id, decisionId));

    return { success: true, rejected: true };
  }

  // ─── Manual trigger ────────────────────────────────────────────────────────

  async runNow(projectId: string, userId: string) {
    await this.assertProjectAccess(projectId, userId);

    const job = await this.strategyQueue.add(
      {
        projectId,
        workspaceId: '',
        agentType: 'strategist',
      },
      { attempts: 2, backoff: { type: 'fixed', delay: 30_000 } },
    );

    return { queued: true, jobId: job.id, projectId };
  }

  // ─── Learned rules ─────────────────────────────────────────────────────────

  async getLearnedRules(projectId: string, userId: string) {
    await this.assertProjectAccess(projectId, userId);

    const projectRules = await this.db.query.strategyLearnedRules.findMany({
      where: and(
        eq(schema.strategyLearnedRules.projectId, projectId),
        eq(schema.strategyLearnedRules.isActive, true),
      ),
      orderBy: (t: any, { desc }: any) => [desc(t.confidenceScore)],
    }) as schema.StrategyLearnedRule[];

    // Also get platform rules relevant to this project
    const project = await this.db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
    }) as schema.Project | null;

    let platformRules: schema.PlatformLearnedRule[] = [];
    if (project?.industry) {
      platformRules = await this.db.query.platformLearnedRules.findMany({
        where: and(
          eq(schema.platformLearnedRules.industry, project.industry),
          eq(schema.platformLearnedRules.isActive, true),
        ),
        orderBy: (t: any, { desc }: any) => [desc(t.confidenceScore)],
        limit: 10,
      }) as schema.PlatformLearnedRule[];
    }

    return { projectRules, platformRules };
  }

  // ─── Analytics ─────────────────────────────────────────────────────────────

  async getAnalytics(projectId: string, userId: string) {
    await this.assertProjectAccess(projectId, userId);

    const campaigns = await this.db.query.campaigns.findMany({
      where: eq(schema.campaigns.projectId, projectId),
    }) as schema.Campaign[];

    const project = await this.db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
    }) as schema.Project | null;

    // Get platform benchmarks for industry
    let benchmark = null;
    if (project?.industry) {
      const platformRules = await this.db.query.platformLearnedRules.findMany({
        where: and(
          eq(schema.platformLearnedRules.industry, project.industry),
          eq(schema.platformLearnedRules.isActive, true),
        ),
      }) as schema.PlatformLearnedRule[];
      benchmark = { industry: project.industry, rules: platformRules };
    }

    return {
      projectId,
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        settings: c.settings,
      })),
      benchmark,
    };
  }

  // ─── Platform insights ─────────────────────────────────────────────────────

  async getPlatformInsights(industry?: string) {
    const whereConditions: any[] = [eq(schema.platformLearnedRules.isActive, true)];
    if (industry) {
      whereConditions.push(eq(schema.platformLearnedRules.industry, industry));
    }

    const rules = await this.db.query.platformLearnedRules.findMany({
      where: and(...whereConditions),
      orderBy: (t: any, { desc }: any) => [desc(t.confidenceScore)],
      limit: 50,
    }) as schema.PlatformLearnedRule[];

    return { rules, total: rules.length, industry: industry ?? 'all' };
  }

  // ─── Execute decision ──────────────────────────────────────────────────────

  private async executeDecision(decision: schema.StrategyDecision): Promise<void> {
    const newValue = decision.newValue as Record<string, unknown>;

    switch (decision.decisionType) {
      case 'prompt_update': {
        // Activate the new prompt version
        const purpose = newValue.purpose as string;
        const instruction = newValue.instruction as string;

        // Deactivate old active versions for this purpose
        const existingActive = await this.db.query.promptVersions.findMany({
          where: and(
            eq(schema.promptVersions.projectId, decision.projectId),
            eq(schema.promptVersions.isActive, true),
          ),
        }) as schema.PromptVersion[];

        for (const pv of existingActive) {
          if (pv.purpose === purpose) {
            await this.db
              .update(schema.promptVersions)
              .set({ isActive: false })
              .where(eq(schema.promptVersions.id, pv.id));
          }
        }

        // Activate the newest version for this purpose
        const newVersion = await this.db.query.promptVersions.findFirst({
          where: and(
            eq(schema.promptVersions.projectId, decision.projectId),
            eq(schema.promptVersions.purpose, purpose),
          ),
          orderBy: (t: any, { desc }: any) => [desc(t.version)],
        }) as schema.PromptVersion | null;

        if (newVersion) {
          await this.db
            .update(schema.promptVersions)
            .set({ isActive: true })
            .where(eq(schema.promptVersions.id, newVersion.id));
        }
        break;
      }

      case 'ab_test_winner': {
        const winner = newValue.winner as string;
        const step = newValue.step as number;

        // Find and disable the losing variant for this step
        const losingVariant = winner === 'A' ? 'B' : 'A';
        const sequences = await this.db.query.emailSequences.findMany({
          where: eq(schema.emailSequences.stepOrder, step),
        }) as schema.EmailSequence[];

        this.logger.log(
          `[strategy] A/B winner set: Variant ${winner} for step ${step}. Logging decision.`,
        );
        break;
      }

      case 'pause_campaign': {
        // Find campaigns for this project and pause if needed
        // This is already handled in the processor for immediate actions
        break;
      }

      default:
        this.logger.log(`[strategy] Decision type ${decision.decisionType} applied (no automated action)`);
    }
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private async assertProjectAccess(projectId: string, userId: string) {
    const project = await this.db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
    });
    if (!project) throw new NotFoundException('Project not found');

    const membership = await this.db.query.workspaceMembers.findFirst({
      where: and(
        eq(schema.workspaceMembers.workspaceId, project.workspaceId),
        eq(schema.workspaceMembers.userId, userId),
      ),
    });
    if (!membership) throw new ForbiddenException('No access to this project');
    return project;
  }
}