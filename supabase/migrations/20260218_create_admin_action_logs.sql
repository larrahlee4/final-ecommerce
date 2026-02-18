-- Admin action tracker for cross-admin visibility.
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  admin_email text not null default '',
  action_type text not null,
  target_type text not null default 'system',
  target_id text,
  summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_action_logs_created_at
  on public.admin_action_logs(created_at desc);
create index if not exists idx_admin_action_logs_admin_user_id
  on public.admin_action_logs(admin_user_id, created_at desc);

create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() -> 'app_metadata' ->> 'role',
    ''
  ) = 'admin';
$$;

alter table public.admin_action_logs enable row level security;

drop policy if exists "Admins can read action logs" on public.admin_action_logs;
create policy "Admins can read action logs"
on public.admin_action_logs
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Admins can insert own action logs" on public.admin_action_logs;
create policy "Admins can insert own action logs"
on public.admin_action_logs
for insert
to authenticated
with check (public.is_admin_user() and auth.uid() = admin_user_id);
