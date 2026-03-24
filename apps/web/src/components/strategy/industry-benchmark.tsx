'use client';

interface IndustryBenchmarkProps {
  industry: string;
  projectOpenRate?: number;
  projectReplyRate?: number;
}

const INDUSTRY_BENCHMARKS: Record<string, { openRate: number; replyRate: number; bounceRate: number }> = {
  saas:        { openRate: 0.24, replyRate: 0.06, bounceRate: 0.02 },
  ecommerce:   { openRate: 0.18, replyRate: 0.03, bounceRate: 0.03 },
  agency:      { openRate: 0.28, replyRate: 0.08, bounceRate: 0.02 },
  service:     { openRate: 0.26, replyRate: 0.07, bounceRate: 0.02 },
  marketplace: { openRate: 0.20, replyRate: 0.04, bounceRate: 0.03 },
  other:       { openRate: 0.22, replyRate: 0.05, bounceRate: 0.02 },
};

function pct(val: number) {
  return `${(val * 100).toFixed(1)}%`;
}

export function IndustryBenchmark({ industry, projectOpenRate, projectReplyRate }: IndustryBenchmarkProps) {
  const benchmark = INDUSTRY_BENCHMARKS[industry] ?? INDUSTRY_BENCHMARKS.other;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sektör Benchmark — {industry}
        </p>
      </div>
      <div className="p-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Open Rate', benchmark: benchmark.openRate, project: projectOpenRate },
          { label: 'Reply Rate', benchmark: benchmark.replyRate, project: projectReplyRate },
          { label: 'Bounce Rate', benchmark: benchmark.bounceRate, project: undefined },
        ].map(({ label, benchmark: b, project: p }) => (
          <div key={label} className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-base font-semibold">{pct(b)}</p>
            {p !== undefined && (
              <p className={`text-xs font-medium ${p >= b ? 'text-green-600' : 'text-red-500'}`}>
                Sizin: {pct(p)} {p >= b ? '↑' : '↓'}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}