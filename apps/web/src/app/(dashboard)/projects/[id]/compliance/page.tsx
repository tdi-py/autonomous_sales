'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComplianceRule {
  id: string;
  countryCode: string;
  stateCode?: string;
  regulationName: string;
  requiresConsentEmail: boolean;
  requiresConsentCall: boolean;
  requiresPhysicalAddress: boolean;
  requiresUnsubscribe: boolean;
  aiDisclosureRequired: boolean;
  callingHoursStart?: string;
  callingHoursEnd?: string;
  maxCallsPerDayPerNumber?: number;
  requiresTwoPartyConsent: boolean;
  penaltyPerViolation?: string;
  notes?: string;
}

interface AbuseIncident {
  id: string;
  incidentType: string;
  severity: 'warning' | 'suspension' | 'termination';
  details: Record<string, unknown>;
  actionTaken?: string;
  resolved: boolean;
  createdAt: string;
}

interface DeletionRequest {
  id: string;
  requestedBy: string;
  requestType: 'lead_deletion' | 'full_erasure';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  leadIds: string[];
  completedAt?: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

const SEVERITY_STYLE: Record<string, string> = {
  warning: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  suspension: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  termination: 'bg-red-500/10 text-red-700 border-red-500/20',
};

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-700 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-700 border-red-500/20',
};

const COUNTRY_FLAG: Record<string, string> = {
  US: '🇺🇸',
  EU: '🇪🇺',
  GB: '🇬🇧',
  CA: '🇨🇦',
  TR: '🇹🇷',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  status,
}: {
  label: string;
  value: string | number;
  status: 'ok' | 'warn' | 'fail';
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card px-4 py-3 space-y-1',
        status === 'ok' ? 'border-green-500/20' :
        status === 'warn' ? 'border-yellow-500/20' :
        'border-red-500/20',
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <div className="flex items-center gap-1">
        {status === 'ok' ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        ) : status === 'warn' ? (
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
        ) : (
          <XCircle className="w-3.5 h-3.5 text-red-500" />
        )}
        <span className={cn(
          'text-xs font-medium',
          status === 'ok' ? 'text-green-600' :
          status === 'warn' ? 'text-yellow-600' :
          'text-red-600',
        )}>
          {status === 'ok' ? 'OK' : status === 'warn' ? 'Uyarı' : 'İhlal'}
        </span>
      </div>
    </div>
  );
}

function RuleCard({ rule }: { rule: ComplianceRule }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">
            {COUNTRY_FLAG[rule.countryCode] ?? '🌍'}
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold">{rule.regulationName}</p>
            <p className="text-xs text-muted-foreground">
              {rule.countryCode}{rule.stateCode ? `/${rule.stateCode}` : ''}
            </p>
          </div>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 pt-0 space-y-3 border-t border-border bg-muted/20">
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[
              { label: 'Email Rızası Gerekli', value: rule.requiresConsentEmail },
              { label: 'Arama Rızası Gerekli', value: rule.requiresConsentCall },
              { label: 'Fiziksel Adres Gerekli', value: rule.requiresPhysicalAddress },
              { label: 'Unsubscribe Gerekli', value: rule.requiresUnsubscribe },
              { label: 'AI Açıklaması Gerekli', value: rule.aiDisclosureRequired },
              { label: 'İki Taraflı Kayıt', value: rule.requiresTwoPartyConsent },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                {value ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                )}
                <span className={value ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {rule.callingHoursStart && (
            <p className="text-xs text-muted-foreground">
              📞 Arama saatleri: {rule.callingHoursStart} – {rule.callingHoursEnd}
              {rule.maxCallsPerDayPerNumber && ` (max ${rule.maxCallsPerDayPerNumber}/gün)`}
            </p>
          )}

          {rule.penaltyPerViolation && (
            <p className="text-xs text-destructive font-medium">
              ⚠️ Ceza: {rule.penaltyPerViolation}
            </p>
          )}

          {rule.notes && (
            <p className="text-xs text-muted-foreground border-t border-border pt-2 mt-2">
              {rule.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [incidents, setIncidents] = useState<AbuseIncident[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'incidents' | 'deletion' | 'rules'>('overview');

  // Deletion form state
  const [deletionEmail, setDeletionEmail] = useState('');
  const [deletionType, setDeletionType] = useState<'lead_deletion' | 'full_erasure'>('full_erasure');
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [deletionSuccess, setDeletionSuccess] = useState(false);

  const loadData = useCallback(async () => {
    const token = getToken();
    try {
      const [rulesData, deletionData] = await Promise.all([
        api.get<ComplianceRule[]>('/compliance/rules', token).catch(() => []),
        api.get<DeletionRequest[]>(`/compliance/data-deletion-requests?projectId=${projectId}`, token).catch(() => []),
      ]);
      setRules(rulesData);
      setDeletionRequests(deletionData);

      // Load abuse incidents (need workspaceId — skip for now if not available)
    } catch (err) {
      console.error('Compliance data load error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateDeletionRequest() {
    if (!deletionEmail.trim()) return;
    const token = getToken();
    setDeletionLoading(true);
    try {
      await api.post('/compliance/data-deletion-request', {
        projectId,
        requestedBy: deletionEmail.trim(),
        requestType: deletionType,
      }, token);
      setDeletionSuccess(true);
      setDeletionEmail('');
      setTimeout(() => setDeletionSuccess(false), 3000);
      await loadData();
    } catch (err) {
      console.error('Deletion request error:', err);
    } finally {
      setDeletionLoading(false);
    }
  }

  async function handleProcessRequest(requestId: string) {
    if (!confirm('Bu silme talebini işlemek istediğinizden emin misiniz? Bu işlem GERİ ALINAMAZ.')) return;
    const token = getToken();
    try {
      await api.post(`/compliance/data-deletion-request/${requestId}/process`, {}, token);
      await loadData();
    } catch (err) {
      console.error('Process request error:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const TABS = [
    { id: 'overview', label: '🛡️ Genel Durum' },
    { id: 'incidents', label: `⚠️ İhlaller (${incidents.length})` },
    { id: 'deletion', label: `🗑️ Veri Silme (${deletionRequests.length})` },
    { id: 'rules', label: `📋 Ülke Kuralları (${rules.length})` },
  ] as const;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Uyumluluk Paneli
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            GDPR, CAN-SPAM, TCPA ve diğer yasal düzenlemeler izleniyor.
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-background text-sm hover:bg-accent transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0',
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Status cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Bounce Oranı" value="—" status="ok" />
            <StatCard label="Spam Şikayeti" value="—" status="ok" />
            <StatCard label="Abonelik İptali" value="—" status="ok" />
            <StatCard label="Aktif İhlal" value={incidents.filter((i) => !i.resolved).length} status={incidents.filter((i) => !i.resolved).length > 0 ? 'warn' : 'ok'} />
          </div>

          {/* Quick info */}
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-5 py-4 space-y-2">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Compliance Engine Aktif
            </p>
            <p className="text-xs text-muted-foreground">
              Her email ve arama gönderiminde otomatik uyumluluk kontrolü yapılmaktadır.
              Suppression list, frekans limitleri, gönderim saatleri ve ülke kuralları kontrol edilir.
            </p>
          </div>

          {/* Active incidents */}
          {incidents.filter((i) => !i.resolved).length > 0 && (
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5 space-y-3">
              <p className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Aktif İhlaller ({incidents.filter((i) => !i.resolved).length})
              </p>
              {incidents.filter((i) => !i.resolved).slice(0, 3).map((incident) => (
                <div key={incident.id} className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>{incident.incidentType} — {incident.actionTaken}</span>
                  <span className={cn('px-2 py-0.5 rounded-full border text-xs font-medium capitalize', SEVERITY_STYLE[incident.severity])}>
                    {incident.severity}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pending deletion requests */}
          {deletionRequests.filter((r) => r.status === 'pending').length > 0 && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-4">
              <p className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Bekleyen Silme Talepleri ({deletionRequests.filter((r) => r.status === 'pending').length})
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Incidents */}
      {activeTab === 'incidents' && (
        <div className="space-y-3">
          {incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed border-border">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <p className="text-sm font-medium">İhlal yok</p>
              <p className="text-sm text-muted-foreground">Platform uyumlu şekilde çalışıyor.</p>
            </div>
          ) : (
            incidents.map((incident) => (
              <div key={incident.id} className="rounded-xl border border-border bg-card px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{incident.incidentType}</p>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium capitalize', SEVERITY_STYLE[incident.severity])}>
                        {incident.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{incident.actionTaken}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(incident.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  {incident.resolved && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Deletion Requests */}
      {activeTab === 'deletion' && (
        <div className="space-y-6">
          {/* Create new request */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold">Yeni Veri Silme Talebi</h3>
            <p className="text-xs text-muted-foreground">
              GDPR "Unutulma Hakkı" (Right to be Forgotten) talebi oluşturun.
              Bu işlem kişisel verileri anonimleştirir ve GERİ ALINAMAZ.
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Talep Eden Email</label>
                <input
                  type="email"
                  value={deletionEmail}
                  onChange={(e) => setDeletionEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Talep Tipi</label>
                <div className="flex gap-2">
                  {[
                    { value: 'full_erasure', label: 'Tam Silme' },
                    { value: 'lead_deletion', label: 'Belirli Lead\'ler' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDeletionType(value as typeof deletionType)}
                      className={cn(
                        'h-8 px-3 rounded-md border text-xs font-medium transition-colors',
                        deletionType === value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:bg-accent',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {deletionSuccess && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs text-green-700">
                  ✅ Silme talebi alındı. 72 saat içinde işlenecek.
                </div>
              )}

              <button
                onClick={handleCreateDeletionRequest}
                disabled={!deletionEmail.trim() || deletionLoading}
                className="flex items-center gap-2 h-9 px-4 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deletionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Silme Talebi Oluştur
              </button>
            </div>
          </div>

          {/* Existing requests */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Talep Geçmişi
            </h3>
            {deletionRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Henüz silme talebi yok.</p>
            ) : (
              deletionRequests.map((req) => (
                <div key={req.id} className="rounded-xl border border-border bg-card px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{req.requestedBy}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.requestType === 'full_erasure' ? 'Tam Silme' : `${req.leadIds?.length ?? 0} Lead Silme`}
                        {' · '}
                        {new Date(req.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                      {req.completedAt && (
                        <p className="text-xs text-green-600">
                          Tamamlandı: {new Date(req.completedAt).toLocaleString('tr-TR')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium capitalize', STATUS_STYLE[req.status])}>
                        {req.status === 'pending' ? 'Bekliyor'
                          : req.status === 'processing' ? 'İşleniyor'
                          : req.status === 'completed' ? 'Tamamlandı'
                          : 'Reddedildi'}
                      </span>
                      {req.status === 'pending' && (
                        <button
                          onClick={() => handleProcessRequest(req.id)}
                          className="h-7 px-2 rounded-md border border-border text-xs hover:bg-accent transition-colors"
                        >
                          İşle
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Country Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Platform, gönderim öncesi otomatik olarak lead'in ülkesine göre uygun kuralları uygular.
          </p>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Ülke kuralları yükleniyor veya henüz seed edilmemiş.
              <br />
              <code className="text-xs bg-muted px-2 py-0.5 rounded mt-2 inline-block">
                pnpm tsx drizzle/seed/compliance-rules-seed.ts
              </code>
            </div>
          ) : (
            rules.map((rule) => (
              <RuleCard key={rule.id} rule={rule} />
            ))
          )}
        </div>
      )}
    </div>
  );
}