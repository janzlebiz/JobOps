# Blueprint Assessment & Improvements

Assessment of `JobOps_Radar_Complete_Implementation_Blueprint.md` (v1.0) and improvements implemented in this repository.

## Strengths Retained
- **Five-Action Workflow** (`ASSESS`, `ANALYZE`, `APPLY`, `BUILD`, `AUTOMATE`) stored independently so any stage can be regenerated without overwriting others.
- **Deterministic Hard Rules Before AI**: Proposal ceiling (`0–19`, preferred `0–10`), `24h` freshness, location eligibility (`worldwide` / `philippines`), and trust rejections (`unpaid test`, `commission-only`, credential requests) are enforced deterministically and cannot be overridden by AI scores.
- **Evidence-Tagged Skills**: `verified`, `self_reported`, `transferable`, `learning`, `missing` prevents hallucinated experience in generated proposals.
- **Personal-First, Multi-User-Ready**: Explicit `user_id` ownership and PostgreSQL RLS from day one.

## Gaps Identified & Improved
1. **Schema & RLS Completeness (§10.3–10.4)**:
   - Added `set_updated_at()` triggers on mutable tables.
   - Added DDL for all §10.2 production tables (`employer_profiles`, `employer_evaluations`, `skill_catalog`, `user_skill_evidence`, `build_artifacts`, `notification_preferences`, `source_rate_limits`, `worker_attempts`).
   - Added `include_unknown_eligibility` to `search_profiles` and full RLS policies covering `application_drafts` (via parent `applications`), read-only shared tables, and locked-down worker-only tables.
2. **Qualification Edge Cases (§12.2)**:
   - Added `minimumCompensation` floor check (`rejected_compensation`) and `preferredCompetition` flag (`0–10` proposals) to `qualifyJob()`.
3. **Permitted Source Connectors & Out-of-the-Box Operability**:
   - Implemented `UpworkConnector` (official GraphQL API), `FreelancerConnector` (official REST API), `OnlineJobsPhConnector` (authorized feed with `competitionStatus: 'not_disclosed'`), plus `DemoSeedConnector` so the full pipeline and UI run locally without external credentials.
4. **AI Prompt-Injection Isolation & Schema Guard (§13)**:
   - Wrapped external listing payloads in `<UNTRUSTED_LISTING_DATA>` delimiters, added Zod validation (`FiveActionOutputSchema`), retry-with-limit, missing-skill honesty check, and a `DeterministicFallbackProvider` for offline/no-key operation.
5. **Mandatory Manual Approval Gate (§6.3, §14)**:
   - Enforced server-side in `POST/PATCH /api/applications`: transitioning to `applied` returns `400 APPROVAL_REQUIRED` unless `userApproved` / `userApprovedAt` is explicitly set.
