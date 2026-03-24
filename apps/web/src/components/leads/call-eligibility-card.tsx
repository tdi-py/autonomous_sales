'use client';

import { useState, useEffect } from 'react';
import { Phone, Shield, Globe, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhoneClassificationBadge, type PhoneClassification } from './phone-classification-badge';
import { ConsentFormModal } from './consent-form-modal';

interface CallEligibility {
  leadId: string;
  classification: PhoneClassification | 'not_verified';
  reason: string;
  numberType: string | null;
  carrier: string | null;
  countryCode: string | null;
  stateCode: string | null;
  isOnDnc: boolean | null;
  isPubliclyListed: boolean | null;
  hasConsent: boolean;
  activeConsent: {
    id: string;
    consentType: string;
    consentScope: string;
    grantedAt: string;
  } | null;
  verifiedAt: string | null;
  canCallAi: boolean;
  canCallManual: boolean;
  stateRules: {
    callingHours: string;
    maxCallsPerDay: number;
    twoPartyConsent: boolean;
  } | null;
}

interface CallEligibilityCardProps {
  leadId: string;
  token: string;
  onInitiateCall?: (leadId: string) => void;
  onRefresh?: () => void;
}

function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
}

function StatusRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: 'ok' | 'warn' | 'fail' | 'neutral';
}) {
  const icon = {
    ok: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
    warn: <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />,
    fail: <XCircle className="w-3.5 h-3.5 text-red-500" />,
    neutral: <div className="w-3.5 h-3.5 rounded-full bg-muted-foreground/30" />,
  }[status];

  return (
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function CallEligibilityCard({
  leadId,
  token,
  onInitiateCall,
  onRefresh,
}: CallEligibilityCardProps) {
  const [eligibility, setEligibility] = useState<CallEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [initiatingCall, setInitiatingCall] = useState(false);

  async function loadEligibility() {
    try {
      const res = await fetch(
        `${getApiUrl()}/leads/${leadId}/consent/eligibility`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setEligibility(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEligibility();
  }, [leadId]);

  async function handleInitiateCall() {
    if (!eligibility?.canCallAi) return;
    setInitiatingCall(true);
    try {
      onInitiateCall?.(leadId);
    } finally {
      setInitiatingCall(false);
    }
  }

  async function handleTriggerVerification() {
    try {
      await fetch(`${getApiUrl()}/phone-verification/leads/${leadId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimeout(() => { loadEligibility(); onRefresh?.(); }, 3000);
    } catch {}
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading call eligibility...</span>
      </div>
    );
  }

  if (!eligibility) return null;

  const classification = eligibility.classification as PhoneClassification;

  return (
    <>
      {showConsentModal && (
        <ConsentFormModal
          leadId={leadId}
          token={token}
          onClose={() => setShowConsentModal(false)}
          onSuccess={() => {
            setShowConsentModal(false);
            loadEligibility();
            onRefresh?.();
          }}
        />
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Call Eligibility
          </h3>
          <PhoneClassificationBadge classification={classification} />
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Reason */}
          <p className="text-xs text-muted-foreground">{eligibility.reason}</p>

          {/* Status rows */}
          <div className="space-y-2">
            <StatusRow
              label="Number Type"
              value={eligibility.numberType ?? 'Unknown'}
              status={eligibility.numberType === 'landline' ? 'ok' : eligibility.numberType === 'mobile' ? 'warn' : 'neutral'}
            />
            {eligibility.carrier && (
              <StatusRow label="Carrier" value={eligibility.carrier} status="neutral" />
            )}
            <StatusRow
              label="DNC Registry"
              value={eligibility.isOnDnc === true ? 'Listed ⚠️' : eligibility.isOnDnc === false ? 'Clear ✓' : 'Not Checked'}
              status={eligibility.isOnDnc === true ? 'fail' : eligibility.isOnDnc === false ? 'ok' : 'neutral'}
            />
            <StatusRow
              label="Publicly Listed"
              value={eligibility.isPubliclyListed === true ? 'Yes ✓' : eligibility.isPubliclyListed === false ? 'No' : 'Unknown'}
              status={eligibility.isPubliclyListed === true ? 'ok' : 'neutral'}
            />
            <StatusRow
              label="AI Consent"
              value={eligibility.hasConsent ? 'On File ✓' : 'None'}
              status={eligibility.hasConsent ? 'ok' : 'neutral'}
            />
          </div>

          {/* State rules */}
          {eligibility.stateRules && (
            <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-1.5">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                State Rules {eligibility.stateCode && `(${eligibility.stateCode})`}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Calling hours: {eligibility.stateRules.callingHours}
              </p>
              <p className="text-xs text-muted-foreground">
                Max calls/day: {eligibility.stateRules.maxCallsPerDay}
              </p>
              {eligibility.stateRules.twoPartyConsent && (
                <p className="text-xs text-yellow-600 font-medium">
                  ⚠️ Two-party consent required (recording)
                </p>
              )}
            </div>
          )}

          {/* Verified at */}
          {eligibility.verifiedAt && (
            <p className="text-xs text-muted-foreground">
              Last verified: {new Date(eligibility.verifiedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-muted/20 flex-wrap">
          {/* AI Call button — only for green leads */}
          {eligibility.canCallAi && onInitiateCall && (
            <button
              onClick={handleInitiateCall}
              disabled={initiatingCall}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {initiatingCall ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Phone className="w-3.5 h-3.5" />
              )}
              AI ile Ara
            </button>
          )}

          {/* Consent button */}
          {!eligibility.hasConsent && (
            <button
              onClick={() => setShowConsentModal(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-background text-xs font-medium hover:bg-accent transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Rıza Kaydet
            </button>
          )}

          {/* Re-verify */}
          {!eligibility.verifiedAt && (
            <button
              onClick={handleTriggerVerification}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-background text-xs font-medium hover:bg-accent transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              Doğrula
            </button>
          )}
        </div>
      </div>
    </>
  );
}