'use client';

import { useState } from 'react';
import { Mail, Phone, Linkedin, Zap, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IcpProfile {
  id: string;
  label: string;
}

interface CreateCampaignFormProps {
  projectId: string;
  icpProfiles: IcpProfile[];
  onSubmit: (data: {
    name: string;
    type: string;
    icpProfileId?: string;
    targetLanguage: string;
    additionalNotes?: string;
    scriptOnly?: boolean;
  }) => void;
  isLoading?: boolean;
}

const CAMPAIGN_TYPES = [
  {
    id: 'cold_email',
    label: 'Cold Email',
    desc: 'Kişiselleştirilmiş email dizisi',
    icon: Mail,
    color: 'text-blue-600',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    available: true,
  },
  {
    id: 'cold_call',
    label: 'Cold Call',
    desc: 'Arama senaryosu + AI arama',
    icon: Phone,
    color: 'text-green-600',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    available: true,
  },
  {
    id: 'multi_channel',
    label: 'Multi-Channel',
    desc: 'Email + Call birleşik',
    icon: Zap,
    color: 'text-orange-600',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    available: true,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    desc: 'LinkedIn mesaj dizisi',
    icon: Linkedin,
    color: 'text-sky-600',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    available: false,
  },
];

const LANGUAGES = [
  { code: 'en', label: '🇺🇸 English' },
  { code: 'tr', label: '🇹🇷 Türkçe' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'pt', label: '🇧🇷 Português' },
];

export function CreateCampaignForm({
  projectId,
  icpProfiles,
  onSubmit,
  isLoading,
}: CreateCampaignFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('cold_email');
  const [icpProfileId, setIcpProfileId] = useState(icpProfiles[0]?.id ?? '');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [scriptOnly, setScriptOnly] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim() || name.length < 2) e.name = 'Kampanya adı en az 2 karakter olmalı';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      type,
      icpProfileId: icpProfileId || undefined,
      targetLanguage,
      additionalNotes: additionalNotes.trim() || undefined,
      scriptOnly: type === 'cold_call' ? scriptOnly : undefined,
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Yeni Kampanya</h2>
        <p className="text-sm text-muted-foreground">
          AI, projenizi analiz ederek otomatik satış içerikleri üretecek.
        </p>
      </div>

      <div className="space-y-6">
        {/* Campaign name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Kampanya Adı *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Florist Soğuk Email — Mart 2026"
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        {/* Campaign type */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Kampanya Tipi *</label>
          <div className="grid grid-cols-2 gap-3">
            {CAMPAIGN_TYPES.map((ct) => (
              <button
                key={ct.id}
                type="button"
                disabled={!ct.available}
                onClick={() => ct.available && setType(ct.id)}
                className={cn(
                  'relative flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
                  !ct.available && 'opacity-50 cursor-not-allowed',
                  type === ct.id && ct.available
                    ? `${ct.border} ${ct.bg}`
                    : 'border-border bg-background hover:bg-muted/50',
                )}
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', ct.bg)}>
                  <ct.icon className={cn('w-4 h-4', ct.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium">{ct.label}</p>
                  <p className="text-xs text-muted-foreground">{ct.desc}</p>
                </div>
                {!ct.available && (
                  <span className="absolute top-2 right-2 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                    Yakında
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Script-only mode (cold_call için) */}
        {type === 'cold_call' && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={scriptOnly}
              onChange={(e) => setScriptOnly(e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            <div>
              <p className="text-sm font-medium">Sadece senaryo oluştur</p>
              <p className="text-xs text-muted-foreground">
                AI arama yapılmaz, sadece kullanabileceğiniz bir script üretilir.
              </p>
            </div>
          </label>
        )}

        {/* ICP Profile */}
        {icpProfiles.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Hedef ICP Profili</label>
            <select
              value={icpProfileId}
              onChange={(e) => setIcpProfileId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Seçin —</option>
              {icpProfiles.map((icp) => (
                <option key={icp.id} value={icp.id}>
                  {icp.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Language */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Hedef Dil</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setTargetLanguage(lang.code)}
                className={cn(
                  'h-8 px-3 rounded-full text-xs font-medium transition-colors',
                  targetLanguage === lang.code
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-background text-muted-foreground hover:bg-accent',
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Additional notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Ek Notlar{' '}
            <span className="text-muted-foreground font-normal">(opsiyonel)</span>
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={2}
            placeholder="Örn: Florist niche'ine odaklan, 'same-day delivery' özelliğini öne çıkar..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading ? 'Kampanya Oluşturuluyor...' : (
          <>
            İçerik Üret
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}