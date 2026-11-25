# JobOps Radar

Personal-first, multi-user-ready job-opportunity intelligence PWA with a five-action workflow: **ASSESS**, **ANALYZE**, **APPLY**, **BUILD**, **AUTOMATE**.

## Architecture

- `apps/web` — Next.js 15 App Router PWA (Tailwind CSS, Service Worker, IndexedDB offline cache & pending-sync queue)
- `packages/shared-types` — Domain types & connector contracts
- `packages/validation` — Zod schemas for API & AI outputs
- `packages/scoring` — Deterministic qualification rules, 100-point scoring, material-change hashing
- `packages/source-connectors` — Permitted adapters (`UpworkConnector`, `FreelancerConnector`, `OnlineJobsPhConnector`, `DemoSeedConnector`)
- `packages/ai-prompts` — Provider-independent AI adapter (`OpenAIProvider`, `DeterministicFallbackProvider`) with prompt-injection isolation
- `workers/pipeline` — Discovery → Normalize → Deduplicate → Qualify → Score → 5-Action → Notify runner
- `supabase/` — PostgreSQL migrations, RLS policies, seed data, and `dispatch-discovery` Edge Function

## Quick Start

```bash
npm install
npm run typecheck
npm run test
npm run build
npm run dev
```

See [docs/BLUEPRINT_ASSESSMENT.md](docs/BLUEPRINT_ASSESSMENT.md) for the blueprint review and architectural improvements.
