'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
  type: 'cold_email' | 'cold_call' | 'linkedin' | 'multi_channel';
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: string;
}

const statusStyle: Record<Campaign['status'], string> = {
  draft:     'bg-gray-500/10 text-gray-500 border-gray-500/20',
  active:    'bg-green-500/10 text-green-600 border-green-500/20',
  paused:    'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  completed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

const typeLabel: Record<Campaign['type'], string> = {
  cold_email:    'Cold Email',
  cold_call:     'Cold Call',
  linkedin:      'LinkedIn',
  multi_channel: 'Multi-Channel',
};

const MOCK: Campaign[] = [];

export default function ProjectCampaignsPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href={`/projects/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Project
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Campaigns</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage outreach campaigns for this project.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {MOCK.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Megaphone className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">No campaigns yet</p>
            <p className="text-sm text-muted-foreground">
              Create a campaign to start sending outreach.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {MOCK.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{typeLabel[c.type]}</p>
              </div>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', statusStyle[c.status])}>
                {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}