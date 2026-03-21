'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sun, LogOut, User, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleDark() {
    setDark((d) => !d);
    document.documentElement.classList.toggle('dark');
  }

  function handleLogout() {
    document.cookie = 'auth-token=; path=/; max-age=0';
    router.push('/login');
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-background shrink-0">

      {/* Page title */}
      <h1 className="text-base font-semibold tracking-tight">{title}</h1>

      {/* Right side */}
      <div className="flex items-center gap-2">

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
          aria-label="Toggle dark mode"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-accent transition-colors text-sm"
          >
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
              U
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              {/* Dropdown */}
              <div className="absolute right-0 top-10 z-20 w-48 rounded-md border border-border bg-card shadow-md py-1">
                <button
                  onClick={() => { setMenuOpen(false); router.push('/settings'); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile & Settings
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}