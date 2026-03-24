'use client';

import { X, Phone, Clock, TrendingUp, FileText, ExternalLink, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallDetailModalProps {
  call: {
    id: string;
    leadId: string;
    contactName?: string;
    companyName?: string;
    status: string;
    sentAt: string;
    metadata?: Record<string, unknown>;
  };
  token: string;
  onClose: () => void;
}

const OUTCOME_CONFIG: Record<string, { label: string; color: string }> = {
  interested: { label: '✅ İlgili', color: 'text-green-600' },
  not_interested: { label: '❌ İlgisiz', color: 'text-red-600' },
  callback_requested: { label: '📅 Geri Arama İstedi', color: 'text-blue-600' },
  meeting_booked: { label: '🎯 Meeting Ayarlandı', color: 'text-purple-600' },
  wrong_person: { label: '❓ Yanlış Kişi', color: 'text-gray-500' },
};

export function CallDetailModal({ call, token, onClose }: CallDetailModalProps) {
  const meta = (call.metadata ?? {}) as Record<string, unknown>;
  const aiAnalysis = meta.aiAnalysis as Record<string, unknown> | undefined;
  const transcript = meta.transcript as string | undefined;
  const recordingUrl = meta.recordingUrl as string | undefined;
  const durationSeconds = meta.durationSeconds as number | undefined;
  const endedReason = meta.endedReason as string | undefined;
  const cost = meta.cost as number | undefined;

  const outcome = aiAnalysis?.outcome as string | undefined;
  const sentiment = aiAnalysis?.sentiment as string | undefined;
  const objections = aiAnalysis?.objections_raised as string[] | undefined;
  const leadQualityScore = aiAnalysis?.lead_quality_score as number | undefined;
  const summary = aiAnalysis?.summary as string | undefined;
  const meetingBooked = aiAnalysis?.meeting_booked as boolean | undefined;

  const formatDuration = (s?: number) => {
    if (!s) return '—';
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Arama Detayı
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {call.contactName ?? '—'} — {call.companyName ?? '—'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Süre
              </p>
              <p className="text-lg font-bold">{formatDuration(durationSeconds)}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 space-y-1">
              <p className="text-xs text-muted-foreground">Kalite Skoru</p>
              <p className={cn(
                'text-lg font-bold',
                (leadQualityScore ?? 0) >= 70 ? 'text-green-600' :
                (leadQualityScore ?? 0) >= 40 ? 'text-yellow-600' : 'text-red-600',
              )}>
                {leadQualityScore ?? '—'}{leadQualityScore !== undefined ? '/100' : ''}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 space-y-1">
              <p className="text-xs text-muted-foreground">Sonuç</p>
              <p className={cn('text-sm font-semibold', outcome ? OUTCOME_CONFIG[outcome]?.color : '')}>
                {outcome ? OUTCOME_CONFIG[outcome]?.label : '—'}
              </p>
            </div>
          </div>

          {/* AI Analysis */}
          {aiAnalysis && (
            <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                AI Analizi
              </p>

              {summary && (
                <p className="text-sm">{summary}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {sentiment && (
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full border font-medium',
                    sentiment === 'positive' ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                    sentiment === 'negative' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                    'bg-gray-500/10 text-gray-600 border-gray-500/20',
                  )}>
                    Sentiment: {sentiment}
                  </span>
                )}
                {meetingBooked && (
                  <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-purple-500/10 text-purple-600 border-purple-500/20">
                    🎯 Meeting Ayarlandı
                  </span>
                )}
              </div>

              {objections && objections.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">İtirazlar:</p>
                  <ul className="space-y-1">
                    {objections.map((obj, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Call info */}
          <div className="rounded-lg border border-border p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tarih</span>
              <span>{new Date(call.sentAt).toLocaleString('tr-TR')}</span>
            </div>
            {endedReason && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bitiş Sebebi</span>
                <span>{endedReason}</span>
              </div>
            )}
            {cost !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maliyet</span>
                <span>${cost.toFixed(4)}</span>
              </div>
            )}
          </div>

          {/* Recording */}
          {recordingUrl && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                Kayıt
              </p>
              <audio controls className="w-full h-10" src={recordingUrl}>
                <a href={recordingUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" /> Kaydı aç
                </a>
              </audio>
            </div>
          )}

          {/* Transcript */}
          {transcript && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Transkript
              </p>
              <div className="rounded-lg border border-border bg-muted/20 p-3 max-h-48 overflow-y-auto">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                  {transcript}
                </pre>
              </div>
            </div>
          )}

          {!aiAnalysis && !transcript && (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Arama henüz işleniyor veya tamamlanmadı.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}