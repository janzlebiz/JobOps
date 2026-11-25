export type SkillEvidenceLevel =
  | 'verified'
  | 'self_reported'
  | 'transferable'
  | 'learning'
  | 'missing';

export type CompetitionStatus = 'known' | 'not_disclosed' | 'not_applicable';

export type EligibilityStatus =
  | 'worldwide'
  | 'philippines'
  | 'unknown'
  | 'restricted';

export type JobDecision = 'qualified' | 'review_required' | 'rejected';

export type QualificationReason =
  | 'passed_hard_rules'
  | 'competition_unknown'
  | 'eligibility_unknown'
  | 'rejected_competition'
  | 'rejected_stale'
  | 'rejected_location'
  | 'rejected_compensation'
  | 'rejected_trust'
  | 'duplicate'
  | 'source_error';

export type ActionType = 'assess' | 'analyze' | 'apply' | 'build' | 'automate';

export type ApplicationStatus =
  | 'to_review'
  | 'drafting'
  | 'ready_for_approval'
  | 'approved'
  | 'applied'
  | 'interview'
  | 'rejected'
  | 'won'
  | 'withdrawn';

export type EvidenceLabel =
  | 'verified'
  | 'source_reported'
  | 'inferred'
  | 'unknown'
  | 'contradicted';

export type EmployerVerdict = 'good_candidate' | 'conditional' | 'avoid';

export type CompensationType = 'hourly' | 'fixed' | 'monthly' | 'unknown';

export type OpportunityCategory =
  | 'spreadsheet_operations'
  | 'document_processing'
  | 'finance_operations'
  | 'inventory_operations'
  | 'crm_operations'
  | 'ecommerce_operations'
  | 'research_operations'
  | 'database_operations'
  | 'administrative_operations'
  | 'process_automation'
  | 'quality_operations'
  | 'logistics_operations'
  | 'billing_operations'
  | 'product_information_management';

export interface UserSkill {
  name: string;
  level: SkillEvidenceLevel;
  evidenceNote?: string;
  sampleUrl?: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  timezone: string;
  location: string;
  skills: UserSkill[];
  experience: {
    summary: string;
    domains: string[];
  };
  workPreferences: {
    remoteOnly: boolean;
    lowClientInteraction: boolean;
    offlineFriendly: boolean;
  };
}

export interface SearchProfile {
  id: string;
  userId: string;
  name: string;
  enabled: boolean;
  platforms: string[];
  categories: OpportunityCategory[];
  keywords: string[];
  maxProposals: number; // 0-19
  preferredMaxProposals: number; // 0-10
  maxAgeHours: number; // default 24
  minimumCompensation?: number;
  currency?: string;
  includeHiddenCompetition: boolean;
  includeUnknownEligibility: boolean;
  scheduleEnabled: boolean;
}

export interface EmployerSignals {
  name: string | null;
  url?: string | null;
  accountAgeDays?: number | null;
  totalHires?: number | null;
  totalSpentUsd?: number | null;
  paymentVerified?: boolean | null;
  businessPresenceVerified?: boolean | null;
}

export interface NormalizedJob {
  sourceKey: string;
  externalId: string | null;
  canonicalUrl: string;
  title: string;
  description: string;
  category: OpportunityCategory | string;
  skillsRequired: string[];
  employer: EmployerSignals;
  locationText: string | null;
  remoteType: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  eligibleCountries: string[];
  eligibilityStatus: EligibilityStatus;
  compensationMin: number | null;
  compensationMax: number | null;
  compensationCurrency: string | null;
  compensationType: CompensationType;
  proposalCount: number | null;
  competitionStatus: CompetitionStatus;
  postedAt: string | null;
  retrievedAt: string;
  retrievalMethod: 'official_api' | 'authorized_feed' | 'public_listing' | 'user_url' | 'demo_seed';
  termsReviewedAt?: string;
  hasUnpaidTest?: boolean;
  commissionOnly?: boolean;
  requestsSensitiveCredentials?: boolean;
  seriousFraudSignal?: boolean;
  fraudNotes?: string[];
  deliverableClarityScore?: number; // 0-10
  rawData: Record<string, unknown>;
}

export interface QualificationResult {
  decision: JobDecision;
  reason: QualificationReason;
  preferredCompetition: boolean;
  notes: string[];
}

export interface ScoreBreakdown {
  skillFit: number; // max 25
  employerCredibility: number; // max 20
  compensation: number; // max 15
  freshness: number; // max 15
  deliverableClarity: number; // max 10
  locationEligibility: number; // max 10
  recurringPotential: number; // max 5
  total: number; // max 100
  priorityTier: 'high' | 'worthwhile' | 'watchlist' | 'low';
}

export interface JobEvaluation {
  jobId: string;
  userId: string;
  qualification: QualificationResult;
  score: ScoreBreakdown;
  riskFlags: string[];
  skillGaps: Array<{
    skill: string;
    status: SkillEvidenceLevel;
    note: string;
  }>;
  evaluatedAt: string;
}

export interface EvidenceItem {
  claim: string;
  label: EvidenceLabel;
  sourceName: string;
  sourceUrl?: string;
  checkedAt: string;
}

export interface FiveActionOutput {
  assessment: {
    verdict: EmployerVerdict;
    trustScore: number;
    evidence: EvidenceItem[];
    riskFlags: string[];
    unknowns: string[];
  };
  analysis: {
    fitScore: number;
    matchingSkills: string[];
    transferableSkills: string[];
    skillGaps: string[];
    estimatedEffort: string;
    connectivityRequirement: 'low' | 'moderate' | 'high';
    deliveryPlan: string[];
  };
  application: {
    proposal: string;
    screeningAnswers: Array<{ question: string; answer: string }>;
    relevantExperiencePoints: string[];
    suggestedPaidTrial: string;
    questionsForEmployer: string[];
    honestyCheckPassed: boolean;
    originalListingUrl: string;
    requiresUserApproval: true;
  };
  build: {
    recommendedArtifact: string;
    artifactType: string;
    scope: string[];
    acceptanceChecks: string[];
  };
  automate: {
    repetitiveProcess: string;
    frequency: string;
    systemsInvolved: string[];
    serviceOpportunity: string;
    recurringModel: string;
    humanApprovalPoints: string[];
  };
}

export interface DiscoveryPage {
  sourceKey: string;
  jobs: NormalizedJob[];
  nextCursor?: string;
  fetchedAt: string;
}

export interface SourceHealth {
  sourceKey: string;
  healthy: boolean;
  checkedAt: string;
  message?: string;
}

export interface JobSourceConnector {
  sourceKey: string;
  discover(input: {
    keywords: string[];
    categories: string[];
    since?: string;
    locationEligibility?: string[];
    cursor?: string;
  }): Promise<DiscoveryPage>;
  normalize(raw: unknown): NormalizedJob;
  healthCheck(): Promise<SourceHealth>;
}

export type WorkerTaskType =
  | 'DISCOVER_SOURCE'
  | 'NORMALIZE_LISTING'
  | 'CHECK_DUPLICATE'
  | 'QUALIFY_LISTING'
  | 'ASSESS_EMPLOYER'
  | 'MATCH_SKILLS'
  | 'GENERATE_JOB_ACTIONS'
  | 'CREATE_BUILD_ARTIFACT'
  | 'SEND_NOTIFICATION'
  | 'RECHECK_LISTING'
  | 'CLEANUP_OLD_DATA';
