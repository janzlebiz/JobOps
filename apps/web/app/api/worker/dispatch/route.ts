import { NextRequest, NextResponse } from 'next/server';
import { WorkerDispatchSchema } from '@jobops/validation';
import { store } from '@/lib/store';

export async function POST(req: NextRequest) {
  await store.ensureInitialized();

  // Protect worker endpoint when WORKER_DISPATCH_SECRET is configured
  const expectedSecret = process.env.WORKER_DISPATCH_SECRET;
  if (expectedSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const parsed = WorkerDispatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid dispatch payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await store.runDiscovery(
    parsed.data.triggerType,
    parsed.data.platforms
  );

  return NextResponse.json({
    runId: result.runId,
    discoveredCount: result.discoveredCount,
    qualifiedCount: result.qualifiedCount,
    reviewRequiredCount: result.reviewRequiredCount,
    rejectedCount: result.rejectedCount,
    duplicateCount: result.duplicateCount,
    errorCount: result.errorCount,
    notificationsSent: result.notifications.length,
  });
}
