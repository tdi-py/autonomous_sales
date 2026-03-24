import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, gte } from 'drizzle-orm';
import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../database/database.module';
import { createLLMProvider, getModelForAgent } from '@autonomous-sales/shared';
import { AnalyticsService } from './analytics.service';

interface StrategyAnalysis {
  overall_assessment: string;
  health_score: number;
  ab_test_decisions: Array<{
    step: number;
    winner: 'A' | 'B' | 'no_winner_yet';
    confidence: number;
    reason: string;
    recommendation: string;
  }>;
  content_recommendations: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    current_issue: string;
    suggested_change: string;
    expected_impact: string;
  }>;
  spam_risk_analysis: {
    risk_level: 'low' | 'medium' | 'high';
    issues: string[];
    suggestions: string[];
  };
  icp_insights: {
    best_performing_segment: string;
    worst_performing_segment: string;
    suggestion: string;
  };
  objection_analysis: {
    top_objections: string[];
    unhandled_objections: string[];
    new_handlers_needed: Array<{ objection: string; suggested_response: string }>;
  };
  prompt_updates: Array<{
    agent: string;
    purpose: string;
    current_instruction: string;
    new_instruction: string;
    reason: string;
  }>;
  campaign_actions: Array<{
    action: string;
    reason: string;
    urgency: 'immediate' | 'next_cycle' | 'monitor';
  }>;
  learned_rules: Array<{
    rule_type: string;
    rule_content: string;
    confidence: number;
    evidence: string;
  }>;
}

@Injectable()
export class StrategistService {
  private readonly logger = new Logger(StrategistService.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    private readonly analyticsService: AnalyticsService,
  ) {}

  // ─── Main entry: analyze one project's active campaigns ───────────────────

  async runStrategyReview(projectId: string, executionId: string): Promise<void> {
    this.logger.log(`[strategist] Starting strategy review for project: ${projectId}`);

    // Phase 6 (validation of previous decisions) — run first
    await this.validatePreviousDecisions(projectId);

    const campaigns = await this.db.query.campaigns.findMany({
      where: and(
        eq(schema.campaigns.projectId, projectId),
        eq(schema.campaigns.status, 'active'),
      ),
    }) as schema.Campaign[];

    if (campaigns.length === 0) {
      this.logger.log(`[strategist] No active campaigns for project ${projectId}`);
      return;
    }

    const project = await this.db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
    }) as schema.Project | null;

    for (const campaign of campaigns) {
      try {
        await this.analyzeCampaign(campaign, project, executionId);
      } catch (err) {
        this.logger.error(
          `[strategist] Campaign ${campaign.id} analysis failed: ${(err as Error).message}`,
        );
      }
    }

    // Phase 5: check for platform-level rules
    await this.checkForPlatformRules();
  }

  // ─── Phase 1+2+3+4: Analyze single campaign ───────────────────────────────

  private async analyzeCampaign(
    campaign: schema.Campaign,
    project: schema.Project | null,
    executionId: string,
  ): Promise<void> {
    const settings = (campaign.settings ?? {}) as Record<string, unknown>;

    // Require minimum sends
    const events = await this.db.query.outreachEvents.findMany({
      where: eq(schema.outreachEvents.campaignId, campaign.id),
    }) as schema.OutreachEvent[];

    if (events.length < 10) {
      this.logger.log(
        `[strategist] Campaign ${campaign.id} has only ${events.length} events — insufficient data`,
      );
      return;
    }

    // Phase 1: Collect data
    this.logger.log(`[strategist] Phase 1: Collecting data for campaign ${campaign.id}`);
    const performanceData = await this.analyticsService.getCampaignMetrics(campaign.id);

    // Get email sequences for context
    const sequences = await this.db.query.emailSequences.findMany({
      where: and(
        eq(schema.emailSequences.campaignId, campaign.id),
        eq(schema.emailSequences.stepOrder, 1),
      ),
    }) as schema.EmailSequence[];

    const step1A = sequences.find((s) => s.variantLabel === 'A');
    const step1B = sequences.find((s) => s.variantLabel === 'B');

    // Get call scripts
    const callScript = await this.db.query.callScripts.findFirst({
      where: eq(schema.callScripts.campaignId, campaign.id),
      orderBy: (t: any, { desc }: any) => [desc(t.version)],
    }) as schema.CallScript | null;

    // Get ICP profile
    const icpProfileId = settings.icpProfileId as string | undefined;
    const icpProfile = icpProfileId
      ? await this.db.query.icpProfiles.findFirst({
          where: eq(schema.icpProfiles.id, icpProfileId),
        })
      : null;

    // Phase 2: AI Analysis
    this.logger.log(`[strategist] Phase 2: Running AI analysis for campaign ${campaign.id}`);
    const analysis = await this.runAiAnalysis(
      performanceData,
      step1A ?? null,
      step1B ?? null,
      callScript,
      icpProfile,
      project,
    );

    // Phase 3: Apply decisions
    this.logger.log(`[strategist] Phase 3: Applying decisions for campaign ${campaign.id}`);
    await this.applyDecisions(campaign, analysis, executionId);

    // Phase 4: Save learned rules
    this.logger.log(`[strategist] Phase 4: Saving learned rules for project ${campaign.projectId}`);
    await this.saveLearnedRules(campaign.projectId, analysis.learned_rules, executionId);

    // Update campaign health score in settings
    await this.db
      .update(schema.campaigns)
      .set({
        settings: {
          ...settings,
          healthScore: analysis.health_score,
          lastAnalyzedAt: new Date().toISOString(),
          lastAssessment: analysis.overall_assessment,
        },
        updatedAt: new Date(),
      })
      .where(eq(schema.campaigns.id, campaign.id));
  }

  // ─── Phase 2: AI analysis ──────────────────────────────────────────────────

  private async runAiAnalysis(
    performanceData: any,
    step1A: schema.EmailSequence | null,
    step1B: schema.EmailSequence | null,
    callScript: schema.CallScript | null,
    icpProfile: any,
    project: schema.Project | null,
  ): Promise<StrategyAnalysis> {
    const llm = createLLMProvider();
    const model = getModelForAgent('strategist');

    const prompt = `Sen deneyimli bir B2B satış stratejisti ve veri analistisin. Aşağıdaki kampanya performans verilerini analiz et ve aksiyonlar öner.

## KAMPANYA PERFORMANS VERİSİ:
${JSON.stringify(performanceData, null, 2)}

## MEVCUT İÇERİK:
- Email Adım 1 Subject (A): "${step1A?.subjectTemplate ?? 'N/A'}"
- Email Adım 1 Subject (B): "${step1B?.subjectTemplate ?? 'N/A'}"
- Email Adım 1 Body (A): "${(step1A?.bodyTemplate ?? '').substring(0, 200)}..."
- Email Adım 1 Body (B): "${(step1B?.bodyTemplate ?? '').substring(0, 200)}..."

## MEVCUT İTİRAZ KARŞILAMA:
${JSON.stringify(callScript?.objectionHandlers ?? [])}

## SEKTÖR: ${project?.industry ?? 'unknown'}
## İŞ TİPİ: ${project?.businessType ?? 'other'}
## HEDEF KİTLE: ${icpProfile?.label ?? 'B2B decision makers'}

## ANALİZ ET VE SADECE JSON DÖNDÜR (markdown veya açıklama YOK):
{
  "overall_assessment": "Kampanyanın genel durumu hakkında 2-3 cümle",
  "health_score": 0-100,
  "ab_test_decisions": [{"step":1,"winner":"A|B|no_winner_yet","confidence":0.0-1.0,"reason":"neden","recommendation":"önerilen aksiyon"}],
  "content_recommendations": [{"type":"subject_line|email_body|call_script|objection_handler|icp_refinement","priority":"high|medium|low","current_issue":"sorun","suggested_change":"değişiklik","expected_impact":"etki"}],
  "spam_risk_analysis": {"risk_level":"low|medium|high","issues":[],"suggestions":[]},
  "icp_insights": {"best_performing_segment":"","worst_performing_segment":"","suggestion":""},
  "objection_analysis": {"top_objections":[],"unhandled_objections":[],"new_handlers_needed":[{"objection":"","suggested_response":""}]},
  "prompt_updates": [{"agent":"communicator","purpose":"cold_email_step1","current_instruction":"","new_instruction":"","reason":""}],
  "campaign_actions": [{"action":"pause_campaign|switch_variant|increase_volume|decrease_volume|change_send_time|refine_icp","reason":"","urgency":"immediate|next_cycle|monitor"}],
  "learned_rules": [{"rule_type":"spam_word_avoid|subject_pattern|icp_insight|objection_pattern|send_time_optimal|tone_preference","rule_content":"","confidence":0.0-1.0,"evidence":""}]
}`;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await llm.generateCompletion({
          model,
          prompt: attempt > 0 ? prompt + '\n\nSADECE JSON döndür.' : prompt,
          temperature: 0.3,
          maxTokens: 3000,
        });

        const cleaned = result.content
          .replace(/<think>[\s\S]*?<\/think>/g, '')
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        return JSON.parse(cleaned) as StrategyAnalysis;
      } catch (err) {
        this.logger.warn(
          `[strategist] AI analysis parse failed attempt ${attempt + 1}: ${(err as Error).message}`,
        );
      }
    }

    // Fallback minimal analysis
    return {
      overall_assessment: 'Analysis could not be completed. Insufficient data or LLM error.',
      health_score: 50,
      ab_test_decisions: [],
      content_recommendations: [],
      spam_risk_analysis: { risk_level: 'low', issues: [], suggestions: [] },
      icp_insights: { best_performing_segment: '', worst_performing_segment: '', suggestion: '' },
      objection_analysis: { top_objections: [], unhandled_objections: [], new_handlers_needed: [] },
      prompt_updates: [],
      campaign_actions: [],
      learned_rules: [],
    };
  }

  // ─── Phase 3: Apply decisions ─────────────────────────────────────────────

  private async applyDecisions(
    campaign: schema.Campaign,
    analysis: StrategyAnalysis,
    executionId: string,
  ): Promise<void> {
    const projectId = campaign.projectId;

    // Check project auto-mode settings — stored in project_analysis.userEdits.strategySettings
    const projectAnalysis = await this.db.query.projectAnalysis.findFirst({
      where: eq(schema.projectAnalysis.projectId, projectId),
    }) as schema.ProjectAnalysis | null;
    const userEdits = (projectAnalysis?.userEdits as Record<string, unknown>) ?? {};
    const strategySettings = (userEdits.strategySettings as Record<string, unknown>) ?? {};

    const autoApplyAbTest = (strategySettings.autoApplyAbTest as boolean) ?? false;
    const autoApplyPromptUpdates = (strategySettings.autoApplyPromptUpdates as boolean) ?? false;
    const autoPauseBounceThreshold = (strategySettings.autoPauseBounceThreshold as number) ?? 10;

    // A/B Test Decisions
    for (const decision of analysis.ab_test_decisions) {
      if (decision.winner !== 'no_winner_yet' && decision.confidence >= 0.7) {
        const applied = autoApplyAbTest;

        await this.saveDecision({
          projectId,
          agentExecutionId: executionId,
          decisionType: 'ab_test_winner',
          reasoning: decision.reason,
          oldValue: { losingVariant: decision.winner === 'A' ? 'B' : 'A' },
          newValue: { winner: decision.winner, step: decision.step, confidence: decision.confidence },
          applied,
        });
      }
    }

    // Prompt Updates
    for (const update of analysis.prompt_updates) {
      // Get current version
      const currentVersion = await this.db.query.promptVersions.findFirst({
        where: and(
          eq(schema.promptVersions.projectId, projectId),
          eq(schema.promptVersions.agentType, update.agent as any),
          eq(schema.promptVersions.purpose, update.purpose),
          eq(schema.promptVersions.isActive, true),
        ),
        orderBy: (t: any, { desc }: any) => [desc(t.version)],
      }) as schema.PromptVersion | null;

      const nextVersion = (currentVersion?.version ?? 0) + 1;
      const applied = autoApplyPromptUpdates;

      // Create new version (inactive until applied)
      await this.db.insert(schema.promptVersions).values({
        projectId,
        agentType: update.agent as any,
        purpose: update.purpose,
        promptText: update.new_instruction,
        version: nextVersion,
        isActive: false,
        createdBy: 'strategist_agent',
      });

      await this.saveDecision({
        projectId,
        agentExecutionId: executionId,
        decisionType: 'prompt_update',
        reasoning: update.reason,
        oldValue: { instruction: update.current_instruction },
        newValue: { instruction: update.new_instruction, purpose: update.purpose },
        applied,
      });
    }

    // New Objection Handlers
    for (const handler of analysis.objection_analysis.new_handlers_needed) {
      await this.saveDecision({
        projectId,
        agentExecutionId: executionId,
        decisionType: 'objection_update',
        reasoning: `Yeni itiraz tespit edildi: "${handler.objection}"`,
        oldValue: null,
        newValue: handler,
        applied: false,
      });
    }

    // Campaign Actions
    for (const action of analysis.campaign_actions) {
      const isImmediate = action.urgency === 'immediate';

      if (isImmediate) {
        if (action.action === 'pause_campaign') {
          await this.pauseCampaign(campaign.id, action.reason);
        }
      }

      // Always save the decision
      // Normalize action string to valid decisionTypeEnum value
      const normalizeActionType = (a: string): schema.StrategyDecision['decisionType'] => {
        const m: Record<string, schema.StrategyDecision['decisionType']> = {
          pause_campaign:   'pause_campaign',
          switch_variant:   'channel_switch',
          increase_volume:  'channel_switch',
          decrease_volume:  'channel_switch',
          change_send_time: 'channel_switch',
          refine_icp:       'icp_refinement',
        };
        return m[a] ?? 'channel_switch';
      };

      await this.saveDecision({
        projectId,
        agentExecutionId: executionId,
        decisionType: normalizeActionType(action.action),
        reasoning: action.reason,
        oldValue: null,
        newValue: { action: action.action, urgency: action.urgency },
        applied: isImmediate,
      });
    }

    // Auto-pause on high bounce rate
    const bounceRate = (await this.analyticsService.getCampaignMetrics(campaign.id)).email.bounceRate;
    if (bounceRate * 100 >= autoPauseBounceThreshold) {
      await this.pauseCampaign(campaign.id, `Auto-paused: bounce rate ${(bounceRate * 100).toFixed(1)}% exceeds threshold`);
      await this.saveDecision({
        projectId,
        agentExecutionId: executionId,
        decisionType: 'pause_campaign',
        reasoning: `Bounce rate threshold exceeded: ${(bounceRate * 100).toFixed(1)}%`,
        oldValue: null,
        newValue: { reason: 'high_bounce_rate', bounceRate },
        applied: true,
      });
    }
  }

  // ─── Phase 4: Save learned rules ──────────────────────────────────────────

  private async saveLearnedRules(
    projectId: string,
    rules: StrategyAnalysis['learned_rules'],
    executionId: string,
  ): Promise<void> {
    for (const rule of rules) {
      const existing = await this.findSimilarRule(projectId, rule.rule_type, rule.rule_content);

      if (existing) {
        await this.db
          .update(schema.strategyLearnedRules)
          .set({
            confidenceScore: Math.min(1, existing.confidenceScore + 0.1),
            evidenceCount: existing.evidenceCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(schema.strategyLearnedRules.id, existing.id));
      } else {
        await this.db.insert(schema.strategyLearnedRules).values({
          projectId,
          ruleType: rule.rule_type as any,
          ruleContent: { description: rule.rule_content, evidence: rule.evidence },
          confidenceScore: rule.confidence,
          evidenceCount: 1,
          sourceDecisions: [executionId],
          isActive: true,
        });
      }
    }
  }

  // ─── Phase 5: Platform-level rules (cross-project) ────────────────────────

  async checkForPlatformRules(): Promise<void> {
    this.logger.log('[strategist] Phase 5: Checking for platform-level rule patterns');

    try {
      // Find rules that appear across multiple projects
      const allRules = await this.db.query.strategyLearnedRules.findMany({
        where: eq(schema.strategyLearnedRules.isActive, true),
      }) as schema.StrategyLearnedRule[];

      // Group by ruleType + approximate content similarity
      const grouped: Record<string, schema.StrategyLearnedRule[]> = {};
      for (const rule of allRules) {
        const key = `${rule.ruleType}::${this.normalizeRuleContent(rule.ruleContent)}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(rule);
      }

      for (const [key, rules] of Object.entries(grouped)) {
        if (rules.length < 3) continue;

        const avgConfidence = rules.reduce((sum, r) => sum + r.confidenceScore, 0) / rules.length;
        if (avgConfidence < 0.7) continue;

        const uniqueProjects = new Set(rules.map((r) => r.projectId));
        if (uniqueProjects.size < 3) continue;

        const [ruleType] = key.split('::');
        const sampleContent = rules[0].ruleContent;
        const totalEvidence = rules.reduce((sum, r) => sum + r.evidenceCount, 0);

        // Check if platform rule already exists
        const existing = await this.db.query.platformLearnedRules.findFirst({
          where: and(
            eq(schema.platformLearnedRules.ruleType, ruleType as any),
            eq(schema.platformLearnedRules.isActive, true),
          ),
        }) as schema.PlatformLearnedRule | null;

        if (existing) {
          await this.db
            .update(schema.platformLearnedRules)
            .set({
              confidenceScore: avgConfidence,
              evidenceCount: existing.evidenceCount + totalEvidence,
              sourceProjectCount: uniqueProjects.size,
              updatedAt: new Date(),
            })
            .where(eq(schema.platformLearnedRules.id, existing.id));
        } else {
          await this.db.insert(schema.platformLearnedRules).values({
            ruleType: ruleType as any,
            ruleContent: sampleContent,
            confidenceScore: avgConfidence,
            evidenceCount: totalEvidence,
            sourceProjectCount: uniqueProjects.size,
            isActive: true,
          });

          this.logger.log(
            `[strategist] New platform rule created: ${ruleType} (${uniqueProjects.size} projects, confidence: ${avgConfidence.toFixed(2)})`,
          );
        }
      }
    } catch (err) {
      this.logger.error(`[strategist] Platform rules check failed: ${(err as Error).message}`);
    }
  }

  // ─── Phase 6: Validate previous decisions ─────────────────────────────────

  async validatePreviousDecisions(projectId: string): Promise<void> {
    this.logger.log(`[strategist] Phase 6: Validating previous decisions for project ${projectId}`);

    try {
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const recentDecisions = await this.db.query.strategyDecisions.findMany({
        where: and(
          eq(schema.strategyDecisions.projectId, projectId),
          eq(schema.strategyDecisions.applied, true),
          gte(schema.strategyDecisions.appliedAt, cutoff),
        ),
      }) as schema.StrategyDecision[];

      for (const decision of recentDecisions) {
        this.logger.log(
          `[strategist] Evaluating decision ${decision.id} (${decision.decisionType})`,
        );
        // In a full implementation, we'd compare before/after metrics
        // For now, just log that we're tracking it
      }
    } catch (err) {
      this.logger.warn(`[strategist] Decision validation failed: ${(err as Error).message}`);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async saveDecision(params: {
    projectId: string;
    agentExecutionId: string;
    decisionType: schema.StrategyDecision['decisionType'];
    reasoning: string;
    oldValue: unknown;
    newValue: unknown;
    applied: boolean;
  }): Promise<void> {
    try {
      await this.db.insert(schema.strategyDecisions).values({
        projectId: params.projectId,
        agentExecutionId: params.agentExecutionId,
        decisionType: params.decisionType,
        reasoning: params.reasoning,
        oldValue: params.oldValue ?? null,
        newValue: params.newValue,
        applied: params.applied,
        appliedAt: params.applied ? new Date() : null,
      });
    } catch (err) {
      this.logger.error(`[strategist] Failed to save decision: ${(err as Error).message}`);
    }
  }

  private async pauseCampaign(campaignId: string, reason: string): Promise<void> {
    await this.db
      .update(schema.campaigns)
      .set({ status: 'paused', updatedAt: new Date() })
      .where(eq(schema.campaigns.id, campaignId));

    this.logger.log(`[strategist] Campaign ${campaignId} paused: ${reason}`);
  }

  private async findSimilarRule(
    projectId: string,
    ruleType: string,
    ruleContent: string,
  ): Promise<schema.StrategyLearnedRule | null> {
    const rules = await this.db.query.strategyLearnedRules.findMany({
      where: and(
        eq(schema.strategyLearnedRules.projectId, projectId),
        eq(schema.strategyLearnedRules.ruleType, ruleType as any),
        eq(schema.strategyLearnedRules.isActive, true),
      ),
    }) as schema.StrategyLearnedRule[];

    // Simple similarity: check if the rule content contains similar keywords
    const normalizedNew = this.normalizeRuleContent(ruleContent);
    for (const rule of rules) {
      const normalizedExisting = this.normalizeRuleContent(rule.ruleContent);
      if (normalizedExisting === normalizedNew) return rule;
    }

    return null;
  }

  private normalizeRuleContent(content: unknown): string {
    if (typeof content === 'string') {
      return content.toLowerCase().trim().replace(/\s+/g, ' ').substring(0, 100);
    }
    if (typeof content === 'object' && content !== null) {
      const obj = content as Record<string, unknown>;
      return (obj.description ?? JSON.stringify(content)).toString().toLowerCase().trim().substring(0, 100);
    }
    return String(content).toLowerCase().trim().substring(0, 100);
  }
}