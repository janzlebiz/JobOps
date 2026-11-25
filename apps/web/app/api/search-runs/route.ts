import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  await store.ensureInitialized();
  return NextResponse.json({ runs: store.searchRuns });
}
