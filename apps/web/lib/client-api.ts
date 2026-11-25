'use client';

import type { ApplicationStatus, SearchProfile, UserProfile } from '@jobops/shared-types';
import {
  DemoSeedConnector,
  JobicyConnector,
  RemotiveConnector,
} from '@jobops/source-connectors';
import { DeterministicFallbackProvider, generateFiveActions } from '@jobops/ai-prompts';
import { type StoredJobRecord, runDiscoveryPipeline } from '@jobops/worker-pipeline';

const IS_STATIC = process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';
const STORAGE_KEY = 'jobops_static_state_v2';

const DEFAULT_USER_PROFILE: UserProfile = {
  userId: 'local-primary-user',
  displayName: 'Primary Operator',
  timezone: 'Asia/Manila',
  location: 'Philippines',
  skills: [
    { name: 'Spreadsheet Operations (Excel / Google Sheets)', level: 'verified' },
    { name: 'Administrative & Data Handling', level: 'verified' },
    { name: 'Inventory & SKU Operations', level: 'transferable' },
    { name: 'SQL', level: 'self_reported' },
    { name: 'Process Automation', level: 'learning' },
    { name: 'QuickBooks', level: 'missing' },
  ],
  experience: {
    summary: 'Small-retail inventory, administrative data handling, SQL familiarity.',
    domains: ['inventory_operations', 'spreadsheet_operations', 'database_operations'],
  },
  workPreferences: { remoteOnly: true, lowClientInteraction: true, offlineFriendly: true },
};

const DEFAULT_SEARCH_PROFILE: SearchProfile = {
  id: 'default-search-profile',
  userId: 'local-primary-user',
  name: 'Primary Remote Ops Radar',
  enabled: true,
  platforms: ['jobicy', 'remotive', 'upwork', 'freelancer', 'onlinejobs_ph'],
  categories: ['spreadsheet_operations', 'document_processing', 'inventory_operations', 'database_operations'],
  keywords: ['excel', 'sheets', 'sql', 'inventory', 'invoice', 'reconciliation'],
  maxProposals: 19,
  preferredMaxProposals: 10,
  maxAgeHours: 24,
  minimumCompensation: 5,
  currency: 'USD',
  includeHiddenCompetition: true,
  includeUnknownEligibility: false,
  scheduleEnabled: true,
};

interface StaticState {
  records: StoredJobRecord[];
  savedIds: Record<string, { savedAt: string; notes: string }>;
  applications: Array<{
    id: string;
    jobId: string;
    jobTitle: string;
    platform: string;
    canonicalUrl: string;
    status: ApplicationStatus;
    userApprovedAt: string | null;
    submittedAt: string | null;
    outcomeNotes: string;
    proposalDraft: string;
    createdAt: string;
    updatedAt: string;
  }>;
  searchProfile: SearchProfile;
  runs: Array<{
    runId: string;
    triggerType: string;
    finishedAt: string;
    discoveredCount: number;
    qualifiedCount: number;
    reviewRequiredCount: number;
    rejectedCount: number;
    errorCount: number;
  }>;
}

async function getStaticState(): Promise<StaticState> {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as StaticState;
      } catch {
        // re-init
      }
    }
  }
  let run = await runDiscoveryPipeline({
    connectors: [new JobicyConnector(), new RemotiveConnector()],
    searchProfile: DEFAULT_SEARCH_PROFILE,
    userProfile: DEFAULT_USER_PROFILE,
    aiProvider: new DeterministicFallbackProvider(),
  });
  if (run.discoveredCount === 0) {
    run = await runDiscoveryPipeline({
      connectors: [new DemoSeedConnector()],
      searchProfile: DEFAULT_SEARCH_PROFILE,
      userProfile: DEFAULT_USER_PROFILE,
      aiProvider: new DeterministicFallbackProvider(),
    });
  }
  const state: StaticState = {
    records: run.records,
    savedIds: {},
    applications: [],
    searchProfile: DEFAULT_SEARCH_PROFILE,
    runs: [
      {
        runId: run.runId,
        triggerType: 'boot',
        finishedAt: run.finishedAt,
        discoveredCount: run.discoveredCount,
        qualifiedCount: run.qualifiedCount,
        reviewRequiredCount: run.reviewRequiredCount,
        rejectedCount: run.rejectedCount,
        errorCount: run.errorCount,
      },
    ],
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  return state;
}

function saveStaticState(state: StaticState) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

export async function apiFetchJobs(params?: {
  q?: string;
  platform?: string;
  decision?: string;
  sort?: string;
}) {
  if (!IS_STATIC) {
    const sp = new URLSearchParams();
    if (params?.q) sp.set('q', params.q);
    if (params?.platform && params.platform !== 'all') sp.set('platform', params.platform);
    if (params?.decision && params.decision !== 'all') sp.set('decision', params.decision);
    if (params?.sort) sp.set('sort', params.sort);
    const res = await fetch(`/api/jobs?${sp.toString()}`);
    if (res.ok) return res.json();
  }

  const state = await getStaticState();
  let items = state.records.map((r) => ({ ...r, saved: Boolean(state.savedIds[r.id]) }));
  if (params?.platform && params.platform !== 'all') {
    items = items.filter((r) => r.job.sourceKey === params.platform);
  }
  if (params?.decision && params.decision !== 'all') {
    items = items.filter((r) => r.evaluation?.qualification.decision === params.decision);
  }
  if (params?.q) {
    const needle = params.q.toLowerCase();
    items = items.filter(
      (r) =>
        r.job.title.toLowerCase().includes(needle) ||
        r.job.description.toLowerCase().includes(needle)
    );
  }
  items.sort((a, b) => {
    if (params?.sort === 'newest') {
      return new Date(b.job.postedAt ?? 0).getTime() - new Date(a.job.postedAt ?? 0).getTime();
    }
    if (params?.sort === 'lowest_proposals') {
      return (a.job.proposalCount ?? 999) - (b.job.proposalCount ?? 999);
    }
    return (b.evaluation?.score.total ?? 0) - (a.evaluation?.score.total ?? 0);
  });
  return { jobs: items, total: items.length };
}

export async function apiFetchSearchRuns() {
  if (!IS_STATIC) {
    const res = await fetch('/api/search-runs');
    if (res.ok) return res.json();
  }
  const state = await getStaticState();
  return { runs: state.runs };
}

export async function apiDispatchDiscovery() {
  if (!IS_STATIC) {
    const res = await fetch('/api/worker/dispatch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ triggerType: 'manual' }),
    });
    if (res.ok) return res.json();
  }
  const state = await getStaticState();
  let run = await runDiscoveryPipeline({
    connectors: [new JobicyConnector(), new RemotiveConnector()],
    searchProfile: state.searchProfile,
    userProfile: DEFAULT_USER_PROFILE,
    existingRecords: state.records,
    aiProvider: new DeterministicFallbackProvider(),
  });
  if (run.discoveredCount === 0 && state.records.length === 0) {
    run = await runDiscoveryPipeline({
      connectors: [new DemoSeedConnector()],
      searchProfile: state.searchProfile,
      userProfile: DEFAULT_USER_PROFILE,
      existingRecords: state.records,
      aiProvider: new DeterministicFallbackProvider(),
    });
  }
  state.records = run.records;
  state.runs.unshift({
    runId: run.runId,
    triggerType: 'manual',
    finishedAt: run.finishedAt,
    discoveredCount: run.discoveredCount,
    qualifiedCount: run.qualifiedCount,
    reviewRequiredCount: run.reviewRequiredCount,
    rejectedCount: run.rejectedCount,
    errorCount: run.errorCount,
  });
  saveStaticState(state);
  return run;
}

export async function apiFetchJobById(id: string) {
  if (!IS_STATIC) {
    const res = await fetch(`/api/jobs/${id}`);
    if (res.ok) return res.json();
  }
  const state = await getStaticState();
  const rec = state.records.find((r) => r.id === id);
  if (!rec) return null;
  return { ...rec, saved: state.savedIds[id] ?? null };
}

export async function apiSaveJob(id: string, notes = '') {
  if (!IS_STATIC) {
    const res = await fetch(`/api/jobs/${id}/save`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (res.ok) return res.json();
  }
  const state = await getStaticState();
  state.savedIds[id] = { savedAt: new Date().toISOString(), notes };
  saveStaticState(state);
  return { saved: state.savedIds[id] };
}

export async function apiAnalyzeJob(id: string) {
  if (!IS_STATIC) {
    const res = await fetch(`/api/jobs/${id}/analyze`, { method: 'POST' });
    if (res.ok) return res.json();
  }
  const state = await getStaticState();
  const rec = state.records.find((r) => r.id === id);
  if (!rec) return null;
  const generated = await generateFiveActions(
    rec.job,
    DEFAULT_USER_PROFILE,
    new DeterministicFallbackProvider()
  );
  rec.actions = generated.output;
  saveStaticState(state);
  return { jobId: id, actions: generated.output };
}

export async function apiFetchApplications() {
  if (!IS_STATIC) {
    const res = await fetch('/api/applications');
    if (res.ok) return res.json();
  }
  const state = await getStaticState();
  return { applications: state.applications };
}

export async function apiCreateApplication(jobId: string, proposalDraft: string) {
  if (!IS_STATIC) {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jobId,
        status: 'ready_for_approval',
        proposalDraft,
      }),
    });
    if (res.ok) return res.json();
  }
  const state = await getStaticState();
  const rec = state.records.find((r) => r.id === jobId);
  if (!rec) return null;
  const now = new Date().toISOString();
  const app = {
    id: `app_${Date.now()}`,
    jobId,
    jobTitle: rec.job.title,
    platform: rec.job.sourceKey,
    canonicalUrl: rec.job.canonicalUrl,
    status: 'ready_for_approval' as ApplicationStatus,
    userApprovedAt: null,
    submittedAt: null,
    outcomeNotes: '',
    proposalDraft,
    createdAt: now,
    updatedAt: now,
  };
  state.applications.push(app);
  saveStaticState(state);
  return { application: app };
}

export async function apiUpdateApplication(
  id: string,
  status: ApplicationStatus,
  userApproved: boolean
) {
  if (!IS_STATIC) {
    const res = await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, status, userApproved }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error ?? 'Failed to update');
    }
    return res.json();
  }
  const state = await getStaticState();
  const app = state.applications.find((a) => a.id === id);
  if (!app) throw new Error('Application not found');
  if (status === 'applied' && !app.userApprovedAt && !userApproved) {
    throw new Error('Explicit user approval required before marking as applied.');
  }
  const now = new Date().toISOString();
  app.status = status;
  if (userApproved && !app.userApprovedAt) app.userApprovedAt = now;
  if (status === 'applied' && !app.submittedAt) app.submittedAt = now;
  app.updatedAt = now;
  saveStaticState(state);
  return { application: app };
}

export async function apiFetchSearchProfile() {
  if (!IS_STATIC) {
    const res = await fetch('/api/search-profiles');
    if (res.ok) return res.json();
  }
  const state = await getStaticState();
  return { searchProfile: state.searchProfile };
}

export async function apiUpdateSearchProfile(patch: Partial<SearchProfile>) {
  if (!IS_STATIC) {
    const res = await fetch('/api/search-profiles', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) return res.json();
  }
  const state = await getStaticState();
  state.searchProfile = { ...state.searchProfile, ...patch };
  saveStaticState(state);
  return { searchProfile: state.searchProfile };
}
