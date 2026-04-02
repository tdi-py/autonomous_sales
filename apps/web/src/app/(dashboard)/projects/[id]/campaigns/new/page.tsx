'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { CreateCampaignForm } from '@/components/campaigns/create-campaign-form';
import { ContentGenerating } from '@/components/campaigns/content-generating';
import { EmailSequenceEditor } from '@/components/campaigns/email-sequence-editor';
import { CallScriptEditor } from '@/components/campaigns/call-script-editor';
import { useCampaignContentStatus } from '@/hooks/use-campaign-content-status';

type Step = 'form' | 'generating' | 'review';

interface IcpProfile {
  id: string;
  label: string;
}

interface CampaignDetail {
  id: string;
  name: string;
  type: string;
  settings: Record<string, unknown>;
  sequences?: { grouped: Record<string, Record<string, unknown>>; flat: unknown[] };
  scripts?: unknown[];
}

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

export default function NewCampaignPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();

  const [step, setStep] = useState<Step>('form');
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaignDetail, setCampaignDetail] = useState<CampaignDetail | null>(null);
  const [icpProfiles, setIcpProfiles] = useState<IcpProfile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingStep, setRegeneratingStep] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // ICP'leri yükle
  useEffect(() => {
    const token = getToken();
    api.get<IcpProfile[]>(`/projects/${projectId}/icp-profiles`, token)
      .then(setIcpProfiles)
      .catch(() => {});
  }, [projectId]);

  // Content status polling
  useCampaignContentStatus({
    campaignId,
    enabled: step === 'generating',
    onReady: () => {
      loadCampaignDetail();
      setStep('review');
    },
    onError: (msg) => {
      setError(msg);
      setStep('review');
    },
  });

  async function loadCampaignDetail() {
    if (!campaignId) return;
    const token = getToken();
    try {
      const detail = await api.get<CampaignDetail>(`/campaigns/${campaignId}`, token);
      setCampaignDetail(detail);
    } catch {
      setError('Kampanya detayları yüklenemedi.');
    }
  }

  async function handleFormSubmit(data: {
    name: string;
    type: string;
    icpProfileId?: string;
    targetLanguage: string;
    additionalNotes?: string;
    offer?: string;
    scriptOnly?: boolean;
  }) {
    const token = getToken();
    setIsSubmitting(true);
    setError(null);
    try {
      const campaign = await api.post<{ id: string }>('/campaigns', {
        ...data,
        projectId,
      }, token);
      setCampaignId(campaign.id);
      setStep('generating');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kampanya oluşturulamadı');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegenerate() {
    if (!campaignId) return;
    const token = getToken();
    setError(null);
    try {
      await api.post(`/campaigns/${campaignId}/regenerate`, {}, token);
      setStep('generating');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yeniden üretim başlatılamadı');
    }
  }

  async function handleRegenerateStep(stepOrder: number) {
    if (!campaignId) return;
    const token = getToken();
    setRegeneratingStep(stepOrder);
    try {
      await api.post(`/campaigns/${campaignId}/regenerate-step/${stepOrder}`, {}, token);
      // Kısa polling yerine direct refetch
      setTimeout(() => {
        loadCampaignDetail();
        setRegeneratingStep(null);
      }, 5000);
    } catch {
      setRegeneratingStep(null);
    }
  }

  const sequences = (campaignDetail?.sequences?.grouped ?? {}) as Record<string, Record<string, unknown>>;
  const scripts = (campaignDetail?.scripts ?? []) as unknown[];
  const contentStatus = (campaignDetail?.settings?.contentStatus as string) ?? 'pending';
  const scriptOnly = campaignDetail?.settings?.scriptOnly as boolean | undefined;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href={`/projects/${projectId}/campaigns`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kampanyalar
      </Link>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step: Form */}
      {step === 'form' && (
        <div className="max-w-xl">
          <CreateCampaignForm
            projectId={projectId}
            icpProfiles={icpProfiles}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
          />
        </div>
      )}

      {/* Step: Generating */}
      {step === 'generating' && (
        <div className="rounded-2xl border border-border bg-card p-8 max-w-xl">
          <ContentGenerating
            contentStatus={contentStatus}
            contentError={null}
          />
        </div>
      )}

      {/* Step: Review — no content yet (generation failed/timed out) */}
      {step === 'review' && !campaignDetail && (
        <div className="rounded-2xl border border-border bg-card p-8 max-w-xl text-center space-y-4">
          <p className="text-sm font-medium">İçerik üretilemedi</p>
          <p className="text-sm text-muted-foreground">
            Worker servisi çalışmıyor olabilir. Kampanya kaydedildi — daha sonra kampanyalar listesinden tekrar deneyebilirsiniz.
          </p>
          <a
            href={`/projects/${projectId}/campaigns`}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-background text-sm hover:bg-accent transition-colors"
          >
            Kampanyalar Listesine Dön
          </a>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && campaignDetail && (
        <div className="space-y-6">
          {/* Header + actions */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{campaignDetail.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                İçeriği incele ve gerekirse düzenle.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-background text-sm hover:bg-accent transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tümünü Yeniden Üret
              </button>
              <button
                disabled
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary/50 text-primary-foreground text-sm cursor-not-allowed relative"
              >
                Kampanyayı Başlat
                <span className="absolute -top-2 -right-2 text-xs bg-yellow-500 text-white px-1.5 py-0.5 rounded-full">
                  Faz 3
                </span>
              </button>
            </div>
          </div>

          {/* Content status */}
          {contentStatus === 'error' && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              İçerik üretimi sırasında hata oluştu. Yeniden üretmeyi deneyin.
            </div>
          )}

          {/* Tabs */}
          <Tabs
            campaignId={campaignId!}
            campaignType={campaignDetail.type}
            sequences={sequences}
            scripts={scripts}
            scriptOnly={scriptOnly}
            regeneratingStep={regeneratingStep}
            onRegenerateStep={handleRegenerateStep}
            onRefresh={loadCampaignDetail}
          />
        </div>
      )}
    </div>
  );
}

// ─── Inline Tabs ──────────────────────────────────────────────────────────────

function Tabs({
  campaignId,
  campaignType,
  sequences,
  scripts,
  scriptOnly,
  regeneratingStep,
  onRegenerateStep,
  onRefresh,
}: {
  campaignId: string;
  campaignType: string;
  sequences: Record<string, Record<string, unknown>>;
  scripts: unknown[];
  scriptOnly?: boolean;
  regeneratingStep: number | null;
  onRegenerateStep: (step: number) => void;
  onRefresh: () => void;
}) {
  const showEmail = campaignType === 'cold_email' || campaignType === 'multi_channel';
  const showCall = campaignType === 'cold_call' || campaignType === 'multi_channel';

  const tabs = [
    ...(showEmail ? [{ id: 'email', label: '📧 Email Dizisi' }] : []),
    ...(showCall ? [{ id: 'call', label: '📞 Call Senaryosu' }] : []),
  ];

  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? 'email');

  return (
    <div className="space-y-4">
      {tabs.length > 1 && (
        <div className="flex gap-0 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'email' && showEmail && (
        <EmailSequenceEditor
          campaignId={campaignId}
          sequences={sequences as any}
          onRegenerate={onRegenerateStep}
          regeneratingStep={regeneratingStep}
          onRefresh={onRefresh}
        />
      )}

      {activeTab === 'call' && showCall && (
        <CallScriptEditor
          campaignId={campaignId}
          scripts={scripts as any}
          scriptOnly={scriptOnly}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}