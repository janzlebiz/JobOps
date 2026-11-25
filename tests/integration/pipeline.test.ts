import { describe, expect, it } from 'vitest';
import type { JobSourceConnector, SearchProfile, UserProfile } from '@jobops/shared-types';
import { DemoSeedConnector } from '@jobops/source-connectors';
import { runDiscoveryPipeline } from '@jobops/worker-pipeline';

const SEARCH_PROFILE: SearchProfile = {
  id: 'sp1',
  userId: 'u1',
  name: 'Primary',
  enabled: true,
  platforms: ['demo_seed'],
  categories: [],
  keywords: ['excel'],
  maxProposals: 19,
  preferredMaxProposals: 10,
  maxAgeHours: 24,
  minimumCompensation: 5,
  currency: 'USD',
  includeHiddenCompetition: false,
  includeUnknownEligibility: false,
  scheduleEnabled: true,
};

const USER_PROFILE: UserProfile = {
  userId: 'u1',
  displayName: 'Operator',
  timezone: 'Asia/Manila',
  location: 'Philippines',
  skills: [
    { name: 'Excel', level: 'verified' },
    { name: 'SQL', level: 'self_reported' },
    { name: 'Inventory', level: 'transferable' },
  ],
  experience: { summary: 'Retail inventory & spreadsheets', domains: [] },
  workPreferences: {
    remoteOnly: true,
    lowClientInteraction: true,
    offlineFriendly: true,
  },
};

describe('Discovery Pipeline Integration (Blueprint §17)', () => {
  it('deduplicates unchanged repeat runs and emits zero notifications when no new qualified jobs', async () => {
    const connector = new DemoSeedConnector();
    const fixedNow = new Date('2026-11-25T12:00:00Z');
    const fixedConnector: JobSourceConnector = {
      sourceKey: 'demo_seed',
      discover: async () => {
        const page = await connector.discover();
        // stabilize timestamps for deterministic hash
        return {
          ...page,
          jobs: page.jobs.map((j, idx) => ({
            ...j,
            postedAt: new Date(fixedNow.getTime() - (idx + 1) * 3600000).toISOString(),
          })),
        };
      },
      normalize: connector.normalize,
      healthCheck: connector.healthCheck,
    };

    const run1 = await runDiscoveryPipeline({
      connectors: [fixedConnector],
      searchProfile: SEARCH_PROFILE,
      userProfile: USER_PROFILE,
      now: fixedNow,
    });

    expect(run1.qualifiedCount).toBeGreaterThan(0);
    expect(run1.notifications.length).toBe(run1.qualifiedCount);

    // Repeat run with unchanged listings -> all duplicates, zero notifications
    const run2 = await runDiscoveryPipeline({
      connectors: [fixedConnector],
      searchProfile: SEARCH_PROFILE,
      userProfile: USER_PROFILE,
      existingRecords: run1.records,
      now: fixedNow,
    });

    expect(run2.duplicateCount).toBe(run1.discoveredCount);
    expect(run2.notifications.length).toBe(0);
  });

  it('isolates failed source connector so other sources continue', async () => {
    const failingConnector: JobSourceConnector = {
      sourceKey: 'broken_source',
      discover: async () => {
        throw new Error('Upstream 503');
      },
      normalize: (r) => r as never,
      healthCheck: async () => ({
        sourceKey: 'broken_source',
        healthy: false,
        checkedAt: new Date().toISOString(),
      }),
    };

    const res = await runDiscoveryPipeline({
      connectors: [failingConnector, new DemoSeedConnector()],
      searchProfile: SEARCH_PROFILE,
      userProfile: USER_PROFILE,
      maxRetryAttempts: 2,
    });

    expect(res.errorCount).toBe(1);
    expect(res.sourceErrors[0]?.sourceKey).toBe('broken_source');
    expect(res.discoveredCount).toBeGreaterThan(0);
    expect(res.qualifiedCount).toBeGreaterThan(0);
  });
});
