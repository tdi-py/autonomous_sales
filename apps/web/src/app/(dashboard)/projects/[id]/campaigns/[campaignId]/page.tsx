'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  BarChart2,
  Mail,
  Phone,
  Users,
  TrendingUp,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { EmailSequenceEditor } from '@/components/campaigns/email-sequence-editor';
import { CallScriptEditor } from '@/components/campaigns/call-script-editor';
import { ContentGenerating } from '@/components/campaigns/content-generating';
import { useCampaignContentStatus } from '@/hooks/use-campaign-content-status';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailSequence {
  id: string;
  stepOrder: number;
  subjectTemplate: string;
  bodyTemplate: string;
  delayDays: number;
  variantLabel: string;
}

interface CallScript {
  id: string;
  version: number;
  openingScript: string | null;
  dialogueTree: Record<string, unknown>;
  objectionHandlers: Array<{ objection: string; response: string }>;
  closingScript: string | null;
  language: string;
}

interface SequenceGroups {
  [key: string]: {
    A?: EmailSequence;
    B?: EmailSequence;
  };
}

interface Campaign {
  id: string;
  name: string;
  type: 'cold_email' | 'cold_call' | 'linkedin' | 'multi_channel';
  status: 'draft' | 'active' | 'paused' | 'completed';
  settings: Record<string, unknown>;
  contentStatus: string;
  sequences?: {
    grouped: SequenceGroups;
    flat: EmailSequence[];
  };
  scripts?: CallScript[];
  projectId: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<Campaign['type'], string> = {
  cold_email:    '📧 Cold Email',
  cold_call:     '📞 Cold Call',
  linkedin:      '💼 LinkedIn',
  multi_channel: '🚀 Multi-Channel',
};

const STATUS_STYLE: Record<Campaign['status'], string> = {
  draft:     'bg-gray-500/10 text-gray-500 border-gray-500/20',
  active:    'bg-green-500/10 text-green-600 border-green-500/20',
  paused:    'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  completed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignDetailPage() {
  const { id: projectId, campaignId } = useParams<{ id: string; campaignId: string }>();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [regeneratingStep, setRegeneratingStep] = useState<number | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const contentStatus = (campaign?.settings?.contentStatus as string) ?? 'pending';
  const isGenerating = contentStatus === 'generating';

  useCampaignContentStatus({
    campaignId,
    enabled: isGenerating,
    onReady: () => loadCampaign(),
    onError: () => loadCampaign(),
  });

  async function loadCampaign() {
    const token = getToken();
    try {
      const data = await api.get<Campaign>(`/campaigns/${campaignId}`, token);
      setCampaign(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kampanya yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCampaign();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  async function handleRegenerate() {
    const token = getToken();
    setIsRegenerating(true);
    setError('');
    try {
      await api.post(`/campaigns/${campaignId}/regenerate`, {}, token);
      setCampaign((prev) =>
        prev
          ? { ...prev, settings: { ...prev.settings, contentStatus: 'generating' } }
          : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yeniden üretim başlatılamadı');
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleRegenerateStep(stepOrder: number) {
    const token = getToken();
    setRegeneratingStep(stepOrder);
    try {
      await api.post(`/campaigns/${campaignId}/regenerate-step/${stepOrder}`, {}, token);
      setTimeout(() => {
        loadCampaign();
        setRegeneratingStep(null);
      }, 6000);
    } catch {
      setRegeneratingStep(null);
    }
  }

  // ── Loading / Error ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-5xl space-y-4">
        <Link
          href={`/projects/${projectId}/campaigns`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kampanyalar
        </Link>
        <p className="text-sm text-destructive">{error || 'Kampanya bulunamadı.'}</p>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const showEmail = campaign.type === 'cold_email' || campaign.type === 'multi_channel';
  const showCall  = campaign.type === 'cold_call'  || campaign.type === 'multi_channel';
  const scriptOnly = campaign.settings?.scriptOnly as boolean | undefined;
  const sequences: SequenceGroups = campaign.sequences?.grouped ?? {};
  const scripts: CallScript[] = campaign.scripts ?? [];
  const additionalNotes = campaign.settings?.additionalNotes as string | undefined;

  const TABS = [
    { id: 'overview',    label: 'Overview',        icon: BarChart2  },
    ...(showEmail ? [{ id: 'email', label: 'Email Dizisi',    icon: Mail   }] : []),
    ...(showCall  ? [{ id: 'call',  label: 'Call Senaryosu',  icon: Phone  }] : []),
    { id: 'leads',       label: 'Leads',            icon: Users      },
    { id: 'performance', label: 'Performance',      icon: TrendingUp },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Back */}
      <Link
        href={`/projects/${projectId}/campaigns`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Kampanyalar
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">{campaign.name}</h2>
            <span
              className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-full border capitalize',
                STATUS_STYLE[campaign.status],
              )}
            >
              {campaign.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {TYPE_LABEL[campaign.type]}
            {contentStatus === 'ready'      && ' · ✅ İçerik hazır'}
            {contentStatus === 'generating' && ' · ⏳ Üretiliyor...'}
            {contentStatus === 'error'      && ' · ❌ Üretim hatası'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating || isGenerating}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-background text-sm hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', (isRegenerating || isGenerating) && 'animate-spin')} />
            Yeniden Üret
          </button>
          <button
            disabled
            className="relative inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary/50 text-primary-foreground text-sm cursor-not-allowed"
          >
            Kampanyayı Başlat
            <span className="absolute -top-2 -right-2 text-xs bg-yellow-500 text-white px-1.5 py-0.5 rounded-full">
              Faz 3
            </span>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Tab nav */}
      <div className="border-b border-border">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0',
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Kampanya Tipi',  value: TYPE_LABEL[campaign.type] },
                { label: 'Durum',          value: campaign.status },
                { label: 'Dil',            value: String(campaign.settings?.targetLanguage ?? 'en').toUpperCase() },
                {
                  label: 'İçerik Durumu',
                  value:
                    contentStatus === 'ready'      ? '✅ Hazır'       :
                    contentStatus === 'generating' ? '⏳ Üretiliyor'  :
                    contentStatus === 'error'      ? '❌ Hata'         : '— Bekliyor',
                },
                {
                  label: 'Email Adımları',
                  value: campaign.sequences?.flat?.length
                    ? `${Math.ceil(campaign.sequences.flat.length / 2)} adım (A/B)`
                    : '—',
                },
                {
                  label: 'Script Versiyonu',
                  value: scripts.length > 0 ? `v${scripts[0].version}` : '—',
                },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-border bg-card px-4 py-3 space-y-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>

            {isGenerating && (
              <div className="rounded-2xl border border-border bg-card p-8 max-w-lg">
                <ContentGenerating
                  contentStatus={contentStatus}
                  contentError={campaign.settings?.contentError as string | null ?? null}
                />
              </div>
            )}

            {additionalNotes && (
              <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-1">
                <p className="text-xs text-muted-foreground">Ek Notlar</p>
                <p className="text-sm">{additionalNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* Email Dizisi */}
        {activeTab === 'email' && showEmail && (
          isGenerating ? (
            <div className="rounded-2xl border border-border bg-card p-8 max-w-lg">
              <ContentGenerating contentStatus={contentStatus} contentError={null} />
            </div>
          ) : (
            <EmailSequenceEditor
              campaignId={campaignId}
              sequences={sequences}
              onRegenerate={handleRegenerateStep}
              regeneratingStep={regeneratingStep}
              onRefresh={loadCampaign}
            />
          )
        )}

        {/* Call Senaryosu */}
        {activeTab === 'call' && showCall && (
          isGenerating ? (
            <div className="rounded-2xl border border-border bg-card p-8 max-w-lg">
              <ContentGenerating contentStatus={contentStatus} contentError={null} />
            </div>
          ) : (
            <CallScriptEditor
              campaignId={campaignId}
              scripts={scripts}
              scriptOnly={scriptOnly}
              onRefresh={loadCampaign}
            />
          )
        )}

        {/* Leads */}
        {activeTab === 'leads' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed border-border">
            <Users className="w-8 h-8 text-muted-foreground" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Lead atama — Faz 3</p>
              <p className="text-sm text-muted-foreground">
                Leads bu kampanyaya Faz 3&apos;te atanacak.
              </p>
            </div>
            <Link href={`/projects/${projectId}/leads`} className="text-sm text-primary hover:underline">
              Tüm leadleri gör →
            </Link>
          </div>
        )}

        {/* Performance */}
        {activeTab === 'performance' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed border-border">
            <TrendingUp className="w-8 h-8 text-muted-foreground" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Performans metrikleri — Faz 5</p>
              <p className="text-sm text-muted-foreground">
                Open rate, reply rate ve dönüşüm istatistikleri Faz 5&apos;te burada görünecek.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}