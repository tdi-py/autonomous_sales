'use client';

import { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { AnalysisData } from '@/hooks/use-analysis-status';

interface StepReviewAnalysisProps {
  data: AnalysisData;
  onNext: (edits: Record<string, unknown>) => void;
}

const INDUSTRY_OPTIONS = ['saas', 'ecommerce', 'agency', 'service', 'marketplace', 'other'];
const TONE_OPTIONS = ['professional', 'casual', 'technical', 'friendly', 'luxury'];

export function StepReviewAnalysis({ data, onNext }: StepReviewAnalysisProps) {
  const [valueProposition, setValueProposition] = useState(data.valueProposition ?? '');
  const [productDescription, setProductDescription] = useState(data.productDescription ?? '');
  const [targetMarket, setTargetMarket] = useState(data.targetMarket ?? '');
  const [toneOfVoice, setToneOfVoice] = useState(data.toneOfVoice ?? 'professional');
  const [keyFeatures, setKeyFeatures] = useState<string[]>(data.keyFeatures ?? []);
  const [newFeature, setNewFeature] = useState('');

  function addFeature() {
    if (newFeature.trim() && keyFeatures.length < 8) {
      setKeyFeatures([...keyFeatures, newFeature.trim()]);
      setNewFeature('');
    }
  }

  function removeFeature(i: number) {
    setKeyFeatures(keyFeatures.filter((_, idx) => idx !== i));
  }

  function handleNext() {
    onNext({ valueProposition, productDescription, targetMarket, toneOfVoice, keyFeatures });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Review your analysis</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>AI-generated — review and edit anything you'd like to change</span>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
        These details will shape how your AI agents craft outreach messages.
      </div>

      <div className="space-y-5">
        {/* Value Proposition */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Value Proposition</label>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI generated
            </span>
          </div>
          <textarea
            value={valueProposition}
            onChange={(e) => setValueProposition(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Product Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Product Description</label>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI generated
            </span>
          </div>
          <textarea
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Target Market */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Target Market</label>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI generated
            </span>
          </div>
          <textarea
            value={targetMarket}
            onChange={(e) => setTargetMarket(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Tone of Voice */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Communication Tone</label>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => setToneOfVoice(tone)}
                className={`h-8 px-3 rounded-full text-xs font-medium capitalize transition-colors ${
                  toneOfVoice === tone
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-background text-muted-foreground hover:bg-accent'
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        {/* Key Features */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Key Features</label>
          <div className="flex flex-wrap gap-2">
            {keyFeatures.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-secondary text-secondary-foreground text-xs"
              >
                {f}
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="text-muted-foreground hover:text-foreground ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addFeature()}
              placeholder="Add a feature..."
              className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={addFeature}
              className="h-9 px-4 rounded-lg border border-border bg-background text-sm hover:bg-accent transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={handleNext}
        className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
      >
        Review ICP Profiles
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}