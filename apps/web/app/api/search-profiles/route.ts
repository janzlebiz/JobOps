import { NextRequest, NextResponse } from 'next/server';
import { SearchProfileUpdateSchema } from '@jobops/validation';
import { store } from '@/lib/store';

export async function GET() {
  await store.ensureInitialized();
  return NextResponse.json({
    searchProfile: store.searchProfile,
    userProfile: store.userProfile,
  });
}

export async function PATCH(req: NextRequest) {
  await store.ensureInitialized();
  const body = await req.json().catch(() => null);
  const parsed = SearchProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid search profile', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  store.searchProfile = {
    ...store.searchProfile,
    ...(parsed.data as Partial<typeof store.searchProfile>),
  };

  return NextResponse.json({ searchProfile: store.searchProfile });
}
