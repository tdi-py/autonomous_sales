'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface DnsFixGuideProps {
  domain: string;
  missingRecord: 'spf' | 'dkim' | 'dmarc';
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Kopyalandı!' : 'Kopyala'}
    </button>
  );
}

export function DnsFixGuide({ domain, missingRecord }: DnsFixGuideProps) {
  const guides: Record<string, {
    title: string;
    hostname: string;
    type: string;
    value: string;
    steps: string[];
  }> = {
    spf: {
      title: 'SPF Kaydı Ekleme',
      hostname: domain,
      type: 'TXT',
      value: 'v=spf1 include:_spf.google.com ~all',
      steps: [
        'DNS sağlayıcınızın yönetim paneline giriş yapın (Cloudflare, GoDaddy, Namecheap vb.)',
        'Domain için DNS yönetimine gidin',
        'Yeni TXT kaydı ekleyin — aşağıdaki değerleri kullanın',
        'Değişikliklerin yayılması için 24-48 saat bekleyin',
        '"DNS Kontrolü" butonuna tıklayarak sonucu doğrulayın',
      ],
    },
    dkim: {
      title: 'DKIM Kaydı Ekleme',
      hostname: `google._domainkey.${domain}`,
      type: 'TXT',
      value: 'v=DKIM1; k=rsa; p=<Google Admin Panelinden alınacak public key>',
      steps: [
        'Google Admin Panel → Apps → Google Workspace → Gmail gidin',
        '"Authenticate email" seçeneğini tıklayın',
        '"Generate new record" tıklayın — size bir TXT kaydı verecek',
        'Bu TXT kaydını DNS sağlayıcınıza ekleyin',
        'Google Admin\'den "Start authentication" tıklayın',
      ],
    },
    dmarc: {
      title: 'DMARC Kaydı Ekleme',
      hostname: `_dmarc.${domain}`,
      type: 'TXT',
      value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
      steps: [
        'DNS sağlayıcınızın yönetim paneline giriş yapın',
        'Yeni TXT kaydı ekleyin — aşağıdaki değerleri kullanın',
        '"p=none" ile başlayın (izleme modu) — spam sorunu yoksa "p=quarantine" yapabilirsiniz',
        'Değişikliklerin yayılması için 24-48 saat bekleyin',
      ],
    },
  };

  const guide = guides[missingRecord];

  return (
    <div className="mt-3 rounded-lg bg-background border border-border p-4 space-y-3 text-xs">
      <h4 className="font-semibold text-sm">{guide.title}</h4>

      <div className="space-y-2">
        <div className="space-y-1">
          <span className="text-muted-foreground font-medium">Hostname / Name:</span>
          <div className="flex items-center gap-2 font-mono bg-muted rounded px-2 py-1.5">
            <span className="flex-1 break-all">{guide.hostname}</span>
            <CopyButton value={guide.hostname} />
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-muted-foreground font-medium">Type:</span>
          <div className="font-mono bg-muted rounded px-2 py-1.5">{guide.type}</div>
        </div>
        <div className="space-y-1">
          <span className="text-muted-foreground font-medium">Value:</span>
          <div className="flex items-start gap-2 font-mono bg-muted rounded px-2 py-1.5">
            <span className="flex-1 break-all">{guide.value}</span>
            <CopyButton value={guide.value} />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="font-semibold text-muted-foreground">Adımlar:</p>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground leading-relaxed">
          {guide.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
