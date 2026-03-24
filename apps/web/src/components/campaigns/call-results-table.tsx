'use client';

import { useState } from 'react';
import { Phone, Clock, CheckCircle2, XCircle, Volume2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhoneClassificationBadge } from '../leads/phone-classification-badge';
import { CallDetailModal } from './call-detail-modal';

interface CallResult {
  id: string;
  leadId: string;
  contactName?: string;
  companyName?: string;
  phoneNumber?: string;
  classification?: string;
  status: string;
  durationSeconds?: number;
  outcome?: string;
  leadQualityScore?: number;
  sentAt: string;
  metadata?: Record<string, unknown>;
}

interface CallResultsTableProps {
  calls: CallResult[];
  token: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  call_completed: {
    label: 'Tamamlandı',
    color: 'text-green-600',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  call_no_answer: {
    label: 'Cevapsız',
    color: 'text-yellow-600',
    icon: <Phone className="w-3.5 h-3.5" />,
  },
  call_voicemail: {
    label: 'Sesli Mesaj',
    color: 'text-blue-600',
    icon: <Volume2 className="w-3.5 h-3.5" />,
  },
  failed: {
    label: 'Başarısız',
    color: 'text-red-600',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  sent: {
    label: 'Başlatıldı',
    color: 'text-muted-foreground',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
};

const OUTCOME_BADGE: Record<string, { label: string; color: string }> = {
  interested: { label: '✅ İlgili', color: 'bg-green-500/10 text-green-700 border-green-500/20' },
  not_interested: { label: '❌ İlgisiz', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  callback_requested: { label: '📅 Geri Arama', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  meeting_booked: { label: '🎯 Meeting', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  wrong_person: { label: '❓ Yanlış Kişi', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function CallResultsTable({ calls, token }: CallResultsTableProps) {
  const [selectedCall, setSelectedCall] = useState<CallResult | null>(null);

  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed border-border">
        <Phone className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Henüz arama yapılmamış</p>
      </div>
    );
  }

  return (
    <>
      {selectedCall && (
        <CallDetailModal
          call={selectedCall}
          token={token}
          onClose={() => setSelectedCall(null)}
        />
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Lead</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Sınıf</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Durum</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Süre</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Sonuç</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tarih</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {calls.map((call) => {
              const statusCfg = STATUS_CONFIG[call.status] ?? STATUS_CONFIG.sent;
              const outcomeCfg = call.outcome ? OUTCOME_BADGE[call.outcome] : null;
              const aiAnalysis = call.metadata?.aiAnalysis as Record<string, unknown> | undefined;
              const outcome = aiAnalysis?.outcome as string | undefined ?? call.outcome;

              return (
                <tr
                  key={call.id}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => setSelectedCall(call)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{call.contactName ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{call.companyName ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    {call.classification ? (
                      <PhoneClassificationBadge
                        classification={call.classification as any}
                        showLabel={false}
                      />
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('flex items-center gap-1', statusCfg.color)}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDuration(call.durationSeconds)}
                  </td>
                  <td className="px-4 py-3">
                    {outcome && OUTCOME_BADGE[outcome] ? (
                      <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full border',
                        OUTCOME_BADGE[outcome].color,
                      )}>
                        {OUTCOME_BADGE[outcome].label}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(call.sentAt).toLocaleDateString('tr-TR')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}