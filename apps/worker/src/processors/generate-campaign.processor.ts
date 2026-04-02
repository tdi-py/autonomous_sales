import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { eq, and } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { QUEUE_NAMES, type GenerateCampaignContentJobPayload } from '@autonomous-sales/shared';
import { DATABASE_TOKEN, logExecution } from '../database/database.module';
import { CommunicatorService } from '../services/communicator.service';
import { ContentCheckerService } from '../services/content-checker.service';

@Processor(QUEUE_NAMES.GENERATE_CAMPAIGN_CONTENT)
export class GenerateCampaignProcessor {
  private readonly logger = new Logger(GenerateCampaignProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    private readonly communicatorService: CommunicatorService,
    private readonly contentCheckerService: ContentCheckerService,
  ) {}

  @Process()
  async handle(job: Job<GenerateCampaignContentJobPayload>) {
    const startTime = Date.now();
    const { projectId, campaignId } = job.data;

    this.logger.log(`[generate-campaign] Job ${job.id} — campaign: ${campaignId}`);

    try {
      // ── 1. Kampanyayı kontrol et ──────────────────────────────────────
      const campaign = await this.db.query.campaigns.findFirst({
        where: eq(schema.campaigns.id, campaignId),
      });

      if (!campaign) {
        this.logger.warn(`[generate-campaign] Campaign ${campaignId} not found, skipping`);
        return { skipped: true, reason: 'campaign_not_found' };
      }

      const settings = (campaign.settings ?? {}) as Record<string, unknown>;
      const targetLanguage = (settings.targetLanguage as string) ?? 'en';
      const icpProfileId = settings.icpProfileId as string | undefined;
      const offer = settings.offer as string | undefined;

      // ── 2. Proje analizini oku ──────────────────────────────────────
      const analysis = await this.db.query.projectAnalysis.findFirst({
        where: eq(schema.projectAnalysis.projectId, projectId),
      });

      if (!analysis?.analyzedAt) {
        throw new Error('Proje analizi henüz tamamlanmamış. Önce URL analizi yapın.');
      }

      // ── 3. ICP profilini oku ────────────────────────────────────────
      let icp: schema.IcpProfile | null = null;

      if (icpProfileId) {
        icp = await this.db.query.icpProfiles.findFirst({
          where: and(
            eq(schema.icpProfiles.id, icpProfileId),
            eq(schema.icpProfiles.isActive, true),
          ),
        });
      }

      if (!icp) {
        icp = await this.db.query.icpProfiles.findFirst({
          where: and(
            eq(schema.icpProfiles.projectId, projectId),
            eq(schema.icpProfiles.isActive, true),
          ),
        });
      }

      // ── 4. Proje + industry template ───────────────────────────────
      const project = await this.db.query.projects.findFirst({
        where: eq(schema.projects.id, projectId),
      });

      let industryTemplateHint: string | undefined;

      if (project?.industry) {
        const templateType =
          campaign.type === 'cold_email' ? 'email_sequence' : 'call_script';

        const template = await this.db.query.industryTemplates.findFirst({
          where: and(
            eq(schema.industryTemplates.industry, project.industry),
            eq(schema.industryTemplates.templateType, templateType),
            eq(schema.industryTemplates.isSystem, true),
          ),
        });

        if (template) {
          industryTemplateHint = JSON.stringify(template.content);
          this.logger.log(`[generate-campaign] Using industry template: ${template.name}`);
        }
      }

      // ── 5. Platform learned rules context (Faz 5) ─────────────────
      let platformRulesContext: string | undefined;
      if (project?.industry) {
        const platformRules = await this.db.query.platformLearnedRules.findMany({
          where: and(
            eq(schema.platformLearnedRules.industry, project.industry),
            eq(schema.platformLearnedRules.isActive, true),
          ),
          orderBy: (t: any, { desc }: any) => [desc(t.confidenceScore)],
          limit: 5,
        }) as schema.PlatformLearnedRule[];

        if (platformRules.length > 0) {
          const ruleDescriptions = platformRules.map((r) => {
            const content = r.ruleContent as Record<string, unknown>;
            return `- [${r.ruleType}] ${content?.description ?? JSON.stringify(content)} (güven: %${Math.round(r.confidenceScore * 100)}, ${r.sourceProjectCount} projeden)`;
          });
          platformRulesContext = `Bu sektörde kanıtlanmış pattern'ler:\n${ruleDescriptions.join('\n')}`;
          this.logger.log(`[generate-campaign] Injecting ${platformRules.length} platform rules`);
        }
      }

      // ── 6. Proje bazlı aktif prompt versiyonu kontrolü ───────────────
      const activePrompt = await this.db.query.promptVersions.findFirst({
        where: and(
          eq(schema.promptVersions.projectId, projectId),
          eq(schema.promptVersions.agentType, 'communicator'),
          eq(schema.promptVersions.isActive, true),
        ),
        orderBy: (t: any, { desc }: any) => [desc(t.version)],
      }) as schema.PromptVersion | null;

      if (activePrompt) {
        this.logger.log(
          `[generate-campaign] Using custom prompt version ${activePrompt.version} for project ${projectId}`,
        );
      }

      // ── 7. Context oluştur ─────────────────────────────────────────
      const ctx = {
        productDescription: analysis.productDescription ?? '',
        valueProposition: analysis.valueProposition ?? '',
        targetMarket: analysis.targetMarket ?? '',
        toneOfVoice: analysis.toneOfVoice ?? 'professional',
        icpLabel: icp?.label ?? 'B2B decision makers',
        jobTitles: (icp?.jobTitles as string[]) ?? [],
        painPoints: (icp?.painPoints as string[]) ?? [],
        industry: project?.industry ?? 'saas',
        targetLanguage,
        offer,
        industryTemplateHint,
        platformRulesContext,       // Faz 5: platform kuralları
        customPromptText: activePrompt?.promptText,  // Faz 5: özel prompt
      };

      // ── 8. İçerik üret ─────────────────────────────────────────────
      this.logger.log(`[generate-campaign] Calling CommunicatorService...`);
      const result = await this.communicatorService.generateAll(ctx);

      // ── 9. Email sequences kaydet ───────────────────────────────────
      await this.db
        .delete(schema.emailSequences)
        .where(eq(schema.emailSequences.campaignId, campaignId));

      for (const step of result.emailSteps) {
        const reportA = this.contentCheckerService.checkEmail(
          step.variantA.subject,
          step.variantA.body,
        );

        if (reportA.overallWarnings.length > 0) {
          this.logger.warn(
            `[generate-campaign] Step ${step.stepOrder} warnings: ${reportA.overallWarnings.join(' | ')}`,
          );
        }

        await this.db.insert(schema.emailSequences).values({
          campaignId,
          stepOrder: step.stepOrder,
          subjectTemplate: step.variantA.subject,
          bodyTemplate: step.variantA.body,
          delayDays: step.delayDays,
          variantLabel: 'A',
          language: targetLanguage,
          modelUsed: result.modelUsed,
        });

        await this.db.insert(schema.emailSequences).values({
          campaignId,
          stepOrder: step.stepOrder,
          subjectTemplate: step.variantB.subject,
          bodyTemplate: step.variantB.body,
          delayDays: step.delayDays,
          variantLabel: 'B',
          language: targetLanguage,
          modelUsed: result.modelUsed,
        });
      }

      // ── 10. Call script kaydet ──────────────────────────────────────
      if (campaign.type === 'cold_call' || campaign.type === 'multi_channel') {
        const existingScripts = await this.db.query.callScripts.findMany({
          where: eq(schema.callScripts.campaignId, campaignId),
        });
        const nextVersion = existingScripts.length + 1;

        await this.db.insert(schema.callScripts).values({
          campaignId,
          version: nextVersion,
          openingScript: result.callScript.opening_script,
          dialogueTree: result.callScript.dialogue_tree,
          objectionHandlers: result.callScript.objection_handlers,
          closingScript: result.callScript.closing_script,
          language: targetLanguage,
          modelUsed: result.modelUsed,
        });
      }

      // ── 11. Content status güncelle ────────────────────────────────
      await this.db
        .update(schema.campaigns)
        .set({
          settings: {
            ...settings,
            contentStatus: 'ready',
            generatedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        })
        .where(eq(schema.campaigns.id, campaignId));

      const durationMs = Date.now() - startTime;
      this.logger.log(
        `[generate-campaign] Job ${job.id} done in ${durationMs}ms. Tokens: ${result.tokensUsed}`,
      );

      await logExecution({
        db: this.db,
        projectId,
        agentType: 'communicator',
        trigger: QUEUE_NAMES.GENERATE_CAMPAIGN_CONTENT,
        inputPayload: job.data,
        outputPayload: {
          campaignId,
          emailStepsGenerated: result.emailSteps.length,
          tokensUsed: result.tokensUsed,
          model: result.modelUsed,
          platformRulesInjected: !!platformRulesContext,
          customPromptUsed: !!activePrompt,
        },
        status: 'success',
        tokensUsed: result.tokensUsed,
        modelUsed: result.modelUsed,
        durationMs,
      });

      return { success: true, emailSteps: result.emailSteps.length };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[generate-campaign] Job ${job.id} failed: ${err.message}`);

      try {
        const campaign = await this.db.query.campaigns.findFirst({
          where: eq(schema.campaigns.id, campaignId),
        });
        if (campaign) {
          await this.db
            .update(schema.campaigns)
            .set({
              settings: {
                ...(campaign.settings ?? {}),
                contentStatus: 'error',
                contentError: err.message,
              },
              updatedAt: new Date(),
            })
            .where(eq(schema.campaigns.id, campaignId));
        }
      } catch {
        // ignore secondary failure
      }

      await logExecution({
        db: this.db,
        projectId,
        agentType: 'communicator',
        trigger: QUEUE_NAMES.GENERATE_CAMPAIGN_CONTENT,
        inputPayload: job.data,
        status: 'error',
        errorMessage: err.message,
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }
}