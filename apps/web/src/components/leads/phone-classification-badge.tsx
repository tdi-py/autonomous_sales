'use client';

import { cn } from '@/lib/utils';

export type PhoneClassification =
  | 'can_call_ai'
  | 'can_call_manual'
  | 'cannot_call'
  | 'not_verified';

interface PhoneClassificationBadgeProps {
  classification: PhoneClassification;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const CLASSIFICATION_CONFIG: Record<
  PhoneClassification,
  { label: string; icon: string; color: string }
> = {
  can_call_ai: {
    label: 'AI Call OK',
    icon: '🟢',
    color: 'bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400',
  },
  can_call_manual: {
    label: 'Manual Only',
    icon: '🟡',
    color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400',
  },
  cannot_call: {
    label: 'Do Not Call',
    icon: '🔴',
    color: 'bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400',
  },
  not_verified: {
    label: 'Not Verified',
    icon: '⚪',
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  },
};

export function PhoneClassificationBadge({
  classification,
  showLabel = true,
  size = 'sm',
  className,
}: PhoneClassificationBadgeProps) {
  const config = CLASSIFICATION_CONFIG[classification] ?? CLASSIFICATION_CONFIG.not_verified;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        config.color,
        className,
      )}
      title={config.label}
    >
      <span className="text-xs">{config.icon}</span>
      {showLabel && config.label}
    </span>
  );
}