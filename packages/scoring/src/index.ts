import type {
  JobEvaluation,
  NormalizedJob,
  QualificationResult,
  ScoreBreakdown,
  SearchProfile,
  SkillEvidenceLevel,
  UserProfile,
} from '@jobops/shared-types';

export function hoursBetween(isoDate: string, now: Date): number {
  const posted = new Date(isoDate);
  if (Number.isNaN(posted.getTime())) {
    return Number.POSITIVE_INFINITY;
  }
  return (now.getTime() - posted.getTime()) / (1000 * 60 * 60);
}

export function qualifyJob(
  job: NormalizedJob,
  profile: SearchProfile,
  now: Date = new Date()
): QualificationResult {
  const notes: string[] = [];

  // 1. Trust & safety hard rejections (AI score can never override)
  if (
    job.hasUnpaidTest ||
    job.commissionOnly ||
    job.requestsSensitiveCredentials ||
    job.seriousFraudSignal
  ) {
    if (job.hasUnpaidTest) notes.push('Unpaid test or production assignment.');
    if (job.commissionOnly) notes.push('Commission-only compensation.');
    if (job.requestsSensitiveCredentials)
      notes.push('Requests sensitive credentials or banking passwords.');
    if (job.seriousFraudSignal) notes.push('Serious fraud indicators detected.');
    return {
      decision: 'rejected',
      reason: 'rejected_trust',
      preferredCompetition: false,
      notes,
    };
  }

  // 2. Competition ceiling (0-19 accepted, 20+ rejected)
  const maxProposals = Math.min(profile.maxProposals, 19);
  if (
    job.competitionStatus === 'known' &&
    job.proposalCount !== null &&
    job.proposalCount > maxProposals
  ) {
    notes.push(
      `Proposal count ${job.proposalCount} exceeds ceiling ${maxProposals}.`
    );
    return {
      decision: 'rejected',
      reason: 'rejected_competition',
      preferredCompetition: false,
      notes,
    };
  }

  // 3. Freshness window (default 24 hours)
  if (!job.postedAt) {
    notes.push('Missing posting timestamp.');
    return {
      decision: 'rejected',
      reason: 'rejected_stale',
      preferredCompetition: false,
      notes,
    };
  }
  const ageHours = hoursBetween(job.postedAt, now);
  if (ageHours > profile.maxAgeHours) {
    notes.push(
      `Posting age ${ageHours.toFixed(1)}h exceeds ${profile.maxAgeHours}h window.`
    );
    return {
      decision: 'rejected',
      reason: 'rejected_stale',
      preferredCompetition: false,
      notes,
    };
  }

  // 4. Location eligibility
  if (job.eligibilityStatus === 'restricted') {
    notes.push('Restricted to an ineligible country or region.');
    return {
      decision: 'rejected',
      reason: 'rejected_location',
      preferredCompetition: false,
      notes,
    };
  }

  // 5. Compensation floor
  if (
    profile.minimumCompensation !== undefined &&
    profile.minimumCompensation !== null &&
    job.compensationMax !== null &&
    job.compensationMax < profile.minimumCompensation
  ) {
    notes.push(
      `Compensation ${job.compensationMax} below floor ${profile.minimumCompensation}.`
    );
    return {
      decision: 'rejected',
      reason: 'rejected_compensation',
      preferredCompetition: false,
      notes,
    };
  }

  const preferredCompetition =
    job.competitionStatus === 'known' &&
    job.proposalCount !== null &&
    job.proposalCount <= profile.preferredMaxProposals;

  // 6. Hidden competition queue
  if (
    job.competitionStatus === 'not_disclosed' &&
    !profile.includeHiddenCompetition
  ) {
    notes.push('Competition count not disclosed; routed to review.');
    return {
      decision: 'review_required',
      reason: 'competition_unknown',
      preferredCompetition: false,
      notes,
    };
  }

  // 7. Unknown location eligibility queue
  if (
    job.eligibilityStatus === 'unknown' &&
    !profile.includeUnknownEligibility
  ) {
    notes.push('Location eligibility unknown; routed to review.');
    return {
      decision: 'review_required',
      reason: 'eligibility_unknown',
      preferredCompetition,
      notes,
    };
  }

  notes.push('Passed all deterministic qualification rules.');
  return {
    decision: 'qualified',
    reason: 'passed_hard_rules',
    preferredCompetition,
    notes,
  };
}

function matchSkillLevel(
  requiredSkill: string,
  userProfile: UserProfile
): SkillEvidenceLevel {
  const needle = requiredSkill.toLowerCase().trim();
  for (const s of userProfile.skills) {
    const hay = s.name.toLowerCase().trim();
    if (hay === needle || hay.includes(needle) || needle.includes(hay)) {
      return s.level;
    }
  }
  return 'missing';
}

export function scoreJob(
  job: NormalizedJob,
  userProfile: UserProfile,
  now: Date = new Date()
): {
  score: ScoreBreakdown;
  riskFlags: string[];
  skillGaps: JobEvaluation['skillGaps'];
} {
  const riskFlags: string[] = [...(job.fraudNotes ?? [])];
  const skillGaps: JobEvaluation['skillGaps'] = [];

  // 1. Skill fit (max 25)
  let skillFit = 0;
  if (job.skillsRequired.length === 0) {
    skillFit = 12;
  } else {
    let earned = 0;
    for (const req of job.skillsRequired) {
      const level = matchSkillLevel(req, userProfile);
      if (level === 'verified') earned += 1;
      else if (level === 'self_reported') earned += 0.85;
      else if (level === 'transferable') earned += 0.65;
      else if (level === 'learning') {
        earned += 0.3;
        skillGaps.push({ skill: req, status: level, note: 'Currently learning' });
      } else {
        skillGaps.push({
          skill: req,
          status: 'missing',
          note: 'No established evidence; do not claim',
        });
      }
    }
    skillFit = Math.round((earned / job.skillsRequired.length) * 25);
  }

  // 2. Employer credibility (max 20)
  let employerCredibility = 4;
  if (job.employer.paymentVerified) employerCredibility += 6;
  if (job.employer.businessPresenceVerified) employerCredibility += 4;
  if ((job.employer.totalHires ?? 0) >= 3) employerCredibility += 4;
  if ((job.employer.accountAgeDays ?? 0) >= 90) employerCredibility += 2;
  if (
    !job.employer.paymentVerified &&
    (job.employer.totalHires ?? 0) === 0
  ) {
    riskFlags.push('New or unverified employer without hiring history');
  }
  employerCredibility = Math.min(20, employerCredibility);

  // 3. Compensation (max 15)
  let compensation = 5;
  if (job.compensationMin !== null || job.compensationMax !== null) {
    const val = job.compensationMax ?? job.compensationMin ?? 0;
    if (job.compensationType === 'hourly') {
      compensation = val >= 15 ? 15 : val >= 8 ? 11 : val >= 5 ? 7 : 3;
    } else if (job.compensationType === 'fixed') {
      compensation = val >= 300 ? 15 : val >= 100 ? 11 : val >= 40 ? 7 : 3;
    } else if (job.compensationType === 'monthly') {
      compensation = val >= 1000 ? 15 : val >= 500 ? 11 : 6;
    } else {
      compensation = 8;
    }
  } else {
    riskFlags.push('Compensation not specified');
  }

  // 4. Freshness (max 15)
  let freshness = 0;
  if (job.postedAt) {
    const age = hoursBetween(job.postedAt, now);
    if (age <= 2) freshness = 15;
    else if (age <= 6) freshness = 13;
    else if (age <= 12) freshness = 10;
    else if (age <= 24) freshness = 7;
  }

  // 5. Deliverable clarity (max 10)
  const deliverableClarity = Math.min(
    10,
    Math.max(0, job.deliverableClarityScore ?? (job.description.length > 150 ? 7 : 4))
  );

  // 6. Location eligibility (max 10)
  let locationEligibility = 0;
  if (job.eligibilityStatus === 'worldwide') locationEligibility = 10;
  else if (job.eligibilityStatus === 'philippines') locationEligibility = 9;
  else if (job.eligibilityStatus === 'unknown') locationEligibility = 3;

  // 7. Recurring potential (max 5)
  const lowerDesc = `${job.title} ${job.description}`.toLowerCase();
  const recurringKeywords = [
    'ongoing',
    'weekly',
    'monthly',
    'recurring',
    'retainer',
    'long-term',
    'automation',
    'reconciliation',
  ];
  const recurringPotential = recurringKeywords.some((k) =>
    lowerDesc.includes(k)
  )
    ? 5
    : 2;

  const total =
    skillFit +
    employerCredibility +
    compensation +
    freshness +
    deliverableClarity +
    locationEligibility +
    recurringPotential;

  const priorityTier =
    total >= 85
      ? 'high'
      : total >= 70
        ? 'worthwhile'
        : total >= 55
          ? 'watchlist'
          : 'low';

  return {
    score: {
      skillFit,
      employerCredibility,
      compensation,
      freshness,
      deliverableClarity,
      locationEligibility,
      recurringPotential,
      total,
      priorityTier,
    },
    riskFlags,
    skillGaps,
  };
}

export function evaluateJob(
  jobId: string,
  job: NormalizedJob,
  searchProfile: SearchProfile,
  userProfile: UserProfile,
  now: Date = new Date()
): JobEvaluation {
  const qualification = qualifyJob(job, searchProfile, now);
  const { score, riskFlags, skillGaps } = scoreJob(job, userProfile, now);

  return {
    jobId,
    userId: userProfile.userId,
    qualification,
    score,
    riskFlags,
    skillGaps,
    evaluatedAt: now.toISOString(),
  };
}

export function computeMaterialHash(job: NormalizedJob): string {
  const materialPayload = {
    title: job.title.trim(),
    description: job.description.trim(),
    proposalCount: job.proposalCount,
    competitionStatus: job.competitionStatus,
    compensationMin: job.compensationMin,
    compensationMax: job.compensationMax,
    compensationCurrency: job.compensationCurrency,
    eligibilityStatus: job.eligibilityStatus,
    eligibleCountries: [...job.eligibleCountries].sort(),
    employerName: job.employer.name,
    postedAt: job.postedAt,
  };
  const input = JSON.stringify(materialPayload);
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch ^ (i & 0xff);
    h2 = Math.imul(h2, 0x01000193);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

export function detectMaterialChanges(
  previous: NormalizedJob,
  next: NormalizedJob
): Record<string, { before: unknown; after: unknown }> {
  const changes: Record<string, { before: unknown; after: unknown }> = {};
  const fields: Array<keyof NormalizedJob> = [
    'title',
    'description',
    'proposalCount',
    'competitionStatus',
    'compensationMin',
    'compensationMax',
    'eligibilityStatus',
    'postedAt',
  ];
  for (const field of fields) {
    if (previous[field] !== next[field]) {
      changes[String(field)] = { before: previous[field], after: next[field] };
    }
  }
  return changes;
}
