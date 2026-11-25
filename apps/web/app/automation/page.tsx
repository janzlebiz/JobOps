'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { FiveActionOutput } from '@jobops/shared-types';
import { apiFetchJobs } from '@/lib/client-api';

interface AutomationJob {
  id: string;
  job: { title: string; sourceKey: string };
  actions?: FiveActionOutput;
}

export default function AutomationPage() {
  const [jobs, setJobs] = useState<AutomationJob[]>([]);

  useEffect(() => {
    apiFetchJobs({ decision: 'qualified' }).then((d) =>
      setJobs((d.jobs ?? []).filter((j: AutomationJob) => j.actions))
    );
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Service &amp; Automation Pipeline</h1>
        <p className="text-sm text-slate-400">
          Service first, SaaS later — recurring opportunities extracted from qualified work.
        </p>
      </div>

      <div className="grid gap-4">
        {jobs.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <Link
                href={`/jobs?id=${item.id}`}
                className="font-medium text-sky-400 hover:underline"
              >
                {item.job.title}
              </Link>
              <span className="text-xs text-slate-400 uppercase">
                {item.job.sourceKey}
              </span>
            </div>
            <div className="text-sm text-slate-200">
              <strong>Repetitive Process:</strong>{' '}
              {item.actions?.automate.repetitiveProcess}
            </div>
            <div className="text-sm text-slate-300">
              <strong>Recurring Service:</strong>{' '}
              {item.actions?.automate.serviceOpportunity}
            </div>
            <div className="text-xs text-slate-400">
              Model: {item.actions?.automate.recurringModel} · Frequency:{' '}
              {item.actions?.automate.frequency}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
