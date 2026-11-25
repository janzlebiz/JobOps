'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

interface JobItem {
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
  };
  evaluation?: {
    qualification: { decision: string; reason: string };
    score: { total: number; priorityTier: string };
    riskFlags: string[];
  };
}

export default function DiscoverPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [q, setQ] = useState('');
  const [platform, setPlatform] = useState('all');
  const [decision, setDecision] = useState('all');
  const [sort, setSort] = useState('score');

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (platform !== 'all') params.set('platform', platform);
    if (decision !== 'all') params.set('decision', decision);
    params.set('sort', sort);

    fetch(`/api/jobs?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs ?? []));
  }, [q, platform, decision, sort]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Discover Opportunities</h1>
        <p className="text-sm text-slate-400">
          Filter by platform, qualification status, and competition.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, skills, keywords..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm"
        >
          <option value="all">All Platforms</option>
          <option value="upwork">Upwork</option>
          <option value="freelancer">Freelancer</option>
          <option value="onlinejobs_ph">OnlineJobs.ph</option>
        </select>

        <div className="flex gap-2">
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="qualified">Qualified</option>
            <option value="review_required">Review Required</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm"
          >
            <option value="score">Highest Score</option>
            <option value="newest">Newest</option>
            <option value="lowest_proposals">Lowest Proposals</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {jobs.map((item) => {
          const dec = item.evaluation?.qualification.decision ?? 'unknown';
          const badgeColor =
            dec === 'qualified'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : dec === 'review_required'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30';

          return (
            <Link
              key={item.id}
              href={`/jobs/${item.id}`}
              className="block rounded-xl border border-slate-800 bg-slate-900/70 hover:border-sky-500/50 p-4 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="uppercase font-semibold text-sky-400">
                      {item.job.sourceKey}
                    </span>
                    <span className={`px-2 py-0.5 rounded border ${badgeColor}`}>
                      {dec.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400">
                      {item.job.competitionStatus === 'known'
                        ? `${item.job.proposalCount} proposals`
                        : 'Count not disclosed'}
                    </span>
                    <span className="text-slate-400">
                      · {item.job.eligibilityStatus}
                    </span>
                  </div>
                  <div className="font-medium text-slate-100">
                    {item.job.title}
                  </div>
                  {item.evaluation?.qualification.reason && (
                    <div className="text-xs text-slate-400">
                      Rule: {item.evaluation.qualification.reason}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-slate-100">
                    {item.evaluation?.score.total ?? 0}
                  </div>
                  <div className="text-[10px] text-slate-400">SCORE</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
