import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  await store.ensureInitialized();
  return NextResponse.json({
    status: 'ok',
    service: 'jobops-radar',
    timezone: store.userProfile.timezone,
    jobsTracked: store.jobs.size,
    lastRun: store.searchRuns[0] ?? null,
    timestamp: new Date().toISOString(),
  });
}
