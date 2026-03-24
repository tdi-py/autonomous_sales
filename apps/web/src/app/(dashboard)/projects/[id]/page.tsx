'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Globe,
  Loader2,
  Megaphone,
  Users,
  BarChart2,
  Settings,
  ArrowLeft,
  Zap,
  Mail,
  Brain,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  websiteUrl?: string;
  industry?: string;
  businessType: string;
  status: string;
  defaultLanguage: string;
}

interface StrategyOverview {
  healthScore: number;
  pendingDecisions: number;
  activeLearnedRules: number;
  activeCampaigns: number;
}

const TABS = [
  { id: 'overview',       label: 'Overview',          icon: BarChart2 },
  { id: 'campaigns',      label: 'Campaigns',          icon: Megaphone },
  { id: 'leads',          label: 'Leads',              icon: Users },
  { id: 'email-accounts', label: 'Email Hesapları',    icon: Mail },
  { id: 'strategy',       label: 'Strategy',           icon: Brain },
  { id: 'settings',       label: 'Settings',           icon: Settings },
];

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [strategyOverview, setStrategyOverview] = useState<StrategyOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }

    Promise.all([
      api.get<Project>(`/projects/${id}`, token).catch(() => null),
      api.get<StrategyOverview>(`/projects/${id}/strategy/overview`, token).catch(() => null),
    ]).then(([proj, strategy]) => {
      if (proj) setProject(proj);
      if (strategy) setStrategyOverview(strategy);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayProject = project ?? {
    id,
    name: 'Sample Project',
    websiteUrl: 'https://example.com',
    industry: 'SaaS',
    businessType: 'saas',
    status: 'onboarding',
    defaultLanguage: 'en',
  };

  const healthScore = strategyOverview?.healthScore ?? 0;
  const healthColor =
    healthScore >= 80 ? 'text-green-600' :
    healthScore >= 60 ? 'text-yellow-600' :
    healthScore >= 40 ? 'text-orange-500' :
    'text-red-500';

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Back */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All Projects
      </Link>

      {/* Project header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">{displayProject.name}</h2>
            {strategyOverview && healthScore > 0 && (
              <span className={cn('text-sm font-semibold', healthColor)}>
                {healthScore}/100
              </span>
            )}
          </div>
          {displayProject.websiteUrl && (
            <a
              href={displayProject.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {displayProject.websiteUrl.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Strategy pending decisions badge */}
          {strategyOverview && strategyOverview.pendingDecisions > 0 && (
            <Link
              href={`/projects/${id}/strategy`}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-orange-500/10 text-orange-600 text-sm font-medium hover:bg-orange-500/20 transition-colors border border-orange-500/20"
            >
              <AlertTriangle className="w-4 h-4" />
              {strategyOverview.pendingDecisions} bekleyen karar
            </Link>
          )}
          <button className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Zap className="w-4 h-4" />
            Analyze with AI
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0',
                activeTab === tabId
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
              {tabId === 'strategy' && strategyOverview && strategyOverview.pendingDecisions > 0 && (
                <span className="ml-1 flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs font-semibold">
                  {strategyOverview.pendingDecisions}
                </span>
              )}
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
                { label: 'Business Type',  value: displayProject.businessType },
                { label: 'Industry',       value: displayProject.industry ?? '—' },
                { label: 'Language',       value: displayProject.defaultLanguage.toUpperCase() },
                { label: 'Status',         value: displayProject.status },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-border bg-card px-4 py-3 space-y-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium capitalize">{value}</p>
                </div>
              ))}
            </div>

            {/* Strategy summary card */}
            {strategyOverview && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  Strategy Özeti
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Sağlık Skoru</p>
                    <p className={cn('text-xl font-bold', healthColor)}>{healthScore}/100</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bekleyen Karar</p>
                    <p className="text-xl font-bold text-orange-500">{strategyOverview.pendingDecisions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Öğrenilen Kural</p>
                    <p className="text-xl font-bold text-green-600">{strategyOverview.activeLearnedRules}</p>
                  </div>
                </div>
                <Link
                  href={`/projects/${id}/strategy`}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Brain className="w-3.5 h-3.5" />
                  Strategy Panosunu Aç →
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Megaphone className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Kampanyalarınızı görüntüleyin ve yönetin.</p>
            <Link href={`/projects/${id}/campaigns`} className="text-sm text-primary hover:underline">
              Kampanyalara git →
            </Link>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Users className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Lead listesini görüntüleyin.</p>
            <Link href={`/projects/${id}/leads`} className="text-sm text-primary hover:underline">
              Leadlere git →
            </Link>
          </div>
        )}

        {activeTab === 'email-accounts' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4 rounded-xl border border-dashed border-border">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Email Hesabı Yönetimi</p>
              <p className="text-sm text-muted-foreground">
                SMTP hesaplarını bağlayın, DNS kontrolü yapın ve ısındırma sürecini başlatın.
              </p>
            </div>
            <Link
              href={`/projects/${id}/email-accounts`}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email Hesaplarını Yönet
            </Link>
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4 rounded-xl border border-dashed border-border">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Strateji Paneli</p>
              <p className="text-sm text-muted-foreground">
                AI analizi, A/B test kararları ve öğrenilmiş kurallar.
              </p>
            </div>
            <Link
              href={`/projects/${id}/strategy`}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Brain className="w-4 h-4" />
              Strategy Panosunu Aç
            </Link>
          </div>
        )}

        {activeTab === 'settings' && (
          <ProjectSettings projectId={id} />
        )}
      </div>
    </div>
  );
}

// ─── Project Settings (Faz 5: Strategy auto-mode) ────────────────────────────

function ProjectSettings({ projectId }: { projectId: string }) {
  const [settings, setSettings] = useState({
    strategyAutoMode: false,
    strategyReviewInterval: 24,
    autoApplyAbTest: false,
    autoApplyPromptUpdates: false,
    autoApplyObjectionHandlers: true,
    autoPauseBounceThreshold: 10,
    autoStopSpamThreshold: 0.3,
  });
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    const token = getToken();
    try {
      await api.patch(`/projects/${projectId}`, { settings }, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Strategy Auto-Mode */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="border-b border-border pb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Strateji Otomasyonu
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Strategist Agent kararlarının otomatik uygulanıp uygulanmayacağını belirleyin.
          </p>
        </div>

        <div className="space-y-4">
          {/* Review interval */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Analiz Sıklığı (saat)</label>
            <select
              value={settings.strategyReviewInterval}
              onChange={(e) => setSettings((s) => ({ ...s, strategyReviewInterval: Number(e.target.value) }))}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={12}>Her 12 saatte</option>
              <option value={24}>Her 24 saatte (önerilen)</option>
              <option value={48}>Her 48 saatte</option>
              <option value={168}>Her haftada</option>
            </select>
          </div>

          {/* Toggles */}
          {[
            {
              key: 'autoApplyAbTest',
              label: 'A/B Test Kazananlarını Otomatik Uygula',
              desc: 'Güven skoru %70+ olan A/B test kararları otomatik uygulanır.',
            },
            {
              key: 'autoApplyPromptUpdates',
              label: 'Prompt Güncellemelerini Otomatik Uygula',
              desc: 'Strategist yeni prompt versiyonu önerdiğinde otomatik aktifleştirilir.',
            },
            {
              key: 'autoApplyObjectionHandlers',
              label: 'Yeni İtiraz Karşılamalarını Otomatik Ekle',
              desc: 'Tespit edilen yeni itirazlar için otomatik yanıt eklenir. (Genellikle güvenlidir)',
            },
          ].map(({ key, label, desc }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={settings[key as keyof typeof settings] as boolean}
                  onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.checked }))}
                  className="sr-only"
                />
                <div
                  onClick={() => setSettings((s) => ({ ...s, [key]: !s[key as keyof typeof settings] }))}
                  className={cn(
                    'w-10 h-5 rounded-full transition-colors cursor-pointer',
                    settings[key as keyof typeof settings] ? 'bg-primary' : 'bg-muted',
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded-full bg-white shadow transition-transform mt-0.5 ml-0.5',
                    settings[key as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0',
                  )} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </label>
          ))}

          {/* Bounce threshold */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Otomatik Duraklat — Bounce Eşiği (%){' '}
              <span className="text-muted-foreground font-normal text-xs">(kapatılamaz)</span>
            </label>
            <input
              type="number"
              min={5}
              max={20}
              value={settings.autoPauseBounceThreshold}
              onChange={(e) => setSettings((s) => ({ ...s, autoPauseBounceThreshold: Number(e.target.value) }))}
              className="w-32 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Bounce rate bu eşiği aştığında kampanya her zaman otomatik duraklatılır.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Kaydet
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">✓ Kaydedildi</span>}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Diğer proje ayarları — yakında eklenecek.
        </p>
      </div>
    </div>
  );
}