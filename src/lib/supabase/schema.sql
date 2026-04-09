-- Phase 5.1: Data Stabilization Layer
-- This schema establishes the server-side source of truth for Monetarz.

-- 1. TABLES

-- Core ledger for all financial events
create table if not exists entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  amount numeric not null,
  currency_code text not null default 'INR',
  category text not null,
  description text,
  date timestamptz not null default now(),
  source text check (source in ('manual', 'parsed', 'ai_corrected')) not null default 'manual',
  is_archived boolean not null default false,
  metadata jsonb default '{}'::jsonb
);

-- Indexes for optimized hot-path queries
create index if not exists idx_entries_user_archived on entries(user_id, is_archived);
create index if not exists idx_entries_user_archived_date on entries(user_id, is_archived, date);

-- Pre-aggregated summaries for fast historical lookups (Renamed from monthly_trends)
create table if not exists monthly_summary (
  user_id uuid references auth.users(id) not null,
  month date not null, -- First day of the month (e.g., 2023-01-01)
  category text not null,
  entry_count bigint not null default 0,
  total_amount_minor bigint not null default 0,
  max_amount_minor bigint not null default 0,
  min_amount_minor bigint not null default 0,
  avg_amount_minor bigint not null default 0,
  currency_code text not null default 'INR',
  primary key (user_id, month, category, currency_code)
);

-- Audit logs for trust and security
create table if not exists audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  entity_type text not null, -- 'transaction', 'settings', 'archive_migration', etc.
  entity_id text not null,
  action text not null, -- 'create', 'update', 'delete', 'parse', 'archive'
  timestamp timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

-- Weekly goals table
create table if not exists weekly_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  amount numeric not null,
  created_at timestamptz not null default now()
);

-- Financial Profiles (Horizon)
create table if not exists financial_profiles (
  user_id uuid references auth.users(id) primary key,
  monthly_intention numeric not null default 0,
  monthly_income numeric not null default 0,
  updated_at timestamptz not null default now()
);

-- Recurrent Spends (Commitments)
create table if not exists recurrent_spends (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  amount numeric not null,
  category text not null,
  frequency text not null default 'monthly',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Category Budgets (Rhythm Board)
create table if not exists category_budgets (
  user_id uuid references auth.users(id) not null,
  category text not null,
  amount numeric not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

-- Enable Row Level Security (RLS)
alter table entries enable row level security;
alter table monthly_summary enable row level security;
alter table audit_logs enable row level security;
alter table weekly_goals enable row level security;
alter table financial_profiles enable row level security;
alter table recurrent_spends enable row level security;
alter table category_budgets enable row level security;

-- Policies
create policy "entries_select_policy" on entries for select using ((select auth.uid()) = user_id);
create policy "entries_insert_policy" on entries for insert with check ((select auth.uid()) = user_id);
create policy "entries_update_policy" on entries for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "entries_delete_policy" on entries for delete using ((select auth.uid()) = user_id);

create policy "Users can manage their own weekly_goals" on weekly_goals for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can manage their own financial_profiles" on financial_profiles for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can manage their own recurrent_spends" on recurrent_spends for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can manage their own category_budgets" on category_budgets for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users can read their own monthly_summary" on monthly_summary for select using ((select auth.uid()) = user_id);
create policy "Users can read their own audit_logs" on audit_logs for select using ((select auth.uid()) = user_id);

-- 2. RPC FUNCTIONS (Server-side Aggregation)

-- function: get_weekly_aggregate
create or replace function get_weekly_aggregate(
  p_user_id uuid,
  week_start timestamptz
)
returns table (
  total_amount_minor bigint,
  transaction_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() != p_user_id then raise exception 'Unauthorized'; end if;

  return query
  select
    coalesce(sum((amount * 100)::bigint), 0) as total_amount_minor,
    count(*) as transaction_count
  from entries
  where
    user_id = p_user_id
    and is_archived = false
    and date >= week_start
    and date < (week_start + interval '7 days');
end;
$$;

-- function: get_monthly_aggregate
create or replace function get_monthly_aggregate(
  p_user_id uuid,
  p_month date
)
returns table (
  category text,
  total_amount numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() != p_user_id then raise exception 'Unauthorized'; end if;

  return query
  select
    t.category,
    coalesce(sum(t.amount), 0) as total_amount
  from entries t
  where
    t.user_id = p_user_id
    and t.is_archived = false
    and date_trunc('month', t.date)::date = p_month
  group by t.category;
end;
$$;

-- function: get_analytics_snapshot
create or replace function get_analytics_snapshot(
  p_user_id uuid,
  start_date timestamptz,
  end_date timestamptz
)
returns table (
  total_spend numeric,
  top_category text,
  active_days int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() != p_user_id then raise exception 'Unauthorized'; end if;

  return query
  with stats as (
    select
      amount,
      category,
      date_trunc('day', date) as day_bucket
    from entries
    where
      user_id = p_user_id
      and is_archived = false
      and date >= start_date
      and date <= end_date
  )
  select
    coalesce(sum(amount), 0) as total_spend,
    (select s.category from stats s group by s.category order by sum(s.amount) desc limit 1) as top_category,
    count(distinct day_bucket)::int as active_days
  from stats;
end;
$$;

-- ARCHIVING RPCs

-- function: check_archive_threshold
create or replace function check_archive_threshold(
  p_user_id uuid,
  p_threshold_days int
)
returns table (
  should_archive boolean,
  old_entries_count bigint,
  oldest_date timestamptz,
  threshold_date timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_threshold_date timestamptz;
  v_count bigint;
  v_oldest timestamptz;
begin
  if auth.uid() != p_user_id then raise exception 'Unauthorized'; end if;

  v_threshold_date := now() - (p_threshold_days || ' days')::interval;
  
  select count(*), min(date)
  into v_count, v_oldest
  from entries
  where user_id = p_user_id 
    and is_archived = false 
    and date < v_threshold_date;

  return query select 
    v_count > 0, 
    v_count, 
    v_oldest, 
    v_threshold_date;
end;
$$;

-- function: execute_archive_migration
create or replace function execute_archive_migration(
  p_user_id uuid,
  p_threshold_days int
)
returns table (
  success boolean,
  archived_count bigint,
  summaries_created bigint,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_threshold_date timestamptz;
  v_archived_count bigint;
  v_summaries_count bigint;
begin
  if auth.uid() != p_user_id then raise exception 'Unauthorized'; end if;

  v_threshold_date := now() - (p_threshold_days || ' days')::interval;

  -- 1. Aggregation into monthly_summary
  insert into monthly_summary (user_id, month, category, entry_count, total_amount_minor, max_amount_minor, min_amount_minor, avg_amount_minor)
  select 
    user_id, 
    date_trunc('month', date)::date as month, 
    category,
    count(*),
    sum((amount * 100)::bigint),
    max((amount * 100)::bigint),
    min((amount * 100)::bigint),
    avg((amount * 100)::bigint),
    currency_code
  from entries
  where user_id = p_user_id 
    and is_archived = false 
    and date < v_threshold_date
  group by user_id, month, category, currency_code
  on conflict (user_id, month, category, currency_code) do update set
    entry_count = monthly_summary.entry_count + excluded.entry_count,
    total_amount_minor = monthly_summary.total_amount_minor + excluded.total_amount_minor,
    max_amount_minor = greatest(monthly_summary.max_amount_minor, excluded.max_amount_minor),
    min_amount_minor = least(monthly_summary.min_amount_minor, excluded.min_amount_minor),
    avg_amount_minor = (monthly_summary.total_amount_minor + excluded.total_amount_minor) / (monthly_summary.entry_count + excluded.entry_count);

  get diagnostics v_summaries_count = row_count;

  -- 2. Mark as archived
  update entries
  set is_archived = true
  where user_id = p_user_id 
    and is_archived = false 
    and date < v_threshold_date;

  get diagnostics v_archived_count = row_count;

  -- 3. Audit Log
  insert into audit_logs (user_id, entity_type, entity_id, action, metadata)
  values (p_user_id, 'archive_migration', p_user_id::text, 'archive', jsonb_build_object(
    'threshold_days', p_threshold_days,
    'archived_count', v_archived_count,
    'summaries_updated', v_summaries_count
  ));

  return query select true, v_archived_count, v_summaries_count, 'Migration successful';
end;
$$;

-- function: get_archive_summary_by_month
create or replace function get_archive_summary_by_month(
  p_user_id uuid,
  p_start_month date default null,
  p_end_month date default null
)
returns table (
  month date,
  category text,
  entry_count bigint,
  total_amount_minor bigint,
  max_amount_minor bigint,
  min_amount_minor bigint,
  avg_amount_minor bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() != p_user_id then raise exception 'Unauthorized'; end if;

  return query
  select 
    ms.month, ms.category, ms.entry_count, 
    ms.total_amount_minor, ms.max_amount_minor, 
    ms.min_amount_minor, ms.avg_amount_minor
  from monthly_summary ms
  where ms.user_id = p_user_id
    and (p_start_month is null or ms.month >= p_start_month)
    and (p_end_month is null or ms.month <= p_end_month)
  order by ms.month desc, ms.total_amount_minor desc;
end;
$$;

-- function: restore_archived_entries
create or replace function restore_archived_entries(
  p_user_id uuid,
  p_entry_ids uuid[] default null,
  p_month date default null
)
returns table (
  success boolean,
  restored_count bigint,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_restored_count bigint;
begin
  if auth.uid() != p_user_id then raise exception 'Unauthorized'; end if;

  update entries
  set is_archived = false
  where user_id = p_user_id 
    and is_archived = true
    and (
      (p_entry_ids is not null and id = any(p_entry_ids))
      or
      (p_month is not null and date_trunc('month', date)::date = p_month)
    );

  get diagnostics v_restored_count = row_count;

  -- Remove from summary if whole month restored (Simplified: just clear summary for that month)
  if p_month is not null then
    delete from monthly_summary 
    where user_id = p_user_id and month = p_month;
  end if;

  return query select true, v_restored_count, 'Restored ' || v_restored_count || ' entries';
end;
$$;

-- function: get_archived_entries_by_month
create or replace function get_archived_entries_by_month(
  p_user_id uuid,
  p_month date
)
returns table (
  id uuid,
  amount numeric,
  category text,
  description text,
  date timestamptz,
  confidence numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() != p_user_id then raise exception 'Unauthorized'; end if;

  return query
  select 
    e.id, e.amount, e.category, e.description, e.date,
    coalesce((e.metadata->>'confidence')::numeric, 1.0) as confidence
  from entries e
  where e.user_id = p_user_id
    and e.is_archived = true
    and date_trunc('month', e.date)::date = p_month
  order by e.date asc;
end;
$$;

-- Savings Goals & User Feedback (Existing)
create table if not exists savings_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  emoji text,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  target_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  message text not null,
  rating int,
  context_page text,
  created_at timestamptz not null default now()
);

alter table savings_goals enable row level security;
alter table user_feedback enable row level security;

create policy "Users can manage their own savings_goals" on savings_goals for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Anyone can insert feedback" on user_feedback for insert with check ((select auth.uid()) = user_id);
create policy "Users can read their own feedback" on user_feedback for select using ((select auth.uid()) = user_id);

create or replace function purge_old_feedback()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from user_feedback
  where created_at < now() - interval '10 days';
end;
$$;

-- function: purge_user_data
-- Securely removes all user data across all tables before account deletion.
create or replace function purge_user_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  -- Delete from all user-related tables
  delete from entries where user_id = v_user_id;
  delete from monthly_summary where user_id = v_user_id;
  delete from audit_logs where user_id = v_user_id;
  delete from weekly_goals where user_id = v_user_id;
  delete from financial_profiles where user_id = v_user_id;
  delete from recurrent_spends where user_id = v_user_id;
  delete from category_budgets where user_id = v_user_id;
  delete from savings_goals where user_id = v_user_id;
  delete from user_feedback where user_id = v_user_id;
end;
$$;

-- function: apply_retention_policy
-- Prunes user data older than specified days.
create or replace function apply_retention_policy(days_to_keep integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_cutoff_date timestamptz;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  v_cutoff_date := now() - (days_to_keep * interval '1 day');

  -- Delete from entries
  delete from entries 
  where user_id = v_user_id 
    and date < v_cutoff_date;

  -- Delete from monthly_summary (keep full months if they are at or after cutoff month)
  delete from monthly_summary
  where user_id = v_user_id
    and month < date_trunc('month', v_cutoff_date);

  -- Delete from audit_logs
  delete from audit_logs
  where user_id = v_user_id
    and timestamp < v_cutoff_date;

  -- Delete from weekly_goals
  delete from weekly_goals
  where user_id = v_user_id
    and created_at < v_cutoff_date;

  -- Note: recurrent_spends, category_budgets, financial_profiles are stateful/active 
  -- and should not be pruned based on age as they represent current setup.
end;
$$;

-- Phase 6: Security Hardening

create table if not exists user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_pro boolean default false,
  created_at timestamp default now()
);

alter table user_profiles enable row level security;

create policy "Users can read own profile"
on user_profiles for select
using (auth.uid() = user_id);

-- Note: No INSERT or UPDATE policies for clients. Only the service_role key can modify this table.
