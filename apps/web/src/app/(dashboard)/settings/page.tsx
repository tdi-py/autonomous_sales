'use client';

import { useState } from 'react';
import { User, Building2, Mail, Key, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'profile',   label: 'Profile',        icon: User },
  { id: 'workspace', label: 'Workspace',       icon: Building2 },
  { id: 'email',     label: 'Email Accounts',  icon: Mail },
  { id: 'api',       label: 'API Keys',        icon: Key },
];

function Section({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="space-y-1 border-b border-border pb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
        props.className,
      )}
    />
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and workspace preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px shrink-0 transition-colors',
              activeTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && (
        <Section title="Profile" description="Update your personal information.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name">
              <Input placeholder="Mustafa Yılmaz" defaultValue="" />
            </Field>
            <Field label="Email">
              <Input type="email" placeholder="you@company.com" disabled />
            </Field>
            <Field label="Company Name">
              <Input placeholder="ShopFast Inc." />
            </Field>
            <Field label="Timezone">
              <Input placeholder="UTC" />
            </Field>
          </div>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            {saved && (
              <span className="text-sm text-green-600 font-medium">Saved ✓</span>
            )}
          </div>
        </Section>
      )}

      {activeTab === 'workspace' && (
        <Section title="Workspace" description="Manage your workspace settings and team members.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Workspace Name">
              <Input placeholder="My Workspace" />
            </Field>
            <Field label="Billing Email">
              <Input type="email" placeholder="billing@company.com" />
            </Field>
          </div>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
          </div>
        </Section>
      )}

      {activeTab === 'email' && (
        <Section
          title="Email Accounts"
          description="Connect SMTP accounts for sending outreach. SPF, DKIM, and DMARC records must be configured."
        >
          <Placeholder text="Email account management — coming in Phase 2.5 (warmup & deliverability)." />
        </Section>
      )}

      {activeTab === 'api' && (
        <Section
          title="API Keys"
          description="Manage API keys for integrations. Keep these secret."
        >
          <Placeholder text="API key management — coming in a future phase." />
        </Section>
      )}
    </div>
  );
}