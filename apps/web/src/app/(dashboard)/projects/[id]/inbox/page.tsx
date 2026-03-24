'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Inbox, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { MessageList } from '@/components/inbox/message-list';
import { MessageDetail } from '@/components/inbox/message-detail';

type InboxFilter = 'all' | 'requires_action' | 'positive' | 'negative' | 'unread';

interface InboxMessage {
  id: string;
  fromEmail: string;
  subject: string;
  bodyText: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'objection' | 'unsubscribe' | 'out_of_office';
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
}

const FILTERS: { value: InboxFilter; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'requires_action', label: 'Aksiyon Gerekli' },
  { value: 'positive', label: 'Pozitif' },
  { value: 'negative', label: 'Negatif' },
  { value: 'unread', label: 'Okunmamış' },
];

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

export default function InboxPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMessages = useCallback(async () => {
    const token = getToken();
    try {
      const data = await api.get<InboxMessage[]>(
        `/inbox?projectId=${projectId}&filter=${filter}`,
        token,
      );
      setMessages(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId, filter]);

  useEffect(() => {
    setLoading(true);
    loadMessages();
  }, [loadMessages]);

  const selectedMessage = messages.find((m) => m.id === selectedId) ?? null;

  async function handleAction(messageId: string, action: string) {
    const token = getToken();
    await api.patch(`/inbox/${messageId}/action`, { action }, token);
    await loadMessages();
  }

  async function handleMarkRead(messageId: string) {
    const token = getToken();
    await api.patch(`/inbox/${messageId}/read`, {}, token);
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isRead: true } : m)),
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left panel - message list */}
      <div className="w-96 flex flex-col border-r border-border shrink-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              Gelen Yanıtlar
            </h2>
            <button
              onClick={loadMessages}
              className="p-1.5 rounded-md hover:bg-accent transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'h-6 px-2.5 rounded-full text-xs font-medium transition-colors',
                  filter === f.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="px-4 py-8 text-sm text-destructive">{error}</p>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
              <Inbox className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Henüz yanıt yok</p>
            </div>
          ) : (
            <MessageList
              messages={messages}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                handleMarkRead(id);
              }}
            />
          )}
        </div>
      </div>

      {/* Right panel - message detail */}
      <div className="flex-1 overflow-y-auto">
        {selectedMessage ? (
          <MessageDetail
            message={selectedMessage}
            onAction={(action) => handleAction(selectedMessage.id, action)}
            onRefresh={loadMessages}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <Inbox className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm">Sol panelden bir mesaj seçin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}