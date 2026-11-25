import { NextRequest, NextResponse } from 'next/server';
import { SaveJobSchema } from '@jobops/validation';
import { store } from '@/lib/store';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await store.ensureInitialized();
  const { id } = await context.params;
  const rec = store.jobs.get(id);
  if (!rec) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = SaveJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const entry = {
    jobId: id,
    savedAt: new Date().toISOString(),
    notes: parsed.data.notes ?? '',
  };
  store.savedJobs.set(id, entry);
  return NextResponse.json({ saved: entry });
}
