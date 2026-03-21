'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Megaphone,
  Send,
  TrendingUp,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color?: string;
}

function StatCard({ title, value, icon: Icon, trend, color = 'bg-primary/10 text-primary' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-start justify-between gap-4">
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
}

interface Activity {
  id: string;
  label: string;
  time: string;
  type: 'email' | 'call' | 'lead' | 'campaign';
}

const MOCK_ACTIVITY: Activity[] = [
  { id: '1', label: 'New lead added — Bloom & Co Florists', time: '2m ago', type: 'lead' },
  { id: '2', label: 'Campaign "March Florists" activated', time: '1h ago', type: 'campaign' },
  { id: '3', label: 'Email sequence step 1 sent to 12 leads', time: '3h ago', type: 'email' },
];

const activityColor: Record<Activity['type'], string> = {
  email: 'bg-blue-500/10 text-blue-500',
  call: 'bg-green-500/10 text-green-500',
  lead: 'bg-violet-500/10 text-violet-500',
  campaign: 'bg-orange-500/10 text-orange-500',
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
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
          Welcome back. Here&apos;s what&apos;s happening.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value="0"
          icon={Users}
          color="bg-violet-500/10 text-violet-500"
        />
        <StatCard
          title="Active Campaigns"
          value="0"
          icon={Megaphone}
          color="bg-orange-500/10 text-orange-500"
        />
        <StatCard
          title="Sent This Week"
          value="0"
          icon={Send}
          color="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title="Reply Rate"
          value="—"
          icon={TrendingUp}
          color="bg-green-500/10 text-green-500"
        />
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold">Recent Activity</h3>
        </div>
        <div className="divide-y divide-border">
          {MOCK_ACTIVITY.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground text-center">
              No activity yet. Create your first project to get started.
            </p>
          ) : (
            MOCK_ACTIVITY.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    activityColor[item.type].split(' ')[0],
                  )}
                />
                <p className="text-sm flex-1">{item.label}</p>
                <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Phase indicator */}
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-5 py-4">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Faz 0 tamamlandı.</span>{' '}
          Monorepo iskelet, 32 tablo, LLM abstraction, 9 API modülü, 7 BullMQ worker processor hazır.
          Faz 1&apos;de Analyzer Agent devreye girecek.
        </p>
      </div>
    </div>
  );
}