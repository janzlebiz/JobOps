-- Extended production tables from Blueprint §10.2

create table public.employer_profiles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.job_sources(id),
  external_employer_id text,
  name text not null,
  website_url text,
  business_presence_verified boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger employer_profiles_updated_at
  before update on public.employer_profiles
  for each row execute function public.set_updated_at();

create table public.employer_evaluations (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employer_profiles(id) on delete cascade,
  account_age_days integer,
  total_hires integer,
  payment_verified boolean,
  verdict text not null default 'conditional',
  risk_findings jsonb not null default '[]',
  evidence jsonb not null default '[]',
  checked_at timestamptz not null default now()
);

create table public.skill_catalog (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique,
  aliases text[] not null default '{}',
  category text,
  created_at timestamptz not null default now()
);

create table public.user_skill_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_name text not null,
  evidence_level text not null check (evidence_level in ('verified', 'self_reported', 'transferable', 'learning', 'missing')),
  evidence_note text,
  sample_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, skill_name)
);

create trigger user_skill_evidence_updated_at
  before update on public.user_skill_evidence
  for each row execute function public.set_updated_at();

create table public.build_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.job_listings(id) on delete cascade,
  artifact_type text not null,
  version integer not null default 1,
  storage_path text not null,
  user_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default false,
  web_push_enabled boolean not null default false,
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text not null default 'Asia/Manila',
  updated_at timestamptz not null default now()
);

create table public.source_rate_limits (
  source_id uuid primary key references public.job_sources(id) on delete cascade,
  requests_per_minute integer not null default 30,
  backoff_until timestamptz,
  consecutive_failures integer not null default 0,
  last_error text,
  updated_at timestamptz not null default now()
);

create table public.worker_attempts (
  id uuid primary key default gen_random_uuid(),
  task_type text not null,
  idempotency_key text not null unique,
  status text not null default 'queued',
  attempt_count integer not null default 0,
  last_error text,
  execution_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
