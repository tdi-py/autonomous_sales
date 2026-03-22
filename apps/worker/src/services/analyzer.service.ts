import { Injectable, Logger, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { createLLMProvider, getModelForAgent } from '@autonomous-sales/shared';
import { DATABASE_TOKEN } from '../database/database.module';
import type { ScrapedData } from './scraper.service';

export interface AnalysisResult {
  value_proposition: string;
  product_description: string;
  target_market: string;
  key_features: string[];
  industry: 'saas' | 'ecommerce' | 'agency' | 'service' | 'marketplace' | 'other';
  business_type: 'b2b' | 'b2c' | 'b2b2c' | 'marketplace';
  tone_of_voice: 'professional' | 'casual' | 'technical' | 'friendly' | 'luxury';
  competitors_detected: string[] | null;
  icp_suggestions: Array<{
    label: string;
    industry: string;
    company_size: string;
    job_titles: string[];
    pain_points: string[];
    geography: string;
  }>;
}

const BUSINESS_TYPE_MAP: Record<string, schema.NewProject['businessType']> = {
  b2b: 'saas',
  b2c: 'ecommerce',
  b2b2c: 'saas',
  marketplace: 'marketplace',
  saas: 'saas',
  ecommerce: 'ecommerce',
  agency: 'agency',
  service: 'service',
  other: 'other',
};

@Injectable()
export class AnalyzerService {
  private readonly logger = new Logger(AnalyzerService.name);

  constructor(@Inject(DATABASE_TOKEN) private readonly db: any) {}

  async analyze(
    projectId: string,
    scrapedData: ScrapedData,
  ): Promise<{ result: AnalysisResult; tokensUsed: number; durationMs: number; model: string }> {
    const llm = createLLMProvider();
    const model = getModelForAgent('analyzer');

    const scrapedSummary = JSON.stringify(
      {
        title: scrapedData.title,
        meta: scrapedData.metaDescription,
        og: scrapedData.openGraph,
        headings: scrapedData.headings,
        nav: scrapedData.navLinks,
        pricing: scrapedData.pricing,
        testimonials: scrapedData.testimonials.slice(0, 500),
        body: scrapedData.bodyText.slice(0, 3000),
      },
      null,
      2,
    );

    const prompt = buildPrompt(scrapedSummary);

    let result: AnalysisResult | null = null;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const retryNote =
        attempt > 0
          ? '\n\nIMPORTANT: Your previous response was not valid JSON. Return ONLY valid JSON, nothing else, no markdown backticks.'
          : '';

      const llmResult = await llm.generateCompletion({
        model,
        prompt: prompt + retryNote,
        temperature: 0.3,
        maxTokens: 2000,
      });

      try {
        const cleaned = llmResult.content
          .replace(/<think>[\s\S]*?<\/think>/g, '')
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        result = JSON.parse(cleaned) as AnalysisResult;

        return {
          result,
          tokensUsed: llmResult.tokensUsed,
          durationMs: llmResult.durationMs,
          model: llmResult.model,
        };
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        this.logger.warn(`[AnalyzerService] JSON parse failed on attempt ${attempt + 1}: ${lastError.message}`);
      }
    }

    throw new Error(`Failed to parse LLM JSON after 3 attempts. Last error: ${lastError?.message}`);
  }

  async saveToDatabase(projectId: string, result: AnalysisResult, model: string): Promise<void> {
    const mappedBusinessType = BUSINESS_TYPE_MAP[result.business_type] ?? 'other';

    // Update project_analysis
    await this.db
      .update(schema.projectAnalysis)
      .set({
        valueProposition: result.value_proposition,
        productDescription: result.product_description,
        targetMarket: result.target_market,
        keyFeatures: result.key_features,
        toneOfVoice: result.tone_of_voice,
        competitorsDetected: result.competitors_detected,
        analyzedAt: new Date(),
        modelUsed: model,
        userConfirmed: false,
      })
      .where(eq(schema.projectAnalysis.projectId, projectId));

    // Update project industry/business_type
    await this.db
      .update(schema.projects)
      .set({
        industry: result.industry,
        businessType: mappedBusinessType,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, projectId));

    // Soft-delete old ICP profiles, insert fresh ones
    const existingIcps = await this.db.query.icpProfiles.findMany({
      where: eq(schema.icpProfiles.projectId, projectId),
    });

    for (const icp of existingIcps) {
      await this.db
        .update(schema.icpProfiles)
        .set({ isActive: false })
        .where(eq(schema.icpProfiles.id, icp.id));
    }

    for (let i = 0; i < result.icp_suggestions.length; i++) {
      const icp = result.icp_suggestions[i];
      await this.db.insert(schema.icpProfiles).values({
        projectId,
        label: icp.label,
        industry: icp.industry,
        companySize: icp.company_size,
        jobTitles: icp.job_titles,
        painPoints: icp.pain_points,
        geography: icp.geography,
        priority: String(i + 1),
        isActive: true,
      });
    }
  }
}

function buildPrompt(scrapedSummary: string): string {
  return `You are a business analyst and marketing expert. Extract structured information from the website data below.

Return ONLY a JSON object (no markdown, no explanation), following this exact schema:
{
  "value_proposition": "string (1-2 sentences)",
  "product_description": "string (2-3 sentences)",
  "target_market": "string (industry, company size, roles)",
  "key_features": ["string", "string", "string", "string", "string"],
  "industry": "saas|ecommerce|agency|service|marketplace|other",
  "business_type": "b2b|b2c|b2b2c|marketplace",
  "tone_of_voice": "professional|casual|technical|friendly|luxury",
  "competitors_detected": ["string"] or null,
  "icp_suggestions": [
    {
      "label": "string (short description, e.g. 'US-based SaaS companies 10-50 employees')",
      "industry": "string",
      "company_size": "string",
      "job_titles": ["string"],
      "pain_points": ["string"],
      "geography": "string"
    }
  ]
}

Provide 2-3 ICP suggestions. Be specific and actionable.

Website data:
---
${scrapedSummary}
---

RETURN ONLY JSON:`;
}