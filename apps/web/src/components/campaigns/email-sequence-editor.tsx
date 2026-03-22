'use client';

import { EmailStepCard } from './email-step-card';
import { api } from '@/lib/api';

interface EmailSequence {
  id: string;
  stepOrder: number;
  subjectTemplate: string;
  bodyTemplate: string;
  delayDays: number;
  variantLabel: string;
}

interface SequenceGroups {
  [key: string]: {
    A?: EmailSequence;
    B?: EmailSequence;
  };
}

interface EmailSequenceEditorProps {
  campaignId: string;
  sequences: SequenceGroups;
  onRegenerate: (stepOrder: number) => void;
  regeneratingStep?: number | null;
  onRefresh: () => void;
}

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

export function EmailSequenceEditor({
  campaignId,
  sequences,
  onRegenerate,
  regeneratingStep,
  onRefresh,
}: EmailSequenceEditorProps) {
  const stepKeys = Object.keys(sequences).sort((a, b) => {
    const na = parseInt(a.replace('step', ''));
    const nb = parseInt(b.replace('step', ''));
    return na - nb;
  });

  // Step'teki delay bilgisini al
  const DELAY_MAP: Record<number, number> = { 1: 0, 2: 3, 3: 5 };

  async function handleUpdate(id: string, subject: string, body: string) {
    const token = getToken();
    await api.patch(`/campaigns/${campaignId}/sequences/${id}`, {
      subjectTemplate: subject,
      bodyTemplate: body,
    }, token);
    onRefresh();
  }

  if (stepKeys.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Email dizisi henüz üretilmedi.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stepKeys.map((key) => {
        const stepNum = parseInt(key.replace('step', ''));
        const group = sequences[key];
        return (
          <EmailStepCard
            key={key}
            stepOrder={stepNum}
            delayDays={DELAY_MAP[stepNum] ?? 0}
            variantA={group.A}
            variantB={group.B}
            onUpdate={handleUpdate}
            onRegenerate={onRegenerate}
            isRegenerating={regeneratingStep === stepNum}
          />
        );
      })}
    </div>
  );
}