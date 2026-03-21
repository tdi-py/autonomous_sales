'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const MESSAGES = [
  'Fetching your website...',
  'Extracting value proposition...',
  'Identifying your target market...',
  'Building ICP suggestions...',
  'Almost done...',
];

interface StepAnalyzingProps {
  projectId: string;
  onComplete: () => void;
  onError: (msg: string) => void;
  analysisStatus: string | null;
}

export function StepAnalyzing({ onComplete, onError, analysisStatus }: StepAnalyzingProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (analysisStatus === 'completed') onComplete();
    else if (analysisStatus === 'failed') onError('We couldn\'t analyze this website. You can fill in the details manually.');
  }, [analysisStatus, onComplete, onError]);

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <Loader2 className="absolute inset-0 m-auto w-6 h-6 text-primary animate-spin" style={{ animationDirection: 'reverse' }} />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Analyzing your website</h2>
        <p className="text-muted-foreground text-sm animate-pulse min-h-[20px]">
          {MESSAGES[msgIndex]}
        </p>
        <p className="text-xs text-muted-foreground">This usually takes 15-30 seconds</p>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ animation: 'progress 30s linear forwards' }}
        />
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0% }
          to { width: 90% }
        }
      `}</style>
    </div>
  );
}