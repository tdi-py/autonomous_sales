'use client';

import { useState } from 'react';
import { X, Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConsentFormModalProps {
  leadId: string;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CONSENT_TYPES = [
  { value: 'inbound_form', label: 'İnbound Form', desc: 'Web formundan gelen talep' },
  { value: 'demo_request', label: 'Demo Talebi', desc: 'Demo talep formu doldurdu' },
  { value: 'web_callback', label: 'Web Callback', desc: 'Aranma talebinde bulundu' },
  { value: 'written_consent', label: 'Yazılı Rıza', desc: 'İmzalı veya dijital onay' },
  { value: 'verbal_consent', label: 'Sözlü Rıza', desc: 'Telefonda onay verdi' },
] as const;

const CONSENT_SCOPES = [
  { value: 'email_only', label: 'Sadece Email', icon: '📧' },
  { value: 'call_only', label: 'Sadece Arama', icon: '📞' },
  { value: 'ai_call', label: 'AI Arama', icon: '🤖' },
  { value: 'all_channels', label: 'Tüm Kanallar', icon: '🚀' },
] as const;

export function ConsentFormModal({ leadId, token, onClose, onSuccess }: ConsentFormModalProps) {
  const [consentType, setConsentType] = useState<string>('written_consent');
  const [consentScope, setConsentScope] = useState<string>('ai_call');
  const [consentSource, setConsentSource] = useState('');
  const [consentProofUrl, setConsentProofUrl] = useState('');
  const [consentText, setConsentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setLoading(true);
    setError('');

    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
      const res = await fetch(`${API}/leads/${leadId}/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          consentType,
          consentScope,
          consentSource: consentSource || undefined,
          consentProofUrl: consentProofUrl || undefined,
          consentText: consentText || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Rıza kaydedilemedi');
      }

      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const isAiConsent = consentScope === 'ai_call' || consentScope === 'all_channels';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Rıza Kaydı Oluştur
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Consent Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rıza Tipi *</label>
            <div className="grid grid-cols-1 gap-2">
              {CONSENT_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => setConsentType(ct.value)}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border text-left transition-colors',
                    consentType === ct.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/40',
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 mt-0.5 shrink-0',
                    consentType === ct.value ? 'border-primary bg-primary' : 'border-muted-foreground',
                  )} />
                  <div>
                    <p className="text-sm font-medium">{ct.label}</p>
                    <p className="text-xs text-muted-foreground">{ct.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Consent Scope */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rıza Kapsamı *</label>
            <div className="grid grid-cols-2 gap-2">
              {CONSENT_SCOPES.map((cs) => (
                <button
                  key={cs.value}
                  type="button"
                  onClick={() => setConsentScope(cs.value)}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-colors',
                    consentScope === cs.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-muted/40',
                  )}
                >
                  <span>{cs.icon}</span>
                  {cs.label}
                </button>
              ))}
            </div>

            {isAiConsent && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2">
                <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Bu rıza AI sesli aramayı etkinleştirir (TCPA uyumlu)
                </p>
              </div>
            )}
          </div>

          {/* Consent Source */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Rıza Kaynağı{' '}
              <span className="text-muted-foreground font-normal">(opsiyonel)</span>
            </label>
            <input
              type="text"
              value={consentSource}
              onChange={(e) => setConsentSource(e.target.value)}
              placeholder="Örn: Contact form on website"
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Proof URL */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Kanıt URL{' '}
              <span className="text-muted-foreground font-normal">(opsiyonel)</span>
            </label>
            <input
              type="url"
              value={consentProofUrl}
              onChange={(e) => setConsentProofUrl(e.target.value)}
              placeholder="https://screenshot.example.com/consent.png"
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Consent Text */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Rıza Metni{' '}
              <span className="text-muted-foreground font-normal">(opsiyonel)</span>
            </label>
            <textarea
              value={consentText}
              onChange={(e) => setConsentText(e.target.value)}
              rows={2}
              placeholder="Örn: I agree to receive AI-assisted calls from CompanyX"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-border bg-muted/30">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-border bg-background text-sm font-medium hover:bg-accent transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 ml-auto"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</>
            ) : (
              <><Shield className="w-4 h-4" /> Rıza Kaydet</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}