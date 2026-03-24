import { Injectable, Logger } from '@nestjs/common';
import { createLLMProvider, getModelForAgent } from '@autonomous-sales/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommunicatorContext {
  productDescription: string;
  valueProposition: string;
  targetMarket: string;
  toneOfVoice: string;
  icpLabel: string;
  jobTitles: string[];
  painPoints: string[];
  industry: string;
  targetLanguage: string;
  industryTemplateHint?: string;
  // Faz 5: Platform kuralları ve özel prompt
  platformRulesContext?: string;
  customPromptText?: string;
}

export interface EmailVariant {
  subject: string;
  body: string;
  variant: 'A' | 'B';
}

export interface EmailStep {
  stepOrder: number;
  delayDays: number;
  variantA: EmailVariant;
  variantB: EmailVariant;
}

export interface ObjectionHandler {
  objection: string;
  response: string;
}

export interface DialogueNode {
  agent_says: string;
  if_positive?: string;
  if_negative?: string;
  if_busy?: string;
  if_qualified?: string;
  if_not_qualified?: string;
}

export interface CallScriptResult {
  opening_script: string;
  hook: string;
  qualification_questions: string[];
  objection_handlers: ObjectionHandler[];
  closing_script: string;
  dialogue_tree: Record<string, DialogueNode>;
}

export interface CommunicatorResult {
  emailSteps: EmailStep[];
  callScript: CallScriptResult;
  tokensUsed: number;
  modelUsed: string;
}

// ─── Step configs ─────────────────────────────────────────────────────────────

const EMAIL_STEPS = [
  {
    stepOrder: 1,
    delayDays: 0,
    note: '',
  },
  {
    stepOrder: 2,
    delayDays: 3,
    note: `Bu bir takip emaili. Alıcı ilk emaile yanıt vermedi.
- İlk emaile referans ver ama tekrar ETME
- Yeni bir değer önerisi veya sosyal kanıt sun
- Daha kısa ol (60-80 kelime)
- Baskıcı olma, merak uyandır`,
  },
  {
    stepOrder: 3,
    delayDays: 5,
    note: `Bu son takip emaili. Breakup email formatında yaz.
- Çok kısa (40-60 kelime)
- "Sizi rahatsız etmek istemiyorum" tonu
- Son bir değer önerisi veya kaynak bırak
- Kapıyı açık bırak: "İleride ilgilenirseniz buradayım"`,
  },
];

const SPAM_WORDS = [
  'free', 'limited time', 'act now', 'guaranteed', 'click here',
  'buy now', 'urgent', 'winner', 'congratulations', '100%',
  'no cost', 'risk-free',
];

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class CommunicatorService {
  private readonly logger = new Logger(CommunicatorService.name);

  async generateAll(ctx: CommunicatorContext): Promise<CommunicatorResult> {
    const llm = createLLMProvider();
    const model = getModelForAgent('communicator');

    let totalTokens = 0;

    // ── 1. Email Steps (paralel A+B per step) ─────────────────────────────
    const emailSteps: EmailStep[] = [];

    for (const stepCfg of EMAIL_STEPS) {
      this.logger.log(`[Communicator] Generating email step ${stepCfg.stepOrder}...`);

      const [resA, resB] = await Promise.all([
        this.generateEmailVariant(llm, model, ctx, stepCfg, 'A'),
        this.generateEmailVariant(llm, model, ctx, stepCfg, 'B'),
      ]);

      totalTokens += resA.tokens + resB.tokens;

      emailSteps.push({
        stepOrder: stepCfg.stepOrder,
        delayDays: stepCfg.delayDays,
        variantA: resA.variant,
        variantB: resB.variant,
      });
    }

    // ── 2. Call Script ────────────────────────────────────────────────────
    this.logger.log('[Communicator] Generating call script...');
    const { script, tokens: scriptTokens } = await this.generateCallScript(llm, model, ctx);
    totalTokens += scriptTokens;

    return {
      emailSteps,
      callScript: script,
      tokensUsed: totalTokens,
      modelUsed: model,
    };
  }

  // ─── Email Variant ───────────────────────────────────────────────────────

  private async generateEmailVariant(
    llm: ReturnType<typeof createLLMProvider>,
    model: string,
    ctx: CommunicatorContext,
    stepCfg: (typeof EMAIL_STEPS)[number],
    variant: 'A' | 'B',
  ): Promise<{ variant: EmailVariant; tokens: number }> {
    const variantNote =
      variant === 'B'
        ? '\n\nFarklı bir açıdan yaklaş. Farklı bir pain point kullan veya farklı bir CTA dene.'
        : '';

    const stepNote = stepCfg.note ? `\n\n## ADIM NOTU:\n${stepCfg.note}` : '';

    const langNote =
      ctx.targetLanguage !== 'en'
        ? `\n\nTÜM çıktıyı ${ctx.targetLanguage} dilinde yaz. Sadece JSON key'leri İngilizce kalsın.`
        : '';

    const templateNote = ctx.industryTemplateHint
      ? `\n\n## SEKTÖR ŞABLONU (referans al, birebir kopyalama):\n${ctx.industryTemplateHint}`
      : '';

    // Faz 5: Platform kuralları context
    const platformNote = ctx.platformRulesContext
      ? `\n\n## PLATFORM KURALLARI (bu sektörde kanıtlanmış — mutlaka uygula):\n${ctx.platformRulesContext}`
      : '';

    // Faz 5: Özel prompt (Strategist Agent tarafından güncellendi)
    const customNote = ctx.customPromptText
      ? `\n\n## STRATEJİST'TEN ÖZEL TALİMAT:\n${ctx.customPromptText}`
      : '';

    const prompt = `Sen dünya çapında bir B2B cold email uzmanısın. Aşağıdaki bilgileri kullanarak bir cold email yaz.

## KURALLAR:
- Kısa tut: maksimum 100 kelime body
- Subject line: 5-8 kelime, merak uyandırıcı ama clickbait değil
- İlk cümle: alıcının spesifik bir sorununa değin (pain point)
- Ürünü 1 cümlede açıkla, özellik listesi YAPMA
- CTA: tek, net, düşük bariyer
- Ton: ${ctx.toneOfVoice}
- Dil: ${ctx.targetLanguage}
- Spam tetikleyici kelimelerden KAÇIN: ${SPAM_WORDS.join(', ')}
- Doğal ve insan gibi yaz
- Kişiselleştirme: {{first_name}}, {{company_name}}, {{job_title}}
- Footer placeholder'ları EKLE (değiştirme): {{unsubscribe_link}}, {{physical_address}}, {{sender_name}}, {{sender_title}}

## PROJE BİLGİLERİ:
- Ürün: ${ctx.productDescription}
- Değer Önerisi: ${ctx.valueProposition}
- Hedef Kişi: ${ctx.icpLabel}
- Hedef Pozisyon: ${ctx.jobTitles.join(', ')}
- Hedef Kişinin Sorunları: ${ctx.painPoints.join(', ')}
- Sektör: ${ctx.industry}${stepNote}${templateNote}${platformNote}${customNote}${variantNote}${langNote}

## ÇIKTI FORMATI (SADECE JSON, başka hiçbir şey yazma):
{"subject":"string","body":"string","variant":"${variant}"}`;

    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await llm.generateCompletion({
        model,
        prompt: attempt > 0 ? prompt + '\n\nSADECE JSON döndür, markdown veya açıklama YOK.' : prompt,
        temperature: 0.7,
        maxTokens: 1500,
      });

      try {
        const cleaned = this.cleanJson(res.content);
        const parsed = JSON.parse(cleaned) as EmailVariant;
        return { variant: { ...parsed, variant }, tokens: res.tokensUsed };
      } catch {
        this.logger.warn(`[Communicator] Email variant ${variant} step ${stepCfg.stepOrder} JSON parse failed, attempt ${attempt + 1}`);
      }
    }

    // Fallback
    return {
      variant: {
        subject: `Quick question about {{company_name}}`,
        body: `Hi {{first_name}},\n\n${ctx.valueProposition}\n\nWould you be open to a 15-minute call?\n\n{{sender_name}}\n{{sender_title}}\n\n{{unsubscribe_link}}\n{{physical_address}}`,
        variant,
      },
      tokens: 0,
    };
  }

  // ─── Call Script ─────────────────────────────────────────────────────────

  private async generateCallScript(
    llm: ReturnType<typeof createLLMProvider>,
    model: string,
    ctx: CommunicatorContext,
  ): Promise<{ script: CallScriptResult; tokens: number }> {
    const langNote =
      ctx.targetLanguage !== 'en'
        ? `\n\nTÜM çıktıyı ${ctx.targetLanguage} dilinde yaz. Sadece JSON key'leri İngilizce kalsın.`
        : '';

    const platformNote = ctx.platformRulesContext
      ? `\n\n## PLATFORM KURALLARI:\n${ctx.platformRulesContext}`
      : '';

    const customNote = ctx.customPromptText
      ? `\n\n## STRATEJİST'TEN ÖZEL TALİMAT:\n${ctx.customPromptText}`
      : '';

    const prompt = `Sen dünya çapında bir B2B satış koçusun. Aşağıdaki bilgileri kullanarak bir cold call senaryosu yaz.

## SENARYO YAPISI:
1. Opening: İlk 10 saniye. Kendini tanıt, neden aradığını 1 cümlede söyle.
2. Hook: 15-20 saniye. Alıcının sorununu dile getir, çözümü 1 cümlede sun.
3. Qualification: 2-3 soru sor.
4. Objection Handling: En az 5 itiraz ve yanıt.
5. Closing: Meeting veya sonraki adım.

## İTİRAZ KARŞILAMA (EN AZ 5):
- "Not interested" / "İlgilenmiyorum"
- "No budget" / "Bütçemiz yok"
- "We already have a solution" / "Zaten bir çözümümüz var"
- "I'm not the decision maker" / "Karar verici ben değilim"
- "Send me an email" / "Bana email atın"
- "I'm busy right now" / "Şu an meşgulüm"

## PROJE BİLGİLERİ:
- Ürün: ${ctx.productDescription}
- Değer Önerisi: ${ctx.valueProposition}
- Hedef Kişi: ${ctx.icpLabel}
- Hedef Pozisyon: ${ctx.jobTitles.join(', ')}
- Sorunları: ${ctx.painPoints.join(', ')}
- Ton: ${ctx.toneOfVoice}
- Dil: ${ctx.targetLanguage}${platformNote}${customNote}${langNote}

## ÇIKTI FORMATI (SADECE JSON):
{
  "opening_script": "string",
  "hook": "string",
  "qualification_questions": ["string"],
  "objection_handlers": [{"objection":"string","response":"string"}],
  "closing_script": "string",
  "dialogue_tree": {
    "start": {"agent_says":"string","if_positive":"hook","if_negative":"objection_not_interested","if_busy":"objection_busy"},
    "hook": {"agent_says":"string","if_positive":"qualification","if_negative":"objection_no_need"},
    "qualification": {"agent_says":"string","if_qualified":"closing","if_not_qualified":"polite_end"},
    "closing": {"agent_says":"string"},
    "polite_end": {"agent_says":"string"}
  }
}`;

    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await llm.generateCompletion({
        model,
        prompt: attempt > 0 ? prompt + '\n\nSADECE JSON döndür.' : prompt,
        temperature: 0.7,
        maxTokens: 3000,
      });

      try {
        const cleaned = this.cleanJson(res.content);
        const parsed = JSON.parse(cleaned) as CallScriptResult;
        return { script: parsed, tokens: res.tokensUsed };
      } catch {
        this.logger.warn(`[Communicator] Call script JSON parse failed, attempt ${attempt + 1}`);
      }
    }

    // Fallback minimal script
    return {
      script: {
        opening_script: `Hi, this is [Name] from [Company]. I'm calling because we help ${ctx.icpLabel} with ${ctx.valueProposition}. Is this a good time?`,
        hook: `We've been helping businesses like yours ${ctx.valueProposition}. I wanted to see if that's something you're working on too.`,
        qualification_questions: [
          `Are you currently dealing with [pain point]?`,
          `Who on your team handles this?`,
          `Is this a priority for you this quarter?`,
        ],
        objection_handlers: [
          { objection: 'Not interested', response: `Totally understand. Can I ask what you're currently using to handle [pain point]?` },
          { objection: 'No budget', response: `Fair enough. Most of our customers said the same — until they saw the ROI. Would a quick 10-minute demo change that?` },
          { objection: 'We already have a solution', response: `Good to know. We actually work alongside existing tools. What are you using?` },
          { objection: "I'm not the decision maker", response: `No problem — who would be the right person to speak with?` },
          { objection: 'Send me an email', response: `Happy to. What email should I use, and what's the best subject line so it doesn't get buried?` },
        ],
        closing_script: `Great — let's set up a quick 15-minute call this week. Does Tuesday or Thursday work for you?`,
        dialogue_tree: {
          start: { agent_says: `Hi, is this {{contact_name}}? Great — I'm calling from [Company]. Quick question: are you currently handling [pain point] manually?`, if_positive: 'hook', if_negative: 'objection_not_interested', if_busy: 'objection_busy' },
          hook: { agent_says: `We built a tool that automates that for companies like yours. Takes about 15 minutes to set up. Worth a quick look?`, if_positive: 'qualification', if_negative: 'objection_no_need' },
          qualification: { agent_says: `Just a couple of questions — how many [relevant metric] are you dealing with per week?`, if_qualified: 'closing', if_not_qualified: 'polite_end' },
          closing: { agent_says: `Perfect. Let's schedule 15 minutes — I'll send a calendar link. What's your email?` },
          polite_end: { agent_says: `Totally fair. I'll shoot you a quick email with some resources. Have a great day!` },
        },
      },
      tokens: 0,
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private cleanJson(raw: string): string {
    return raw
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
  }
}