'use client';

import { Phone, CheckCircle2, Calendar, TrendingUp, Volume2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallMetricsProps {
  totalCalls: number;
  completed: number;
  noAnswer: number;
  voicemail: number;
  meetingBooked: number;
  interested: number;
  averageDuration?: number;
  totalCost?: number;
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function CallMetrics({
  totalCalls,
  completed,
  noAnswer,
  voicemail,
  meetingBooked,
  interested,
  averageDuration,
  totalCost,
}: CallMetricsProps) {
  const completionRate = totalCalls > 0 ? `${((completed / totalCalls) * 100).toFixed(0)}%` : '0%';
  const meetingRate = totalCalls > 0 ? `${((meetingBooked / totalCalls) * 100).toFixed(0)}%` : '0%';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Toplam Arama"
          value={totalCalls}
          icon={Phone}
          color="bg-blue-500/10 text-blue-600"
        />
        <MetricCard
          label="Tamamlanan"
          value={completed}
          sub={`Oran: ${completionRate}`}
          icon={CheckCircle2}
          color="bg-green-500/10 text-green-600"
        />
        <MetricCard
          label="Meeting Ayarlanan"
          value={meetingBooked}
          sub={`Oran: ${meetingRate}`}
          icon={Calendar}
          color="bg-purple-500/10 text-purple-600"
        />
        <MetricCard
          label="İlgili Lead"
          value={interested}
          icon={TrendingUp}
          color="bg-orange-500/10 text-orange-600"
        />
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Volume2 className="w-3 h-3" /> Sesli Mesaj
          </p>
          <p className="text-lg font-bold">{voicemail}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Cevapsız
          </p>
          <p className="text-lg font-bold">{noAnswer}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-1">
          <p className="text-xs text-muted-foreground">Ort. Süre</p>
          <p className="text-lg font-bold">{formatDuration(averageDuration)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-1">
          <p className="text-xs text-muted-foreground">Toplam Maliyet</p>
          <p className="text-lg font-bold">
            {totalCost !== undefined ? `$${totalCost.toFixed(3)}` : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}