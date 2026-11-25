import { z } from 'zod';

export const PROMPT_SCHEMA_VERSION = '1.0.0';

export const EvidenceLabelSchema = z.enum([
  'verified',
  'source_reported',
  'inferred',
  'unknown',
  'contradicted',
]);

export const EvidenceItemSchema = z.object({
  claim: z.string().min(1),
  label: EvidenceLabelSchema,
  sourceName: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  checkedAt: z.string().min(1),
});

export const FiveActionOutputSchema = z.object({
  assessment: z.object({
    verdict: z.enum(['good_candidate', 'conditional', 'avoid']),
    trustScore: z.number().min(0).max(100),
    evidence: z.array(EvidenceItemSchema),
    riskFlags: z.array(z.string()),
    unknowns: z.array(z.string()),
  }),
  analysis: z.object({
    fitScore: z.number().min(0).max(100),
    matchingSkills: z.array(z.string()),
    transferableSkills: z.array(z.string()),
    skillGaps: z.array(z.string()),
    estimatedEffort: z.string().min(1),
    connectivityRequirement: z.enum(['low', 'moderate', 'high']),
    deliveryPlan: z.array(z.string()),
  }),
  application: z.object({
    proposal: z.string().min(1),
    screeningAnswers: z.array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
      })
    ),
    relevantExperiencePoints: z.array(z.string()),
    suggestedPaidTrial: z.string(),
    questionsForEmployer: z.array(z.string()),
    honestyCheckPassed: z.boolean(),
    originalListingUrl: z.string().min(1),
    requiresUserApproval: z.literal(true),
  }),
  build: z.object({
    recommendedArtifact: z.string().min(1),
    artifactType: z.string().min(1),
    scope: z.array(z.string()),
    acceptanceChecks: z.array(z.string()),
  }),
  automate: z.object({
    repetitiveProcess: z.string().min(1),
    frequency: z.string().min(1),
    systemsInvolved: z.array(z.string()),
    serviceOpportunity: z.string().min(1),
    recurringModel: z.string().min(1),
    humanApprovalPoints: z.array(z.string()),
  }),
});

export const SearchProfileUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  enabled: z.boolean().optional(),
  platforms: z.array(z.string().min(1)).optional(),
  categories: z.array(z.string().min(1)).optional(),
  keywords: z.array(z.string().min(1)).optional(),
  maxProposals: z.number().int().min(0).max(19).optional(),
  preferredMaxProposals: z.number().int().min(0).max(19).optional(),
  maxAgeHours: z.number().int().min(1).max(168).optional(),
  minimumCompensation: z.number().nonnegative().nullable().optional(),
  currency: z.string().min(3).max(5).nullable().optional(),
  includeHiddenCompetition: z.boolean().optional(),
  includeUnknownEligibility: z.boolean().optional(),
  scheduleEnabled: z.boolean().optional(),
});

export const SaveJobSchema = z.object({
  notes: z.string().max(4000).optional(),
});

export const ApplicationStatusSchema = z.enum([
  'to_review',
  'drafting',
  'ready_for_approval',
  'approved',
  'applied',
  'interview',
  'rejected',
  'won',
  'withdrawn',
]);

export const ApplicationCreateSchema = z.object({
  jobId: z.string().min(1),
  status: ApplicationStatusSchema.default('to_review'),
  proposalDraft: z.string().optional(),
  outcomeNotes: z.string().max(4000).optional(),
});

export const ApplicationUpdateSchema = z.object({
  status: ApplicationStatusSchema.optional(),
  userApproved: z.boolean().optional(),
  outcomeNotes: z.string().max(4000).optional(),
  followUpAt: z.string().datetime().nullable().optional(),
});

export const WorkerDispatchSchema = z.object({
  triggerType: z.enum(['cron', 'manual', 'api']).default('manual'),
  platforms: z.array(z.string().min(1)).optional(),
});
