'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';

export type AnalysisStatus = 'pending' | 'completed' | 'failed' | 'no_url';

export interface AnalysisData {
  status: AnalysisStatus;
  valueProposition?: string;
  productDescription?: string;
  targetMarket?: string;
  keyFeatures?: string[];
  toneOfVoice?: string;
  competitorsDetected?: string[] | null;
  modelUsed?: string;
  analyzedAt?: string;
  userConfirmed?: boolean;
  icpProfiles?: Array<{
    id: string;
    label: string;
    industry?: string;
    companySize?: string;
    jobTitles?: string[];
    painPoints?: string[];
    geography?: string;
  }>;
  error?: string | null;
}

interface UseAnalysisStatusOptions {
  projectId: string | null;
  token?: string;
  pollingIntervalMs?: number;
  enabled?: boolean;
  onComplete?: (data: AnalysisData) => void;
  onError?: (error: string) => void;
}

export function useAnalysisStatus({
  projectId,
  token,
  pollingIntervalMs = 3000,
  enabled = true,
  onComplete,
  onError,
}: UseAnalysisStatusOptions) {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const poll = useCallback(async () => {
    if (!projectId) return;
    try {
      const result = await api.get<AnalysisData>(`/projects/${projectId}/analysis`, token);
      setData(result);

      if (result.status === 'completed') {
        stopPolling();
        onCompleteRef.current?.(result);
      } else if (result.status === 'failed') {
        stopPolling();
        onErrorRef.current?.(result.error ?? 'Analysis failed');
      }
    } catch (err) {
      console.error('[useAnalysisStatus] poll error:', err);
    }
  }, [projectId, token, stopPolling]);

  useEffect(() => {
    if (!projectId || !enabled) return;

    setIsPolling(true);
    poll(); // immediate first call

    intervalRef.current = setInterval(poll, pollingIntervalMs);
    return stopPolling;
  }, [projectId, enabled, pollingIntervalMs, poll, stopPolling]);

  return { data, isPolling, stopPolling, refetch: poll };
}