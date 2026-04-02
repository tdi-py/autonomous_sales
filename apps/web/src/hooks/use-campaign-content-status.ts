'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';

export type ContentStatus = 'pending' | 'generating' | 'ready' | 'error';

export interface CampaignContentStatus {
  campaignId: string;
  contentStatus: ContentStatus;
  generatedAt: string | null;
  contentError: string | null;
}

interface UseCampaignContentStatusOptions {
  campaignId: string | null;
  token?: string;
  pollingIntervalMs?: number;
  maxPolls?: number;
  enabled?: boolean;
  onReady?: () => void;
  onError?: (msg: string) => void;
}

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match?.[1] ?? '';
}

export function useCampaignContentStatus({
  campaignId,
  token,
  pollingIntervalMs = 3000,
  maxPolls = 60,
  enabled = true,
  onReady,
  onError,
}: UseCampaignContentStatusOptions) {
  const [data, setData] = useState<CampaignContentStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const pollCountRef = useRef(0);

  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const poll = useCallback(async () => {
    if (!campaignId) return;

    pollCountRef.current += 1;
    if (pollCountRef.current > maxPolls) {
      stopPolling();
      onErrorRef.current?.('İçerik üretimi zaman aşımına uğradı. Worker servisinin çalıştığını ve LLM\'nin yapılandırıldığını kontrol edin.');
      return;
    }

    const tok = token ?? getToken();
    try {
      const result = await api.get<CampaignContentStatus>(
        `/campaigns/${campaignId}/content-status`,
        tok,
      );
      setData(result);

      if (result.contentStatus === 'ready') {
        stopPolling();
        onReadyRef.current?.();
      } else if (result.contentStatus === 'error') {
        stopPolling();
        onErrorRef.current?.(result.contentError ?? 'İçerik üretimi başarısız');
      }
    } catch (err) {
      console.error('[useCampaignContentStatus] poll error:', err);
    }
  }, [campaignId, token, maxPolls, stopPolling]);

  useEffect(() => {
    if (!campaignId || !enabled) return;

    pollCountRef.current = 0;
    setIsPolling(true);
    poll();

    intervalRef.current = setInterval(poll, pollingIntervalMs);
    return stopPolling;
  }, [campaignId, enabled, pollingIntervalMs, poll, stopPolling]);

  return { data, isPolling, stopPolling, refetch: poll };
}