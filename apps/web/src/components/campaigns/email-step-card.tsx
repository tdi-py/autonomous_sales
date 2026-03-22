'use client';

import { useState } from 'react';
import { RefreshCw, Eye, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailSequence {
  id: string;
  stepOrder: number;
  subjectTemplate: string;
  bodyTemplate: string;
  delayDays: number;
  variantLabel: string;
}

interface EmailStepCardProps {
  stepOrder: number;
  delayDays: number;
  variantA: EmailSequence | undefined;
  variantB: EmailSequence | undefined;
  onUpdate: (id: string, subject: string, body: string) => Promise<void>;
  onRegenerate: (stepOrder: number) => void;
  isRegenerating?: boolean;
}

function highlightPlaceholders(text: string): string {
  return text.replace(/\{\{([^}]+)\}\}/g, '<mark class="bg-yellow-200 dark:bg-yellow-900/50 rounded px-0.5">{{$1}}</mark>');
}

export function EmailStepCard({
  stepOrder,
  delayDays,
  variantA,
  variantB,
  onUpdate,
  onRegenerate,
  isRegenerating,
}: EmailStepCardProps) {
  const [activeVariant, setActiveVariant] = useState<'A' | 'B'>('A');
  const [editingSubject, setEditingSubject] = useState('');
  const [editingBody, setEditingBody] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const activeSeq = activeVariant === 'A' ? variantA : variantB;
  const subject = isEditing ? editingSubject : (activeSeq?.subjectTemplate ?? '');
  const body = isEditing ? editingBody : (activeSeq?.bodyTemplate ?? '');

  // Spam kontrolü (basit client-side)
  const SPAM_WORDS = ['free', 'guaranteed', 'act now', 'click here', 'buy now', 'urgent'];
  const foundSpam = SPAM_WORDS.filter((w) =>
    (subject + ' ' + body).toLowerCase().includes(w),
  );

  const charCount = subject.length;
  const wordCount = body.split(/\s+/).filter(Boolean).length;

  function startEdit() {
    setEditingSubject(activeSeq?.subjectTemplate ?? '');
    setEditingBody(activeSeq?.bodyTemplate ?? '');
    setIsEditing(true);
  }

  async function handleSave() {
    if (!activeSeq) return;
    setIsSaving(true);
    try {
      await onUpdate(activeSeq.id, editingSubject, editingBody);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  const delayLabel = delayDays === 0 ? 'Gün 0 — İlk Temas' : `Gün ${delayDays} — Takip`;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
            {stepOrder}
          </span>
          <div>
            <p className="text-sm font-medium">Adım {stepOrder}</p>
            <p className="text-xs text-muted-foreground">{delayLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* A/B Toggle */}
          <div className="flex rounded-md border border-border overflow-hidden text-xs">
            {(['A', 'B'] as const).map((v) => (
              <button
                key={v}
                onClick={() => { setActiveVariant(v); setIsEditing(false); }}
                className={cn(
                  'px-3 py-1.5 font-medium transition-colors',
                  activeVariant === v
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-accent',
                )}
              >
                Varyant {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-8 h-8 rounded-md border border-border hover:bg-accent flex items-center justify-center transition-colors"
            title="Önizle"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onRegenerate(stepOrder)}
            disabled={isRegenerating}
            className="w-8 h-8 rounded-md border border-border hover:bg-accent flex items-center justify-center transition-colors disabled:opacity-50"
            title="Yeniden Üret"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isRegenerating && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Spam warning */}
      {foundSpam.length > 0 && (
        <div className="px-5 py-2 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center gap-2 text-xs text-yellow-700">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Spam kelimesi tespit edildi: {foundSpam.join(', ')}
        </div>
      )}

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Subject */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Subject
            </label>
            <span className={cn('text-xs', charCount > 60 ? 'text-destructive' : 'text-muted-foreground')}>
              {charCount}/60
            </span>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editingSubject}
              onChange={(e) => setEditingSubject(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          ) : (
            <div
              className="text-sm font-medium cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 transition-colors"
              onClick={startEdit}
              dangerouslySetInnerHTML={{ __html: highlightPlaceholders(subject) }}
            />
          )}
        </div>

        {/* Body */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Body
            </label>
            <span className={cn('text-xs', wordCount > 300 ? 'text-destructive' : 'text-muted-foreground')}>
              {wordCount} kelime
            </span>
          </div>
          {isEditing ? (
            <textarea
              value={editingBody}
              onChange={(e) => setEditingBody(e.target.value)}
              rows={8}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y font-mono"
            />
          ) : (
            <div
              className="text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 transition-colors whitespace-pre-wrap text-muted-foreground"
              onClick={startEdit}
              dangerouslySetInnerHTML={{ __html: highlightPlaceholders(body) }}
            />
          )}
        </div>

        {/* Edit actions */}
        {isEditing && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="h-8 px-4 rounded-md border border-border text-xs hover:bg-accent transition-colors"
            >
              İptal
            </button>
          </div>
        )}

        {/* Preview modal */}
        {showPreview && (
          <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Önizleme (örnek verilerle)
              </p>
              <button onClick={() => setShowPreview(false)} className="text-xs text-muted-foreground hover:text-foreground">
                Kapat
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {subject
                  .replace('{{first_name}}', 'Sarah')
                  .replace('{{company_name}}', 'Bloom & Co')
                  .replace('{{job_title}}', 'Owner')}
              </p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {body
                  .replace(/\{\{first_name\}\}/g, 'Sarah')
                  .replace(/\{\{company_name\}\}/g, 'Bloom & Co')
                  .replace(/\{\{job_title\}\}/g, 'Owner')
                  .replace(/\{\{unsubscribe_link\}\}/g, '[Unsubscribe]')
                  .replace(/\{\{physical_address\}\}/g, '123 Main St, New York, NY 10001')
                  .replace(/\{\{sender_name\}\}/g, 'Mustafa')
                  .replace(/\{\{sender_title\}\}/g, 'Founder, ShopFast')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}