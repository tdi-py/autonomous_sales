'use client';

import { useState } from 'react';
import { Phone, Download, Copy, Check } from 'lucide-react';
import { ObjectionHandlerTable } from './objection-handler-table';
import { api } from '@/lib/api';

interface ObjectionHandler {
  objection: string;
  response: string;
}

interface CallScript {
  id: string;
  version: number;
  openingScript: string | null;
  hook?: string;
  qualificationQuestions?: string[];
  dialogueTree: Record<string, unknown>;
  objectionHandlers: ObjectionHandler[];
  closingScript: string | null;
  language: string;
}

interface CallScriptEditorProps {
  campaignId: string;
  scripts: CallScript[];
  scriptOnly?: boolean;
  onRefresh: () => void;
}

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

export function CallScriptEditor({
  campaignId,
  scripts,
  scriptOnly,
  onRefresh,
}: CallScriptEditorProps) {
  const script = scripts[0]; // En güncel versiyon
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local state — mutable fields
  const [opening, setOpening] = useState(script?.openingScript ?? '');
  const [closing, setClosing] = useState(script?.closingScript ?? '');
  const [objections, setObjections] = useState<ObjectionHandler[]>(
    (script?.objectionHandlers as ObjectionHandler[]) ?? [],
  );

  if (!script) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Call script henüz üretilmedi.
      </div>
    );
  }

  async function handleSave() {
    const token = getToken();
    setIsSaving(true);
    try {
      await api.patch(`/campaigns/${campaignId}/scripts/${script.id}`, {
        openingScript: opening,
        closingScript: closing,
        objectionHandlers: objections,
      }, token);
      onRefresh();
    } finally {
      setIsSaving(false);
    }
  }

  function copyScript() {
    const text = `AÇILIŞ:\n${opening}\n\nİTİRAZ KARŞILAMA:\n${objections.map((o) => `❓ ${o.objection}\n✅ ${o.response}`).join('\n\n')}\n\nKAPANIŞ:\n${closing}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Script-only badge */}
      {scriptOnly && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-2.5">
          <Phone className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-700">
            Sadece senaryo modu — AI arama yapılmayacak. Bu senaryoyu manuel aramada kullanabilirsiniz.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Versiyon {script.version} · {script.language.toUpperCase()}</p>
        <div className="flex gap-2">
          <button
            onClick={copyScript}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-xs hover:bg-accent transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Kopyalandı' : 'Kopyala'}
          </button>
        </div>
      </div>

      {/* Opening */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
          Açılış (İlk 10 Saniye)
        </label>
        <textarea
          value={opening}
          onChange={(e) => setOpening(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Hook from dialogue tree */}
      {(script.dialogueTree as any)?.hook?.agent_says && (
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
            Değer Önerisi (Hook)
          </label>
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            {(script.dialogueTree as any).hook.agent_says}
          </div>
        </div>
      )}

      {/* Objection handlers */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
          İtiraz Karşılama ({objections.length} itiraz)
        </label>
        <ObjectionHandlerTable handlers={objections} onChange={setObjections} />
      </div>

      {/* Closing */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">4</span>
          Kapanış (Meeting / Sonraki Adım)
        </label>
        <textarea
          value={closing}
          onChange={(e) => setClosing(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </div>
    </div>
  );
}