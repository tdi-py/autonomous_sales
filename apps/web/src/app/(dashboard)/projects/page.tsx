'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Globe, Loader2, FolderKanban } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  websiteUrl?: string;
  industry?: string;
  businessType: string;
  status: 'onboarding' | 'active' | 'paused' | 'archived';
  createdAt: string;
}

const statusStyle: Record<Project['status'], string> = {
  onboarding: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  active:     'bg-green-500/10 text-green-600 border-green-500/20',
  paused:     'bg-gray-500/10 text-gray-500 border-gray-500/20',
  archived:   'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const statusLabel: Record<Project['status'], string> = {
  onboarding: 'Onboarding',
  active:     'Active',
  paused:     'Paused',
  archived:   'Archived',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // In real usage, pass workspaceId from session/context
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Projects</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Each project is one product or campaign target.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <FolderKanban className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">No projects yet</p>
            <p className="text-sm text-muted-foreground">
              Create a project to start building your sales campaign.
            </p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create first project
          </Link>
        </div>
      )}

      {/* Project grid */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm leading-snug">{project.name}</h3>
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full border shrink-0',
                    statusStyle[project.status],
                  )}
                >
                  {statusLabel[project.status]}
                </span>
              </div>

              {project.websiteUrl && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                  <Globe className="w-3 h-3 shrink-0" />
                  {project.websiteUrl.replace(/^https?:\/\//, '')}
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="capitalize">{project.businessType}</span>
                {project.industry && (
                  <>
                    <span>·</span>
                    <span>{project.industry}</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}