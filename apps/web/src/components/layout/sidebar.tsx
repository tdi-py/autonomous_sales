'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  Zap,
  Inbox,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects',  label: 'Projects',  icon: FolderKanban },
  { href: '/settings',  label: 'Settings',  icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [inboxCount, setInboxCount] = useState(0);
  const [pendingDecisions, setPendingDecisions] = useState(0);

  // Extract projectId from path if inside a project
  const projectMatch = pathname.match(/\/projects\/([^/]+)/);
  const currentProjectId = projectMatch?.[1];

  useEffect(() => {
    if (!currentProjectId) return;
    const token = getToken();

    api.get<{ count: number }>(`/inbox?projectId=${currentProjectId}&filter=requires_action`, token)
      .then((data) => {
        const arr = data as unknown as unknown[];
        setInboxCount(Array.isArray(arr) ? arr.length : 0);
      })
      .catch(() => {});

    api.get<{ pendingDecisions: number }>(`/projects/${currentProjectId}/strategy/overview`, token)
      .then((data) => setPendingDecisions(data.pendingDecisions ?? 0))
      .catch(() => {});
  }, [currentProjectId, pathname]);

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-sidebar border-r border-sidebar-border shrink-0">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
          <Zap className="w-4 h-4" />
        </div>
        <span className="font-semibold text-sidebar-foreground text-sm tracking-tight">
          Autonomous Sales
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        {/* Project-level links */}
        {currentProjectId && (
          <>
            <Link
              href={`/projects/${currentProjectId}/inbox`}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname.includes('/inbox')
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              <Inbox className="w-4 h-4 shrink-0" />
              <span className="flex-1">Inbox</span>
              {inboxCount > 0 && (
                <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  {inboxCount > 9 ? '9+' : inboxCount}
                </span>
              )}
            </Link>

            <Link
              href={`/projects/${currentProjectId}/strategy`}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname.includes('/strategy')
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              <Brain className="w-4 h-4 shrink-0" />
              <span className="flex-1">Strategy</span>
              {pendingDecisions > 0 && (
                <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-semibold">
                  {pendingDecisions > 9 ? '9+' : pendingDecisions}
                </span>
              )}
            </Link>
          </>
        )}
      </nav>

      {/* Bottom hint */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40">
          Faz 5 — Strategist Agent
        </p>
      </div>
    </aside>
  );
}