create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type public.competition_status as enum (
  'known',
  'not_disclosed',
  'not_applicable'
);

create type public.job_decision as enum (
  'qualified',
  'review_required',
  'rejected'
);

create type public.application_status as enum (
  'to_review',
  'drafting',
  'ready_for_approval',
  'approved',
  'applied',
  'interview',
  'rejected',
  'won',
  'withdrawn'
);

create type public.action_type as enum (
  'assess',
  'analyze',
  'apply',
  'build',
  'automate'
);

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'Asia/Manila',
  location text,
  skills jsonb not null default '[]',
  experience jsonb not null default '{}',
  work_preferences jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

create table public.search_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Primary search',
  enabled boolean not null default true,
  platforms text[] not null default array['upwork','freelancer','onlinejobs_ph'],
  categories text[] not null default '{}',
  keywords text[] not null default '{}',
  max_proposals integer not null default 19 check (max_proposals between 0 and 19),
  preferred_max_proposals integer not null default 10 check (preferred_max_proposals between 0 and 19),
  max_age_hours integer not null default 24 check (max_age_hours >= 1),
  minimum_compensation numeric,
  currency text,
  include_hidden_competition boolean not null default false,
  include_unknown_eligibility boolean not null default false,
  schedule_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.job_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  source_type text not null,
  base_url text,
  enabled boolean not null default true,
  access_method text,
  terms_reviewed_at timestamptz,
  last_success_at timestamptz,
  configuration jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.job_listings (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.job_sources(id),
  external_id text,
  canonical_url text not null,
  title text not null,
  employer_name text,
  employer_url text,
  description text,
  category text,
  skills_required text[] not null default '{}',
  location_text text,
  remote_type text,
  eligible_countries text[] not null default '{}',
  eligibility_status text not null default 'unknown',
  compensation_min numeric,
  compensation_max numeric,
  compensation_currency text,
  compensation_type text,
  proposal_count integer,
  competition_status public.competition_status not null default 'not_disclosed',
  posted_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  content_hash text,
  listing_status text not null default 'active',
  raw_data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(source_id, external_id),
  unique(source_id, canonical_url),
  check (proposal_count is null or proposal_count >= 0)
);

create index jobs_posted_at_idx on public.job_listings(posted_at desc);
create index jobs_competition_idx on public.job_listings(competition_status, proposal_count);
create index jobs_first_seen_idx on public.job_listings(first_seen_at desc);
create index jobs_category_idx on public.job_listings(category);

create table public.job_snapshots (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_listings(id) on delete cascade,
  content_hash text not null,
  captured_at timestamptz not null default now(),
  changes jsonb not null default '{}',
  unique(job_id, content_hash)
);

create table public.search_runs (
  id uuid primary key default gen_random_uuid(),
  search_profile_id uuid references public.search_profiles(id) on delete set null,
  source_id uuid references public.job_sources(id),
  trigger_type text not null,
  status text not null default 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  discovered_count integer not null default 0,
  qualified_count integer not null default 0,
  rejected_count integer not null default 0,
  error_count integer not null default 0,
  error_summary text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.discovery_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.search_runs(id) on delete cascade,
  job_id uuid references public.job_listings(id) on delete set null,
  outcome text not null,
  reason text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.job_evaluations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  decision public.job_decision not null,
  trust_score numeric,
  fit_score numeric,
  overall_score numeric,
  reasons jsonb not null default '[]',
  risk_flags jsonb not null default '[]',
  skill_gaps jsonb not null default '[]',
  evaluated_at timestamptz not null default now()
);

create index job_evaluations_user_idx on public.job_evaluations(user_id, evaluated_at desc);

create table public.job_actions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action public.action_type not null,
  content jsonb not null default '{}',
  status text not null default 'draft',
  model_name text,
  prompt_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, user_id, action)
);

create trigger job_actions_updated_at
  before update on public.job_actions
  for each row execute function public.set_updated_at();

create table public.saved_jobs (
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.job_listings(id) on delete cascade,
  saved_at timestamptz not null default now(),
  notes text,
  primary key(user_id, job_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.job_listings(id),
  status public.application_status not null default 'to_review',
  user_approved_at timestamptz,
  submitted_at timestamptz,
  follow_up_at timestamptz,
  outcome_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, job_id)
);

create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

create table public.application_drafts (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  draft_type text not null,
  content text not null,
  version integer not null default 1,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.job_listings(id) on delete cascade,
  notification_type text not null,
  payload jsonb not null default '{}',
  delivery_status text not null default 'pending',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
