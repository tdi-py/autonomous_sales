'use client';

import { cn } from '@/lib/utils';
import { Flame, Pause, Play, CheckCircle2, Clock } from 'lucide-react';

type WarmupStatus = 'not_started' | 'warming' | 'ready' | 'paused';

interface WarmupProgressProps {
  status: WarmupStatus;
  warmupDay: number;
  totalDays?: number;
  dailySendLimit: number;
  percentComplete: number;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  loading?: boolean;
}

export function WarmupProgress({
  status,
  warmupDay,
  totalDays = 28,
  dailySendLimit,
  percentComplete,
  onStart,
  onPause,
  onResume,
  loading = false,
}: WarmupProgressProps) {

  const statusConfig = {
    not_started: {
      icon: <Clock className="w-4 h-4 text-muted-foreground" />,
      label: 'Başlatılmadı',
      color: 'text-muted-foreground',
      barColor: 'bg-muted-foreground/30',
      description: 'Isındırmayı başlatarak email itibarınızı oluşturun.',
    },
    warming: {
      icon: <Flame className="w-4 h-4 text-orange-500 animate-pulse" />,
      label: `Gün ${warmupDay}/${totalDays}`,
      color: 'text-orange-500',
      barColor: 'bg-gradient-to-r from-orange-400 to-amber-400',
      description: `${dailySendLimit} email/gün limiti ile ısınıyor...`,
    },
    ready: {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      label: 'Hazır ✅',
      color: 'text-emerald-500',
      barColor: 'bg-emerald-500',
      description: 'Hesap hazır! Kampanya gönderebilirsiniz.',
    },
    paused: {
      icon: <Pause className="w-4 h-4 text-amber-500" />,
      label: 'Duraklatıldı',
      color: 'text-amber-500',
      barColor: 'bg-amber-400',
      description: 'Isındırma duraklatıldı. Devam etmek için butona tıklayın.',
    },
  };

  const config = statusConfig[status];
  const displayPercent = status === 'ready' ? 100 : percentComplete;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className={cn('text-sm font-semibold', config.color)}>{config.label}</span>
          {status !== 'not_started' && status !== 'ready' && (
            <span className="text-xs text-muted-foreground">({dailySendLimit} email/gün)</span>
          )}
        </div>
        <span className="text-xs font-medium text-muted-foreground">{displayPercent}%</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', config.barColor)}
          style={{ width: `${displayPercent}%` }}
        />
        {status === 'warming' && (
          <div
            className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
            style={{ left: `${Math.max(0, displayPercent - 8)}%` }}
          />
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground">{config.description}</p>

      {/* Controls */}
      <div className="flex gap-2">
        {status === 'not_started' && onStart && (
          <button
            id="warmup-start-btn"
            onClick={onStart}
            disabled={loading}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Flame className="w-3.5 h-3.5" />
            {loading ? 'Başlatılıyor...' : 'Isındırmayı Başlat'}
          </button>
        )}

        {status === 'warming' && onPause && (
          <button
            id="warmup-pause-btn"
            onClick={onPause}
            disabled={loading}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Pause className="w-3.5 h-3.5" />
            {loading ? 'İşleniyor...' : 'Duraklat'}
          </button>
        )}

        {status === 'paused' && onResume && (
          <button
            id="warmup-resume-btn"
            onClick={onResume}
            disabled={loading}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {loading ? 'İşleniyor...' : 'Devam Ettir'}
          </button>
        )}

        {status === 'ready' && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Kampanya göndermeye hazırsınız!
          </div>
        )}
      </div>

      {/* Warmup schedule mini-chart */}
      {status !== 'not_started' && (
        <div className="flex items-end gap-0.5 h-8 mt-2">
          {[5, 5, 5, 10, 10, 10, 10, 20, 20, 20, 20, 20, 20, 20, 35, 35, 35, 35, 35, 35, 35, 50, 50, 50, 50, 50, 50, 50].map(
            (target, i) => {
              const isCompleted = i < warmupDay - 1;
              const isCurrent = i === warmupDay - 1;
              return (
                <div
                  key={i}
                  title={`Gün ${i + 1}: ${target} email`}
                  style={{ height: `${(target / 50) * 100}%` }}
                  className={cn(
                    'flex-1 rounded-sm transition-colors',
                    isCompleted ? 'bg-emerald-500/60' :
                    isCurrent ? 'bg-orange-400' :
                    'bg-muted',
                  )}
                />
              );
            },
          )}
        </div>
      )}
    </div>
  );
}
