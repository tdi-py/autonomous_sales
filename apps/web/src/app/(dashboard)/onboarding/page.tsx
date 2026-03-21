'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { StepProjectInfo } from '@/components/onboarding/step-project-info';
import { StepAnalyzing } from '@/components/onboarding/step-analyzing';
import { StepReviewAnalysis } from '@/components/onboarding/step-review-analysis';
import { StepReviewIcp } from '@/components/onboarding/step-review-icp';
import { useAnalysisStatus } from '@/hooks/use-analysis-status';

type Step = 'project-info' | 'analyzing' | 'review-analysis' | 'review-icp' | 'complete';

function getToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1];
}

const STEP_LABELS = ['Project', 'Analyzing', 'Review', 'ICP', 'Done'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('project-info');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [analysisEdits, setAnalysisEdits] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: analysisData } = useAnalysisStatus({
    projectId,
    token: getToken(),
    enabled: step === 'analyzing',
    onComplete: () => setStep('review-analysis'),
    onError: (msg) => {
      setError(msg);
      setStep('review-analysis'); // allow manual entry
    },
  });

  // Step 1 → create project + start analysis
  async function handleProjectInfo(data: { name: string; websiteUrl?: string; businessType?: string }) {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = getToken();

      // Get workspaceId from /users/me/workspaces
      const workspaces = await api.get<Array<{ id: string }>>('/users/me/workspaces', token);
      const workspaceId = workspaces[0]?.id;
      if (!workspaceId) throw new Error('No workspace found. Please refresh.');

      const project = await api.post<{ id: string; analysis_status: string }>(
        '/projects',
        {
          name: data.name,
          workspaceId,
          websiteUrl: data.websiteUrl,
          businessType: data.businessType,
        },
        token,
      );

      setProjectId(project.id);

      if (data.websiteUrl) {
        setStep('analyzing');
      } else {
        setStep('review-analysis');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Step 3 → save edits and go to ICP
  function handleAnalysisReview(edits: Record<string, unknown>) {
    setAnalysisEdits(edits);
    setStep('review-icp');
  }

  // Step 4 → confirm everything
  async function handleConfirm() {
    if (!projectId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const token = getToken();
      await api.patch(`/projects/${projectId}/analysis/confirm`, { edits: analysisEdits }, token);
      setStep('complete');
      setTimeout(() => router.push(`/projects/${projectId}`), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm analysis');
    } finally {
      setIsSubmitting(false);
    }
  }

  const stepIndex = ['project-info', 'analyzing', 'review-analysis', 'review-icp', 'complete'].indexOf(step);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-xl">

        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                i < stepIndex ? 'bg-primary text-primary-foreground' :
                i === stepIndex ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}>
                {i < stepIndex ? '✓' : i + 1}
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`h-0.5 flex-1 transition-colors ${i < stepIndex ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Step content */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {step === 'project-info' && (
            <StepProjectInfo onNext={handleProjectInfo} />
          )}

          {step === 'analyzing' && projectId && (
            <StepAnalyzing
              projectId={projectId}
              analysisStatus={analysisData?.status ?? null}
              onComplete={() => setStep('review-analysis')}
              onError={(msg) => { setError(msg); setStep('review-analysis'); }}
            />
          )}

          {step === 'review-analysis' && (
            <StepReviewAnalysis
              data={analysisData ?? { status: 'completed' }}
              onNext={handleAnalysisReview}
            />
          )}

          {step === 'review-icp' && (
            <StepReviewIcp
              icpProfiles={analysisData?.icpProfiles ?? []}
              onConfirm={handleConfirm}
            />
          )}

          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <h2 className="text-2xl font-semibold">You're all set!</h2>
              <p className="text-muted-foreground text-sm">Redirecting to your project...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}