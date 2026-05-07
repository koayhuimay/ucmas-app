-- UCMAS app — Supabase schema v1
-- Run this in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Idempotent: safe to re-run; uses IF NOT EXISTS / OR REPLACE / DROP-then-CREATE for triggers.

-- =========================================================================
-- profiles
-- One row per authenticated user. Auto-created by trigger on signup.
-- =========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  current_addsub_level int default 1 check (current_addsub_level between 1 and 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile row on auth.users insert.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- drill_sessions
-- One row per completed drill. client_session_id is generated on device so
-- offline-queued sessions can be safely re-pushed without duplicates.
-- =========================================================================
create table if not exists public.drill_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_session_id text not null,
  track text not null check (track in ('addsub','mult','div')),
  level int,
  format_id text,
  drill_mode text not null check (drill_mode in ('quick','full')),
  total_questions int not null,
  correct_count int not null,
  time_seconds int not null,
  completed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, client_session_id)
);

create index if not exists drill_sessions_user_completed_idx
  on public.drill_sessions (user_id, completed_at desc);

alter table public.drill_sessions enable row level security;

drop policy if exists "Users can read own sessions" on public.drill_sessions;
create policy "Users can read own sessions"
  on public.drill_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own sessions" on public.drill_sessions;
create policy "Users can insert own sessions"
  on public.drill_sessions for insert
  with check (auth.uid() = user_id);

-- =========================================================================
-- drill_answers
-- For now: stores mistakes only (matches what the app currently records).
-- Schema permits is_correct=true rows so we can capture all answers later
-- without a migration.
-- =========================================================================
create table if not exists public.drill_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.drill_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_text text not null,
  user_answer text,
  correct_answer text not null,
  is_correct boolean not null,
  position int,
  time_ms int,
  created_at timestamptz not null default now()
);

create index if not exists drill_answers_session_idx
  on public.drill_answers (session_id);

alter table public.drill_answers enable row level security;

drop policy if exists "Users can read own answers" on public.drill_answers;
create policy "Users can read own answers"
  on public.drill_answers for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own answers" on public.drill_answers;
create policy "Users can insert own answers"
  on public.drill_answers for insert
  with check (auth.uid() = user_id);
