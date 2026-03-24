'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Upload, Users, Phone, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { PhoneClassificationBadge } from '@/components/leads/phone-classification-badge';

interface Lead {
  id: string;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: 'new' | 'contacted' | 'responded' | 'qualified' | 'converted' | 'lost';
  phoneVerification?: {
    aiCallClassification: 'can_call_ai' | 'can_call_manual' | 'cannot_call';
    numberType: string;
    isOnDnc: boolean;
    verifiedAt: string | null;
  } | null;
}

interface PhoneStats {
  total: number;
  notVerified: number;
  canCallAi: number;
  canCallManual: number;
  cannotCall: number;
}

const statusStyle: Record<Lead['status'], string> = {
  new:       'bg-gray-500/10 text-gray-500 border-gray-500/20',
  contacted: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  responded: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  qualified: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  converted: 'bg-green-500/10 text-green-600 border-green-500/20',
  lost:      'bg-red-500/10 text-red-500 border-red-500/20',
};

const STATUS_FILTERS = ['all', 'new', 'contacted', 'responded', 'qualified', 'converted', 'lost'];
const PHONE_FILTERS = ['all', 'can_call_ai', 'can_call_manual', 'cannot_call', 'not_verified'];

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export default function ProjectLeadsPage() {
  const { id } = useParams<{ id: string }>();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [phoneStats, setPhoneStats] = useState<PhoneStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [phoneFilter, setPhoneFilter] = useState('all');
  const [bulkVerifying, setBulkVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ queued: number } | null>(null);

  const loadLeads = useCallback(async () => {
    const token = getToken();
    try {
      const params = new URLSearchParams({ projectId: id, limit: '100' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (phoneFilter !== 'all') params.set('phoneClassification', phoneFilter);

      const res = await api.get<{ data: Lead[] }>(`/leads?${params.toString()}`, token);
      setLeads(res.data ?? []);
    } catch {
      setLeads([]);
    }
  }, [id, statusFilter, phoneFilter]);

  const loadPhoneStats = useCallback(async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/phone-verification/project?projectId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { stats: PhoneStats };
        setPhoneStats(data.stats);
      }
    } catch {}
  }, [id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadLeads(), loadPhoneStats()]).finally(() => setLoading(false));
  }, [loadLeads, loadPhoneStats]);

  async function handleBulkVerify() {
    const token = getToken();
    setBulkVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch(`${API_URL}/phone-verification/bulk-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId: id }),
      });
      if (res.ok) {
        const data = await res.json() as { queued: number };
        setVerifyResult(data);
        // Reload stats after a brief delay
        setTimeout(() => { loadPhoneStats(); loadLeads(); }, 5000);
      }
    } catch {}
    finally { setBulkVerifying(false); }
  }

  const getPhoneClassification = (lead: Lead) => {
    return lead.phoneVerification?.aiCallClassification ?? 'not_verified';
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <Link
        href={`/projects/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Projeye Dön
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Leads</h2>
          <p className="text-sm text-muted-foreground mt-1">{leads.length} lead</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkVerify}
            disabled={bulkVerifying}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-background text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            {bulkVerifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Tümünü Doğrula
          </button>
          <button className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-background text-sm font-medium hover:bg-accent transition-colors">
            <Upload className="w-4 h-4" />
            CSV İçe Aktar
          </button>
          <button className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            Lead Ekle
          </button>
        </div>
      </div>

      {/* Verify result */}
      {verifyResult && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-sm text-green-700 dark:text-green-400">
          ✅ {verifyResult.queued} lead doğrulama kuyruğuna alındı. Sonuçlar birkaç dakika içinde görünecek.
        </div>
      )}

      {/* Phone stats */}
      {phoneStats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: 'Toplam', value: phoneStats.total, color: 'text-foreground' },
            { label: '🟢 AI Call', value: phoneStats.canCallAi, color: 'text-green-600' },
            { label: '🟡 Manuel', value: phoneStats.canCallManual, color: 'text-yellow-600' },
            { label: '🔴 DNC', value: phoneStats.cannotCall, color: 'text-red-600' },
            { label: '⚪ Doğrulanmamış', value: phoneStats.notVerified, color: 'text-muted-foreground' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border border-border bg-card px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn('text-xl font-bold', color)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Status filter */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Durum:</span>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'h-7 px-3 rounded-full text-xs font-medium transition-colors capitalize',
              statusFilter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {s === 'all' ? 'Tümü' : s}
          </button>
        ))}
      </div>

      {/* Phone filter */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Telefon:</span>
        {PHONE_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setPhoneFilter(f)}
            className={cn(
              'h-7 px-3 rounded-full text-xs font-medium transition-colors',
              phoneFilter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {f === 'all' ? 'Tümü' : f === 'can_call_ai' ? '🟢 AI Call' : f === 'can_call_manual' ? '🟡 Manuel' : f === 'cannot_call' ? '🔴 DNC' : '⚪ Doğrulanmamış'}
          </button>
        ))}
      </div>

      {/* Lead table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">Lead bulunamadı</p>
            <p className="text-sm text-muted-foreground">Lead ekle veya filtreni değiştir.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Şirket</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">İletişim</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Telefon</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Durum</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Arama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{lead.companyName ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.contactName ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{lead.contactEmail ?? '—'}</td>
                  <td className="px-4 py-3">
                    {lead.contactPhone ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        ****{lead.contactPhone.slice(-4)}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full border capitalize',
                      statusStyle[lead.status],
                    )}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {lead.contactPhone ? (
                      <PhoneClassificationBadge
                        classification={getPhoneClassification(lead) as any}
                        showLabel={true}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">Telefon yok</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}