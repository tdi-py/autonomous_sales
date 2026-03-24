'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Decision {
  id: string;
  decisionType: string;
  reasoning: string;
  applied: boolean;
  appliedAt: string | null;
  createdAt: string;
}

interface DecisionTimelineProps {
  projectId: string;
  filter?: 'applied' | 'pending';
}

const DECISION_LABELS: Record<string, string> = {
  ab_test_winner: 'A/B Test Kazananı',
  prompt_update: 'Prompt Güncellemesi',
  objection_update: 'İtiraz Karşılama',
  pause_campaign: 'Kampanya Duraklatıldı',
  switch_variant: 'Varyant Değişimi',
  icp_refinement: 'ICP Refinement',
};

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor(diff / 3_600_000);
  if (days > 0) return `${days} gün önce`;
  if (hours > 0) return `${hours} saat önce`;
  return 'Az önce';
}

export function DecisionTimeline({ projectId, filter = 'applied' }: DecisionTimelineProps) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    api.get<{ decisions: Decision[] }>(
      `/projects/${projectId}/strategy/decisions?filter=${filter}&limit=10`,
      token,
    )
      .then((data) => setDecisions(data.decisions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId, filter]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Yükleniyor...</span>
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-8 text-center">
        <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Henüz karar geçmişi yok</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="divide-y divide-border">
        {decisions.map((decision) => (
          <div key={decision.id} className="flex items-start gap-3 px-5 py-3">
            <span className="shrink-0 mt-0.5">
              {decision.reasoning.startsWith('REJECTED') ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {DECISION_LABELS[decision.decisionType] ?? decision.decisionType}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {decision.reasoning.startsWith('REJECTED:')
                  ? decision.reasoning.split('|')[0]
                  : decision.reasoning}
              </p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {timeAgo(decision.appliedAt ?? decision.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}