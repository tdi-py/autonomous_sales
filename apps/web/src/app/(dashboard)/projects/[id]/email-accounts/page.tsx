'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, Mail, X } from 'lucide-react';
import Link from 'next/link';

import { ConnectAccountForm } from '@/components/email-accounts/connect-account-form';
import { EmailAccountsList } from '@/components/email-accounts/account-card';
import { cn } from '@/lib/utils';

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
  createdAt: string;
}

export default function EmailAccountsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : '';

  const fetchAccounts = useCallback(async () => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
      const res = await fetch(`${API}/email-accounts?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch {
      // API not connected yet — mock data for UI preview
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleAccountConnected = (account: unknown) => {
    setAccounts((prev) => [account as EmailAccount, ...prev]);
    setShowForm(false);
  };

  const handleAccountDeleted = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Projeye Dön
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Email Hesapları
          </h1>
          <p className="text-sm text-muted-foreground">
            Email hesaplarınızı bağlayın, DNS kayıtlarını kontrol edin ve hesabınızı ısındırın.
          </p>
        </div>

        <button
          id="add-email-account-btn"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all hover:scale-[1.01] active:scale-[0.99] shrink-0"
        >
          <Plus className="w-4 h-4" />
          Hesap Bağla
        </button>
      </div>

      {/* Info bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { emoji: '🔌', title: 'SMTP/IMAP Bağlantısı', desc: 'Gerçek zamanlı bağlantı testi' },
          { emoji: '🔒', title: 'DNS Kontrolü', desc: 'SPF, DKIM, DMARC doğrulama' },
          { emoji: '🔥', title: '28 Günlük Isındırma', desc: 'Kademeli gönderim artışı' },
        ].map(({ emoji, title, desc }) => (
          <div key={title} className="flex items-start gap-3 rounded-xl border border-border bg-card/50 px-4 py-3">
            <span className="text-xl">{emoji}</span>
            <div>
              <p className="text-xs font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Connect form modal/inline */}
      {showForm && (
        <div className="rounded-xl border border-primary/30 bg-card shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
            <div>
              <h2 className="text-sm font-semibold">Yeni Email Hesabı Bağla</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                SMTP/IMAP bilgilerinizi girin — sistem otomatik olarak test edecek
              </p>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5">
            <ConnectAccountForm
              projectId={projectId}
              onSuccess={handleAccountConnected}
            />
          </div>
        </div>
      )}

      {/* Accounts list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Bağlı Hesaplar {accounts.length > 0 && `(${accounts.length})`}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <EmailAccountsList
            projectId={projectId}
            accounts={accounts}
            onDeleted={handleAccountDeleted}
          />
        )}
      </div>

      {/* Help section */}
      {!loading && accounts.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
          <h3 className="text-sm font-semibold">📋 Gönderim Kalitesini Artırmak İçin</h3>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-none">
            <li>✅ SPF, DKIM ve DMARC'ın tümünün geçerli olduğundan emin olun</li>
            <li>🔥 28 günlük ısındırma sürecini tamamlayın (günlük limit 200'e çıkar)</li>
            <li>📬 Kampanya başlatmadan önce spam testi çalıştırın</li>
            <li>🎯 Kişiselleştirilmiş içerik spam filtrelerinden daha iyi geçer</li>
          </ul>
        </div>
      )}
    </div>
  );
}
