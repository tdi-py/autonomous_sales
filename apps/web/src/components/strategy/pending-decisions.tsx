'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Loader2, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Decision {
  id: string;
  decisionType: string;
  reasoning: string;
  oldValue: unknown;
  newValue: unknown;
  applied: boolean;
  createdAt: string;
}

interface PendingDecisionsProps {
  projectId: string;
  onDecisionApplied?: () => void;
}

const DECISION_LABELS: Record<string, string> = {
  ab_test_winner: '🔬 A/B Test Kazananı',
  prompt_update: '✏️ Prompt Güncellemesi',
  objection_update: '🛡️ Yeni İtiraz Karşılama',
  pause_campaign: '⏸️ Kampanya Duraklatma',
  switch_variant: '🔄 Varyant Değişimi',
  icp_refinement: '🎯 ICP Refinement',
};

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

export function PendingDecisions({ projectId, onDecisionApplied }: PendingDecisionsProps) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDecisions = useCallback(async () => {
    const token = getToken();
    try {
      const data = await api.get<{ decisions: Decision[] }>(
        `/projects/${projectId}/strategy/decisions?filter=pending&limit=10`,
        token,
      );
      setDecisions(data.decisions ?? []);
    } catch {}
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { loadDecisions(); }, [loadDecisions]);

  async function handleApply(decisionId: string) {
    const token = getToken();
    setActionLoading(decisionId);
    try {
      await api.post(`/projects/${projectId}/strategy/decisions/${decisionId}/apply`, {}, token);
      await loadDecisions();
      onDecisionApplied?.();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(decisionId: string) {
    const token = getToken();
    setActionLoading(`reject-${decisionId}`);
    try {
      await api.post(`/projects/${projectId}/strategy/decisions/${decisionId}/reject`, {}, token);
      await loadDecisions();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Kararlar yükleniyor...</span>
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-8 text-center">
        <CheckCircle2 className="w-8 h-8 mx-auto text-green-500 mb-2" />
        <p className="text-sm text-muted-foreground">Bekleyen karar yok</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-500/5 dark:border-orange-500/20 overflow-hidden">
      <div className="px-5 py-3 border-b border-orange-200 dark:border-orange-500/20 flex items-center gap-2">
        <Zap className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-400">
          Bekleyen Kararlar ({decisions.length})
        </h3>
      </div>
      <div className="divide-y divide-orange-100 dark:divide-orange-500/10">
        {decisions.map((decision) => (
          <div key={decision.id} className="px-5 py-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {DECISION_LABELS[decision.decisionType] ?? decision.decisionType}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {decision.reasoning}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleApply(decision.id)}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-1 h-7 px-3 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading === decision.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  Uygula
                </button>
                <button
                  onClick={() => handleReject(decision.id)}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-1 h-7 px-3 rounded-md border border-border bg-background text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {actionLoading === `reject-${decision.id}` ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  Reddet
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}