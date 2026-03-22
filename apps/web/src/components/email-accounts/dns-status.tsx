'use client';

import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DnsStatusProps {
  emailAddress: string;
  spfValid?: boolean | null;
  dkimValid?: boolean | null;
  dmarcValid?: boolean | null;
  healthScore?: number | null;
  onRecheck?: () => void;
}

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

function DnsFixGuide({ domain, missingRecord }: DnsFixGuideProps) {
  const guides: Record<string, { title: string; hostname: string; value: string; steps: string[] }> = {
    spf: {
      title: 'SPF Kaydı Ekleme',
      hostname: domain,
      value: 'v=spf1 include:_spf.google.com ~all',
      steps: [
        'DNS sağlayıcınızın yönetim paneline giriş yapın (Cloudflare, GoDaddy, Namecheap vb.)',
        'Domain için DNS yönetimine gidin',
        'Yeni TXT kaydı ekleyin:',
        'Değişikliklerin yayılması için 24-48 saat bekleyin',
        '"DNS Kontrolü" butonuna tıklayarak sonucu doğrulayın',
      ],
    },
    dkim: {
      title: 'DKIM Kaydı Ekleme',
      hostname: `google._domainkey.${domain}`,
      value: 'v=DKIM1; k=rsa; p=<Google Admin Panelinden alınacak public key>',
      steps: [
        'Google Admin Panel > Apps > Google Workspace > Gmail gidin',
        '"Authenticate email" seçin',
        '"Generate new record" tıklayın — size bir TXT kaydı verecek',
        'Bu TXT kaydını DNS sağlayıcınıza ekleyin',
        'Google Admin\'den "Start authentication" tıklayın',
      ],
    },
    dmarc: {
      title: 'DMARC Kaydı Ekleme',
      hostname: `_dmarc.${domain}`,
      value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
      steps: [
        'DNS sağlayıcınızın yönetim paneline giriş yapın',
        'Yeni TXT kaydı ekleyin aşağıdaki değerlerle:',
        '"p=none" ile başlayın (izleme modu) — spam sorunu yoksa "p=quarantine" yapın',
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
          <div className="flex items-center gap-2 font-mono bg-muted rounded px-2 py-1.5 text-xs">
            <span className="flex-1 break-all">{guide.hostname}</span>
            <CopyButton value={guide.hostname} />
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-muted-foreground font-medium">Type:</span>
          <div className="font-mono bg-muted rounded px-2 py-1.5">TXT</div>
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

export function DnsStatus({
  emailAddress,
  spfValid,
  dkimValid,
  dmarcValid,
  healthScore,
  onRecheck,
}: DnsStatusProps) {
  const [openGuide, setOpenGuide] = useState<'spf' | 'dkim' | 'dmarc' | null>(null);
  const domain = emailAddress.split('@')[1] ?? emailAddress;

  const records = [
    {
      key: 'spf' as const,
      label: 'SPF',
      valid: spfValid,
      description: 'Sender Policy Framework',
    },
    {
      key: 'dkim' as const,
      label: 'DKIM',
      valid: dkimValid,
      description: 'DomainKeys Identified Mail',
    },
    {
      key: 'dmarc' as const,
      label: 'DMARC',
      valid: dmarcValid,
      description: 'Domain-based Message Authentication',
    },
  ];

  const getStatusIcon = (valid?: boolean | null) => {
    if (valid === null || valid === undefined) {
      return <div className="w-4 h-4 rounded-full bg-muted-foreground/30 animate-pulse" />;
    }
    return valid
      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      : <XCircle className="w-4 h-4 text-destructive" />;
  };

  const score = healthScore ?? 0;
  const scoreColor =
    score === 100 ? 'text-emerald-500' :
    score >= 66   ? 'text-blue-500' :
    score >= 33   ? 'text-amber-500' :
    'text-destructive';

  const barColor =
    score === 100 ? 'bg-emerald-500' :
    score >= 66   ? 'bg-blue-500' :
    score >= 33   ? 'bg-amber-500' :
    'bg-destructive';

  return (
    <div className="space-y-3">
      {/* DNS Records */}
      <div className="space-y-2">
        {records.map(({ key, label, valid, description }) => (
          <div key={key} className="space-y-0">
            <div className="flex items-center gap-2">
              {getStatusIcon(valid)}
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
              {valid === false && (
                <button
                  id={`dns-fix-guide-${key}`}
                  onClick={() => setOpenGuide(openGuide === key ? null : key)}
                  className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Nasıl düzeltilir?
                  {openGuide === key ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
            {openGuide === key && valid === false && (
              <DnsFixGuide domain={domain} missingRecord={key} />
            )}
          </div>
        ))}
      </div>

      {/* Health Score */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Email Sağlığı</span>
          <span className={cn('text-sm font-bold', scoreColor)}>{score}/100</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700', barColor)}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Recheck */}
      {onRecheck && (
        <button
          id="dns-recheck-btn"
          onClick={onRecheck}
          className="text-xs text-primary hover:underline mt-1"
        >
          DNS kontrolünü yenile →
        </button>
      )}
    </div>
  );
}
