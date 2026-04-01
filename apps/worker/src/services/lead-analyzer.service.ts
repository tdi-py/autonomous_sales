import { Injectable, Logger, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as schema from '@autonomous-sales/database';
import { createLLMProvider, getModelForAgent } from '@autonomous-sales/shared';
import { DATABASE_TOKEN } from '../database/database.module';
import { ScraperService } from './scraper.service';

export interface LeadPainPointAnalysis {
  companyOverview: string;
  painPoints: string[];
  businessChallenges: string[];
  potentialNeeds: string[];
  relevantTalkingPoints: string[];
  suggestedApproach: string;
  industryContext: string;
  urgencyIndicators: string[];
}

@Injectable()
export class LeadAnalyzerService {
  private readonly logger = new Logger(LeadAnalyzerService.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    private readonly scraperService: ScraperService,
  ) {}

  // ─── Analyze lead's website to identify pain points ──────────────────────

  async analyzeLeadWebsite(
    leadId: string,
    projectId: string,
  ): Promise<{ result: LeadPainPointAnalysis; tokensUsed: number; durationMs: number }> {
    const lead = await this.db.query.leads.findFirst({
      where: eq(schema.leads.id, leadId),
    }) as schema.Lead | null;

    if (!lead) throw new Error(`Lead not found: ${leadId}`);
    if (!lead.website) throw new Error(`Lead has no website: ${leadId}`);

    // Get project context so AI knows what we're selling
    const project = await this.db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
    }) as schema.Project | null;

    const projectAnalysis = await this.db.query.projectAnalysis.findFirst({
      where: eq(schema.projectAnalysis.projectId, projectId),
    }) as schema.ProjectAnalysis | null;

    this.logger.log(`[lead-analyzer] Scraping lead website: ${lead.website}`);
    const scraped = await this.scraperService.scrape(lead.website);

    const llm = createLLMProvider();
    const model = getModelForAgent('analyzer');

    const scrapedSummary = JSON.stringify(
      {
        title: scraped.title,
        meta: scraped.metaDescription,
        headings: scraped.headings,
        pricing: scraped.pricing,
        testimonials: scraped.testimonials.slice(0, 500),
        bodyText: scraped.bodyText.slice(0, 3000),
      },
      null,
      2,
    );

    const prompt = `Sen bir B2B satış danışmanı ve iş analisti olarak müşteri sitesini analiz ediyorsun.

## MÜŞTERİ (Lead) BİLGİLERİ:
- Şirket: ${lead.companyName ?? 'Bilinmiyor'}
- Website: ${lead.website}
- Sektör: ${lead.contactTitle ?? ''}

## SATAN BİZ (Gönderen):
- Ürün/Hizmet: ${(projectAnalysis?.valueProposition as string | null) ?? project?.name ?? 'Bilinmiyor'}
- Açıklama: ${(projectAnalysis?.productDescription as string | null) ?? ''}

## MÜŞTERİNİN WEBSİTE VERİSİ:
${scrapedSummary}

## GÖREVİN:
Bu müşterinin sitesini analiz ederek:
1. Şirketin mevcut durumunu anla
2. Potansiyel problemlerini ve pain pointlerini tespit et
3. Bizim ürünümüzün onlara nasıl yardımcı olabileceğini belirle
4. En iyi iletişim yaklaşımını öner

SADECE JSON döndür:
{
  "companyOverview": "Şirket ne yapıyor, büyüklüğü, konumu hakkında 2-3 cümle",
  "painPoints": ["Pain point 1 (siteden çıkarılan)", "Pain point 2", "Pain point 3"],
  "businessChallenges": ["İş zorluğu 1", "İş zorluğu 2"],
  "potentialNeeds": ["İhtiyaç 1 (bizim ürünümüzle ilgili)", "İhtiyaç 2"],
  "relevantTalkingPoints": ["Konuşma noktası 1", "Konuşma noktası 2", "Konuşma noktası 3"],
  "suggestedApproach": "Bu müşteriye nasıl yaklaşılmalı, hangi değer önerisiyle (2-3 cümle)",
  "industryContext": "Bu sektördeki genel zorluklar ve trendler",
  "urgencyIndicators": ["Aciliyet göstergesi 1 (varsa, siteden çıkarılan)"]
}

Website verisi:
---
${scrapedSummary}
---

SADECE JSON DÖNDÜR:`;

    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const llmResult = await llm.generateCompletion({
          model,
          prompt: attempt > 0 ? prompt + '\n\nSADECE JSON döndür.' : prompt,
          temperature: 0.3,
          maxTokens: 1500,
        });

        const cleaned = llmResult.content
          .replace(/<think>[\s\S]*?<\/think>/g, '')
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        const result = JSON.parse(cleaned) as LeadPainPointAnalysis;

        // Save to database
        await this.saveToDatabase(leadId, result, scraped.bodyText.slice(0, 500));

        return {
          result,
          tokensUsed: llmResult.tokensUsed,
          durationMs: Date.now() - startTime,
        };
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        this.logger.warn(`[lead-analyzer] Parse failed attempt ${attempt + 1}: ${lastError.message}`);
      }
    }

    throw new Error(`Lead analysis failed after 3 attempts: ${lastError?.message}`);
  }

  // ─── Save results to lead_enrichment ──────────────────────────────────────

  private async saveToDatabase(
    leadId: string,
    result: LeadPainPointAnalysis,
    websiteSnippet: string,
  ): Promise<void> {
    const existing = await this.db.query.leadEnrichment.findFirst({
      where: eq(schema.leadEnrichment.leadId, leadId),
    });

    const websiteInsights = {
      companyOverview: result.companyOverview,
      businessChallenges: result.businessChallenges,
      industryContext: result.industryContext,
      urgencyIndicators: result.urgencyIndicators,
      suggestedApproach: result.suggestedApproach,
      relevantTalkingPoints: result.relevantTalkingPoints,
      websiteSnippet,
      analyzedAt: new Date().toISOString(),
    };

    if (existing) {
      await this.db
        .update(schema.leadEnrichment)
        .set({
          painPoints: [...result.painPoints, ...result.potentialNeeds],
          websiteInsights,
          websiteAnalyzedAt: new Date(),
        })
        .where(eq(schema.leadEnrichment.leadId, leadId));
    } else {
      await this.db.insert(schema.leadEnrichment).values({
        leadId,
        painPoints: [...result.painPoints, ...result.potentialNeeds],
        websiteInsights,
        websiteAnalyzedAt: new Date(),
      });
    }

    this.logger.log(`[lead-analyzer] Saved pain point analysis for lead: ${leadId}`);
  }
}
