import type {
  ApplicationStatus,
  SearchProfile,
  UserProfile,
} from '@jobops/shared-types';
import {
  DemoSeedConnector,
  FreelancerConnector,
  JobicyConnector,
  OnlineJobsPhConnector,
  RemotiveConnector,
  UpworkConnector,
} from '@jobops/source-connectors';
import {
  DeterministicFallbackProvider,
  OpenAIProvider,
  generateFiveActions,
} from '@jobops/ai-prompts';
import {
  type PipelineNotification,
  type PipelineRunResult,
  type StoredJobRecord,
  runDiscoveryPipeline,
} from '@jobops/worker-pipeline';

export interface SavedJobEntry {
  jobId: string;
  savedAt: string;
  notes: string;
}

export interface ApplicationEntry {
  id: string;
  jobId: string;
  jobTitle: string;
  platform: string;
  canonicalUrl: string;
  status: ApplicationStatus;
  userApprovedAt: string | null;
  submittedAt: string | null;
  followUpAt: string | null;
  outcomeNotes: string;
  proposalDraft: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchRunSummary {
  runId: string;
  triggerType: string;
  startedAt: string;
  finishedAt: string;
  discoveredCount: number;
  qualifiedCount: number;
  reviewRequiredCount: number;
  rejectedCount: number;
  duplicateCount: number;
  errorCount: number;
  sourceErrors: Array<{ sourceKey: string; message: string }>;
}

const DEFAULT_USER_PROFILE: UserProfile = {
  userId: 'local-primary-user',
  displayName: 'Primary Operator',
  timezone: 'Asia/Manila',
  location: 'Philippines',
  skills: [
    {
      name: 'Spreadsheet Operations (Excel / Google Sheets)',
      level: 'verified',
      evidenceNote: 'Document formatting, cleanup, validation',
    },
    {
      name: 'Administrative & Data Handling',
      level: 'verified',
      evidenceNote: 'Structured records and file organization',
    },
    {
      name: 'Inventory & SKU Operations',
      level: 'transferable',
      evidenceNote: 'Small-retail inventory & product handling',
    },
    {
      name: 'SQL',
      level: 'self_reported',
      evidenceNote: 'SQL familiarity; verify complex queries',
    },
    {
      name: 'Process Automation',
      level: 'learning',
      evidenceNote: 'Apps Script / workflow automation interest',
    },
    {
      name: 'QuickBooks',
      level: 'missing',
      evidenceNote: 'Not established — do not claim',
    },
  ],
  experience: {
    summary:
      'Small-retail inventory, administrative data handling, document formatting, and SQL familiarity.',
    domains: ['inventory_operations', 'spreadsheet_operations', 'database_operations'],
  },
  workPreferences: {
    remoteOnly: true,
    lowClientInteraction: true,
    offlineFriendly: true,
  },
};

const DEFAULT_SEARCH_PROFILE: SearchProfile = {
  id: 'default-search-profile',
  userId: 'local-primary-user',
  name: 'Primary Remote Ops Radar',
  enabled: true,
  platforms: ['jobicy', 'remotive', 'upwork', 'freelancer', 'onlinejobs_ph'],
  categories: [
    'spreadsheet_operations',
    'document_processing',
    'inventory_operations',
    'database_operations',
    'ecommerce_operations',
  ],
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

class JobOpsStore {
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  userProfile: UserProfile = DEFAULT_USER_PROFILE;
  searchProfile: SearchProfile = DEFAULT_SEARCH_PROFILE;
  jobs: Map<string, StoredJobRecord> = new Map();
  savedJobs: Map<string, SavedJobEntry> = new Map();
  applications: Map<string, ApplicationEntry> = new Map();
  searchRuns: SearchRunSummary[] = [];
  notifications: Array<PipelineNotification & { id: string; createdAt: string }> = [];

  async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (!this.initPromise) {
      this.initPromise = this.runDiscovery('boot', ['jobicy', 'remotive']).then(() => {
        this.initialized = true;
      });
    }
    return this.initPromise;
  }

  getAIProvider() {
    if (process.env.AI_PROVIDER === 'openai' && process.env.AI_API_KEY) {
      return new OpenAIProvider(
        process.env.AI_API_KEY,
        process.env.AI_MODEL || 'gpt-4o-mini'
      );
    }
    return new DeterministicFallbackProvider();
  }

  async runDiscovery(
    triggerType: string,
    requestedPlatforms?: string[]
  ): Promise<PipelineRunResult> {
    const platforms = requestedPlatforms ?? this.searchProfile.platforms;
    const connectors = [];

    if (platforms.includes('jobicy')) {
      connectors.push(new JobicyConnector());
    }
    if (platforms.includes('remotive')) {
      connectors.push(new RemotiveConnector());
    }
    if (platforms.includes('demo_seed')) {
      connectors.push(new DemoSeedConnector());
    }
    if (platforms.includes('upwork') && process.env.UPWORK_ACCESS_TOKEN) {
      connectors.push(new UpworkConnector(process.env.UPWORK_ACCESS_TOKEN));
    }
    if (platforms.includes('freelancer') && process.env.FREELANCER_OAUTH_TOKEN) {
      connectors.push(new FreelancerConnector(process.env.FREELANCER_OAUTH_TOKEN));
    }
    if (platforms.includes('onlinejobs_ph') && process.env.ONLINEJOBS_FEED_URL) {
      connectors.push(new OnlineJobsPhConnector(process.env.ONLINEJOBS_FEED_URL));
    }

    if (connectors.length === 0) {
      connectors.push(new DemoSeedConnector());
    }

    const result = await runDiscoveryPipeline({
      connectors,
      searchProfile: this.searchProfile,
      userProfile: this.userProfile,
      existingRecords: Array.from(this.jobs.values()),
      aiProvider: this.getAIProvider(),
    });

    for (const rec of result.records) {
      this.jobs.set(rec.id, rec);
    }

    this.searchRuns.unshift({
      runId: result.runId,
      triggerType,
      startedAt: result.startedAt,
      finishedAt: result.finishedAt,
      discoveredCount: result.discoveredCount,
      qualifiedCount: result.qualifiedCount,
      reviewRequiredCount: result.reviewRequiredCount,
      rejectedCount: result.rejectedCount,
      duplicateCount: result.duplicateCount,
      errorCount: result.errorCount,
      sourceErrors: result.sourceErrors,
    });

    // Only emit notifications if new qualifying jobs exist (Blueprint §5.5)
    for (const n of result.notifications) {
      this.notifications.unshift({
        ...n,
        id: `notif_${Date.now()}_${n.jobId}`,
        createdAt: new Date().toISOString(),
      });
    }

    return result;
  }

  async regenerateActions(jobId: string) {
    const rec = this.jobs.get(jobId);
    if (!rec) return null;
    const res = await generateFiveActions(
      rec.job,
      this.userProfile,
      this.getAIProvider()
    );
    rec.actions = res.output;
    this.jobs.set(jobId, rec);
    return res;
  }
}

const globalForStore = globalThis as unknown as { __jobopsStore?: JobOpsStore };
export const store = globalForStore.__jobopsStore ?? new JobOpsStore();
if (!globalForStore.__jobopsStore) {
  globalForStore.__jobopsStore = store;
}
