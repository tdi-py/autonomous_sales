'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Megaphone, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
  type: 'cold_email' | 'cold_call' | 'linkedin' | 'multi_channel';
  status: 'draft' | 'active' | 'paused' | 'completed';
  contentStatus: string;
  settings: Record<string, unknown>;
  createdAt: string;
}

const statusStyle: Record<Campaign['status'], string> = {
  draft:     'bg-gray-500/10 text-gray-500 border-gray-500/20',
  active:    'bg-green-500/10 text-green-600 border-green-500/20',
  paused:    'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  completed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

const typeIcon: Record<Campaign['type'], string> = {
  cold_email:    '📧',
  cold_call:     '📞',
  linkedin:      '💼',
  multi_channel: '🚀',
};

const typeLabel: Record<Campaign['type'], string> = {
  cold_email:    'Cold Email',
  cold_call:     'Cold Call',
  linkedin:      'LinkedIn',
  multi_channel: 'Multi-Channel',
};

const contentStatusStyle: Record<string, string> = {
  generating: 'text-blue-600',
  ready:      'text-green-600',
  error:      'text-destructive',
  pending:    'text-muted-foreground',
};

const contentStatusLabel: Record<string, string> = {
  generating: '⏳ Üretiliyor...',
  ready:      '✅ Hazır',
  error:      '❌ Hata',
  pending:    '— Bekliyor',
};

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

export default function ProjectCampaignsPage() {
  const { id } = useParams<{ id: string }>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    api.get<Campaign[]>(`/campaigns?projectId=${id}`, token)
      .then(setCampaigns)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href={`/projects/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Projeye Dön
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Kampanyalar</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {campaigns.length} kampanya
          </p>
        </div>
        <Link
          href={`/projects/${id}/campaigns/new`}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Kampanya
        </Link>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Megaphone className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">Henüz kampanya yok</p>
            <p className="text-sm text-muted-foreground">
              İlk kampanyanı oluştur, AI içerikleri otomatik üretsin.
            </p>
          </div>
          <Link
            href={`/projects/${id}/campaigns/new`}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Kampanya Oluştur
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/projects/${id}/campaigns/${c.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{typeIcon[c.type]}</span>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{c.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{typeLabel[c.type]}</span>
                    <span>·</span>
                    <span className={cn(contentStatusStyle[c.contentStatus ?? 'pending'])}>
                      {contentStatusLabel[c.contentStatus ?? 'pending']}
                    </span>
                  </div>
                </div>
              </div>
              <span
                className={cn(
                  'text-xs font-medium px-2.5 py-1 rounded-full border capitalize',
                  statusStyle[c.status],
                )}
              >
                {c.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}