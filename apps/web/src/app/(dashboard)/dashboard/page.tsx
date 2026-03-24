'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Megaphone,
  Send,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  Inbox,
  Brain,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color?: string;
  href?: string;
}

function StatCard({ title, value, icon: Icon, trend, color = 'bg-primary/10 text-primary', href }: StatCardProps) {
  const card = (
    <div className={cn(
      'rounded-xl border border-border bg-card p-5 flex items-start justify-between gap-4',
      href && 'hover:border-primary/30 transition-colors cursor-pointer',
    )}>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {trend && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-green-500" />
            {trend}
          </p>
        )}
      </div>
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', color)}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );

  if (href) return <Link href={href}>{card}</Link>;
  return card;
}

interface DashboardStats {
  totalLeads: number;
  activeCampaigns: number;
  sentThisWeek: number;
  replyRate: string;
}

interface ActionRequired {
  id: string;
  fromEmail: string;
  aiSummary: string;
  sentiment: string;
  projectId: string;
  messageId: string;
}

interface StrategyOverview {
  projectId: string;
  projectName: string;
  healthScore: number;
  pendingDecisions: number;
}

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

const sentimentEmoji: Record<string, string> = {
  positive: '🟢',
  negative: '🔴',
  neutral:  '🟡',
  objection:'🟡',
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    activeCampaigns: 0,
    sentThisWeek: 0,
    replyRate: '—',
  });
  const [actionRequired, setActionRequired] = useState<ActionRequired[]>([]);
  const [strategyOverviews, setStrategyOverviews] = useState<StrategyOverview[]>([]);

  useEffect(() => {
    const token = getToken();

    async function loadDashboard() {
      try {
        const workspaces = await api.get<Array<{ id: string }>>('/users/me/workspaces', token);
        const workspaceId = workspaces[0]?.id;
        if (!workspaceId) return;

        const projects = await api.get<Array<{ id: string; name: string }>>(`/projects?workspaceId=${workspaceId}`, token);

        let activeCampaigns = 0;
        let sentThisWeek = 0;
        let totalReplied = 0;
        let totalSent = 0;
        const actions: ActionRequired[] = [];
        const strategyData: StrategyOverview[] = [];

        for (const project of projects.slice(0, 5)) {
          try {
            const campaigns = await api.get<Array<{ id: string; status: string }>>(`/campaigns?projectId=${project.id}`, token);
            activeCampaigns += campaigns.filter((c) => c.status === 'active').length;

            for (const campaign of campaigns.slice(0, 3)) {
              try {
                const metrics = await api.get<{ sent: number; replied: number }>(
                  `/campaigns/${campaign.id}/metrics`, token,
                );
                sentThisWeek += metrics.sent ?? 0;
                totalReplied += metrics.replied ?? 0;
                totalSent += metrics.sent ?? 0;
              } catch {}
            }
          } catch {}

          try {
            const inbox = await api.get<ActionRequired[]>(
              `/inbox?projectId=${project.id}&filter=requires_action&limit=3`, token,
            );
            for (const msg of inbox) {
              actions.push({ ...msg, projectId: project.id, messageId: msg.id });
            }
          } catch {}

          // Load strategy overview per project
          try {
            const overview = await api.get<{ pendingDecisions: number; healthScore: number }>(
              `/projects/${project.id}/strategy/overview`, token,
            );
            if (overview.pendingDecisions > 0 || overview.healthScore > 0) {
              strategyData.push({
                projectId: project.id,
                projectName: project.name,
                healthScore: overview.healthScore,
                pendingDecisions: overview.pendingDecisions,
              });
            }
          } catch {}
        }

        const replyRate = totalSent > 0
          ? `${((totalReplied / totalSent) * 100).toFixed(1)}%`
          : '—';

        setStats({ totalLeads: 0, activeCampaigns, sentThisWeek, replyRate });
        setActionRequired(actions.slice(0, 5));
        setStrategyOverviews(strategyData);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Hoş geldiniz. İşte özet görünüm.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Aktif Kampanya"
          value={stats.activeCampaigns}
          icon={Megaphone}
          color="bg-orange-500/10 text-orange-500"
        />
        <StatCard
          title="Bu Hafta Gönderilen"
          value={stats.sentThisWeek}
          icon={Send}
          color="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title="Yanıt Oranı"
          value={stats.replyRate}
          icon={TrendingUp}
          color="bg-green-500/10 text-green-500"
        />
        <StatCard
          title="Toplam Lead"
          value={stats.totalLeads}
          icon={Users}
          color="bg-violet-500/10 text-violet-500"
        />
      </div>

      {/* AI Strategy Alerts */}
      {strategyOverviews.some((s) => s.pendingDecisions > 0) && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-500/5 dark:border-purple-500/20">
          <div className="px-5 py-4 border-b border-purple-200 dark:border-purple-500/20 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-400">
              AI Strateji Önerileri
            </h3>
          </div>
          <div className="divide-y divide-purple-100 dark:divide-purple-500/10">
            {strategyOverviews
              .filter((s) => s.pendingDecisions > 0)
              .map((s) => (
                <Link
                  key={s.projectId}
                  href={`/projects/${s.projectId}/strategy`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-purple-100/50 dark:hover:bg-purple-500/10 transition-colors"
                >
                  <Zap className="w-4 h-4 text-purple-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.projectName}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.pendingDecisions} bekleyen karar · Sağlık: {s.healthScore}/100
                    </p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Action Required */}
      {actionRequired.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-500/5 dark:border-orange-500/20">
          <div className="px-5 py-4 border-b border-orange-200 dark:border-orange-500/20 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-orange-800 dark:text-orange-400">
              <Inbox className="w-4 h-4" />
              Aksiyon Gerektiren Yanıtlar ({actionRequired.length})
            </h3>
          </div>
          <div className="divide-y divide-orange-100 dark:divide-orange-500/10">
            {actionRequired.map((item) => (
              <Link
                key={item.messageId}
                href={`/projects/${item.projectId}/inbox`}
                className="flex items-start gap-3 px-5 py-3 hover:bg-orange-100/50 dark:hover:bg-orange-500/10 transition-colors"
              >
                <span className="text-sm mt-0.5">
                  {sentimentEmoji[item.sentiment] ?? '🟡'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.fromEmail}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.aiSummary}</p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Phase indicator */}
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-5 py-4">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Faz 5 tamamlandı.</span>{' '}
          Strategist Agent — kampanya analizi, A/B test kararları, prompt güncellemeleri ve öz-öğrenme aktif.
        </p>
      </div>
    </div>
  );
}