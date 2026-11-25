'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getOfflineSavedJobs, type OfflineSavedJob } from '@/lib/offline-db';
import { apiFetchJobs } from '@/lib/client-api';

interface ServerSavedJob {
  id: string;
  job: { title: string; sourceKey: string; canonicalUrl: string };
  saved: boolean;
}

export default function SavedPage() {
  const [serverSaved, setServerSaved] = useState<ServerSavedJob[]>([]);
  const [offlineSaved, setOfflineSaved] = useState<OfflineSavedJob[]>([]);

  useEffect(() => {
    getOfflineSavedJobs().then(setOfflineSaved);
    apiFetchJobs()
      .then((d) => {
        const items = (d.jobs ?? []).filter((j: ServerSavedJob) => j.saved);
        setServerSaved(items);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Saved Opportunities</h1>
        <p className="text-sm text-slate-400">
          Accessible offline via IndexedDB and synced with your workspace.
        </p>
      </div>

      {serverSaved.length === 0 && offlineSaved.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
          No saved opportunities yet. Open any job in Discover and click Save.
        </div>
      ) : (
        <div className="space-y-3">
          {(serverSaved.length > 0
            ? serverSaved.map((s) => ({
                jobId: s.id,
                title: s.job.title,
                platform: s.job.sourceKey,
              }))
            : offlineSaved
          ).map((item) => (
            <Link
              key={item.jobId}
              href={`/jobs?id=${item.jobId}`}
              className="block rounded-xl border border-slate-800 bg-slate-900/70 p-4 hover:border-sky-500/50 transition"
            >
              <div className="text-xs uppercase text-sky-400 font-semibold">
                {item.platform}
              </div>
              <div className="font-medium text-slate-100 mt-1">{item.title}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
