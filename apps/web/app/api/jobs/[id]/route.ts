import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await store.ensureInitialized();
  const { id } = await context.params;
  const rec = store.jobs.get(id);
  if (!rec) {
    return NextResponse.json(
      { error: 'Job not found', code: 'JOB_NOT_FOUND' },
      { status: 404 }
    );
  }
  return NextResponse.json({
    ...rec,
    saved: store.savedJobs.get(id) ?? null,
    application:
      Array.from(store.applications.values()).find((a) => a.jobId === id) ?? null,
  });
}
