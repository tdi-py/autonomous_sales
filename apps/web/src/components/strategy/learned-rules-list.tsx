'use client';

import { useEffect, useState } from 'react';
import { Loader2, BookOpen, Globe } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface LearnedRule {
  id: string;
  ruleType: string;
  ruleContent: { description?: string; evidence?: string } | string;
  confidenceScore: number;
  evidenceCount: number;
}

interface PlatformRule {
  id: string;
  ruleType: string;
  industry: string | null;
  ruleContent: { description?: string } | string;
  confidenceScore: number;
  evidenceCount: number;
  sourceProjectCount: number;
}

interface LearnedRulesListProps {
  projectId: string;
}

const RULE_TYPE_LABELS: Record<string, string> = {
  spam_word_avoid: '🚫 Spam Kelime Kaçın',
  subject_pattern: '📧 Subject Pattern',
  icp_insight: '🎯 ICP İçgörüsü',
  objection_pattern: '🛡️ İtiraz Paterni',
  send_time_optimal: '⏰ En İyi Gönderim Saati',
  tone_preference: '🎭 Ton Tercihi',
  industry_insight: '🏭 Sektör İçgörüsü',
};

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

function getContent(content: { description?: string; evidence?: string } | string): string {
  if (typeof content === 'string') return content;
  return content?.description ?? JSON.stringify(content);
}

export function LearnedRulesList({ projectId }: LearnedRulesListProps) {
  const [projectRules, setProjectRules] = useState<LearnedRule[]>([]);
  const [platformRules, setPlatformRules] = useState<PlatformRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    api.get<{ projectRules: LearnedRule[]; platformRules: PlatformRule[] }>(
      `/projects/${projectId}/strategy/learned-rules`,
      token,
    )
      .then((data) => {
        setProjectRules(data.projectRules ?? []);
        setPlatformRules(data.platformRules ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Rules */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Bu Projeye Özel Kurallar ({projectRules.length})
        </h3>
        {projectRules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Henüz öğrenilen kural yok. Kampanyalar gönderi yaptıkça kurallar birikir.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {projectRules.map((rule) => (
              <div key={rule.id} className="rounded-lg border border-border bg-card px-4 py-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-primary">
                    {RULE_TYPE_LABELS[rule.ruleType] ?? rule.ruleType}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {rule.evidenceCount} kanıt
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${rule.confidenceScore * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">
                        %{Math.round(rule.confidenceScore * 100)}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{getContent(rule.ruleContent as any)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform Rules */}
      {platformRules.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            Platform Geneli Kurallar ({platformRules.length})
            <span className="text-xs font-normal text-muted-foreground">(sektörünüzdeki diğer projelerden öğrenildi)</span>
          </h3>
          <div className="space-y-2">
            {platformRules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-500/5 dark:border-blue-500/20 px-4 py-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3 text-blue-500" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                      {RULE_TYPE_LABELS[rule.ruleType] ?? rule.ruleType}
                      {rule.industry && ` · ${rule.industry}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {rule.sourceProjectCount} projeden
                    </span>
                    <span className="text-xs font-medium">
                      %{Math.round(rule.confidenceScore * 100)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{getContent(rule.ruleContent as any)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}