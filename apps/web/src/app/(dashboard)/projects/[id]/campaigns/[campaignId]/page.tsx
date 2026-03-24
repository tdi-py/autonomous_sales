'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, RefreshCw, BarChart2, Mail,
  Phone, Users, TrendingUp, Rocket, Pause, Play, Square,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { EmailSequenceEditor } from '@/components/campaigns/email-sequence-editor';
import { CallScriptEditor } from '@/components/campaigns/call-script-editor';
import { ContentGenerating } from '@/components/campaigns/content-generating';
import { PreflightCheckModal } from '@/components/campaigns/preflight-check-modal';
import { useCampaignContentStatus } from '@/hooks/use-campaign-content-status';

interface EmailSequence {
  id: string; stepOrder: number; subjectTemplate: string;
  bodyTemplate: string; delayDays: number; variantLabel: string;
}
interface CallScript {
  id: string; version: number; openingScript: string | null;
  dialogueTree: Record<string, unknown>; objectionHandlers: Array<{ objection: string; response: string }>;
  closingScript: string | null; language: string;
}
interface Campaign {
  id: string; name: string;
  type: 'cold_email' | 'cold_call' | 'linkedin' | 'multi_channel';
  status: 'draft' | 'active' | 'paused' | 'completed';
  settings: Record<string, unknown>; contentStatus: string;
  sequences?: { grouped: Record<string, { A?: EmailSequence; B?: EmailSequence }>; flat: EmailSequence[] };
  scripts?: CallScript[]; projectId: string; createdAt: string;
}
interface Metrics {
  total_leads: number; sent: number; opened: number; clicked: number;
  replied: number; bounced: number; open_rate: string; click_rate: string;
  reply_rate: string; bounce_rate: string;
  by_variant: { A: { sent: number; opened: number; open_rate: string }; B: { sent: number; opened: number; open_rate: string } };
}

const TYPE_LABEL: Record<Campaign['type'], string> = {
  cold_email: '📧 Cold Email', cold_call: '📞 Cold Call',
  linkedin: '💼 LinkedIn', multi_channel: '🚀 Multi-Channel',
};
const STATUS_STYLE: Record<Campaign['status'], string> = {
  draft: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  active: 'bg-green-500/10 text-green-600 border-green-500/20',
  paused: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  completed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

export default function CampaignDetailPage() {
  const { id: projectId, campaignId } = useParams<{ id: string; campaignId: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [regeneratingStep, setRegeneratingStep] = useState<number | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showPreflight, setShowPreflight] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const contentStatus = (campaign?.settings?.contentStatus as string) ?? 'pending';
  const isGenerating = contentStatus === 'generating';

  useCampaignContentStatus({
    campaignId, enabled: isGenerating,
    onReady: () => loadCampaign(),
    onError: () => loadCampaign(),
  });

  const loadCampaign = useCallback(async () => {
    const token = getToken();
    try {
      const [data, metricsData] = await Promise.all([
        api.get<Campaign>(`/campaigns/${campaignId}`, token),
        api.get<Metrics>(`/campaigns/${campaignId}/metrics`, token).catch(() => null),
      ]);
      setCampaign(data);
      setMetrics(metricsData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => { loadCampaign(); }, [loadCampaign]);

  async function handleRegenerate() {
    const token = getToken();
    setIsRegenerating(true);
    try {
      await api.post(`/campaigns/${campaignId}/regenerate`, {}, token);
      setCampaign((prev) => prev ? { ...prev, settings: { ...prev.settings, contentStatus: 'generating' } } : prev);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleRegenerateStep(stepOrder: number) {
    const token = getToken();
    setRegeneratingStep(stepOrder);
    try {
      await api.post(`/campaigns/${campaignId}/regenerate-step/${stepOrder}`, {}, token);
      setTimeout(() => { loadCampaign(); setRegeneratingStep(null); }, 6000);
    } catch { setRegeneratingStep(null); }
  }

  async function handlePause() {
    const token = getToken(); setActionLoading(true);
    try { await api.post(`/campaigns/${campaignId}/pause`, {}, token); await loadCampaign(); }
    catch (err) { setError((err as Error).message); }
    finally { setActionLoading(false); }
  }

  async function handleResume() {
    const token = getToken(); setActionLoading(true);
    try { await api.post(`/campaigns/${campaignId}/resume`, {}, token); await loadCampaign(); }
    catch (err) { setError((err as Error).message); }
    finally { setActionLoading(false); }
  }

  async function handleStop() {
    if (!confirm('Kampanyayı tamamen durdurmak istediğinize emin misiniz?')) return;
    const token = getToken(); setActionLoading(true);
    try { await api.post(`/campaigns/${campaignId}/stop`, {}, token); await loadCampaign(); }
    catch (err) { setError((err as Error).message); }
    finally { setActionLoading(false); }
  }

  async function handleLaunchConfirmed() {
    const token = getToken(); setActionLoading(true);
    try {
      await api.post(`/campaigns/${campaignId}/launch`, {}, token);
      setShowPreflight(false);
      await loadCampaign();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!campaign) return <div className="max-w-5xl"><Link href={`/projects/${projectId}/campaigns`} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Kampanyalar</Link><p className="text-sm text-destructive mt-4">{error || 'Kampanya bulunamadı.'}</p></div>;

  const showEmail = campaign.type === 'cold_email' || campaign.type === 'multi_channel';
  const showCall = campaign.type === 'cold_call' || campaign.type === 'multi_channel';
  const sequences = campaign.sequences?.grouped ?? {};
  const scripts = campaign.scripts ?? [];

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    ...(showEmail ? [{ id: 'email', label: 'Email Dizisi', icon: Mail }] : []),
    ...(showCall ? [{ id: 'call', label: 'Call Senaryosu', icon: Phone }] : []),
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {showPreflight && (
        <PreflightCheckModal
          campaignId={campaignId}
          campaignName={campaign.name}
          token={getToken()}
          onClose={() => setShowPreflight(false)}
          onConfirmLaunch={handleLaunchConfirmed}
        />
      )}

      <Link href={`/projects/${projectId}/campaigns`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Kampanyalar
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">{campaign.name}</h2>
            <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border capitalize', STATUS_STYLE[campaign.status])}>
              {campaign.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{TYPE_LABEL[campaign.type]}</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleRegenerate} disabled={isRegenerating || isGenerating}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-background text-sm hover:bg-accent transition-colors disabled:opacity-50">
            <RefreshCw className={cn('w-4 h-4', (isRegenerating || isGenerating) && 'animate-spin')} />
            Yeniden Üret
          </button>

          {/* Status-based action buttons */}
          {campaign.status === 'draft' && (
            <button onClick={() => setShowPreflight(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Rocket className="w-4 h-4" /> Başlat
            </button>
          )}
          {campaign.status === 'active' && (
            <>
              <button onClick={handlePause} disabled={actionLoading}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-background text-sm hover:bg-accent transition-colors disabled:opacity-50">
                <Pause className="w-4 h-4" /> Duraklat
              </button>
              <button onClick={handleStop} disabled={actionLoading}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-destructive/10 text-destructive text-sm hover:bg-destructive/20 transition-colors disabled:opacity-50">
                <Square className="w-4 h-4" /> Durdur
              </button>
            </>
          )}
          {campaign.status === 'paused' && (
            <button onClick={handleResume} disabled={actionLoading}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              <Play className="w-4 h-4" /> Devam Et
            </button>
          )}
        </div>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>}

      {/* Tab nav */}
      <div className="border-b border-border">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn('inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0',
                activeTab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Kampanya Tipi', value: TYPE_LABEL[campaign.type] },
                { label: 'Durum', value: campaign.status },
                { label: 'Dil', value: String(campaign.settings?.targetLanguage ?? 'en').toUpperCase() },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-border bg-card px-4 py-3 space-y-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>

            {/* Metrics summary */}
            {metrics && metrics.sent > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Gönderilen', value: `${metrics.sent}`, sub: `/ ${metrics.total_leads}` },
                  { label: 'Açılma Oranı', value: metrics.open_rate },
                  { label: 'Tıklanma', value: metrics.click_rate },
                  { label: 'Yanıt Oranı', value: metrics.reply_rate },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="rounded-lg border border-border bg-card px-4 py-3 space-y-1">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold">{value} <span className="text-xs font-normal text-muted-foreground">{sub}</span></p>
                  </div>
                ))}
              </div>
            )}

            {isGenerating && (
              <div className="rounded-2xl border border-border bg-card p-8 max-w-lg">
                <ContentGenerating contentStatus={contentStatus} contentError={campaign.settings?.contentError as string | null ?? null} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'email' && showEmail && (
          isGenerating ? (
            <div className="rounded-2xl border border-border bg-card p-8 max-w-lg">
              <ContentGenerating contentStatus={contentStatus} contentError={null} />
            </div>
          ) : (
            <EmailSequenceEditor
              campaignId={campaignId} sequences={sequences as any}
              onRegenerate={handleRegenerateStep} regeneratingStep={regeneratingStep} onRefresh={loadCampaign}
            />
          )
        )}

        {activeTab === 'call' && showCall && (
          isGenerating ? (
            <div className="rounded-2xl border border-border bg-card p-8 max-w-lg">
              <ContentGenerating contentStatus={contentStatus} contentError={null} />
            </div>
          ) : (
            <CallScriptEditor campaignId={campaignId} scripts={scripts} scriptOnly={campaign.settings?.scriptOnly as boolean | undefined} onRefresh={loadCampaign} />
          )
        )}

        {activeTab === 'leads' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed border-border">
            <Users className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm font-medium">Lead yönetimi</p>
            <p className="text-sm text-muted-foreground">Lead\'leri kampanyaya eklemek için API\'yi kullanın: POST /campaigns/{'{id}'}/leads</p>
          </div>
        )}

        {activeTab === 'performance' && metrics && (
          <div className="space-y-6">
            {/* A/B Comparison */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4">A/B Varyant Karşılaştırması</h3>
              <div className="grid grid-cols-2 gap-4">
                {(['A', 'B'] as const).map((variant) => {
                  const v = metrics.by_variant[variant];
                  return (
                    <div key={variant} className="rounded-lg border border-border p-4 space-y-2">
                      <p className="text-sm font-semibold">Varyant {variant}</p>
                      <p className="text-2xl font-bold">{v.open_rate}</p>
                      <p className="text-xs text-muted-foreground">açılma oranı · {v.sent} gönderim</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Full metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Gönderilen', value: metrics.sent },
                { label: 'Açılan', value: metrics.opened },
                { label: 'Tıklanan', value: metrics.clicked },
                { label: 'Yanıt', value: metrics.replied },
                { label: 'Açılma %', value: metrics.open_rate },
                { label: 'Tıklanma %', value: metrics.click_rate },
                { label: 'Yanıt %', value: metrics.reply_rate },
                { label: 'Bounce %', value: metrics.bounce_rate },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-border bg-card px-4 py-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-bold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'performance' && !metrics && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed border-border">
            <TrendingUp className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Henüz gönderim yapılmamış.</p>
          </div>
        )}
      </div>
    </div>
  );
}