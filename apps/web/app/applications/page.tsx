'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import {
  apiFetchApplications,
  apiUpdateApplication,
} from '@/lib/client-api';

interface ApplicationItem {
  id: string;
  jobId: string;
  jobTitle: string;
  platform: string;
  canonicalUrl: string;
  status: string;
  userApprovedAt: string | null;
  submittedAt: string | null;
  proposalDraft: string;
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [error, setError] = useState('');

  async function load() {
    const data = await apiFetchApplications();
    setApps(data.applications ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function approveAndMark(id: string, nextStatus: 'approved' | 'applied') {
    setError('');
    try {
      await apiUpdateApplication(id, nextStatus, true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Application Tracker</h1>
        <p className="text-sm text-slate-400">
          Mandatory approval gate: review drafts before marking as applied.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
          {error}
        </div>
      )}

      {apps.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
          No staged applications yet. Open a qualified job and click &quot;Stage for Manual Approval&quot;.
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div
              key={app.id}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs uppercase text-sky-400 font-semibold">
                    {app.platform} · Status: {app.status.replace(/_/g, ' ')}
                  </div>
                  <Link
                    href={`/jobs?id=${app.jobId}`}
                    className="font-medium text-slate-100 hover:underline"
                  >
                    {app.jobTitle}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  {!app.userApprovedAt && (
                    <button
                      onClick={() => approveAndMark(app.id, 'approved')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve Draft
                    </button>
                  )}
                  {app.userApprovedAt && app.status !== 'applied' && (
                    <button
                      onClick={() => approveAndMark(app.id, 'applied')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-medium text-white"
                    >
                      Mark Applied
                    </button>
                  )}
                  <a
                    href={app.canonicalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 text-xs"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              {app.proposalDraft && (
                <pre className="whitespace-pre-wrap text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-lg p-3 font-sans">
                  {app.proposalDraft}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
