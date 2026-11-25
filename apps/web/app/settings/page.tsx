'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';

interface SearchProfileState {
  maxProposals: number;
  preferredMaxProposals: number;
  maxAgeHours: number;
  minimumCompensation: number | null;
  includeHiddenCompetition: boolean;
  includeUnknownEligibility: boolean;
  scheduleEnabled: boolean;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<SearchProfileState | null>(null);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    fetch('/api/search-profiles')
      .then((r) => r.json())
      .then((d) => setProfile(d.searchProfile));
  }, []);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSavedMsg('');
    const res = await fetch('/api/search-profiles', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (res.ok) setSavedMsg('Settings saved.');
  }

  if (!profile) {
    return <div className="text-sm text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Search &amp; Qualification Settings</h1>
        <p className="text-sm text-slate-400">
          Timezone: Asia/Manila · Hard deterministic filters run before AI scoring.
        </p>
      </div>

      <form
        onSubmit={saveSettings}
        className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4 text-sm"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs text-slate-400">Competition Ceiling (0–19)</span>
            <input
              type="number"
              min={0}
              max={19}
              value={profile.maxProposals}
              onChange={(e) =>
                setProfile({ ...profile, maxProposals: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-slate-400">Preferred Range Max (0–19)</span>
            <input
              type="number"
              min={0}
              max={19}
              value={profile.preferredMaxProposals}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  preferredMaxProposals: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-slate-400">Freshness Window (hours)</span>
            <input
              type="number"
              min={1}
              max={168}
              value={profile.maxAgeHours}
              onChange={(e) =>
                setProfile({ ...profile, maxAgeHours: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-slate-400">Minimum Compensation (USD)</span>
            <input
              type="number"
              min={0}
              value={profile.minimumCompensation ?? 0}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  minimumCompensation: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800"
            />
          </label>
        </div>

        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={profile.includeHiddenCompetition}
            onChange={(e) =>
              setProfile({
                ...profile,
                includeHiddenCompetition: e.target.checked,
              })
            }
          />
          <span>Qualify hidden-count listings (e.g. OnlineJobs.ph) directly</span>
        </label>

        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={profile.includeUnknownEligibility}
            onChange={(e) =>
              setProfile({
                ...profile,
                includeUnknownEligibility: e.target.checked,
              })
            }
          />
          <span>Qualify unknown location eligibility directly</span>
        </label>

        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={profile.scheduleEnabled}
            onChange={(e) =>
              setProfile({ ...profile, scheduleEnabled: e.target.checked })
            }
          />
          <span>Hourly background discovery enabled (Asia/Manila)</span>
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
          {savedMsg && <span className="text-xs text-emerald-400">{savedMsg}</span>}
        </div>
      </form>
    </div>
  );
}
