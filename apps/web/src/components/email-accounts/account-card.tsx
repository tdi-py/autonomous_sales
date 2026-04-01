'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  X as XIcon,
  Save,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { DnsStatus } from './dns-status';
import { WarmupProgress } from './warmup-progress';
import { DeliverabilityResults } from './deliverability-results';

// ─── Auth Token Helper ────────────────────────────────────────────────────────
// ✅ Fixed: consistent with the rest of the app — use cookie, not localStorage

function getAuthToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailAccount {
  id: string;
  emailAddress: string;
  provider: 'gmail' | 'outlook' | 'custom_smtp';
  warmupStatus: 'not_started' | 'warming' | 'ready' | 'paused';
  warmupDay: number;
  dailySendLimit: number;
  healthScore?: number | null;
  spfValid?: boolean | null;
  dkimValid?: boolean | null;
  dmarcValid?: boolean | null;
  warmupSeedEmails?: string[] | null;
  createdAt: string;
}

interface WarmupProgressData {
  completedDays: number;
  totalDays: number;
  percentComplete: number;
  currentDailyLimit: number;
}

interface DeliverabilityTest {
  id: string;
  gmailResult: string;
  outlookResult: string;
  yahooResult?: string;
  overallScore?: number | null;
  testedAt: string;
  issuesDetected?: string[];
}

const PROVIDER_LABELS = {
  gmail: 'Gmail',
  outlook: 'Outlook',
  custom_smtp: 'Custom SMTP',
};

const PROVIDER_COLORS = {
  gmail: 'from-red-500 to-orange-400',
  outlook: 'from-blue-600 to-blue-400',
  custom_smtp: 'from-slate-600 to-slate-400',
};

// ─── Account Card ─────────────────────────────────────────────────────────────

interface AccountCardProps {
  account: EmailAccount;
  onDeleted: (id: string) => void;
}

function AccountCard({ account, onDeleted }: AccountCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [warmupProgress, setWarmupProgress] = useState<WarmupProgressData | null>(null);
  const [deliverabilityTests, setDeliverabilityTests] = useState<DeliverabilityTest[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [localAccount, setLocalAccount] = useState(account);
  const [seedEmails, setSeedEmails] = useState<string[]>(account.warmupSeedEmails ?? []);
  const [seedEmailInput, setSeedEmailInput] = useState('');
  const [savingSeedEmails, setSavingSeedEmails] = useState(false);

  const apiFetch = useCallback(async (path: string, options?: RequestInit) => {
    const token = getAuthToken(); // ✅ Cookie-based token
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
    }
    return res.json();
  }, []);

  const loadDetails = useCallback(async () => {
    try {
      const [progress, tests] = await Promise.all([
        apiFetch(`/email-accounts/${account.id}/warmup-progress`),
        apiFetch(`/email-accounts/${account.id}/deliverability-history`),
      ]);
      setWarmupProgress(progress as WarmupProgressData);
      setDeliverabilityTests(tests as DeliverabilityTest[]);
    } catch {
      // Silently fail — not critical
    }
  }, [account.id, apiFetch]);

  useEffect(() => {
    if (expanded) loadDetails();
  }, [expanded, loadDetails]);

  const handleAction = async (action: string) => {
    setLoadingAction(action);
    try {
      switch (action) {
        case 'test-connection': {
          const result = await apiFetch(`/email-accounts/${account.id}/test-connection`, { method: 'POST' });
          alert(`SMTP: ${(result as { smtp: string }).smtp}, IMAP: ${(result as { imap: string }).imap}${(result as { error?: string }).error ? `\n${(result as { error: string }).error}` : ''}`);
          break;
        }
        case 'check-dns': {
          const result = await apiFetch(`/email-accounts/${account.id}/check-dns`, { method: 'POST' });
          setLocalAccount((prev) => ({
            ...prev,
            spfValid: (result as { spfValid: boolean }).spfValid,
            dkimValid: (result as { dkimValid: boolean }).dkimValid,
            dmarcValid: (result as { dmarcValid: boolean }).dmarcValid,
            healthScore: (result as { healthScore: number }).healthScore,
          }));
          break;
        }
        case 'start-warmup': {
          await apiFetch(`/email-accounts/${account.id}/start-warmup`, { method: 'POST' });
          setLocalAccount((prev) => ({ ...prev, warmupStatus: 'warming', warmupDay: 1, dailySendLimit: 5 }));
          break;
        }
        case 'pause-warmup': {
          await apiFetch(`/email-accounts/${account.id}/pause-warmup`, { method: 'POST' });
          setLocalAccount((prev) => ({ ...prev, warmupStatus: 'paused' }));
          break;
        }
        case 'resume-warmup': {
          await apiFetch(`/email-accounts/${account.id}/resume-warmup`, { method: 'POST' });
          setLocalAccount((prev) => ({ ...prev, warmupStatus: 'warming' }));
          break;
        }
        case 'delete': {
          if (!confirm(`${localAccount.emailAddress} hesabını kaldırmak istediğinize emin misiniz?`)) break;
          await apiFetch(`/email-accounts/${account.id}`, { method: 'DELETE' });
          onDeleted(account.id);
          break;
        }
      }
    } catch (err) {
      alert(`Hata: ${(err as Error).message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSaveSeedEmails = async () => {
    setSavingSeedEmails(true);
    try {
      await apiFetch(`/email-accounts/${account.id}/seed-emails`, {
        method: 'PUT',
        body: JSON.stringify({ seedEmails }),
      });
    } catch (err) {
      alert(`Hata: ${(err as Error).message}`);
    } finally {
      setSavingSeedEmails(false);
    }
  };

  const handleAddSeedEmail = () => {
    const email = seedEmailInput.trim();
    if (!email || seedEmails.includes(email)) return;
    if (!email.includes('@')) { alert('Geçerli bir email adresi girin'); return; }
    setSeedEmails((prev) => [...prev, email]);
    setSeedEmailInput('');
  };

  const handleRunTest = async () => {
    setTestLoading(true);
    try {
      await apiFetch(`/email-accounts/${account.id}/run-deliverability-test`, { method: 'POST' });
      await loadDetails();
    } catch (err) {
      alert(`Test hatası: ${(err as Error).message}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-primary/30">
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Provider badge */}
          <div className={cn(
            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold',
            `bg-gradient-to-br ${PROVIDER_COLORS[localAccount.provider]}`,
          )}>
            {localAccount.provider === 'gmail' ? 'G' : localAccount.provider === 'outlook' ? 'O' : 'S'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold truncate">{localAccount.emailAddress}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                {PROVIDER_LABELS[localAccount.provider]}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Günlük Limit: <strong>{localAccount.dailySendLimit}</strong> email
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id={`account-test-${account.id}`}
              onClick={() => handleAction('test-connection')}
              disabled={loadingAction !== null}
              title="Bağlantı Test Et"
              className="flex items-center gap-1 h-8 px-2 rounded-md border border-border bg-background hover:bg-accent text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {loadingAction === 'test-connection' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Test</span>
            </button>
            <button
              id={`account-delete-${account.id}`}
              onClick={() => handleAction('delete')}
              disabled={loadingAction !== null}
              title="Hesabı Kaldır"
              className="flex items-center gap-1 h-8 px-2 rounded-md border border-border bg-background hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-xs text-muted-foreground transition-colors disabled:opacity-50"
            >
              {loadingAction === 'delete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setExpanded((p) => !p)}
              className="flex items-center h-8 px-2 rounded-md border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick status row */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {/* DNS mini status */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">DNS:</span>
            {(['spf', 'dkim', 'dmarc'] as const).map((key) => {
              const val = localAccount[`${key}Valid` as keyof EmailAccount] as boolean | null | undefined;
              return (
                <span
                  key={key}
                  className={cn(
                    'text-xs font-medium px-1.5 py-0.5 rounded',
                    val === true ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    val === false ? 'bg-destructive/10 text-destructive' :
                    'bg-muted text-muted-foreground',
                  )}
                >
                  {key.toUpperCase()}
                  {val === true ? ' ✓' : val === false ? ' ✗' : ' ?'}
                </span>
              );
            })}
          </div>

          {/* Warmup status */}
          <div className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            localAccount.warmupStatus === 'ready' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
            localAccount.warmupStatus === 'warming' ? 'bg-orange-500/10 text-orange-600' :
            localAccount.warmupStatus === 'paused' ? 'bg-amber-500/10 text-amber-600' :
            'bg-muted text-muted-foreground',
          )}>
            {localAccount.warmupStatus === 'not_started' ? '⏸ Başlatılmadı' :
             localAccount.warmupStatus === 'warming' ? `🔥 Isınıyor — Gün ${localAccount.warmupDay}/28` :
             localAccount.warmupStatus === 'ready' ? '✅ Hazır' :
             '⏸ Duraklatıldı'}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border bg-muted/30 p-4 space-y-5">
          {/* DNS Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">DNS Durumu</p>
              <button
                id={`check-dns-${account.id}`}
                onClick={() => handleAction('check-dns')}
                disabled={loadingAction !== null}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                {loadingAction === 'check-dns' ? 'Kontrol ediliyor...' : 'Yenile'}
              </button>
            </div>
            <DnsStatus
              emailAddress={localAccount.emailAddress}
              spfValid={localAccount.spfValid}
              dkimValid={localAccount.dkimValid}
              dmarcValid={localAccount.dmarcValid}
              healthScore={localAccount.healthScore}
              onRecheck={() => handleAction('check-dns')}
            />
          </div>

          {/* Warmup Progress */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Isındırma</p>
            <WarmupProgress
              status={localAccount.warmupStatus}
              warmupDay={localAccount.warmupDay}
              totalDays={28}
              dailySendLimit={localAccount.dailySendLimit}
              percentComplete={warmupProgress?.percentComplete ?? Math.round((localAccount.warmupDay / 28) * 100)}
              onStart={() => handleAction('start-warmup')}
              onPause={() => handleAction('pause-warmup')}
              onResume={() => handleAction('resume-warmup')}
              loading={loadingAction === 'start-warmup' || loadingAction === 'pause-warmup' || loadingAction === 'resume-warmup'}
            />
          </div>

          {/* Warmup Seed Emails */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Isındırma Test Emailleri
              </p>
              <button
                onClick={handleSaveSeedEmails}
                disabled={savingSeedEmails}
                className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
              >
                {savingSeedEmails ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Kaydet
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Isındırma emailleri bu adreslere gönderilecek. Spam yükünü azaltmak için kendi test emaillerinizi girin.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={seedEmailInput}
                onChange={(e) => setSeedEmailInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddSeedEmail(); }}
                placeholder="test@gmail.com"
                className="flex-1 border border-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-background"
              />
              <button
                onClick={handleAddSeedEmail}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs hover:bg-primary/90"
              >
                <Plus className="w-3 h-3" />
                Ekle
              </button>
            </div>
            {seedEmails.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {seedEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-100"
                  >
                    {email}
                    <button
                      onClick={() => setSeedEmails((prev) => prev.filter((e) => e !== email))}
                      className="hover:text-red-500"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                ⚠️ Test email eklenmedi. Env var SEED_TEST_GMAIL kullanılacak. Test emaillerinizi ekleyerek daha iyi kontrol sağlayabilirsiniz.
              </p>
            )}
          </div>

          {/* Deliverability */}
          <div className="space-y-2">
            <DeliverabilityResults
              tests={deliverabilityTests as Parameters<typeof DeliverabilityResults>[0]['tests']}
              seedTestAvailable={false}
              onRunTest={handleRunTest}
              runningTest={testLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface EmailAccountsListProps {
  projectId: string;
  accounts: EmailAccount[];
  onDeleted: (id: string) => void;
}

export function EmailAccountsList({ projectId: _projectId, accounts, onDeleted }: EmailAccountsListProps) {
  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-xl border border-dashed border-border">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
          <Mail className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">Henüz email hesabı bağlamadınız</p>
          <p className="text-xs text-muted-foreground mt-1">
            Kampanya göndermek için en az bir email hesabı bağlayın.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          onDeleted={onDeleted}
        />
      ))}
    </div>
  );
}
