'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Globe,
  Loader2,
  Megaphone,
  Users,
  BarChart2,
  Settings,
  ArrowLeft,
  Zap,
  Mail,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  websiteUrl?: string;
  industry?: string;
  businessType: string;
  status: string;
  defaultLanguage: string;
}

// ✅ Added: Email Accounts tab
const TABS = [
  { id: 'overview',       label: 'Overview',          icon: BarChart2 },
  { id: 'campaigns',      label: 'Campaigns',          icon: Megaphone },
  { id: 'leads',          label: 'Leads',              icon: Users },
  { id: 'email-accounts', label: 'Email Hesapları',    icon: Mail },
  { id: 'settings',       label: 'Settings',           icon: Settings },
];

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const token = getToken();
    if (token) {
      api.get<Project>(`/projects/${id}`, token)
        .then(setProject)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setTimeout(() => setLoading(false), 400);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayProject = project ?? {
    id,
    name: 'Sample Project',
    websiteUrl: 'https://example.com',
    industry: 'SaaS',
    businessType: 'saas',
    status: 'onboarding',
    defaultLanguage: 'en',
  };

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Back */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All Projects
      </Link>

      {/* Project header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">{displayProject.name}</h2>
          {displayProject.websiteUrl && (
            <a
              href={displayProject.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {displayProject.websiteUrl.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>

        <button className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Zap className="w-4 h-4" />
          Analyze with AI
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0',
                activeTab === tabId
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Business Type',  value: displayProject.businessType },
              { label: 'Industry',       value: displayProject.industry ?? '—' },
              { label: 'Language',       value: displayProject.defaultLanguage.toUpperCase() },
              { label: 'Status',         value: displayProject.status },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-border bg-card px-4 py-3 space-y-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium capitalize">{value}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Megaphone className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Kampanyalarınızı görüntüleyin ve yönetin.</p>
            <Link
              href={`/projects/${id}/campaigns`}
              className="text-sm text-primary hover:underline"
            >
              Kampanyalara git →
            </Link>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Users className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Lead listesini görüntüleyin.</p>
            <Link
              href={`/projects/${id}/leads`}
              className="text-sm text-primary hover:underline"
            >
              Leadlere git →
            </Link>
          </div>
        )}

        {/* ✅ New: Email Accounts tab */}
        {activeTab === 'email-accounts' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4 rounded-xl border border-dashed border-border">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Email Hesabı Yönetimi</p>
              <p className="text-sm text-muted-foreground">
                SMTP hesaplarını bağlayın, DNS kontrolü yapın ve ısındırma sürecini başlatın.
              </p>
            </div>
            <Link
              href={`/projects/${id}/email-accounts`}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email Hesaplarını Yönet
            </Link>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              Project settings — coming in a future update.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
