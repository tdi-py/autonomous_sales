'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Upload, Users, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: 'new' | 'contacted' | 'responded' | 'qualified' | 'converted' | 'lost';
  phoneClassification?: 'can_call_ai' | 'can_call_manual' | 'cannot_call';
}

const statusStyle: Record<Lead['status'], string> = {
  new:        'bg-gray-500/10 text-gray-500 border-gray-500/20',
  contacted:  'bg-blue-500/10 text-blue-600 border-blue-500/20',
  responded:  'bg-violet-500/10 text-violet-600 border-violet-500/20',
  qualified:  'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  converted:  'bg-green-500/10 text-green-600 border-green-500/20',
  lost:       'bg-red-500/10 text-red-500 border-red-500/20',
};

const phoneStyle: Record<NonNullable<Lead['phoneClassification']>, string> = {
  can_call_ai:     'bg-green-500/10 text-green-600 border-green-500/20',
  can_call_manual: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  cannot_call:     'bg-red-500/10 text-red-500 border-red-500/20',
};

const phoneLabel: Record<NonNullable<Lead['phoneClassification']>, string> = {
  can_call_ai:     '🟢 AI Call',
  can_call_manual: '🟡 Manual',
  cannot_call:     '🔴 DNC',
};

const STATUS_FILTERS = ['all', 'new', 'contacted', 'responded', 'qualified', 'converted', 'lost'];

const MOCK: Lead[] = [];

export default function ProjectLeadsPage() {
  const { id } = useParams<{ id: string }>();
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = MOCK.filter((l) => statusFilter === 'all' || l.status === statusFilter);

  return (
    <div className="space-y-6 max-w-6xl">
      <Link
        href={`/projects/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Project
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Leads</h2>
          <p className="text-sm text-muted-foreground mt-1">{MOCK.length} total leads</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-background text-sm font-medium hover:bg-accent transition-colors">
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
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
            {s}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">No leads yet</p>
            <p className="text-sm text-muted-foreground">
              Add leads manually or import a CSV file.
            </p>
          </div>
        </div>
      ) : (
        /* Lead table */
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Company</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Call</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{lead.companyName ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.contactName ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.contactEmail ?? '—'}</td>
                  <td className="px-4 py-3">
                    {lead.contactPhone ? (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {lead.contactPhone}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border capitalize', statusStyle[lead.status])}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {lead.phoneClassification ? (
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', phoneStyle[lead.phoneClassification])}>
                        {phoneLabel[lead.phoneClassification]}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not verified</span>
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