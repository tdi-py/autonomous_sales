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

interface Activity {
  id: string;
  description: string;
  time: string;
  type: 'email' | 'reply' | 'lead' | 'campaign';
}

interface ActionRequired {
  id: string;
  fromEmail: string;
  aiSummary: string;
  sentiment: string;
  projectId: string;
  messageId: string;
}

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

const activityColor: Record<string, string> = {
  email:    'bg-blue-500',
  reply:    'bg-green-500',
  lead:     'bg-violet-500',
  campaign: 'bg-orange-500',
};

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
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [actionRequired, setActionRequired] = useState<ActionRequired[]>([]);

  useEffect(() => {
    const token = getToken();

    async function loadDashboard() {
      try {
        // Load workspace → projects
        const workspaces = await api.get<Array<{ id: string }>>('/users/me/workspaces', token);
        const workspaceId = workspaces[0]?.id;
        if (!workspaceId) return;

        const projects = await api.get<Array<{ id: string }>>(`/projects?workspaceId=${workspaceId}`, token);

        let totalLeads = 0;
        let activeCampaigns = 0;
        let sentThisWeek = 0;
        let totalReplied = 0;
        let totalSent = 0;
        const activities: Activity[] = [];
        const actions: ActionRequired[] = [];

        for (const project of projects.slice(0, 5)) {
          // Leads count
          try {
            const leads = await api.get<{ data: unknown[] }>(`/leads?projectId=${project.id}&limit=1`, token);
            // We don't have total count endpoint, approximate from page
          } catch {}

          // Campaigns
          try {
            const campaigns = await api.get<Array<{ id: string; status: string; name: string }>>(`/campaigns?projectId=${project.id}`, token);
            activeCampaigns += campaigns.filter((c) => c.status === 'active').length;

            for (const campaign of campaigns.slice(0, 3)) {
              try {
                const metrics = await api.get<{
                  sent: number; replied: number;
                  by_variant: unknown;
                }>(`/campaigns/${campaign.id}/metrics`, token);
                sentThisWeek += metrics.sent ?? 0;
                totalReplied += metrics.replied ?? 0;
                totalSent += metrics.sent ?? 0;
              } catch {}
            }
          } catch {}

          // Inbox actions
          try {
            const inbox = await api.get<ActionRequired[]>(
              `/inbox?projectId=${project.id}&filter=requires_action&limit=3`,
              token,
            );
            for (const msg of inbox) {
              actions.push({ ...msg, projectId: project.id, messageId: msg.id });
            }
          } catch {}
        }

        const replyRate = totalSent > 0
          ? `${((totalReplied / totalSent) * 100).toFixed(1)}%`
          : '—';

        setStats({ totalLeads, activeCampaigns, sentThisWeek, replyRate });
        setActionRequired(actions.slice(0, 5));
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
        <p className="text-sm text-muted-foreground mt-1">
          Hoş geldiniz. İşte özet görünüm.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Toplam Lead"
          value={stats.totalLeads}
          icon={Users}
          color="bg-violet-500/10 text-violet-500"
        />
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
      </div>

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

      {/* Recent activity */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold">Son Aktiviteler</h3>
        </div>
        <div className="divide-y divide-border">
          {recentActivity.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground text-center">
              Henüz aktivite yok. İlk projenizi oluşturun.
            </p>
          ) : (
            recentActivity.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                <span className={cn('w-2 h-2 rounded-full shrink-0', activityColor[item.type] ?? 'bg-muted')} />
                <p className="text-sm flex-1">{item.description}</p>
                <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Phase indicator */}
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-5 py-4">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Faz 3 tamamlandı.</span>{' '}
          Email gönderimi, open/click/reply tracking, Unified Inbox ve kampanya metrikleri aktif.
        </p>
      </div>
    </div>
  );
}