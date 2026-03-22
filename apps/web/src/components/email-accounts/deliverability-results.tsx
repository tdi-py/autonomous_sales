'use client';

import { CheckCircle2, XCircle, AlertCircle, Inbox, Ban, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type DeliverabilityResult = 'inbox' | 'spam' | 'promotions' | 'junk' | 'not_tested';

interface DeliverabilityTest {
  id: string;
  gmailResult: DeliverabilityResult;
  outlookResult: DeliverabilityResult;
  yahooResult?: DeliverabilityResult;
  overallScore?: number | null;
  testedAt: string;
  issuesDetected?: string[];
}

interface DeliverabilityResultsProps {
  tests: DeliverabilityTest[];
  loading?: boolean;
  seedTestAvailable?: boolean;
  onRunTest?: () => void;
  runningTest?: boolean;
}

function ResultBadge({ result }: { result: DeliverabilityResult }) {
  const configs = {
    inbox: { icon: <Inbox className="w-3.5 h-3.5" />, label: 'Inbox', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    spam: { icon: <Ban className="w-3.5 h-3.5" />, label: 'Spam', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
    promotions: { icon: <AlertCircle className="w-3.5 h-3.5" />, label: 'Promotions', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
    junk: { icon: <Ban className="w-3.5 h-3.5" />, label: 'Junk', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
    not_tested: { icon: <AlertCircle className="w-3.5 h-3.5" />, label: 'Test Yok', cls: 'bg-muted text-muted-foreground border-transparent' },
  };
  const cfg = configs[result];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', cfg.cls)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function ScoreBadge({ score }: { score?: number | null }) {
  if (score == null) return <span className="text-xs text-muted-foreground">—</span>;
  const color = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-destructive';
  return <span className={cn('text-sm font-bold', color)}>{score}/100</span>;
}

function TestItem({ test }: { test: DeliverabilityTest }) {
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${mins} dakika önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} saat önce`;
    return `${Math.floor(hours / 24)} gün önce`;
  };

  return (
    <div className="rounded-lg border border-border bg-card/50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Gmail</span>
            <ResultBadge result={test.gmailResult} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Outlook</span>
            <ResultBadge result={test.outlookResult} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge score={test.overallScore} />
          <span className="text-xs text-muted-foreground">{timeAgo(test.testedAt)}</span>
        </div>
      </div>
      {test.issuesDetected && test.issuesDetected.length > 0 && (
        <div className="space-y-1">
          {(test.issuesDetected as string[]).map((issue, i) => (
            <p key={i} className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              {issue}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function DeliverabilityResults({
  tests,
  loading = false,
  seedTestAvailable = false,
  onRunTest,
  runningTest = false,
}: DeliverabilityResultsProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header + Run Test button */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">SON TEST SONUÇLARI</p>
        <button
          id="run-deliverability-test-btn"
          onClick={onRunTest}
          disabled={runningTest}
          className="flex items-center gap-1.5 h-7 px-3 rounded-md bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {runningTest ? <Loader2 className="w-3 h-3 animate-spin" /> : <Inbox className="w-3 h-3" />}
          {runningTest ? 'Test Çalışıyor...' : 'Spam Testi Çalıştır'}
        </button>
      </div>

      {/* Seed test unavailable warning */}
      {!seedTestAvailable && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Seed Test Yakında</p>
            <p className="text-xs text-amber-600 dark:text-amber-300 mt-0.5">
              Spam/inbox testi için platform test hesapları yapılandırılmamış.
              DNS kontrolü ve ısındırma aktif olarak devam ediyor.
            </p>
          </div>
        </div>
      )}

      {/* Test history */}
      {tests.length === 0 ? (
        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
          Henüz spam testi yapılmamış.
        </div>
      ) : (
        <div className="space-y-2">
          {tests.slice(0, 5).map((test) => (
            <TestItem key={test.id} test={test} />
          ))}
        </div>
      )}
    </div>
  );
}
