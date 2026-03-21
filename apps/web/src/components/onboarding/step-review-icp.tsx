'use client';

import { useState } from 'react';
import { Users, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface IcpProfile {
  id?: string;
  label: string;
  industry?: string;
  companySize?: string;
  jobTitles?: string[];
  painPoints?: string[];
  geography?: string;
}

interface StepReviewIcpProps {
  icpProfiles: IcpProfile[];
  onConfirm: (profiles: IcpProfile[]) => void;
}

function IcpCard({
  profile,
  onEdit,
  onDelete,
}: {
  profile: IcpProfile;
  onEdit: (p: IcpProfile) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">{profile.label}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(profile)}
            className="w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="w-7 h-7 rounded-md hover:bg-destructive/10 flex items-center justify-center transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {profile.industry && (
          <div><span className="text-muted-foreground">Industry: </span>{profile.industry}</div>
        )}
        {profile.companySize && (
          <div><span className="text-muted-foreground">Company size: </span>{profile.companySize}</div>
        )}
        {profile.geography && (
          <div><span className="text-muted-foreground">Geography: </span>{profile.geography}</div>
        )}
      </div>

      {profile.jobTitles && profile.jobTitles.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Target roles</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.jobTitles.map((t) => (
              <span key={t} className="h-6 px-2 rounded-full bg-secondary text-secondary-foreground text-xs inline-flex items-center">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.painPoints && profile.painPoints.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Pain points</p>
          <ul className="space-y-0.5">
            {profile.painPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs">
                <span className="text-primary mt-0.5">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function StepReviewIcp({ icpProfiles: initial, onConfirm }: StepReviewIcpProps) {
  const [profiles, setProfiles] = useState<IcpProfile[]>(initial);
  const [editingProfile, setEditingProfile] = useState<IcpProfile | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newProfile, setNewProfile] = useState<IcpProfile>({ label: '' });

  function startEdit(p: IcpProfile, i: number) {
    setEditingProfile({ ...p });
    setEditIndex(i);
  }

  function saveEdit() {
    if (editingProfile && editIndex !== null) {
      const updated = [...profiles];
      updated[editIndex] = editingProfile;
      setProfiles(updated);
      setEditingProfile(null);
      setEditIndex(null);
    }
  }

  function deleteProfile(i: number) {
    setProfiles(profiles.filter((_, idx) => idx !== i));
  }

  function addProfile() {
    if (!newProfile.label.trim()) return;
    setProfiles([...profiles, { ...newProfile }]);
    setNewProfile({ label: '' });
    setShowAdd(false);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Your ideal customers</h2>
        <p className="text-sm text-muted-foreground">
          Review the AI-suggested customer profiles. These drive your outreach targeting.
        </p>
      </div>

      <div className="space-y-4">
        {profiles.map((profile, i) => (
          <IcpCard
            key={i}
            profile={profile}
            onEdit={(p) => startEdit(p, i)}
            onDelete={() => deleteProfile(i)}
          />
        ))}

        {/* Add new ICP */}
        {showAdd ? (
          <div className="rounded-xl border border-dashed border-border p-5 space-y-3">
            <h3 className="text-sm font-medium">New ICP Profile</h3>
            {[
              { key: 'label', label: 'Label *', placeholder: 'US SaaS companies 10-50 employees' },
              { key: 'industry', label: 'Industry', placeholder: 'SaaS' },
              { key: 'companySize', label: 'Company Size', placeholder: '10-50' },
              { key: 'geography', label: 'Geography', placeholder: 'United States' },
            ].map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs font-medium">{field.label}</label>
                <input
                  type="text"
                  value={(newProfile as unknown as Record<string, string>)[field.key] ?? ''}
                  onChange={(e) => setNewProfile({ ...newProfile, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addProfile}
                className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Add
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="h-8 px-3 rounded-md border border-border text-xs hover:bg-accent transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="w-full h-10 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add ICP Profile
          </button>
        )}
      </div>

      <button
        onClick={() => onConfirm(profiles)}
        className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
      >
        Confirm & Start Outreach
      </button>
    </div>
  );
}