-- Monetarz Supabase Migration v2
-- This script synchronizes the database with the pre-production service layer.

-- 1. Table Synchronization
-- Rename monthly_trends to monthly_summary for codebase consistency
DO $$ 
BEGIN
    -- Only rename if the source exists and the target does not
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'monthly_trends') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'monthly_summary') THEN
        ALTER TABLE monthly_trends RENAME TO monthly_summary;
    END IF;
END $$;

-- 2. Update monthly_summary structure
-- Ensure all aggregation fields exist
ALTER TABLE monthly_summary 
ADD COLUMN IF NOT EXISTS entry_count bigint NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount_minor bigint NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_amount_minor bigint NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_amount_minor bigint NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_amount_minor bigint NOT NULL DEFAULT 0;

-- 3. Security Hardening & RPC Implementation
-- Note: Dropping functions first because return types may have changed
DROP FUNCTION IF EXISTS get_weekly_aggregate(uuid, timestamptz);
DROP FUNCTION IF EXISTS get_monthly_aggregate(uuid, date);

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
    avg((amount * 100)::bigint)
  from entries
  where user_id = p_user_id 
    and is_archived = false 
    and date < v_threshold_date
  group by user_id, month, category
  on conflict (user_id, month, category) do update set
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

  -- Remove from summary if whole month restored
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
