'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Bookmark,
  ExternalLink,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import type { FiveActionOutput } from '@jobops/shared-types';
import { cacheSavedJobOffline, enqueueOfflineSync } from '@/lib/offline-db';

type TabKey = 'assess' | 'analyze' | 'apply' | 'build' | 'automate';

interface JobDetailResponse {
  id: string;
  job: {
    title: string;
    description: string;
    sourceKey: string;
    canonicalUrl: string;
    category: string;
    skillsRequired: string[];
    proposalCount: number | null;
    competitionStatus: string;
    eligibilityStatus: string;
    compensationMin: number | null;
    compensationMax: number | null;
    compensationCurrency: string | null;
    compensationType: string;
    postedAt: string | null;
    employer: { name: string | null };
  };
  evaluation?: {
    qualification: { decision: string; reason: string; notes: string[] };
    score: { total: number; priorityTier: string };
    riskFlags: string[];
  };
  actions?: FiveActionOutput;
  saved: { notes: string } | null;
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<JobDetailResponse | null>(null);
  const [tab, setTab] = useState<TabKey>('assess');
  const [statusMsg, setStatusMsg] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetch(`/api/jobs/${params.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d));
  }, [params.id]);

  async function saveJob() {
    if (!data) return;
    await cacheSavedJobOffline({
      jobId: data.id,
      title: data.job.title,
      platform: data.job.sourceKey,
      canonicalUrl: data.job.canonicalUrl,
      notes: '',
      savedAt: new Date().toISOString(),
    });

    if (!navigator.onLine) {
      await enqueueOfflineSync({
        endpoint: `/api/jobs/${data.id}/save`,
        method: 'POST',
        body: { notes: '' },
      });
      setStatusMsg('Saved offline (queued for sync).');
      return;
    }

    const res = await fetch(`/api/jobs/${data.id}/save`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ notes: '' }),
    });
    if (res.ok) setStatusMsg('Saved to workspace & offline cache.');
  }

  async function regenerate() {
    if (!data) return;
    setRegenerating(true);
    try {
      const res = await fetch(`/api/jobs/${data.id}/analyze`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setData({ ...data, actions: updated.actions });
        setStatusMsg('5-action analysis refreshed.');
      }
    } finally {
      setRegenerating(false);
    }
  }

  async function createDraftApplication() {
    if (!data) return;
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jobId: data.id,
        status: 'ready_for_approval',
        proposalDraft: data.actions?.application.proposal ?? '',
      }),
    });
    if (res.ok) {
      router.push('/applications');
    }
  }

  if (!data) {
    return <div className="text-sm text-slate-400">Loading opportunity...</div>;
  }

  const actions = data.actions;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="uppercase font-semibold text-sky-400">
              {data.job.sourceKey}
            </span>
            <span>·</span>
            <span>
              {data.job.competitionStatus === 'known'
                ? `${data.job.proposalCount} proposals`
                : 'Count not disclosed'}
            </span>
            <span>·</span>
            <span>{data.job.eligibilityStatus}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveJob}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-medium"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Save
            </button>
            <button
              onClick={regenerate}
              disabled={regenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              Re-analyze
            </button>
            <a
              href={data.job.canonicalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium"
            >
              Listing <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-slate-100">{data.job.title}</h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          {data.job.description}
        </p>

        {statusMsg && (
          <div className="text-xs text-emerald-400">{statusMsg}</div>
        )}
      </div>

      {/* 5-Action Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-800 pb-2">
        {(['assess', 'analyze', 'apply', 'build', 'automate'] as TabKey[]).map(
          (k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                tab === k
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              {k}
            </button>
          )
        )}
      </div>

      {!actions ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-sm text-slate-400">
          5-action analysis not generated for rejected listings. Click Re-analyze to force generation.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
          {tab === 'assess' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">
                  Employer Verdict:{' '}
                  <span className="uppercase text-sky-400">
                    {actions.assessment.verdict.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm font-semibold">
                  Trust Score: {actions.assessment.trustScore}/100
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">
                  Evidence
                </h3>
                <ul className="space-y-1.5 text-sm">
                  {actions.assessment.evidence.map((ev, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] uppercase text-sky-300">
                        {ev.label}
                      </span>
                      <span>{ev.claim}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {actions.assessment.riskFlags.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase text-amber-400 mb-1">
                    Risk Flags
                  </h3>
                  <ul className="list-disc list-inside text-sm text-amber-200">
                    {actions.assessment.riskFlags.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {actions.assessment.unknowns.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase text-slate-400 mb-1">
                    Explicit Unknowns
                  </h3>
                  <ul className="list-disc list-inside text-sm text-slate-300">
                    {actions.assessment.unknowns.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {tab === 'analyze' && (
            <div className="space-y-4 text-sm">
              <div className="font-semibold">
                Skill Fit: {actions.analysis.fitScore}/100 · Effort:{' '}
                {actions.analysis.estimatedEffort} · Connectivity:{' '}
                {actions.analysis.connectivityRequirement}
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase text-emerald-400 mb-1">
                    Matching Skills
                  </h3>
                  <ul className="list-disc list-inside text-slate-300">
                    {actions.analysis.matchingSkills.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase text-sky-400 mb-1">
                    Transferable
                  </h3>
                  <ul className="list-disc list-inside text-slate-300">
                    {actions.analysis.transferableSkills.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase text-amber-400 mb-1">
                    Gaps (Do Not Claim)
                  </h3>
                  <ul className="list-disc list-inside text-slate-300">
                    {actions.analysis.skillGaps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase text-slate-400 mb-1">
                  Delivery Plan
                </h3>
                <ol className="list-decimal list-inside text-slate-300 space-y-1">
                  {actions.analysis.deliveryPlan.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {tab === 'apply' && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Manual approval gate active: review proposal below, then stage in Application Tracker.
              </div>
              <pre className="whitespace-pre-wrap rounded-lg bg-slate-950 border border-slate-800 p-4 text-sm font-sans text-slate-200">
                {actions.application.proposal}
              </pre>
              <div>
                <h3 className="text-xs font-semibold uppercase text-slate-400 mb-1">
                  Suggested Paid Trial
                </h3>
                <p className="text-slate-300">{actions.application.suggestedPaidTrial}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase text-slate-400 mb-1">
                  Questions for Employer
                </h3>
                <ul className="list-disc list-inside text-slate-300">
                  {actions.application.questionsForEmployer.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={createDraftApplication}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium"
              >
                <Send className="w-4 h-4" />
                Stage for Manual Approval
              </button>
            </div>
          )}

          {tab === 'build' && (
            <div className="space-y-3 text-sm">
              <div className="font-semibold">
                Recommended Artifact: {actions.build.recommendedArtifact}
              </div>
              <div className="text-xs text-slate-400">
                Type: {actions.build.artifactType}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase text-slate-400 mb-1">
                  Scope
                </h3>
                <ul className="list-disc list-inside text-slate-300">
                  {actions.build.scope.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase text-slate-400 mb-1">
                  Acceptance Checks
                </h3>
                <ul className="list-disc list-inside text-slate-300">
                  {actions.build.acceptanceChecks.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {tab === 'automate' && (
            <div className="space-y-3 text-sm">
              <div className="font-semibold">
                Repetitive Process: {actions.automate.repetitiveProcess}
              </div>
              <div className="text-slate-300">
                Frequency: {actions.automate.frequency}
              </div>
              <div className="text-slate-300">
                Service Opportunity: {actions.automate.serviceOpportunity}
              </div>
              <div className="text-slate-300">
                Recurring Model: {actions.automate.recurringModel}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase text-slate-400 mb-1">
                  Human Approval Points
                </h3>
                <ul className="list-disc list-inside text-slate-300">
                  {actions.automate.humanApprovalPoints.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
