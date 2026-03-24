// ─── message-list.tsx ─────────────────────────────────────────────────────────

'use client';

import { cn } from '@/lib/utils';

const SENTIMENT_CONFIG = {
  positive:      { emoji: '🟢', color: 'text-green-600'  },
  negative:      { emoji: '🔴', color: 'text-red-500'    },
  neutral:       { emoji: '🟡', color: 'text-yellow-600' },
  objection:     { emoji: '🟡', color: 'text-yellow-600' },
  unsubscribe:   { emoji: '🚫', color: 'text-purple-600' },
  out_of_office: { emoji: '⚪', color: 'text-gray-400'   },
} as const;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dakika önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  return new Date(dateStr).toLocaleDateString('tr-TR');
}

interface Message {
  id: string;
  fromEmail: string;
  subject: string;
  aiSummary: string;
  sentiment: keyof typeof SENTIMENT_CONFIG;
  isRead: boolean;
  requiresAction: boolean;
  receivedAt: string;
  lead: { contactName?: string; companyName?: string } | null;
  campaign: { name: string } | null;
}

interface MessageListProps {
  messages: Message[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MessageList({ messages, selectedId, onSelect }: MessageListProps) {
  return (
    <div className="divide-y divide-border">
      {messages.map((msg) => {
        const cfg = SENTIMENT_CONFIG[msg.sentiment] ?? SENTIMENT_CONFIG.neutral;
        const ago = timeAgo(msg.receivedAt);

        return (
          <button
            key={msg.id}
            onClick={() => onSelect(msg.id)}
            className={cn(
              'w-full text-left px-4 py-3 transition-colors',
              selectedId === msg.id ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-muted/30',
              !msg.isRead && 'bg-blue-500/3',
            )}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-lg mt-0.5 shrink-0">{cfg.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 justify-between">
                  <p className={cn('text-sm font-medium truncate', !msg.isRead && 'font-semibold')}>
                    {msg.lead?.contactName ?? msg.fromEmail}
                    {msg.lead?.companyName && (
                      <span className="font-normal text-muted-foreground"> — {msg.lead.companyName}</span>
                    )}
                  </p>
                  {!msg.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {msg.aiSummary || msg.subject || '(konu yok)'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {msg.campaign && (
                    <span className="text-xs text-muted-foreground">
                      📧 {msg.campaign.name}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">{ago}</span>
                </div>
                {msg.requiresAction && !msg.isRead && (
                  <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                    Aksiyon Gerekli
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}