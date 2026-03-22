'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Rocket,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreflightCheck {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  action?: string;
}

interface PreflightResult {
  canLaunch: boolean;
  checks: PreflightCheck[];
  warnings: PreflightCheck[];
  blockers: PreflightCheck[];
}

interface PreflightCheckModalProps {
  campaignId: string;
  campaignName: string;
  leadCount?: number;
  token: string;
  onClose: () => void;
  onConfirmLaunch: () => void;
}

// ─── Check Item ───────────────────────────────────────────────────────────────

function CheckItem({ check }: { check: PreflightCheck }) {
  const iconMap = {
    pass: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    warn: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    fail: <XCircle className="w-4 h-4 text-destructive shrink-0" />,
  };

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg border',
      check.status === 'pass' ? 'bg-emerald-500/5 border-emerald-500/20' :
      check.status === 'warn' ? 'bg-amber-500/5 border-amber-500/20' :
      'bg-destructive/5 border-destructive/20',
    )}>
      {iconMap[check.status]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{check.label}</p>
        <p className={cn(
          'text-xs mt-0.5',
          check.status === 'pass' ? 'text-emerald-700 dark:text-emerald-400' :
          check.status === 'warn' ? 'text-amber-700 dark:text-amber-400' :
          'text-destructive/80',
        )}>
          {check.message}
        </p>
        {check.action && (
          <p className="text-xs text-muted-foreground mt-1 italic">→ {check.action}</p>
        )}
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function PreflightCheckModal({
  campaignId,
  campaignName,
  leadCount,
  token,
  onClose,
  onConfirmLaunch,
}: PreflightCheckModalProps) {
  const [result, setResult] = useState<PreflightResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceOverride, setForceOverride] = useState(false);

  useEffect(() => {
    const fetchPreflight = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
        const res = await fetch(`${API}/campaigns/${campaignId}/preflight-check`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setResult(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPreflight();
  }, [campaignId, token]);

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      onConfirmLaunch();
    } finally {
      setLaunching(false);
    }
  };

  const canProceed = result?.canLaunch || (forceOverride && result?.blockers?.length === 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Rocket className="w-4 h-4 text-primary" />
              Kampanya Başlatma Kontrolü
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              <strong>{campaignName}</strong> kampanyası için ön kontroller yapılıyor
            </p>
          </div>
          <button
            id="preflight-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-8 gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Kontroller yapılıyor...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <XCircle className="w-4 h-4 text-destructive" />
              <p className="text-sm text-destructive">Kontrol yapılamadı: {error}</p>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Overall status */}
              <div className={cn(
                'p-3 rounded-lg border text-sm font-medium flex items-center gap-2',
                result.canLaunch
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                  : result.blockers.length > 0
                    ? 'bg-destructive/10 border-destructive/30 text-destructive'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
              )}>
                {result.canLaunch
                  ? <><CheckCircle2 className="w-4 h-4" /> Kampanya başlatılabilir — tüm kontroller geçti!</>
                  : result.blockers.length > 0
                    ? <><XCircle className="w-4 h-4" /> {result.blockers.length} engel var — kampanya başlatılamaz.</>
                    : <><AlertTriangle className="w-4 h-4" /> {result.warnings.length} uyarı var — yine de başlatabilirsiniz.</>
                }
              </div>

              {/* All checks */}
              <div className="space-y-2">
                {result.checks.map((check) => (
                  <CheckItem key={check.id} check={check} />
                ))}
              </div>

              {/* Warnings override */}
              {!result.canLaunch && result.blockers.length === 0 && result.warnings.length > 0 && (
                <label className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceOverride}
                    onChange={(e) => setForceOverride(e.target.checked)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-xs text-amber-700 dark:text-amber-400">
                    Uyarıları anlıyorum, yine de başlatmak istiyorum
                  </span>
                </label>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {result && !loading && (
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border bg-muted/30">
            {leadCount !== undefined && (
              <p className="text-xs text-muted-foreground">
                <strong>{leadCount}</strong> lead'e gönderilecek
              </p>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                id="preflight-cancel-btn"
                onClick={onClose}
                className="h-9 px-4 rounded-lg border border-border bg-background hover:bg-accent text-sm font-medium transition-colors"
              >
                İptal
              </button>
              <button
                id="preflight-launch-btn"
                onClick={handleLaunch}
                disabled={!canProceed || launching}
                className={cn(
                  'flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold transition-all',
                  canProceed && !launching
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.01]'
                    : 'bg-muted text-muted-foreground cursor-not-allowed',
                )}
              >
                {launching ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Başlatılıyor...</>
                ) : (
                  <><Rocket className="w-4 h-4" /> Kampanyayı Başlat</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
