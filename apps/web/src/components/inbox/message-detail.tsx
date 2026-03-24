// ─── message-detail.tsx ───────────────────────────────────────────────────────
'use client';

import { cn } from '@/lib/utils';

const SENTIMENT_CONFIG = {
  positive:      { label: 'Pozitif',    color: 'bg-green-100 text-green-800',   emoji: '🟢' },
  negative:      { label: 'Negatif',    color: 'bg-red-100 text-red-700',       emoji: '🔴' },
  neutral:       { label: 'Nötr',       color: 'bg-gray-100 text-gray-700',     emoji: '🟡' },
  objection:     { label: 'İtiraz',     color: 'bg-yellow-100 text-yellow-800', emoji: '🟡' },
  unsubscribe:   { label: 'Abonelik İptali', color: 'bg-purple-100 text-purple-800', emoji: '🚫' },
  out_of_office: { label: 'Dışarıda',   color: 'bg-gray-100 text-gray-500',     emoji: '⚪' },
} as const;

const ACTION_BUTTONS = [
  { action: 'schedule_meeting', label: '📅 Meeting Planla',   variant: 'primary' as const },
  { action: 'send_info',        label: '📄 Bilgi Gönder',     variant: 'secondary' as const },
  { action: 'follow_up_later',  label: '⏰ Sonra Takip Et',   variant: 'secondary' as const },
  { action: 'no_action',        label: '✓ Aksiyon Gereksiz',  variant: 'ghost' as const },
] as const;

interface MessageDetailProps {
  message: {
    id: string;
    fromEmail: string;
    subject: string;
    bodyText: string;
    sentiment: keyof typeof SENTIMENT_CONFIG;
    sentimentScore: number;
    aiSummary: string;
    isRead: boolean;
    requiresAction: boolean;
    receivedAt: string;
    lead: {
      id: string;
      contactName?: string;
      companyName?: string;
      contactEmail?: string;
      status: string;
    } | null;
    campaign: { id: string; name: string } | null;
  };
  onAction: (action: string) => Promise<void>;
  onRefresh: () => void;
}

export function MessageDetail({ message, onAction, onRefresh }: MessageDetailProps) {
  const cfg = SENTIMENT_CONFIG[message.sentiment] ?? SENTIMENT_CONFIG.neutral;

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-base font-semibold leading-snug">
            {message.subject || '(konu yok)'}
          </h2>
          <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full shrink-0', cfg.color)}>
            {cfg.emoji} {cfg.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Gönderen: <strong>{message.fromEmail}</strong>
          {' · '}
          {new Date(message.receivedAt).toLocaleString('tr-TR')}
        </p>
        {message.campaign && (
          <p className="text-xs text-muted-foreground">
            📧 Kampanya: {message.campaign.name}
          </p>
        )}
      </div>

      {/* AI Analysis */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          AI Analizi
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Özet:</span>
            <span className="text-sm text-muted-foreground">{message.aiSummary || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Güven:</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-32">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${(message.sentimentScore ?? 0.5) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.round((message.sentimentScore ?? 0.5) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {message.requiresAction && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Önerilen Aksiyonlar
          </p>
          <div className="flex flex-wrap gap-2">
            {ACTION_BUTTONS.map(({ action, label, variant }) => (
              <button
                key={action}
                onClick={() => onAction(action).then(onRefresh)}
                className={cn(
                  'h-9 px-4 rounded-lg text-sm font-medium transition-colors',
                  variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  variant === 'secondary' && 'border border-border bg-background hover:bg-accent',
                  variant === 'ghost' && 'text-muted-foreground hover:bg-accent',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Email Body */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Email İçeriği
        </p>
        <div className="rounded-lg border border-border bg-card p-4">
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
            {message.bodyText || '(içerik yok)'}
          </pre>
        </div>
      </div>

      {/* Lead Card */}
      {message.lead && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Lead Bilgisi
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { label: 'Ad', value: message.lead.contactName },
              { label: 'Şirket', value: message.lead.companyName },
              { label: 'Email', value: message.lead.contactEmail },
              { label: 'Durum', value: message.lead.status },
            ].map(({ label, value }) =>
              value ? (
                <div key={label}>
                  <span className="text-muted-foreground">{label}: </span>
                  <span className="font-medium">{value}</span>
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}

      {/* Reply note */}
      <div className="rounded-lg border border-dashed border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          💬 Yanıtlamak için email client'ınızı kullanın: <strong>{message.fromEmail}</strong>
        </p>
      </div>
    </div>
  );
}