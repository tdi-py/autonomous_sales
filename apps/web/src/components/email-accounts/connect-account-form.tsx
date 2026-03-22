'use client';

import { useState } from 'react';
import { Mail, Settings, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Provider = 'gmail' | 'outlook' | 'custom_smtp';

interface ConnectAccountFormProps {
  projectId: string;
  onSuccess: (account: unknown) => void;
}

const PROVIDERS = [
  {
    id: 'gmail' as Provider,
    label: 'Gmail',
    description: 'Google Workspace dahil',
    icon: '📧',
    color: 'from-red-500 to-orange-400',
    fields: ['emailAddress', 'password'],
    note: 'Gmail için Google hesabınızda 2FA aktifse "App Password" oluşturmanız gerekir.',
  },
  {
    id: 'outlook' as Provider,
    label: 'Outlook',
    description: 'Microsoft 365 dahil',
    icon: '📨',
    color: 'from-blue-600 to-blue-400',
    fields: ['emailAddress', 'password'],
    note: 'Microsoft 365 hesabınızın şifresini kullanın.',
  },
  {
    id: 'custom_smtp' as Provider,
    label: 'Custom SMTP',
    description: 'Kendi SMTP sunucunuz',
    icon: '⚙️',
    color: 'from-slate-600 to-slate-400',
    fields: ['emailAddress', 'smtpHost', 'smtpPort', 'imapHost', 'imapPort', 'username', 'password'],
    note: 'SMTP ve IMAP bilgilerinizi girin.',
  },
];

export function ConnectAccountForm({ projectId, onSuccess }: ConnectAccountFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    smtp: 'ok' | 'failed' | null;
    imap: 'ok' | 'failed' | null;
    error?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    emailAddress: '',
    password: '',
    senderName: '',
    smtpHost: '',
    smtpPort: '587',
    imapHost: '',
    imapPort: '993',
    username: '',
  });

  const selectedProviderDef = PROVIDERS.find((p) => p.id === selectedProvider);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('auth_token');
      const body: Record<string, unknown> = {
        projectId,
        emailAddress: form.emailAddress,
        provider: selectedProvider,
        password: form.password,
        senderName: form.senderName || undefined,
      };

      if (selectedProvider === 'custom_smtp') {
        body.smtpHost = form.smtpHost;
        body.smtpPort = parseInt(form.smtpPort, 10);
        body.imapHost = form.imapHost;
        body.imapPort = parseInt(form.imapPort, 10);
        body.username = form.username || form.emailAddress;
      }

      const res = await fetch('/api/email-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? 'Hesap bağlanamadı');
      }

      setSuccess(true);
      onSuccess(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <div className="space-y-6">
      {/* Provider selector */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Email sağlayıcısı seçin</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              type="button"
              id={`provider-${provider.id}`}
              onClick={() => {
                setSelectedProvider(provider.id);
                setTestResult(null);
                setError(null);
              }}
              className={cn(
                'relative flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-all',
                selectedProvider === provider.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-accent/30',
              )}
            >
              <span className="text-2xl">{provider.icon}</span>
              <div>
                <p className="text-sm font-semibold">{provider.label}</p>
                <p className="text-xs text-muted-foreground">{provider.description}</p>
              </div>
              {selectedProvider === provider.id && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      {selectedProvider && selectedProviderDef && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Note */}
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">{selectedProviderDef.note}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Adresi</label>
              <input
                id="email-address-input"
                type="email"
                required
                placeholder="sales@company.com"
                className="w-full h-10 px-3 rounded-lg border border-border bg-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                {...field('emailAddress')}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gönderici Adı</label>
              <input
                id="sender-name-input"
                type="text"
                placeholder="Sales Team"
                className="w-full h-10 px-3 rounded-lg border border-border bg-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                {...field('senderName')}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {selectedProvider === 'gmail' ? 'App Password' : 'Şifre'}
              </label>
              <input
                id="password-input"
                type="password"
                required
                placeholder="••••••••••••••••"
                className="w-full h-10 px-3 rounded-lg border border-border bg-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                {...field('password')}
              />
            </div>

            {selectedProvider === 'custom_smtp' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">SMTP Host</label>
                  <input
                    id="smtp-host-input"
                    type="text"
                    required
                    placeholder="smtp.yourserver.com"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    {...field('smtpHost')}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">SMTP Port</label>
                  <input
                    id="smtp-port-input"
                    type="number"
                    required
                    placeholder="587"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    {...field('smtpPort')}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">IMAP Host</label>
                  <input
                    id="imap-host-input"
                    type="text"
                    placeholder="imap.yourserver.com"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    {...field('imapHost')}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">IMAP Port</label>
                  <input
                    id="imap-port-input"
                    type="number"
                    placeholder="993"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    {...field('imapPort')}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kullanıcı Adı</label>
                  <input
                    id="username-input"
                    type="text"
                    placeholder="Email adresiniz ile aynı olabilir"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    {...field('username')}
                  />
                </div>
              </>
            )}
          </div>

          {/* Test result */}
          {testResult && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bağlantı Test Sonucu</p>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-sm">
                  {testResult.smtp === 'ok'
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    : <XCircle className="w-4 h-4 text-destructive" />}
                  SMTP {testResult.smtp === 'ok' ? '✓' : '✗'}
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  {testResult.imap === 'ok'
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    : <XCircle className="w-4 h-4 text-destructive" />}
                  IMAP {testResult.imap === 'ok' ? '✓' : '✗'}
                </span>
              </div>
              {testResult.error && (
                <p className="text-xs text-destructive">{testResult.error}</p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Email hesabı başarıyla bağlandı! DNS kontrol ediliyor...
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              id="connect-account-submit"
              type="submit"
              disabled={loading || success}
              className={cn(
                'flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold transition-all',
                loading || success
                  ? 'bg-primary/50 cursor-not-allowed text-primary-foreground'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99]',
              )}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
                  Bağlanıyor...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Bağlandı
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Hesabı Bağla
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
