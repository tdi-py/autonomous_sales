'use client';

import { cn } from '@/lib/utils';

interface HealthScoreCardProps {
  score: number;
}

export function HealthScoreCard({ score }: HealthScoreCardProps) {
  const color =
    score >= 80 ? 'text-green-600' :
    score >= 60 ? 'text-yellow-600' :
    score >= 40 ? 'text-orange-500' :
    'text-red-500';

  const barColor =
    score >= 80 ? 'bg-green-500' :
    score >= 60 ? 'bg-yellow-500' :
    score >= 40 ? 'bg-orange-500' :
    'bg-red-500';

  const label =
    score >= 80 ? 'Sağlıklı' :
    score >= 60 ? 'İyi' :
    score >= 40 ? 'Orta' :
    'Zayıf';

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-2">
      <p className="text-xs text-muted-foreground">Kampanya Sağlığı</p>
      <div className="flex items-end justify-between">
        <p className={cn('text-2xl font-bold', color)}>{score}<span className="text-sm font-normal">/100</span></p>
        <p className={cn('text-xs font-medium', color)}>{label}</p>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}