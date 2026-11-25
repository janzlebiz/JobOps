import { NextRequest, NextResponse } from 'next/server';
import {
  ApplicationCreateSchema,
  ApplicationUpdateSchema,
} from '@jobops/validation';
import { store } from '@/lib/store';

export async function GET() {
  await store.ensureInitialized();
  return NextResponse.json({
    applications: Array.from(store.applications.values()),
  });
}

export async function POST(req: NextRequest) {
  await store.ensureInitialized();
  const body = await req.json().catch(() => null);
  const parsed = ApplicationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid application payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const jobRec = store.jobs.get(parsed.data.jobId);
  if (!jobRec) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Mandatory approval gate: cannot create directly in 'applied' status
  const status =
    parsed.data.status === 'applied' ? 'ready_for_approval' : parsed.data.status;

  const now = new Date().toISOString();
  const existing = Array.from(store.applications.values()).find(
    (a) => a.jobId === parsed.data.jobId
  );
  const id = existing?.id ?? `app_${Date.now()}`;

  const entry = {
    id,
    jobId: parsed.data.jobId,
    jobTitle: jobRec.job.title,
    platform: jobRec.job.sourceKey,
    canonicalUrl: jobRec.job.canonicalUrl,
    status,
    userApprovedAt: existing?.userApprovedAt ?? null,
    submittedAt: existing?.submittedAt ?? null,
    followUpAt: existing?.followUpAt ?? null,
    outcomeNotes: parsed.data.outcomeNotes ?? existing?.outcomeNotes ?? '',
    proposalDraft:
      parsed.data.proposalDraft ??
      jobRec.actions?.application.proposal ??
      existing?.proposalDraft ??
      '',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  store.applications.set(id, entry);
  return NextResponse.json({ application: entry }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  await store.ensureInitialized();
  const body = (await req.json().catch(() => null)) as
    | (Record<string, unknown> & { id?: string })
    | null;
  if (!body?.id) {
    return NextResponse.json({ error: 'Application id required' }, { status: 400 });
  }

  const existing = store.applications.get(body.id);
  if (!existing) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const parsed = ApplicationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid update payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Mandatory approval gate (Blueprint §6.3)
  if (
    parsed.data.status === 'applied' &&
    !existing.userApprovedAt &&
    !parsed.data.userApproved
  ) {
    return NextResponse.json(
      {
        error: 'Explicit user approval required before marking as applied.',
        code: 'APPROVAL_REQUIRED',
      },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const userApprovedAt = parsed.data.userApproved
    ? existing.userApprovedAt ?? now
    : existing.userApprovedAt;

  const updated = {
    ...existing,
    status: parsed.data.status ?? existing.status,
    userApprovedAt,
    submittedAt:
      parsed.data.status === 'applied'
        ? existing.submittedAt ?? now
        : existing.submittedAt,
    followUpAt:
      parsed.data.followUpAt !== undefined
        ? parsed.data.followUpAt
        : existing.followUpAt,
    outcomeNotes: parsed.data.outcomeNotes ?? existing.outcomeNotes,
    updatedAt: now,
  };

  store.applications.set(existing.id, updated);
  return NextResponse.json({ application: updated });
}
