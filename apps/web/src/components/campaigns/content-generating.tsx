'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const MESSAGES = [
  'Proje analizinizi okuyorum...',
  'Hedef müşteri profilini inceliyorum...',
  'Email dizisi yazılıyor...',
  'A/B varyantları oluşturuluyor...',
  'Call senaryosu hazırlanıyor...',
  'İtiraz karşılama metinleri üretiliyor...',
  'Son rötuşlar yapılıyor...',
];

interface ContentGeneratingProps {
  onComplete?: () => void;
  onError?: (msg: string) => void;
  contentStatus: string | null;
  contentError?: string | null;
}

export function ContentGenerating({
  contentStatus,
  contentError,
}: ContentGeneratingProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (contentStatus === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="text-center space-y-2">
          <p className="font-semibold text-destructive">İçerik üretimi başarısız</p>
          <p className="text-sm text-muted-foreground">{contentError ?? 'Bilinmeyen hata'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <Loader2
          className="absolute inset-0 m-auto w-6 h-6 text-primary animate-spin"
          style={{ animationDirection: 'reverse' }}
        />
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">AI satış içeriklerinizi hazırlıyor...</h3>
        <p className="text-sm text-muted-foreground animate-pulse min-h-[20px]">
          {MESSAGES[msgIndex]}
        </p>
        <p className="text-xs text-muted-foreground">Bu 30-60 saniye sürebilir</p>
      </div>

      <div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{ animation: 'progress 60s linear forwards' }}
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