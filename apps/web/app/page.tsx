'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import {
  apiDispatchDiscovery,
  apiFetchJobs,
  apiFetchSearchRuns,
} from '@/lib/client-api';

interface JobSummary {
  id: string;
  job: {
    title: string;
    sourceKey: string;
    category: string;
    proposalCount: number | null;
    competitionStatus: string;
    eligibilityStatus: string;
    compensationMin: number | null;
    compensationMax: number | null;
    compensationCurrency: string | null;
    compensationType: string;
    postedAt: string | null;
  };
  evaluation?: {
    qualification: { decision: string; reason: string; preferredCompetition: boolean };
    score: { total: number; priorityTier: string };
    riskFlags: string[];
  };
}

interface SearchRun {
  runId: string;
  triggerType: string;
  finishedAt: string;
  discoveredCount: number;
  qualifiedCount: number;
  reviewRequiredCount: number;
  rejectedCount: number;
  errorCount: number;
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [runs, setRuns] = useState<SearchRun[]>([]);
  const [running, setRunning] = useState(false);

  async function load() {
    const [jobsData, runsData] = await Promise.all([
      apiFetchJobs(),
      apiFetchSearchRuns(),
    ]);
    setJobs(jobsData.jobs ?? []);
    setRuns(runsData.runs ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function triggerDiscovery() {
    setRunning(true);
    try {
      await apiDispatchDiscovery();
      await load();
    } finally {
      setRunning(false);
    }
  }

  const qualified = jobs.filter(
    (j) => j.evaluation?.qualification.decision === 'qualified'
  );
  const reviewRequired = jobs.filter(
    (j) => j.evaluation?.qualification.decision === 'review_required'
  );
  const rejected = jobs.filter(
    (j) => j.evaluation?.qualification.decision === 'rejected'
  );
  const preferred = qualified.filter(
    (j) => j.evaluation?.qualification.preferredCompetition
  );
  const lastRun = runs[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Radar Dashboard</h1>
          <p className="text-sm text-slate-400">
            Low-competition remote opportunities (&lt;20 proposals, &lt;24h)
          </p>
        </div>
        <button
          onClick={triggerDiscovery}
          disabled={running}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-sm font-medium text-white transition"
        >
          {running ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Run Discovery
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Qualified Jobs
          </div>
          <div className="text-2xl font-bold mt-1">{qualified.length}</div>
          <div className="text-xs text-emerald-400 mt-1">
            {preferred.length} in 0–10 preferred range
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Review Queue
          </div>
          <div className="text-2xl font-bold mt-1">{reviewRequired.length}</div>
          <div className="text-xs text-slate-400 mt-1">
            Hidden count or unknown location
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Filtered Out
          </div>
          <div className="text-2xl font-bold mt-1">{rejected.length}</div>
          <div className="text-xs text-slate-400 mt-1">
            Hard rules (20+ bids / trust / stale)
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            Last Discovery Run
          </div>
          <div className="text-sm font-semibold mt-2">
            {lastRun ? `${lastRun.discoveredCount} scanned` : 'Pending'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {lastRun
              ? `${lastRun.errorCount} source errors`
              : 'No runs yet'}
          </div>
        </div>
      </div>

      {/* High-Priority Opportunities */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">High-Priority Opportunities</h2>
          <Link
            href="/discover"
            className="text-xs text-sky-400 hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="grid gap-3">
          {qualified.map((item) => (
            <Link
              key={item.id}
              href={`/jobs?id=${item.id}`}
              className="block rounded-xl border border-slate-800 bg-slate-900/70 hover:border-sky-500/50 p-4 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <span className="uppercase font-medium text-sky-400">
                      {item.job.sourceKey}
                    </span>
                    <span>·</span>
                    <span>{item.job.category.replace(/_/g, ' ')}</span>
                    <span>·</span>
                    <span>
                      {item.job.competitionStatus === 'known'
                        ? `${item.job.proposalCount} proposals`
                        : 'Count not disclosed'}
                    </span>
                  </div>
                  <div className="font-medium text-slate-100">
                    {item.job.title}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">
                      {item.evaluation?.score.total ?? 0}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">
                      Score / 100
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
