'use client';

import { useEffect, useState } from 'react';
import { Loader2, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';

// Recharts is available in the web package's context
// We'll use dynamic imports to avoid SSR issues
let LineChart: any, Line: any, XAxis: any, YAxis: any, Tooltip: any, ResponsiveContainer: any,
  BarChart: any, Bar: any, PieChart: any, Pie: any, Cell: any, Legend: any;

try {
  const recharts = require('recharts');
  LineChart = recharts.LineChart;
  Line = recharts.Line;
  XAxis = recharts.XAxis;
  YAxis = recharts.YAxis;
  Tooltip = recharts.Tooltip;
  ResponsiveContainer = recharts.ResponsiveContainer;
  BarChart = recharts.BarChart;
  Bar = recharts.Bar;
  PieChart = recharts.PieChart;
  Pie = recharts.Pie;
  Cell = recharts.Cell;
  Legend = recharts.Legend;
} catch {
  // recharts not available, will show placeholder
}

interface AnalyticsChartsProps {
  projectId: string;
}

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

interface AnalyticsData {
  projectId: string;
  campaigns: Array<{ id: string; name: string; status: string; settings: any }>;
  benchmark: { industry: string; rules: any[] } | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function AnalyticsCharts({ projectId }: AnalyticsChartsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    api.get<AnalyticsData>(`/projects/${projectId}/strategy/analytics`, token)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed border-border">
        <TrendingUp className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Analitik verisi yüklenemedi.</p>
      </div>
    );
  }

  // Build campaign health data from settings
  const campaignHealthData = data.campaigns
    .filter((c) => c.status === 'active' || c.status === 'paused')
    .map((c) => ({
      name: c.name.substring(0, 20),
      score: (c.settings as any)?.healthScore ?? 0,
      sent: (c.settings as any)?.totalSent ?? 0,
    }));

  // Sentiment distribution from inbox (placeholder data for visualization)
  const sentimentData = [
    { name: 'Pozitif', value: 35, color: '#10b981' },
    { name: 'Nötr', value: 40, color: '#6b7280' },
    { name: 'Negatif', value: 15, color: '#ef4444' },
    { name: 'İtiraz', value: 10, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-8">
      {/* Campaign Health Comparison */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Kampanya Sağlık Skorları</h3>
        {campaignHealthData.length > 0 && BarChart ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={campaignHealthData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" name="Sağlık Skoru" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Grafik için aktif kampanya verisi bekleniyor.
            </p>
          </div>
        )}
      </div>

      {/* Sentiment Distribution */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Yanıt Sentiment Dağılımı</h3>
        {PieChart ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }: any) => `${name}: %${value}`}
                  labelLine={false}
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `%${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sentimentData.map((item) => (
              <div key={item.name} className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">{item.name}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: item.color }}>
                  %{item.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform Benchmark */}
      {data.benchmark && data.benchmark.rules.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">
            Sektör Benchmarkı — {data.benchmark.industry}
          </h3>
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-500/5 dark:border-blue-500/20 p-4 space-y-2">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
              Bu sektörde {data.benchmark.rules.length} platform kuralı aktif
            </p>
            <ul className="space-y-1">
              {data.benchmark.rules.slice(0, 5).map((rule: any) => (
                <li key={rule.id} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                  <span>
                    {typeof rule.ruleContent === 'object'
                      ? rule.ruleContent?.description ?? JSON.stringify(rule.ruleContent)
                      : rule.ruleContent}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}