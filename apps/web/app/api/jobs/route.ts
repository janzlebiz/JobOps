import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(req: NextRequest) {
  await store.ensureInitialized();
  const { searchParams } = req.nextUrl;
  const platform = searchParams.get('platform');
  const category = searchParams.get('category');
  const decision = searchParams.get('decision');
  const q = searchParams.get('q')?.toLowerCase().trim();
  const sort = searchParams.get('sort') ?? 'score';

  let items = Array.from(store.jobs.values()).map((rec) => ({
    ...rec,
    saved: store.savedJobs.has(rec.id),
  }));

  if (platform && platform !== 'all') {
    items = items.filter((r) => r.job.sourceKey === platform);
  }
  if (category && category !== 'all') {
    items = items.filter((r) => r.job.category === category);
  }
  if (decision && decision !== 'all') {
    items = items.filter((r) => r.evaluation?.qualification.decision === decision);
  }
  if (q) {
    items = items.filter(
      (r) =>
        r.job.title.toLowerCase().includes(q) ||
        r.job.description.toLowerCase().includes(q) ||
        r.job.skillsRequired.some((s) => s.toLowerCase().includes(q))
    );
  }

  items.sort((a, b) => {
    if (sort === 'newest') {
      return (
        new Date(b.job.postedAt ?? 0).getTime() -
        new Date(a.job.postedAt ?? 0).getTime()
      );
    }
    if (sort === 'lowest_proposals') {
      return (a.job.proposalCount ?? 999) - (b.job.proposalCount ?? 999);
    }
    return (b.evaluation?.score.total ?? 0) - (a.evaluation?.score.total ?? 0);
  });

  return NextResponse.json({ jobs: items, total: items.length });
}
