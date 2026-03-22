import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

import * as schema from '@autonomous-sales/database';
import { DATABASE_TOKEN } from '../../database/database.module';
import { QUEUE_NAMES } from '@autonomous-sales/shared';
import type {
  CreateCampaignDto,
  UpdateCampaignDto,
  CreateEmailSequenceDto,
  UpdateEmailSequenceDto,
  CreateCallScriptDto,
  UpdateCallScriptDto,
} from './dto/campaign.dto';

export interface PreflightCheck {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  action?: string; // optional CTA
}

export interface PreflightResult {
  canLaunch: boolean;
  checks: PreflightCheck[];
  warnings: PreflightCheck[];
  blockers: PreflightCheck[];
}

@Injectable()
export class CampaignsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    @InjectQueue(QUEUE_NAMES.GENERATE_CAMPAIGN_CONTENT) private generateQueue: Queue,
  ) {}

  // ─── Campaign CRUD ─────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateCampaignDto) {
    await this.assertProjectAccess(dto.projectId, userId);

    const [campaign] = await this.db
      .insert(schema.campaigns)
      .values({
        projectId: dto.projectId,
        name: dto.name,
        type: (dto.type as schema.NewCampaign['type']) ?? 'cold_email',
        status: 'draft',
        settings: {
          icpProfileId: dto.icpProfileId,
          targetLanguage: dto.targetLanguage ?? 'en',
          additionalNotes: dto.additionalNotes,
          scriptOnly: dto.scriptOnly ?? false,
          contentStatus: 'generating',
        },
      })
      .returning();

    // Job'ı tetikle
    const job = await this.generateQueue.add(
      {
        projectId: dto.projectId,
        campaignId: campaign.id,
        workspaceId: '',   // assertProjectAccess'te alınabilir ama şimdilik boş
        agentType: 'communicator',
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );

    return { ...campaign, contentStatus: 'generating', jobId: job.id };
  }

  async findAll(userId: string, projectId: string) {
    await this.assertProjectAccess(projectId, userId);
    const campaigns = await this.db.query.campaigns.findMany({
      where: eq(schema.campaigns.projectId, projectId),
      orderBy: (t: any, { desc }: any) => [desc(t.createdAt)],
    });

    return campaigns.map((c: schema.Campaign) => ({
      ...c,
      contentStatus: (c.settings as Record<string, unknown>)?.contentStatus ?? 'pending',
    }));
  }

  async findOne(id: string, userId: string) {
    const campaign = await this.db.query.campaigns.findFirst({
      where: eq(schema.campaigns.id, id),
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    await this.assertProjectAccess(campaign.projectId, userId);

    const settings = (campaign.settings ?? {}) as Record<string, unknown>;
    const contentStatus = settings.contentStatus ?? 'pending';

    // İçerik üretilmişse sequence + script'leri de döndür
    if (contentStatus === 'ready') {
      const sequences = await this.getSequences(id, userId);
      const scripts = await this.getScripts(id, userId);
      return { ...campaign, contentStatus, sequences, scripts };
    }

    return { ...campaign, contentStatus };
  }

  async update(id: string, userId: string, dto: UpdateCampaignDto) {
    const campaign = await this.findOne(id, userId);
    const [updated] = await this.db
      .update(schema.campaigns)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.campaigns.id, campaign.id))
      .returning();
    return updated;
  }

  async remove(id: string, userId: string) {
    const campaign = await this.findOne(id, userId);
    await this.db.delete(schema.campaigns).where(eq(schema.campaigns.id, campaign.id));
    return { deleted: true };
  }

  // ─── Content Status ────────────────────────────────────────────────────────

  async getContentStatus(id: string, userId: string) {
    const campaign = await this.db.query.campaigns.findFirst({
      where: eq(schema.campaigns.id, id),
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    await this.assertProjectAccess(campaign.projectId, userId);

    const settings = (campaign.settings ?? {}) as Record<string, unknown>;
    return {
      campaignId: id,
      contentStatus: settings.contentStatus ?? 'pending',
      generatedAt: settings.generatedAt ?? null,
      contentError: settings.contentError ?? null,
    };
  }

  // ─── Email Sequences ───────────────────────────────────────────────────────

  async getSequences(campaignId: string, userId: string) {
    await this.findOne(campaignId, userId);
    const rows = await this.db.query.emailSequences.findMany({
      where: eq(schema.emailSequences.campaignId, campaignId),
      orderBy: (t: any, { asc }: any) => [asc(t.stepOrder), asc(t.variantLabel)],
    });

    // Adım + varyant'a göre grupla: { step1: { A: {...}, B: {...} }, ... }
    const grouped: Record<string, Record<string, schema.EmailSequence>> = {};
    for (const row of rows) {
      const key = `step${row.stepOrder}`;
      if (!grouped[key]) grouped[key] = {};
      grouped[key][row.variantLabel ?? 'A'] = row;
    }

    return { grouped, flat: rows };
  }

  async createSequenceStep(campaignId: string, userId: string, dto: CreateEmailSequenceDto) {
    await this.findOne(campaignId, userId);
    const [step] = await this.db
      .insert(schema.emailSequences)
      .values({ campaignId, ...dto })
      .returning();
    return step;
  }

  async updateSequenceStep(
    campaignId: string,
    sequenceId: string,
    userId: string,
    dto: UpdateEmailSequenceDto,
  ) {
    await this.findOne(campaignId, userId);
    const seq = await this.db.query.emailSequences.findFirst({
      where: and(
        eq(schema.emailSequences.id, sequenceId),
        eq(schema.emailSequences.campaignId, campaignId),
      ),
    });
    if (!seq) throw new NotFoundException('Email sequence not found');

    const [updated] = await this.db
      .update(schema.emailSequences)
      .set(dto)
      .where(eq(schema.emailSequences.id, sequenceId))
      .returning();
    return updated;
  }

  // ─── Call Scripts ──────────────────────────────────────────────────────────

  async getScripts(campaignId: string, userId: string) {
    await this.findOne(campaignId, userId);
    return this.db.query.callScripts.findMany({
      where: eq(schema.callScripts.campaignId, campaignId),
      orderBy: (t: any, { desc }: any) => [desc(t.version)],
    });
  }

  async createScript(campaignId: string, userId: string, dto: CreateCallScriptDto) {
    await this.findOne(campaignId, userId);
    const existing = await this.db.query.callScripts.findMany({
      where: eq(schema.callScripts.campaignId, campaignId),
    });
    const nextVersion = existing.length + 1;

    const [script] = await this.db
      .insert(schema.callScripts)
      .values({ campaignId, version: nextVersion, ...dto })
      .returning();
    return script;
  }

  async updateScript(
    campaignId: string,
    scriptId: string,
    userId: string,
    dto: UpdateCallScriptDto,
  ) {
    await this.findOne(campaignId, userId);
    const script = await this.db.query.callScripts.findFirst({
      where: and(
        eq(schema.callScripts.id, scriptId),
        eq(schema.callScripts.campaignId, campaignId),
      ),
    });
    if (!script) throw new NotFoundException('Call script not found');

    const [updated] = await this.db
      .update(schema.callScripts)
      .set(dto)
      .where(eq(schema.callScripts.id, scriptId))
      .returning();
    return updated;
  }

  // ─── Regenerate ────────────────────────────────────────────────────────────

  async regenerate(id: string, userId: string) {
    const campaign = await this.findOne(id, userId);

    // Status güncelle
    await this.db
      .update(schema.campaigns)
      .set({
        settings: {
          ...(campaign.settings as Record<string, unknown>),
          contentStatus: 'generating',
          contentError: null,
        },
        updatedAt: new Date(),
      })
      .where(eq(schema.campaigns.id, id));

    const job = await this.generateQueue.add(
      {
        projectId: campaign.projectId,
        campaignId: id,
        workspaceId: '',
        agentType: 'communicator',
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );

    return { campaignId: id, contentStatus: 'generating', jobId: job.id };
  }

  async regenerateStep(id: string, stepOrder: number, userId: string) {
    const campaign = await this.findOne(id, userId);

    // Sadece bu adımın sequence kayıtlarını sil
    const seqsToDelete = await this.db.query.emailSequences.findMany({
      where: and(
        eq(schema.emailSequences.campaignId, id),
        eq(schema.emailSequences.stepOrder, stepOrder),
      ),
    });

    for (const seq of seqsToDelete) {
      await this.db.delete(schema.emailSequences)
        .where(eq(schema.emailSequences.id, seq.id));
    }

    // Yeni job (step-level regeneration için worker'da handling gerekir — şimdilik full regen)
    const job = await this.generateQueue.add(
      {
        projectId: campaign.projectId,
        campaignId: id,
        workspaceId: '',
        agentType: 'communicator',
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );

    return { campaignId: id, stepOrder, contentStatus: 'generating', jobId: job.id };
  }

  // ─── Preflight Check ──────────────────────────────────────────────────────

  async preflightCheck(campaignId: string, userId: string): Promise<PreflightResult> {
    const campaign = await this.findOne(campaignId, userId);
    const projectId = campaign.projectId;

    const checks: PreflightCheck[] = [];

    // ── 1. Email account bağlı mı? ──────────────────────────────────────────
    const emailAccounts = await this.db.query.emailAccounts.findMany({
      where: eq(schema.emailAccounts.projectId, projectId),
    }) as schema.EmailAccount[];

    if (emailAccounts.length === 0) {
      checks.push({
        id: 'email_account',
        label: 'Email Hesabı',
        status: 'fail',
        message: 'Email hesabı bağlanmamış.',
        action: 'Önce email hesabı bağlayın',
      });
    } else {
      const ready = emailAccounts.find((a) => a.warmupStatus === 'ready');
      const warming = emailAccounts.find((a) => a.warmupStatus === 'warming');
      const account = ready ?? warming ?? emailAccounts[0];

      // ── 2. DNS kayıtları ──────────────────────────────────────────────────
      const spfOk = account.spfValid ?? false;
      const dkimOk = account.dkimValid ?? false;
      const dmarcOk = account.dmarcValid ?? false;

      if (!spfOk || !dkimOk) {
        checks.push({
          id: 'dns',
          label: 'DNS Kayıtları',
          status: 'fail',
          message: `DNS eksik: ${!spfOk ? 'SPF ' : ''}${!dkimOk ? 'DKIM ' : ''}${!dmarcOk ? 'DMARC' : ''}.`,
          action: 'Email hesabı sayfasından DNS yapılandırmasını tamamlayın',
        });
      } else if (!dmarcOk) {
        checks.push({
          id: 'dns',
          label: 'DNS Kayıtları',
          status: 'warn',
          message: 'SPF ve DKIM geçerli ancak DMARC eksik.',
          action: 'DMARC kaydı ekleyerek korumayı güçlendirin',
        });
      } else {
        checks.push({
          id: 'dns',
          label: 'DNS Kayıtları',
          status: 'pass',
          message: 'SPF, DKIM ve DMARC geçerli ✅',
        });
      }

      // ── 3. Isındırma durumu ──────────────────────────────────────────────
      checks.push({
        id: 'email_account',
        label: 'Email Hesabı',
        status: 'pass',
        message: `${account.emailAddress} bağlı`,
      });

      if (account.warmupStatus === 'not_started') {
        checks.push({
          id: 'warmup',
          label: 'Email Isındırma',
          status: 'warn',
          message: 'Hesap henüz ısındırılmamış. Teslim edilebilirlik sorunları yaşanabilir.',
          action: 'Isındırmayı başlatın',
        });
      } else if (account.warmupStatus === 'warming') {
        const daysLeft = 28 - (account.warmupDay ?? 0);
        checks.push({
          id: 'warmup',
          label: 'Email Isındırma',
          status: 'warn',
          message: `Isındırma devam ediyor — ${daysLeft} gün kaldı. Günlük limit: ${account.dailySendLimit} email.`,
        });
      } else if (account.warmupStatus === 'ready') {
        checks.push({
          id: 'warmup',
          label: 'Email Isındırma',
          status: 'pass',
          message: 'Hesap hazır ✅',
        });
      } else {
        checks.push({
          id: 'warmup',
          label: 'Email Isındırma',
          status: 'fail',
          message: 'Isındırma duraklamış.',
          action: 'Isındırmayı devam ettirin',
        });
      }
    }

    // ── 4. Kampanya içeriği hazır mı? ────────────────────────────────────────
    const settings = (campaign.settings ?? {}) as Record<string, unknown>;
    const contentStatus = settings.contentStatus as string ?? 'pending';

    if (contentStatus === 'ready') {
      checks.push({
        id: 'content',
        label: 'Kampanya İçeriği',
        status: 'pass',
        message: 'Email dizisi ve içerik hazır ✅',
      });
    } else if (contentStatus === 'generating') {
      checks.push({
        id: 'content',
        label: 'Kampanya İçeriği',
        status: 'warn',
        message: 'İçerik henüz üretiliyor. Tamamlanmasını bekleyin.',
      });
    } else {
      checks.push({
        id: 'content',
        label: 'Kampanya İçeriği',
        status: 'fail',
        message: 'Kampanya içeriği oluşturulmamış.',
        action: 'Kampanya içeriği oluşturun',
      });
    }

    // ── 5. Lead listesi var mı? ──────────────────────────────────────────────
    const leadCount = await this.db.query.leads.findMany({
      where: eq(schema.leads.projectId, projectId),
      limit: 1,
    });

    if (leadCount.length === 0) {
      checks.push({
        id: 'leads',
        label: 'Lead Listesi',
        status: 'fail',
        message: 'Kampanyaya lead eklenmemiş.',
        action: 'Lead ekleyin',
      });
    } else {
      checks.push({
        id: 'leads',
        label: 'Lead Listesi',
        status: 'pass',
        message: 'Lead listesi mevcut ✅',
      });
    }

    // ── 6. Son deliverability testi ──────────────────────────────────────────
    if (emailAccounts.length > 0) {
      const lastTest = await this.db.query.deliverabilityTests.findFirst({
        where: eq(schema.deliverabilityTests.emailAccountId, emailAccounts[0].id),
        orderBy: (t: any, { desc }: any) => [desc(t.testedAt)],
      });

      if (!lastTest) {
        checks.push({
          id: 'deliverability',
          label: 'Spam Testi',
          status: 'warn',
          message: 'Hiç spam testi yapılmamış.',
          action: 'Gönderim öncesi spam testi çalıştırın',
        });
      } else if ((lastTest.overallScore ?? 0) < 50) {
        checks.push({
          id: 'deliverability',
          label: 'Spam Testi',
          status: 'fail',
          message: `Son spam testi başarısız (skor: ${lastTest.overallScore ?? 0}/100).`,
          action: 'Spam testini tekrar çalıştırın',
        });
      } else {
        checks.push({
          id: 'deliverability',
          label: 'Spam Testi',
          status: 'pass',
          message: `Son spam testi geçti (skor: ${lastTest.overallScore}/100) ✅`,
        });
      }
    }

    const blockers = checks.filter((c) => c.status === 'fail');
    const warnings = checks.filter((c) => c.status === 'warn');
    const canLaunch = blockers.length === 0;

    return { canLaunch, checks, warnings, blockers };
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