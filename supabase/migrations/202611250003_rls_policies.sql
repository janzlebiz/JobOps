-- Enable RLS on all exposed tables (Blueprint §10.4)
alter table public.user_profiles enable row level security;
alter table public.search_profiles enable row level security;
alter table public.job_sources enable row level security;
alter table public.job_listings enable row level security;
alter table public.job_snapshots enable row level security;
alter table public.search_runs enable row level security;
alter table public.discovery_events enable row level security;
alter table public.job_evaluations enable row level security;
alter table public.job_actions enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.applications enable row level security;
alter table public.application_drafts enable row level security;
alter table public.notifications enable row level security;
alter table public.employer_profiles enable row level security;
alter table public.employer_evaluations enable row level security;
alter table public.skill_catalog enable row level security;
alter table public.user_skill_evidence enable row level security;
alter table public.build_artifacts enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.source_rate_limits enable row level security;
alter table public.worker_attempts enable row level security;

-- User-owned tables
create policy "Manage own user profile"
  on public.user_profiles for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Manage own search profiles"
  on public.search_profiles for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Manage own evaluations"
  on public.job_evaluations for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Manage own job actions"
  on public.job_actions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Manage own saved jobs"
  on public.saved_jobs for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Manage own applications"
  on public.applications for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Manage own application drafts via parent"
  on public.application_drafts for all to authenticated
  using (
    exists (
      select 1 from public.applications a
      where a.id = application_id and a.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.applications a
      where a.id = application_id and a.user_id = (select auth.uid())
    )
  );

create policy "Manage own notifications"
  on public.notifications for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Manage own skill evidence"
  on public.user_skill_evidence for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Manage own build artifacts"
  on public.build_artifacts for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Manage own notification preferences"
  on public.notification_preferences for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Shared read-only catalog/listings for authenticated users (writes via service_role only)
create policy "Read job sources"
  on public.job_sources for select to authenticated using (true);

create policy "Read job listings"
  on public.job_listings for select to authenticated using (true);

create policy "Read job snapshots"
  on public.job_snapshots for select to authenticated using (true);

create policy "Read employer profiles"
  on public.employer_profiles for select to authenticated using (true);

create policy "Read employer evaluations"
  on public.employer_evaluations for select to authenticated using (true);

create policy "Read skill catalog"
  on public.skill_catalog for select to authenticated using (true);

-- Scoped search runs for profile owner
create policy "Read own search runs"
  on public.search_runs for select to authenticated
  using (
    search_profile_id is not null and exists (
      select 1 from public.search_profiles sp
      where sp.id = search_profile_id and sp.user_id = (select auth.uid())
    )
  );

-- Worker-only tables (source_rate_limits, worker_attempts, discovery_events):
-- No policies for authenticated/anon -> denied by default; accessible only via service_role.
