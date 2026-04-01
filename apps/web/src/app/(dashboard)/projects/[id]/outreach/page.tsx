'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Mail, Phone, Globe, Linkedin, RefreshCw, Loader2,
  CheckCircle, XCircle, Clock, AlertCircle, TrendingUp, Send,
  Eye, MessageSquare, BarChart2, ChevronRight, Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OutreachEvent {
  id: string;
  channel: 'email' | 'call' | 'contact_form' | 'linkedin';
  status: string;
  sentAt: string;
  leadName: string;
  leadEmail: string;
  companyName: string;
  campaignName: string;
  metadata: Record<string, unknown>;
}

interface OutreachStats {
  totalSent: number;
  byChannel: { email: number; call: number; contact_form: number; linkedin: number };
  responseRate: number;
  openRate: number;
  replyCount: number;
  contactFormCount: number;
  last7Days: number;
}

interface ContactFormSubmission {
  id: string;
  leadId: string;
  websiteUrl: string;
  contactFormUrl?: string;
  status: 'pending_approval' | 'approved' | 'submitted' | 'failed' | 'rejected';
  generatedContent: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    subject?: string;
    message?: string;
    fields?: unknown[];
  };
  aiReasoning?: string;
  errorMessage?: string;
  submittedAt?: string;
  createdAt: string;
  leadCompanyName: string;
  leadContactName: string;
}

interface Suggestion {
  suggestedAction: string;
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  reasoning: string;
}

interface PlatformInsights {
  projectRules: Array<{ ruleType: string; ruleContent: unknown; confidenceScore: number; evidenceCount: number }>;
  platformRules: Array<{ ruleType: string; ruleContent: unknown; confidenceScore: number; sourceProjectCount: number }>;
  categoryInsights: Array<{
    category: string;
    avgReplyRate: number;
    totalSamples: number;
    bestTemplate?: { subjectSnippet: string; replyRate: number; variantLabel: string };
  }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />,
  call: <Phone className="w-4 h-4" />,
  contact_form: <Globe className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
};

const CHANNEL_COLORS: Record<string, string> = {
  email: 'text-blue-600 bg-blue-50',
  call: 'text-green-600 bg-green-50',
  contact_form: 'text-purple-600 bg-purple-50',
  linkedin: 'text-sky-600 bg-sky-50',
};

const STATUS_COLORS: Record<string, string> = {
  sent: 'text-blue-600',
  delivered: 'text-blue-700',
  opened: 'text-green-600',
  clicked: 'text-green-700',
  replied: 'text-emerald-600',
  bounced: 'text-red-500',
  failed: 'text-red-600',
  submitted: 'text-purple-600',
  pending_approval: 'text-yellow-600',
  approved: 'text-blue-600',
  rejected: 'text-red-500',
  call_completed: 'text-green-600',
  call_no_answer: 'text-gray-500',
};

const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  pending_approval: 'Onay Bekliyor',
  approved: 'Onaylandı',
  submitted: 'Gönderildi',
  failed: 'Başarısız',
  rejected: 'Reddedildi',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={cn('text-2xl font-bold mt-1', color ?? 'text-gray-900')}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Contact Form Approval Modal ───────────────────────────────────────────────

function ContactFormApprovalModal({
  submission,
  onApprove,
  onReject,
  onClose,
}: {
  submission: ContactFormSubmission;
  onApprove: (content: NonNullable<ContactFormSubmission['generatedContent']>) => void;
  onReject: () => void;
  onClose: () => void;
}) {
  const [content, setContent] = useState({
    name: submission.generatedContent.name ?? '',
    email: submission.generatedContent.email ?? '',
    phone: submission.generatedContent.phone ?? '',
    company: submission.generatedContent.company ?? '',
    subject: submission.generatedContent.subject ?? '',
    message: submission.generatedContent.message ?? '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">İletişim Formu Onayı</h2>
            <p className="text-xs text-gray-500 mt-0.5">{submission.leadCompanyName} — {submission.contactFormUrl}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {submission.aiReasoning && (
          <div className="mx-6 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex gap-2">
            <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">{submission.aiReasoning}</p>
          </div>
        )}

        <div className="p-6 grid grid-cols-2 gap-4">
          {(['name', 'email', 'phone', 'company', 'subject'] as const).map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">{field}</label>
              <input
                value={content[field]}
                onChange={(e) => setContent((p) => ({ ...p, [field]: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`${field}...`}
              />
            </div>
          ))}

          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Mesaj</label>
            <textarea
              value={content.message}
              onChange={(e) => setContent((p) => ({ ...p, message: e.target.value }))}
              rows={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button
            onClick={onReject}
            className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
          >
            Reddet
          </button>
          <button
            onClick={() => onApprove(content)}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutreachPanelPage() {
  const { id: projectId } = useParams<{ id: string }>();

  const [stats, setStats] = useState<OutreachStats | null>(null);
  const [events, setEvents] = useState<OutreachEvent[]>([]);
  const [submissions, setSubmissions] = useState<ContactFormSubmission[]>([]);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [insights, setInsights] = useState<PlatformInsights | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'events' | 'contact_forms' | 'insights'>('events');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [approvalModal, setApprovalModal] = useState<ContactFormSubmission | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const token = getToken();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashData, submissionsData, suggestionData, insightsData] = await Promise.all([
        api.get<{ events: OutreachEvent[]; stats: OutreachStats; total: number }>(
          `/projects/${projectId}/outreach?limit=100`,
          token,
        ),
        api.get<{ submissions: ContactFormSubmission[]; total: number }>(
          `/projects/${projectId}/outreach/contact-form-submissions?limit=100`,
          token,
        ),
        api.get<Suggestion>(`/projects/${projectId}/outreach/next-suggestion`, token),
        api.get<PlatformInsights>(`/projects/${projectId}/outreach/platform-insights`, token),
      ]);

      setStats(dashData.stats);
      setEvents(dashData.events);
      setSubmissions(submissionsData.submissions);
      setSuggestion(suggestionData);
      setInsights(insightsData);
    } catch (err) {
      console.error('Outreach panel load error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredEvents = channelFilter === 'all'
    ? events
    : events.filter((e) => e.channel === channelFilter);

  async function handleApprove(content: ContactFormSubmission['generatedContent']) {
    if (!approvalModal) return;
    setApproving(approvalModal.id);
    try {
      await api.post(
        `/leads/${approvalModal.leadId}/contact-form/${approvalModal.id}/approve`,
        content,
        token,
      );
      setApprovalModal(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setApproving(null);
    }
  }

  async function handleReject() {
    setApprovalModal(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const PRIORITY_COLORS = { high: 'border-red-200 bg-red-50', medium: 'border-yellow-200 bg-yellow-50', low: 'border-green-200 bg-green-50' };
  const pendingApprovals = submissions.filter((s) => s.status === 'pending_approval');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/projects/${projectId}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Outreach Paneli</h1>
          <p className="text-sm text-gray-500">Tüm kanallardan gönderiler, contact form takibi ve AI önerileri</p>
        </div>
        <button onClick={loadData} className="ml-auto flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <RefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      {/* Pending Approvals Banner */}
      {pendingApprovals.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              {pendingApprovals.length} adet contact form onay bekliyor
            </span>
          </div>
          <button
            onClick={() => setActiveTab('contact_forms')}
            className="text-xs text-yellow-700 underline"
          >
            İncele
          </button>
        </div>
      )}

      {/* Suggestion Card */}
      {suggestion && (
        <div className={cn('mb-5 p-4 rounded-xl border', PRIORITY_COLORS[suggestion.priority])}>
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-gray-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{suggestion.suggestion}</p>
              <p className="text-xs text-gray-600 mt-0.5">{suggestion.reasoning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <StatCard label="Toplam Gönderim" value={stats.totalSent} />
          <StatCard label="Son 7 Gün" value={stats.last7Days} color="text-blue-600" />
          <StatCard label="Yanıt Oranı" value={`${stats.responseRate}%`} color={stats.responseRate > 10 ? 'text-green-600' : 'text-red-500'} />
          <StatCard label="Açılma Oranı" value={`${stats.openRate}%`} />
          <StatCard label="Email" value={stats.byChannel.email} />
          <StatCard label="Contact Form" value={stats.byChannel.contact_form} color="text-purple-600" />
          <StatCard label="Yanıt" value={stats.replyCount} color="text-emerald-600" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 w-fit">
        {([
          { key: 'events', label: 'Tüm Gönderimlər', icon: <Send className="w-4 h-4" /> },
          { key: 'contact_forms', label: `Contact Forms ${pendingApprovals.length > 0 ? `(${pendingApprovals.length})` : ''}`, icon: <Globe className="w-4 h-4" /> },
          { key: 'insights', label: 'AI İçgörüler', icon: <BarChart2 className="w-4 h-4" /> },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Events ────────────────────────────────────────────────────── */}
      {activeTab === 'events' && (
        <div>
          {/* Channel Filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', 'email', 'call', 'contact_form', 'linkedin'].map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  channelFilter === ch
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
                )}
              >
                {ch === 'all' ? 'Tümü' : ch.replace('_', ' ')}
              </button>
            ))}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Send className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>Henüz gönderim yok</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Kanal</th>
                    <th className="px-4 py-3 text-left">Şirket</th>
                    <th className="px-4 py-3 text-left">Kişi</th>
                    <th className="px-4 py-3 text-left">Kampanya</th>
                    <th className="px-4 py-3 text-left">Durum</th>
                    <th className="px-4 py-3 text-left">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium', CHANNEL_COLORS[event.channel])}>
                          {CHANNEL_ICONS[event.channel]}
                          {event.channel.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{event.companyName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{event.leadName}</div>
                        <div className="text-xs text-gray-400">{event.leadEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{event.campaignName || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('font-medium text-xs', STATUS_COLORS[event.status] ?? 'text-gray-500')}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(event.sentAt).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Contact Forms ─────────────────────────────────────────────── */}
      {activeTab === 'contact_forms' && (
        <div className="space-y-3">
          {submissions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Globe className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>Henüz contact form gönderimi yok</p>
              <p className="text-xs mt-1">Lead sayfasından &quot;İletişim Formu&quot; butonuna basarak başlayabilirsiniz</p>
            </div>
          ) : (
            submissions.map((sub) => (
              <div key={sub.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{sub.leadCompanyName || sub.leadContactName}</span>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        sub.status === 'submitted' ? 'bg-green-50 text-green-700' :
                        sub.status === 'pending_approval' ? 'bg-yellow-50 text-yellow-700' :
                        sub.status === 'failed' ? 'bg-red-50 text-red-700' :
                        'bg-gray-50 text-gray-600',
                      )}>
                        {SUBMISSION_STATUS_LABELS[sub.status] ?? sub.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{sub.contactFormUrl ?? sub.websiteUrl}</p>

                    {sub.generatedContent.message && (
                      <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 line-clamp-3">
                        <span className="font-medium text-gray-700">Mesaj: </span>
                        {sub.generatedContent.message}
                      </div>
                    )}

                    {sub.aiReasoning && (
                      <p className="text-xs text-blue-600 mt-2 flex gap-1">
                        <Lightbulb className="w-3 h-3 mt-0.5 shrink-0" />
                        {sub.aiReasoning}
                      </p>
                    )}

                    {sub.errorMessage && (
                      <p className="text-xs text-red-500 mt-1">{sub.errorMessage}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                    <span className="text-xs text-gray-400">
                      {new Date(sub.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                    {sub.status === 'pending_approval' && (
                      <button
                        onClick={() => setApprovalModal(sub)}
                        disabled={approving === sub.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                      >
                        {approving === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                        İncele & Gönder
                      </button>
                    )}
                    {sub.status === 'submitted' && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" /> Gönderildi
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tab: AI Insights ───────────────────────────────────────────────── */}
      {activeTab === 'insights' && (
        <div className="space-y-5">
          {/* Category Performance */}
          {insights && insights.categoryInsights.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <h3 className="font-semibold text-gray-900 text-sm">Segment Bazlı Template Performansı</h3>
                <p className="text-xs text-gray-500">Hangi sektörde hangi template daha iyi çalışıyor</p>
              </div>
              <div className="divide-y divide-gray-50">
                {insights.categoryInsights.map((item) => (
                  <div key={item.category} className="px-4 py-3 flex items-center gap-4">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{item.category}</span>
                      {item.bestTemplate && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          Best: &quot;{item.bestTemplate.subjectSnippet}&quot; ({item.bestTemplate.variantLabel})
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        'text-sm font-bold',
                        item.avgReplyRate > 0.1 ? 'text-green-600' :
                        item.avgReplyRate > 0.05 ? 'text-yellow-600' : 'text-red-500',
                      )}>
                        {(item.avgReplyRate * 100).toFixed(1)}%
                      </span>
                      <p className="text-xs text-gray-400">{item.totalSamples} gönderim</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project Learned Rules */}
          {insights && insights.projectRules.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <h3 className="font-semibold text-gray-900 text-sm">Proje Öğrenilmiş Kurallar</h3>
                <p className="text-xs text-gray-500">AI bu projede neyin işe yaradığını öğrendi</p>
              </div>
              <div className="divide-y divide-gray-50">
                {insights.projectRules.map((rule, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {rule.ruleType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-gray-700 flex-1">
                      {typeof rule.ruleContent === 'object' && rule.ruleContent !== null
                        ? (rule.ruleContent as any).description ?? JSON.stringify(rule.ruleContent).slice(0, 80)
                        : String(rule.ruleContent).slice(0, 80)}
                    </span>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold text-gray-900">
                        {(rule.confidenceScore * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-400">{rule.evidenceCount} kanıt</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platform Rules */}
          {insights && insights.platformRules.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <h3 className="font-semibold text-gray-900 text-sm">Platform Geneli Kurallar</h3>
                <p className="text-xs text-gray-500">Birden fazla projede kanıtlanan kurallar</p>
              </div>
              <div className="divide-y divide-gray-50">
                {insights.platformRules.map((rule, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                      {rule.ruleType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-gray-700 flex-1">
                      {typeof rule.ruleContent === 'object' && rule.ruleContent !== null
                        ? (rule.ruleContent as any).description ?? JSON.stringify(rule.ruleContent).slice(0, 80)
                        : String(rule.ruleContent).slice(0, 80)}
                    </span>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold text-gray-900">
                        {(rule.confidenceScore * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-400">{rule.sourceProjectCount} proje</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!insights || (insights.categoryInsights.length === 0 && insights.projectRules.length === 0)) && (
            <div className="text-center py-12 text-gray-400">
              <BarChart2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>Henüz yeterli veri yok</p>
              <p className="text-xs mt-1">AI daha fazla gönderim analiz ettikçe burada içgörüler görünecek</p>
            </div>
          )}
        </div>
      )}

      {/* Approval Modal */}
      {approvalModal && (
        <ContactFormApprovalModal
          submission={approvalModal}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setApprovalModal(null)}
        />
      )}
    </div>
  );
}
