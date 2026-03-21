'use client';

import { useState } from 'react';
import { Globe, ArrowRight } from 'lucide-react';

interface StepProjectInfoProps {
  onNext: (data: { name: string; websiteUrl?: string; businessType?: string }) => void;
}

const BUSINESS_TYPES = [
  { value: 'saas', label: 'SaaS Product' },
  { value: 'ecommerce', label: 'E-commerce Store' },
  { value: 'agency', label: 'Agency (for clients)' },
  { value: 'service', label: 'Service Business' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'other', label: 'Other' },
];

export function StepProjectInfo({ onNext }: StepProjectInfoProps) {
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Project name must be at least 2 characters';
    if (websiteUrl && !websiteUrl.match(/^https?:\/\/.+/)) e.websiteUrl = 'Enter a valid URL (https://...)';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onNext({
      name: name.trim(),
      websiteUrl: websiteUrl.trim() || undefined,
      businessType: businessType || undefined,
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Create your project</h2>
        <p className="text-muted-foreground">
          Enter your product website and we'll analyze it automatically.
        </p>
      </div>

      <div className="space-y-5">
        {/* Project name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="name">Project Name *</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ShopFast US Campaign"
            className="w-full h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        {/* Website URL */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="url">
            Website URL <span className="text-muted-foreground font-normal">(optional, but recommended)</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="url"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yoursite.com"
              className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {errors.websiteUrl && <p className="text-xs text-destructive">{errors.websiteUrl}</p>}
          <p className="text-xs text-muted-foreground">
            We'll scrape and analyze your site to extract your value proposition and ICP.
          </p>
        </div>

        {/* Business type */}
        <div className="space-y-2">
          <label className="text-sm font-medium">What are you selling? <span className="text-muted-foreground font-normal">(optional)</span></label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BUSINESS_TYPES.map((bt) => (
              <button
                key={bt.value}
                type="button"
                onClick={() => setBusinessType(businessType === bt.value ? '' : bt.value)}
                className={`h-10 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  businessType === bt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {bt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
      >
        {websiteUrl ? 'Analyze Website' : 'Continue'}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}