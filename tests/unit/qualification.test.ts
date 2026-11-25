import { describe, expect, it } from 'vitest';
import type { NormalizedJob, SearchProfile, UserProfile } from '@jobops/shared-types';
import { qualifyJob, scoreJob } from '@jobops/scoring';
import { OnlineJobsPhConnector } from '@jobops/source-connectors';

const NOW = new Date('2026-11-25T12:00:00Z');

const BASE_PROFILE: SearchProfile = {
  id: 'sp1',
  userId: 'u1',
  name: 'Primary',
  enabled: true,
  platforms: ['upwork', 'freelancer', 'onlinejobs_ph'],
  categories: [],
  keywords: [],
  maxProposals: 19,
  preferredMaxProposals: 10,
  maxAgeHours: 24,
  minimumCompensation: 5,
  currency: 'USD',
  includeHiddenCompetition: false,
  includeUnknownEligibility: false,
  scheduleEnabled: true,
};

const BASE_USER: UserProfile = {
  userId: 'u1',
  displayName: 'Test User',
  timezone: 'Asia/Manila',
  location: 'Philippines',
  skills: [
    { name: 'Excel', level: 'verified' },
    { name: 'SQL', level: 'self_reported' },
    { name: 'QuickBooks', level: 'missing' },
  ],
  experience: { summary: 'Admin & data', domains: [] },
  workPreferences: {
    remoteOnly: true,
    lowClientInteraction: true,
    offlineFriendly: true,
  },
};

function makeJob(overrides: Partial<NormalizedJob> = {}): NormalizedJob {
  return {
    sourceKey: 'upwork',
    externalId: 'j1',
    canonicalUrl: 'https://www.upwork.com/jobs/j1',
    title: 'Excel Cleanup',
    description: 'Clean 1000 rows in Excel with clear deliverables and validation checks.',
    category: 'spreadsheet_operations',
    skillsRequired: ['Excel'],
    employer: {
      name: 'Acme',
      paymentVerified: true,
      totalHires: 5,
      accountAgeDays: 180,
    },
    locationText: 'Worldwide',
    remoteType: 'remote',
    eligibleCountries: ['Worldwide'],
    eligibilityStatus: 'worldwide',
    compensationMin: 15,
    compensationMax: 20,
    compensationCurrency: 'USD',
    compensationType: 'hourly',
    proposalCount: 5,
    competitionStatus: 'known',
    postedAt: new Date(NOW.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    retrievedAt: NOW.toISOString(),
    retrievalMethod: 'official_api',
    rawData: {},
    ...overrides,
  };
}

describe('Deterministic Qualification Rules (Blueprint §17)', () => {
  it('accepts 5 proposals and marks preferredCompetition=true', () => {
    const res = qualifyJob(makeJob({ proposalCount: 5 }), BASE_PROFILE, NOW);
    expect(res.decision).toBe('qualified');
    expect(res.preferredCompetition).toBe(true);
  });

  it('accepts 19 proposals with preferredCompetition=false', () => {
    const res = qualifyJob(makeJob({ proposalCount: 19 }), BASE_PROFILE, NOW);
    expect(res.decision).toBe('qualified');
    expect(res.preferredCompetition).toBe(false);
  });

  it('rejects 20 proposals and 50+ proposals', () => {
    expect(qualifyJob(makeJob({ proposalCount: 20 }), BASE_PROFILE, NOW).reason).toBe('rejected_competition');
    expect(qualifyJob(makeJob({ proposalCount: 55 }), BASE_PROFILE, NOW).reason).toBe('rejected_competition');
  });

  it('marks hidden proposal count as review_required when disabled', () => {
    const res = qualifyJob(
      makeJob({ proposalCount: null, competitionStatus: 'not_disclosed' }),
      BASE_PROFILE,
      NOW
    );
    expect(res.decision).toBe('review_required');
    expect(res.reason).toBe('competition_unknown');
  });

  it('OnlineJobs.ph normalizes count as not_disclosed and null', () => {
    const connector = new OnlineJobsPhConnector();
    const job = connector.normalize({
      id: 'oj1',
      title: 'Inventory VA',
      url: 'https://www.onlinejobs.ph/job/oj1',
    });
    expect(job.competitionStatus).toBe('not_disclosed');
    expect(job.proposalCount).toBeNull();
  });

  it('accepts 23h posting age and rejects 25h posting age', () => {
    const h23 = new Date(NOW.getTime() - 23 * 60 * 60 * 1000).toISOString();
    const h25 = new Date(NOW.getTime() - 25 * 60 * 60 * 1000).toISOString();
    expect(qualifyJob(makeJob({ postedAt: h23 }), BASE_PROFILE, NOW).decision).toBe('qualified');
    expect(qualifyJob(makeJob({ postedAt: h25 }), BASE_PROFILE, NOW).reason).toBe('rejected_stale');
  });

  it('accepts worldwide and philippines, rejects restricted', () => {
    expect(qualifyJob(makeJob({ eligibilityStatus: 'worldwide' }), BASE_PROFILE, NOW).decision).toBe('qualified');
    expect(qualifyJob(makeJob({ eligibilityStatus: 'philippines' }), BASE_PROFILE, NOW).decision).toBe('qualified');
    expect(qualifyJob(makeJob({ eligibilityStatus: 'restricted' }), BASE_PROFILE, NOW).reason).toBe('rejected_location');
  });

  it('rejects unpaid test and commission-only', () => {
    expect(qualifyJob(makeJob({ hasUnpaidTest: true }), BASE_PROFILE, NOW).reason).toBe('rejected_trust');
    expect(qualifyJob(makeJob({ commissionOnly: true }), BASE_PROFILE, NOW).reason).toBe('rejected_trust');
  });

  it('flags new employer without hiring history', () => {
    const { riskFlags } = scoreJob(
      makeJob({ employer: { name: 'NewCo', paymentVerified: false, totalHires: 0 } }),
      BASE_USER,
      NOW
    );
    expect(riskFlags.some((f) => f.toLowerCase().includes('new or unverified'))).toBe(true);
  });
});
