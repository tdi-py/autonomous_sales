'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface SpamWarningBannerProps {
  warnings: string[];
  spamWords?: string[];
  className?: string;
}

export function SpamWarningBanner({ warnings, spamWords, className }: SpamWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || warnings.length === 0) return null;

  return (
    <div className={`rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 ${className ?? ''}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-yellow-700">İçerik Uyarıları</p>
          <ul className="mt-1 space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs text-yellow-700">
                • {w}
              </li>
            ))}
          </ul>
          {spamWords && spamWords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {spamWords.map((w) => (
                <span
                  key={w}
                  className="inline-block px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-800 text-xs font-mono"
                >
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-yellow-600 hover:text-yellow-800 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}