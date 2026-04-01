import { Injectable, Logger, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { chromium, type Browser, type Page } from 'playwright';
import * as schema from '@autonomous-sales/database';
import { createLLMProvider, getModelForAgent } from '@autonomous-sales/shared';
import { DATABASE_TOKEN } from '../database/database.module';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContactFormField {
  name: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  selector: string;
}

export interface ContactFormContent {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
}

export interface ContactFormAnalysis {
  formFound: boolean;
  formUrl: string;
  fields: ContactFormField[];
  generatedContent: ContactFormContent;
  aiReasoning: string;
}

const REAL_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ContactFormService {
  private readonly logger = new Logger(ContactFormService.name);

  constructor(@Inject(DATABASE_TOKEN) private readonly db: any) {}

  // ─── Step 1: Find contact form and generate content ────────────────────────

  async analyzeAndGenerate(
    leadId: string,
    projectId: string,
    campaignId?: string,
  ): Promise<ContactFormAnalysis> {
    const lead = await this.db.query.leads.findFirst({
      where: eq(schema.leads.id, leadId),
    }) as schema.Lead | null;

    if (!lead) throw new Error(`Lead not found: ${leadId}`);
    if (!lead.website) throw new Error(`Lead has no website: ${leadId}`);

    const project = await this.db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
    }) as schema.Project | null;

    const projectAnalysis = await this.db.query.projectAnalysis.findFirst({
      where: eq(schema.projectAnalysis.projectId, projectId),
    }) as schema.ProjectAnalysis | null;

    const leadEnrichment = await this.db.query.leadEnrichment.findFirst({
      where: eq(schema.leadEnrichment.leadId, leadId),
    });

    // Find contact form page
    this.logger.log(`[contact-form] Finding contact form for: ${lead.website}`);
    const formAnalysis = await this.findContactForm(lead.website);

    if (!formAnalysis.formFound) {
      this.logger.warn(`[contact-form] No contact form found at: ${lead.website}`);
      return {
        formFound: false,
        formUrl: lead.website,
        fields: [],
        generatedContent: {
          name: '',
          email: '',
          message: '',
        },
        aiReasoning: 'İletişim formu bulunamadı.',
      };
    }

    // AI generates form content
    this.logger.log(`[contact-form] Generating content for: ${lead.companyName}`);
    const generated = await this.generateFormContent(
      lead,
      project,
      projectAnalysis,
      leadEnrichment,
      formAnalysis.fields,
    );

    return {
      formFound: true,
      formUrl: formAnalysis.formUrl,
      fields: formAnalysis.fields,
      generatedContent: generated.content,
      aiReasoning: generated.reasoning,
    };
  }

  // ─── Step 2: Submit the approved form ──────────────────────────────────────

  async submitForm(
    formUrl: string,
    fields: ContactFormField[],
    content: ContactFormContent,
  ): Promise<{ success: boolean; error?: string }> {
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: REAL_USER_AGENT,
        extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
      });
      const page = await context.newPage();

      await page.goto(formUrl, { waitUntil: 'networkidle', timeout: 30_000 });
      await page.waitForTimeout(1000);

      // Fill fields intelligently by label/name matching
      await this.fillFormFields(page, fields, content);

      // Submit the form
      const submitted = await this.trySubmitForm(page);

      if (!submitted) {
        return { success: false, error: 'Form submit butonu bulunamadı' };
      }

      // Wait for confirmation
      await page.waitForTimeout(3000);
      this.logger.log(`[contact-form] Form submitted successfully to: ${formUrl}`);

      return { success: true };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[contact-form] Form submission failed: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      if (browser) await browser.close();
    }
  }

  // ─── Private: Find contact form ────────────────────────────────────────────

  private async findContactForm(websiteUrl: string): Promise<{
    formFound: boolean;
    formUrl: string;
    fields: ContactFormField[];
  }> {
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({ userAgent: REAL_USER_AGENT });

      const baseUrl = new URL(websiteUrl).origin;

      // Common contact page paths to try
      const candidateUrls = [
        websiteUrl,
        `${baseUrl}/contact`,
        `${baseUrl}/contact-us`,
        `${baseUrl}/iletisim`,
        `${baseUrl}/get-in-touch`,
        `${baseUrl}/reach-us`,
        `${baseUrl}/about/contact`,
      ];

      for (const url of candidateUrls) {
        try {
          const page = await context.newPage();
          await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 });

          const fields = await this.extractFormFields(page);
          await page.close();

          if (fields.length >= 2) {
            // Found a form with enough fields
            return { formFound: true, formUrl: url, fields };
          }
        } catch {
          // try next URL
        }
      }

      // Try to find contact link from homepage
      try {
        const homePage = await context.newPage();
        await homePage.goto(websiteUrl, { waitUntil: 'networkidle', timeout: 20_000 });
        const contactLink = await this.findContactLink(homePage);
        await homePage.close();

        if (contactLink) {
          const contactPage = await context.newPage();
          await contactPage.goto(contactLink, { waitUntil: 'networkidle', timeout: 20_000 });
          const fields = await this.extractFormFields(contactPage);
          await contactPage.close();

          if (fields.length >= 2) {
            return { formFound: true, formUrl: contactLink, fields };
          }
        }
      } catch {
        // ignore
      }

      return { formFound: false, formUrl: websiteUrl, fields: [] };
    } finally {
      if (browser) await browser.close();
    }
  }

  private async extractFormFields(page: Page): Promise<ContactFormField[]> {
    return page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      const fields: Array<{
        name: string;
        type: string;
        label: string;
        placeholder: string;
        required: boolean;
        selector: string;
      }> = [];

      for (const form of Array.from(forms)) {
        const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select');

        for (const input of Array.from(inputs)) {
          const el = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          const name = el.name || el.id || '';
          const type = (el as HTMLInputElement).type || el.tagName.toLowerCase();
          const placeholder = (el as HTMLInputElement).placeholder || '';
          const required = el.required;

          // Find associated label
          let label = '';
          if (el.id) {
            const labelEl = document.querySelector(`label[for="${el.id}"]`);
            label = labelEl?.textContent?.trim() ?? '';
          }
          if (!label && el.getAttribute('aria-label')) {
            label = el.getAttribute('aria-label') ?? '';
          }
          if (!label && el.closest('label')) {
            label = (el.closest('label') as HTMLLabelElement)?.textContent?.trim() ?? '';
          }

          const selectorParts = [];
          if (el.tagName) selectorParts.push(el.tagName.toLowerCase());
          if (el.name) selectorParts.push(`[name="${el.name}"]`);
          else if (el.id) selectorParts.push(`#${el.id}`);
          const selector = selectorParts.join('') || el.tagName.toLowerCase();

          if (name || placeholder || label) {
            fields.push({ name, type, label, placeholder, required, selector });
          }
        }

        if (fields.length > 0) break; // Use first form with fields
      }

      return fields;
    });
  }

  private async findContactLink(page: Page): Promise<string | null> {
    return page.evaluate(() => {
      const keywords = ['contact', 'iletisim', 'reach', 'touch', 'write', 'message'];
      const links = document.querySelectorAll('a[href]');

      for (const link of Array.from(links)) {
        const href = (link as HTMLAnchorElement).href.toLowerCase();
        const text = (link.textContent ?? '').toLowerCase();

        for (const kw of keywords) {
          if (href.includes(kw) || text.includes(kw)) {
            return (link as HTMLAnchorElement).href;
          }
        }
      }
      return null;
    });
  }

  // ─── Private: AI content generation ───────────────────────────────────────

  private async generateFormContent(
    lead: schema.Lead,
    project: schema.Project | null,
    projectAnalysis: schema.ProjectAnalysis | null,
    leadEnrichment: any,
    fields: ContactFormField[],
  ): Promise<{ content: ContactFormContent; reasoning: string }> {
    const llm = createLLMProvider();
    const model = getModelForAgent('communicator');

    const prompt = `Sen B2B satış uzmanısın. Bir müşterinin iletişim formunu doldurman gerekiyor.

## GÖNDEREN BİLGİLERİ (biz kimiz):
- Şirket: ${project?.name ?? 'Şirketimiz'}
- Ürün/Hizmet: ${(projectAnalysis?.valueProposition as string | null) ?? 'Bilinmiyor'}
- Açıklama: ${(projectAnalysis?.productDescription as string | null) ?? ''}

## ALICI (form sahibi müşteri):
- Şirket: ${lead.companyName ?? 'Bilinmiyor'}
- İsim: ${lead.contactName ?? ''}
- Website: ${lead.website ?? ''}
- Pain Points: ${JSON.stringify(leadEnrichment?.painPoints ?? [])}
- Website Insights: ${JSON.stringify(leadEnrichment?.websiteInsights ?? {})}

## FORMUN ALANLARI:
${JSON.stringify(fields.map(f => ({ name: f.name, type: f.type, label: f.label, placeholder: f.placeholder, required: f.required })), null, 2)}

## GÖREVİN:
Bu iletişim formunu doldurmak için uygun içerik oluştur.
- name alanı: Gönderen kişinin adı (senin/bizim adımız)
- email: Gönderici email
- company: Gönderen şirket adı
- subject/konu: Kısa ilgi çekici konu başlığı
- message/mesaj: 3-4 cümle kişiselleştirilmiş, değer odaklı mesaj

SADECE JSON döndür:
{
  "name": "...",
  "email": "contact@ourgcompany.com",
  "phone": "...",
  "company": "...",
  "subject": "...",
  "message": "...",
  "reasoning": "Neden bu mesajı bu şekilde yazdım (2-3 cümle)"
}`;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await llm.generateCompletion({
          model,
          prompt: attempt > 0 ? prompt + '\n\nSADECE JSON döndür.' : prompt,
          temperature: 0.6,
          maxTokens: 800,
        });

        const cleaned = result.content
          .replace(/<think>[\s\S]*?<\/think>/g, '')
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        const parsed = JSON.parse(cleaned);
        return {
          content: {
            name: parsed.name ?? '',
            email: parsed.email ?? '',
            phone: parsed.phone,
            company: parsed.company,
            subject: parsed.subject,
            message: parsed.message ?? '',
          },
          reasoning: parsed.reasoning ?? '',
        };
      } catch {
        // retry
      }
    }

    // Fallback content
    return {
      content: {
        name: 'Sales Team',
        email: 'contact@company.com',
        message: `Hello, I wanted to reach out about a potential partnership opportunity with ${lead.companyName ?? 'your company'}.`,
      },
      reasoning: 'AI içerik üretimi başarısız oldu, varsayılan içerik kullanıldı.',
    };
  }

  // ─── Private: Fill form fields ─────────────────────────────────────────────

  private async fillFormFields(
    page: Page,
    fields: ContactFormField[],
    content: ContactFormContent,
  ): Promise<void> {
    const fieldMappings: Record<string, string> = {
      name: content.name,
      email: content.email,
      phone: content.phone ?? '',
      company: content.company ?? '',
      subject: content.subject ?? '',
      message: content.message,
    };

    for (const field of fields) {
      const fieldKey = this.matchFieldToContent(field);
      const value = fieldMappings[fieldKey];
      if (!value) continue;

      try {
        // Try multiple selectors
        const selectors = [
          field.name ? `[name="${field.name}"]` : null,
          field.selector,
        ].filter(Boolean) as string[];

        for (const selector of selectors) {
          try {
            const el = await page.$(selector);
            if (el) {
              await el.click();
              await el.fill('');
              await el.type(value, { delay: 30 + Math.random() * 50 });
              break;
            }
          } catch {
            // try next selector
          }
        }
      } catch {
        // skip field
      }

      await page.waitForTimeout(200 + Math.random() * 300);
    }
  }

  private matchFieldToContent(field: ContactFormField): string {
    const combined = `${field.name} ${field.label} ${field.placeholder}`.toLowerCase();

    if (combined.match(/\b(name|ad|isim|full.?name|your.?name)\b/)) return 'name';
    if (combined.match(/\b(email|e.?mail|elektronik)\b/)) return 'email';
    if (combined.match(/\b(phone|tel|telefon|mobile|gsm)\b/)) return 'phone';
    if (combined.match(/\b(company|firma|şirket|organization|org)\b/)) return 'company';
    if (combined.match(/\b(subject|konu|başlık|title)\b/)) return 'subject';
    if (combined.match(/\b(message|mesaj|ileti|comment|note|text|description|how.can|what.can)\b/)) return 'message';

    // Fallback by field type
    if (field.type === 'email') return 'email';
    if (field.type === 'tel') return 'phone';
    if (field.type === 'textarea') return 'message';

    return '';
  }

  private async trySubmitForm(page: Page): Promise<boolean> {
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Send")',
      'button:has-text("Submit")',
      'button:has-text("Gönder")',
      'button:has-text("İlet")',
      '[class*="submit"]',
    ];

    for (const selector of submitSelectors) {
      try {
        const el = await page.$(selector);
        if (el) {
          await el.click();
          this.logger.log(`[contact-form] Clicked submit with selector: ${selector}`);
          return true;
        }
      } catch {
        // try next
      }
    }
    return false;
  }
}
