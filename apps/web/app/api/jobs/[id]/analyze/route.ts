import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await store.ensureInitialized();
  const { id } = await context.params;
  const result = await store.regenerateActions(id);
  if (!result) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  return NextResponse.json({
    jobId: id,
    actions: result.output,
    modelName: result.modelName,
    promptVersion: result.promptVersion,
  });
}
