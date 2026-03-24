'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Brain, RefreshCw, Loader2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { HealthScoreCard } from '@/components/strategy/health-score-card';
import { PendingDecisions } from '@/components/strategy/pending-decisions';
import { DecisionTimeline } from '@/components/strategy/decision-timeline';
import { LearnedRulesList } from '@/components/strategy/learned-rules-list';
import { AnalyticsCharts } from '@/components/strategy/analytics-charts';

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

interface StrategyOverview {
  healthScore: number;
  lastAnalyzedAt: string | null;
  pendingDecisions: number;
  activeLearnedRules: number;
  activeCampaigns: number;
  pendingDecisionsList: any[];
}

export default function StrategyPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [overview, setOverview] = useState<StrategyOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'decisions' | 'rules' | 'analytics'>('overview');

  const loadOverview = useCallback(async () => {
    const token = getToken();
    try {
      const data = await api.get<StrategyOverview>(`/projects/${projectId}/strategy/overview`, token);
      setOverview(data);
    } catch (err) {
      console.error('Strategy overview load error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  async function handleRunNow() {
    const token = getToken();
    setRunning(true);
    try {
      await api.post(`/projects/${projectId}/strategy/run-now`, {}, token);
      setTimeout(() => {
        loadOverview();
        setRunning(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Henüz analiz yapılmadı';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return 'Az önce';
    if (hours < 24) return `${hours} saat önce`;
    return `${Math.floor(hours / 24)} gün önce`;
  };

  const TABS = [
    { id: 'overview', label: 'Genel Bakış' },
    { id: 'decisions', label: `Kararlar ${overview?.pendingDecisions ? `(${overview.pendingDecisions})` : ''}` },
    { id: 'rules', label: 'Öğrenilen Kurallar' },
    { id: 'analytics', label: 'Analitik' },
  ] as const;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href={`/projects/${projectId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Projeye Dön
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Strateji Paneli
          </h2>
          <p className="text-sm text-muted-foreground">
            Son analiz: {timeAgo(overview?.lastAnalyzedAt ?? null)}
          </p>
        </div>
        <button
          onClick={handleRunNow}
          disabled={running}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Analiz Ediliyor...' : 'Şimdi Analiz Et'}
        </button>
      </div>

      {/* Health Score Quick Summary */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <HealthScoreCard score={overview.healthScore} />
          {[
            { label: 'Aktif Kampanya', value: overview.activeCampaigns, color: 'text-blue-600' },
            { label: 'Bekleyen Karar', value: overview.pendingDecisions, color: overview.pendingDecisions > 0 ? 'text-orange-500' : 'text-muted-foreground' },
            { label: 'Öğrenilen Kural', value: overview.activeLearnedRules, color: 'text-green-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card px-4 py-3 space-y-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`inline-flex items-center px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0 ${
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && overview && (
          <div className="space-y-6">
            {/* Pending decisions quick list */}
            {overview.pendingDecisionsList.length > 0 && (
              <PendingDecisions
                projectId={projectId}
                onDecisionApplied={loadOverview}
              />
            )}

            {/* Recent timeline */}
            <DecisionTimeline projectId={projectId} filter="applied" />
          </div>
        )}

        {activeTab === 'decisions' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">⚡ Bekleyen Kararlar</h3>
              <PendingDecisions projectId={projectId} onDecisionApplied={loadOverview} />
            </div>
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold">📋 Karar Geçmişi</h3>
              <DecisionTimeline projectId={projectId} filter="applied" />
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <LearnedRulesList projectId={projectId} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsCharts projectId={projectId} />
        )}
      </div>
    </div>
  );
}