import type {
  FiveActionOutput,
  JobEvaluation,
  JobSourceConnector,
  NormalizedJob,
  SearchProfile,
  UserProfile,
} from '@jobops/shared-types';
import {
  computeMaterialHash,
  detectMaterialChanges,
  evaluateJob,
} from '@jobops/scoring';
import {
  type AIProvider,
  DeterministicFallbackProvider,
  generateFiveActions,
} from '@jobops/ai-prompts';

export interface StoredJobRecord {
  id: string;
  job: NormalizedJob;
  contentHash: string;
  evaluation?: JobEvaluation;
  actions?: FiveActionOutput;
  snapshots: Array<{ contentHash: string; capturedAt: string; changes: Record<string, unknown> }>;
}

export interface PipelineNotification {
  jobId: string;
  title: string;
  platform: string;
  competitionStatus: string;
  postedAt: string | null;
  reason: string;
}

export interface PipelineRunResult {
  runId: string;
  startedAt: string;
  finishedAt: string;
  discoveredCount: number;
  qualifiedCount: number;
  reviewRequiredCount: number;
  rejectedCount: number;
  duplicateCount: number;
  errorCount: number;
  sourceErrors: Array<{ sourceKey: string; message: string }>;
  notifications: PipelineNotification[];
  records: StoredJobRecord[];
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 10;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** (attempt - 1)));
      }
    }
  }
  throw lastError;
}

export async function runDiscoveryPipeline(params: {
  connectors: JobSourceConnector[];
  searchProfile: SearchProfile;
  userProfile: UserProfile;
  existingRecords?: StoredJobRecord[];
  aiProvider?: AIProvider;
  now?: Date;
  maxRetryAttempts?: number;
}): Promise<PipelineRunResult> {
  const now = params.now ?? new Date();
  const startedAt = now.toISOString();
  const runId = `run_${now.getTime()}`;
  const aiProvider = params.aiProvider ?? new DeterministicFallbackProvider();

  const recordsByKey = new Map<string, StoredJobRecord>();
  const recordsByUrl = new Map<string, StoredJobRecord>();

  for (const rec of params.existingRecords ?? []) {
    if (rec.job.externalId) {
      recordsByKey.set(`${rec.job.sourceKey}:${rec.job.externalId}`, rec);
    }
    recordsByUrl.set(rec.job.canonicalUrl, rec);
  }

  let discoveredCount = 0;
  let qualifiedCount = 0;
  let reviewRequiredCount = 0;
  let rejectedCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  const sourceErrors: Array<{ sourceKey: string; message: string }> = [];
  const notifications: PipelineNotification[] = [];

  for (const connector of params.connectors) {
    try {
      const page = await withRetry(
        () =>
          connector.discover({
            keywords: params.searchProfile.keywords,
            categories: params.searchProfile.categories,
          }),
        { maxAttempts: params.maxRetryAttempts ?? 2, baseDelayMs: 5 }
      );

      for (const job of page.jobs) {
        discoveredCount++;
        const contentHash = computeMaterialHash(job);
        const key = job.externalId ? `${job.sourceKey}:${job.externalId}` : null;
        const existing =
          (key ? recordsByKey.get(key) : undefined) ??
          recordsByUrl.get(job.canonicalUrl);

        if (existing && existing.contentHash === contentHash) {
          duplicateCount++;
          continue;
        }

        const isMaterialUpdate = Boolean(
          existing && existing.contentHash !== contentHash
        );
        const jobId =
          existing?.id ??
          `job_${job.sourceKey}_${job.externalId ?? discoveredCount}`;

        const evaluation = evaluateJob(
          jobId,
          job,
          params.searchProfile,
          params.userProfile,
          now
        );

        let actions: FiveActionOutput | undefined;
        if (
          evaluation.qualification.decision === 'qualified' ||
          evaluation.qualification.decision === 'review_required'
        ) {
          const generated = await generateFiveActions(
            job,
            params.userProfile,
            aiProvider
          );
          actions = generated.output;
        }

        if (evaluation.qualification.decision === 'qualified') {
          qualifiedCount++;
          notifications.push({
            jobId,
            title: job.title,
            platform: job.sourceKey,
            competitionStatus:
              job.competitionStatus === 'known'
                ? `${job.proposalCount} proposals`
                : 'Not disclosed',
            postedAt: job.postedAt,
            reason: isMaterialUpdate
              ? 'Materially updated and re-qualified'
              : 'Passed all qualification rules',
          });
        } else if (evaluation.qualification.decision === 'review_required') {
          reviewRequiredCount++;
        } else {
          rejectedCount++;
        }

        const snapshots = existing ? [...existing.snapshots] : [];
        snapshots.push({
          contentHash,
          capturedAt: now.toISOString(),
          changes: existing ? detectMaterialChanges(existing.job, job) : {},
        });

        const updatedRecord: StoredJobRecord = {
          id: jobId,
          job,
          contentHash,
          evaluation,
          actions,
          snapshots,
        };

        if (key) recordsByKey.set(key, updatedRecord);
        recordsByUrl.set(job.canonicalUrl, updatedRecord);
      }
    } catch (err) {
      errorCount++;
      sourceErrors.push({
        sourceKey: connector.sourceKey,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    runId,
    startedAt,
    finishedAt: new Date().toISOString(),
    discoveredCount,
    qualifiedCount,
    reviewRequiredCount,
    rejectedCount,
    duplicateCount,
    errorCount,
    sourceErrors,
    notifications,
    records: Array.from(new Set(recordsByUrl.values())),
  };
}
