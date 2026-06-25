-- PostgreSQL Database Schema Export
-- Exported on 2026-06-25T14:14:55.051Z

-- 1. CUSTOM TYPES (ENUMS)

-- 2. TABLES
-- Table: ai_usage_logs
CREATE TABLE public."ai_usage_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "date" date DEFAULT CURRENT_DATE NOT NULL,
  "calls_count" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: audit_logs
CREATE TABLE public."audit_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text NOT NULL,
  "action" text NOT NULL,
  "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb
);

-- Table: category_budgets
CREATE TABLE public."category_budgets" (
  "user_id" uuid NOT NULL,
  "category" text NOT NULL,
  "amount" numeric NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: daily_summary
CREATE TABLE public."daily_summary" (
  "date" date NOT NULL,
  "user_id" uuid NOT NULL,
  "total_amount" numeric DEFAULT 0,
  "entry_count" integer DEFAULT 0,
  "category_breakdown" jsonb DEFAULT '{}'::jsonb,
  "updated_at" timestamp with time zone DEFAULT now()
);

-- Table: entries
CREATE TABLE public."entries" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "amount" numeric NOT NULL,
  "category" text NOT NULL,
  "description" text,
  "date" timestamp with time zone DEFAULT now() NOT NULL,
  "confidence" numeric DEFAULT 1.0,
  "created_at" timestamp with time zone DEFAULT now(),
  "is_archived" boolean DEFAULT false,
  "currency_code" text DEFAULT 'INR'::text NOT NULL,
  "source" text DEFAULT 'manual'::text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb
);

-- Table: financial_profiles
CREATE TABLE public."financial_profiles" (
  "user_id" uuid NOT NULL,
  "monthly_intention" numeric DEFAULT 0 NOT NULL,
  "monthly_income" numeric DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: journal_entries
CREATE TABLE public."journal_entries" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "prompt_id" text NOT NULL,
  "response" text NOT NULL,
  "category" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: monthly_summary
CREATE TABLE public."monthly_summary" (
  "user_id" uuid NOT NULL,
  "month" date NOT NULL,
  "category" text NOT NULL,
  "total_amount_minor" bigint DEFAULT 0 NOT NULL,
  "max_amount_minor" bigint DEFAULT 0 NOT NULL,
  "min_amount_minor" bigint DEFAULT 0 NOT NULL,
  "avg_amount_minor" bigint DEFAULT 0 NOT NULL,
  "entry_count" integer DEFAULT 0 NOT NULL,
  "currency_code" text DEFAULT 'INR'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: monthly_trends
CREATE TABLE public."monthly_trends" (
  "user_id" uuid NOT NULL,
  "month" date NOT NULL,
  "category" text NOT NULL,
  "average_amount_minor" bigint DEFAULT 0 NOT NULL,
  "currency_code" text DEFAULT 'INR'::text NOT NULL
);

-- Table: payments_log
CREATE TABLE public."payments_log" (
  "payment_id" text NOT NULL,
  "user_id" uuid,
  "order_id" text NOT NULL,
  "amount" integer NOT NULL,
  "currency" text DEFAULT 'INR'::text,
  "status" text DEFAULT 'captured'::text,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: recurrent_spends
CREATE TABLE public."recurrent_spends" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "amount" numeric NOT NULL,
  "category" text NOT NULL,
  "frequency" text DEFAULT 'monthly'::text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "billing_month" text
);

-- Table: savings_goals
CREATE TABLE public."savings_goals" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "emoji" text,
  "target_amount" numeric NOT NULL,
  "current_amount" numeric DEFAULT 0 NOT NULL,
  "target_date" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: user_feedback
CREATE TABLE public."user_feedback" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "message" text NOT NULL,
  "rating" integer,
  "context_page" text,
  "admin_reaction" text,
  "created_at" timestamp with time zone DEFAULT now()
);

-- Table: user_profiles
CREATE TABLE public."user_profiles" (
  "user_id" uuid NOT NULL,
  "tier" text DEFAULT 'free'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "is_pro" boolean DEFAULT false,
  "subscription_id" text,
  "plan_type" text
);

-- Table: weekly_goals
CREATE TABLE public."weekly_goals" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "amount" numeric NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

-- 3. TABLE CONSTRAINTS
ALTER TABLE ONLY public."ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY public."ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_date_key" UNIQUE ("date", "user_id");
ALTER TABLE ONLY public."audit_logs" ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY public."category_budgets" ADD CONSTRAINT "category_budgets_pkey" PRIMARY KEY ("category", "user_id");
ALTER TABLE ONLY public."daily_summary" ADD CONSTRAINT "daily_summary_pkey" PRIMARY KEY ("user_id", "date");
ALTER TABLE ONLY public."entries" ADD CONSTRAINT "entries_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY public."financial_profiles" ADD CONSTRAINT "financial_profiles_pkey" PRIMARY KEY ("user_id");
ALTER TABLE ONLY public."journal_entries" ADD CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY public."monthly_summary" ADD CONSTRAINT "monthly_summary_pkey" PRIMARY KEY ("category", "month", "currency_code", "user_id");
ALTER TABLE ONLY public."monthly_trends" ADD CONSTRAINT "monthly_trends_pkey" PRIMARY KEY ("month", "user_id", "category");
ALTER TABLE ONLY public."payments_log" ADD CONSTRAINT "payments_log_pkey" PRIMARY KEY ("payment_id");
ALTER TABLE ONLY public."recurrent_spends" ADD CONSTRAINT "recurrent_spends_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY public."savings_goals" ADD CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY public."user_feedback" ADD CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY public."user_profiles" ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id");
ALTER TABLE ONLY public."weekly_goals" ADD CONSTRAINT "weekly_goals_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY public."weekly_goals" ADD CONSTRAINT "weekly_goals_user_id_unique" UNIQUE ("user_id");
ALTER TABLE ONLY public."entries" ADD CONSTRAINT "entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users("id");
ALTER TABLE ONLY public."daily_summary" ADD CONSTRAINT "daily_summary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users("id");
ALTER TABLE ONLY public."weekly_goals" ADD CONSTRAINT "weekly_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users("id");
ALTER TABLE ONLY public."monthly_trends" ADD CONSTRAINT "monthly_trends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users("id");
ALTER TABLE ONLY public."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users("id");
ALTER TABLE ONLY public."monthly_summary" ADD CONSTRAINT "monthly_summary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users("id");
ALTER TABLE ONLY public."user_profiles" ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users("id");
ALTER TABLE ONLY public."financial_profiles" ADD CONSTRAINT "financial_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users("id");
ALTER TABLE ONLY public."recurrent_spends" ADD CONSTRAINT "recurrent_spends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users("id");
ALTER TABLE ONLY public."category_budgets" ADD CONSTRAINT "category_budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users("id");
ALTER TABLE ONLY public."savings_goals" ADD CONSTRAINT "savings_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users("id");
ALTER TABLE ONLY public."journal_entries" ADD CONSTRAINT "journal_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users("id");
ALTER TABLE ONLY public."ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users("id");
ALTER TABLE ONLY public."user_feedback" ADD CONSTRAINT "user_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users("id");
ALTER TABLE ONLY public."payments_log" ADD CONSTRAINT "payments_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users("id");

-- 4. FUNCTIONS & PROCEDURES
-- Function: get_weekly_aggregate
CREATE OR REPLACE FUNCTION public.get_weekly_aggregate(p_user_id uuid, week_start timestamp with time zone)
 RETURNS TABLE(total_amount_minor bigint, transaction_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

-- Function: get_monthly_aggregate
CREATE OR REPLACE FUNCTION public.get_monthly_aggregate(p_user_id uuid, p_month date)
 RETURNS TABLE(category text, total_amount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

-- Function: purge_old_feedback
CREATE OR REPLACE FUNCTION public.purge_old_feedback()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  DELETE FROM user_feedback
  WHERE created_at < NOW() - INTERVAL '10 days';
END;
$function$
;

-- Function: check_archive_threshold
CREATE OR REPLACE FUNCTION public.check_archive_threshold(p_user_id uuid, p_threshold_days integer)
 RETURNS TABLE(should_archive boolean, old_entries_count bigint, oldest_date timestamp with time zone, threshold_date timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

-- Function: handle_new_user_profile
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.user_profiles (user_id, is_pro)
  VALUES (new.id, false)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$function$
;

-- Function: migrate_guest_to_user
CREATE OR REPLACE FUNCTION public.migrate_guest_to_user(target_temp_id text, target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- 1. Migrate Entries
    UPDATE entries 
    SET user_id = target_user_id, temp_user_id = NULL
    WHERE temp_user_id = target_temp_id AND user_id IS NULL;

    -- 2. Migrate Weekly Goals
    UPDATE weekly_goals
    SET user_id = target_user_id, temp_user_id = NULL
    WHERE temp_user_id = target_temp_id AND user_id IS NULL;

    -- 3. Cleanup old guest summaries
    DELETE FROM daily_summary 
    WHERE temp_user_id = target_temp_id AND user_id IS NULL;
END;
$function$
;

-- Function: sync_daily_summary_legacy
CREATE OR REPLACE FUNCTION public.sync_daily_summary_legacy()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_date date;
  v_temp_id text;
  v_amount numeric;
  v_category text;
  v_delta integer;
BEGIN
  -- Simple extraction, ignoring UUIDs
  IF (TG_OP = 'DELETE') THEN
    v_date := OLD.date::date;
    v_temp_id := OLD.temp_user_id;
    v_amount := -OLD.amount;
    v_category := OLD.category;
    v_delta := -1;
  ELSE
    v_date := NEW.date::date;
    v_temp_id := NEW.temp_user_id;
    v_amount := NEW.amount;
    v_category := NEW.category;
    v_delta := 1;
    IF (TG_OP = 'UPDATE') THEN
       v_amount := NEW.amount - OLD.amount; 
       v_delta := 0; 
    END IF;
  END IF;

  -- Simple Upsert using temp_user_id
  INSERT INTO daily_summary (date, temp_user_id, total_amount, entry_count, category_breakdown)
  VALUES (
    v_date, 
    v_temp_id, 
    v_amount, 
    v_delta, 
    jsonb_build_object(v_category, v_amount)
  )
  ON CONFLICT (date, temp_user_id) DO UPDATE
  SET 
    total_amount = daily_summary.total_amount + EXCLUDED.total_amount,
    entry_count = daily_summary.entry_count + EXCLUDED.entry_count,
    category_breakdown = daily_summary.category_breakdown || jsonb_build_object(v_category, COALESCE((daily_summary.category_breakdown->>v_category)::numeric, 0) + v_amount),
    updated_at = now();
    
  RETURN NULL;
END;
$function$
;

-- Function: apply_retention_policy
CREATE OR REPLACE FUNCTION public.apply_retention_policy(days_to_keep integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_cutoff_date timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Unauthorized'; end if;
  v_cutoff_date := now() - (days_to_keep * interval '1 day');

  delete from entries where user_id = v_user_id and date < v_cutoff_date;
  delete from monthly_summary where user_id = v_user_id and month < date_trunc('month', v_cutoff_date);
  delete from audit_logs where user_id = v_user_id and timestamp < v_cutoff_date;
  delete from weekly_goals where user_id = v_user_id and created_at < v_cutoff_date;
end;
$function$
;

-- Function: execute_archive_migration
CREATE OR REPLACE FUNCTION public.execute_archive_migration(p_user_id uuid, p_threshold_days integer)
 RETURNS TABLE(success boolean, archived_count bigint, summaries_created bigint, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

-- Function: get_archive_summary_by_month
CREATE OR REPLACE FUNCTION public.get_archive_summary_by_month(p_user_id uuid, p_start_month date DEFAULT NULL::date, p_end_month date DEFAULT NULL::date)
 RETURNS TABLE(month date, category text, entry_count bigint, total_amount_minor bigint, max_amount_minor bigint, min_amount_minor bigint, avg_amount_minor bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

-- Function: restore_archived_entries
CREATE OR REPLACE FUNCTION public.restore_archived_entries(p_user_id uuid, p_entry_ids uuid[] DEFAULT NULL::uuid[], p_month date DEFAULT NULL::date)
 RETURNS TABLE(success boolean, restored_count bigint, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

-- Function: get_archived_entries_by_month
CREATE OR REPLACE FUNCTION public.get_archived_entries_by_month(p_user_id uuid, p_month date)
 RETURNS TABLE(id uuid, amount numeric, category text, description text, date timestamp with time zone, confidence numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

-- Function: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, tier)
  VALUES (new.id, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$function$
;

-- Function: purge_user_data
CREATE OR REPLACE FUNCTION public.purge_user_data()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  -- Delete from all user-related tables identified in your schema
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
$function$
;

-- Function: increment_ai_usage
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id uuid, p_max_calls integer DEFAULT 5)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_current_calls integer;
BEGIN
    IF auth.uid() != p_user_id THEN RETURN false; END IF;

    INSERT INTO public.ai_usage_logs (user_id, date, calls_count)
    VALUES (p_user_id, current_date, 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
        calls_count = public.ai_usage_logs.calls_count + 1,
        updated_at = now()
    RETURNING calls_count INTO v_current_calls;

    -- Forced limit of 15 to prevent client-side bypass of p_max_calls
    IF v_current_calls <= 15 THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$function$
;

-- Function: get_daily_insight
CREATE OR REPLACE FUNCTION public.get_daily_insight(p_user_id uuid)
 RETURNS TABLE(today_total numeric, usual_average numeric, delta numeric, unique_days integer, day_of_week text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_today date := current_date;
  v_day_of_week int := extract(dow from v_today);
begin
  return query
  with today_spends as (
    select coalesce(sum(amount), 0) as total
    from entries
    where user_id = p_user_id
      and is_archived = false
      and date::date = v_today
  ),
  same_day_history as (
    select
      date::date as spend_date,
      sum(amount) as daily_total
    from entries
    where user_id = p_user_id
      and is_archived = false
      and date::date < v_today
      and extract(dow from date) = v_day_of_week
      and date >= (v_today - interval '28 days')
    group by date::date
  )
  select
    t.total as today_total,
    coalesce(avg(h.daily_total), 0) as usual_average,
    case
      when coalesce(avg(h.daily_total), 0) = 0 and t.total = 0 then 0
      when coalesce(avg(h.daily_total), 0) = 0 then 1.0
      else (t.total - avg(h.daily_total)) / avg(h.daily_total)
    end as delta,
    (select count(*)::int from same_day_history) as unique_days,
    to_char(v_today, 'Day') as day_of_week
  from today_spends t
  cross join lateral (
    select daily_total from same_day_history
    union all
    select 0 where not exists (select 1 from same_day_history)
  ) h
  group by t.total;
end;
$function$
;

-- Function: auto_archive_eligible_users
CREATE OR REPLACE FUNCTION public.auto_archive_eligible_users()
 RETURNS TABLE(user_id uuid, archived_count bigint, summaries_created integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user RECORD;
  v_result RECORD;
  v_threshold_days INTEGER := 90; -- Pro users get 90-day threshold
BEGIN
  -- Loop through all Pro users
  FOR v_user IN 
    SELECT id 
    FROM user_profiles 
    WHERE tier = 'pro'
  LOOP
    -- Check if user has eligible entries
    DECLARE
      v_eligible_count BIGINT;
    BEGIN
      SELECT COUNT(*) INTO v_eligible_count
      FROM entries
      WHERE entries.user_id = v_user.id
        AND entries.date < (NOW() - (v_threshold_days || ' days')::INTERVAL)
        AND entries.is_archived = false;
      
      -- If user has eligible entries, execute archive
      IF v_eligible_count > 0 THEN
        SELECT * INTO v_result
        FROM execute_archive_migration(v_user.id, v_threshold_days);
        
        IF v_result.success THEN
          RETURN QUERY SELECT
            v_user.id AS user_id,
            v_result.archived_count,
            v_result.summaries_created;
        END IF;
      END IF;
    END;
  END LOOP;
  
  RETURN;
END;
$function$
;

-- Function: check_guest_data
CREATE OR REPLACE FUNCTION public.check_guest_data(target_temp_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    found_count integer;
BEGIN
    SELECT count(*) INTO found_count
    FROM entries
    WHERE temp_user_id = target_temp_id
    AND user_id IS NULL; -- Only count un-migrated data

    RETURN found_count > 0;
END;
$function$
;

-- Function: get_category_deviations
CREATE OR REPLACE FUNCTION public.get_category_deviations(p_user_id uuid)
 RETURNS TABLE(category text, current_total numeric, baseline_avg numeric, delta numeric, trend text, tier text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_today date := current_date;
  v_week_start date := date_trunc('week', v_today)::date;
  v_baseline_start date := v_week_start - interval '28 days';
begin
  return query
  with current_week as (
    select
      e.category,
      coalesce(sum(e.amount), 0) as total
    from entries e
    where e.user_id = p_user_id
      and e.is_archived = false
      and e.date::date >= v_week_start
      and e.date::date <= v_today
    group by e.category
  ),
  baseline as (
    select
      e.category,
      coalesce(sum(e.amount), 0) / 4.0 as avg_total
    from entries e
    where e.user_id = p_user_id
      and e.is_archived = false
      and e.date::date >= v_baseline_start
      and e.date::date < v_week_start
    group by e.category
  )
  select
    coalesce(c.category, b.category) as category,
    coalesce(c.total, 0) as current_total,
    coalesce(b.avg_total, 0) as baseline_avg,
    case
      when coalesce(b.avg_total, 0) = 0 and coalesce(c.total, 0) > 0 then 1.0
      when coalesce(b.avg_total, 0) = 0 then 0
      else (coalesce(c.total, 0) - b.avg_total) / b.avg_total
    end as delta,
    case
      when coalesce(b.avg_total, 0) = 0 then 'Steady'
      when (coalesce(c.total, 0) - b.avg_total) / b.avg_total > 0.10 then 'Rising'
      when (coalesce(c.total, 0) - b.avg_total) / b.avg_total < -0.10 then 'Falling'
      else 'Steady'
    end as trend,
    case
      when coalesce(b.avg_total, 0) = 0 then 'Stable'
      when abs((coalesce(c.total, 0) - b.avg_total) / b.avg_total) >= 0.20 then 'Strong'
      when abs((coalesce(c.total, 0) - b.avg_total) / b.avg_total) >= 0.10 then 'Moderate'
      else 'Stable'
    end as tier
  from current_week c
  full outer join baseline b on c.category = b.category;
end;
$function$
;

-- Function: get_analytics_snapshot
CREATE OR REPLACE FUNCTION public.get_analytics_snapshot(p_user_id uuid, start_date timestamp with time zone, end_date timestamp with time zone)
 RETURNS TABLE(total_spend_minor bigint, top_category text, active_days integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
  with stats as (
    select
      amount_minor,
      category,
      date_trunc('day', timestamp) as day_bucket
    from transactions
    where
      user_id = p_user_id
      and timestamp >= start_date
      and timestamp <= end_date
  )
  select
    coalesce(sum(amount_minor), 0) as total_spend_minor,
    (select category from stats group by category order by sum(amount_minor) desc limit 1) as top_category,
    count(distinct day_bucket)::int as active_days
  from stats;
end;
$function$
;

-- Function: set_user_id
CREATE OR REPLACE FUNCTION public.set_user_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.user_id IS NULL THEN
        NEW.user_id := (SELECT auth.uid());
    END IF;
    RETURN NEW;
END;
$function$
;

-- Function: recompute_daily_summary
CREATE OR REPLACE FUNCTION public.recompute_daily_summary()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    t_date date;
    t_user_id uuid;
BEGIN
    -- 1. Identify Target Scope
    IF (TG_OP = 'DELETE') THEN
        t_date := OLD.date::date;
        t_user_id := OLD.user_id;
    ELSE
        t_date := NEW.date::date;
        t_user_id := NEW.user_id;
    END IF;

    IF t_user_id IS NULL THEN RETURN NULL; END IF;

    -- 2. Compute & Upsert
    -- BUG FIX: Previous version tried to SUM(amount) from 'sub' alias which didn't have 'amount'.
    -- We now correctly SUM(cat_total) and SUM(cat_count).
    INSERT INTO daily_summary (date, user_id, total_amount, entry_count, category_breakdown, updated_at)
    SELECT 
        t_date, t_user_id,
        COALESCE(SUM(cat_total), 0),
        COALESCE(SUM(cat_count), 0),
        COALESCE(jsonb_object_agg(category, cat_total) FILTER (WHERE category IS NOT NULL), '{}'::jsonb),
        NOW()
    FROM (
        SELECT 
            category, 
            SUM(amount) as cat_total, 
            COUNT(*) as cat_count
        FROM entries
        WHERE date::date = t_date AND user_id = t_user_id
        GROUP BY category
    ) sub
    ON CONFLICT (date, user_id) 
    DO UPDATE SET
        total_amount = EXCLUDED.total_amount,
        entry_count = EXCLUDED.entry_count,
        category_breakdown = EXCLUDED.category_breakdown,
        updated_at = NOW();

    RETURN NULL;
END;
$function$
;

-- Function: generate_user_id_if_null
CREATE OR REPLACE FUNCTION public.generate_user_id_if_null()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF NEW.user_id IS NULL AND NEW.temp_user_id IS NOT NULL THEN
    NEW.user_id := uuid_generate_v5(uuid_ns_url(), NEW.temp_user_id);
  END IF;
  RETURN NEW;
END;
$function$
;

-- Function: get_dev_uuid
CREATE OR REPLACE FUNCTION public.get_dev_uuid()
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'extensions'
AS $function$
    SELECT '00000000-0000-0000-0000-000000000123'::uuid;
$function$
;

-- Function: get_weekly_stats
CREATE OR REPLACE FUNCTION public.get_weekly_stats(target_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    pivot_date date := CURRENT_DATE;
    curr_start date;
    curr_end date;
    prev_start date;
    prev_end date;
    
    curr_total numeric;
    prev_total numeric;
    momentum integer;
    avg_activity numeric;
    cat_focus jsonb;
    total_lifetime numeric;
BEGIN
    -- 1. Calculate Ranges (Standard Monday-Sunday)
    curr_start := date_trunc('week', pivot_date)::date;
    curr_end := curr_start + 6;
    prev_start := curr_start - 7;
    prev_end := prev_start + 6;

    -- 2. Weekly Totals
    SELECT COALESCE(SUM(total_amount), 0) INTO curr_total 
    FROM daily_summary 
    WHERE user_id = target_user_id AND date BETWEEN curr_start AND curr_end;

    SELECT COALESCE(SUM(total_amount), 0) INTO prev_total 
    FROM daily_summary 
    WHERE user_id = target_user_id AND date BETWEEN prev_start AND prev_end;

    -- 3. Momentum
    IF prev_total = 0 THEN
        momentum := CASE WHEN curr_total > 0 THEN NULL ELSE 0 END;
    ELSE
        momentum := round(((curr_total - prev_total) / prev_total) * 100);
    END IF;

    -- 4. Category Focus (Top 3 for current week)
    -- Using CROSS JOIN LATERAL for maximum compatibility and robustness
    SELECT jsonb_agg(item) INTO cat_focus
    FROM (
        SELECT stats.key as category, SUM(stats.value::numeric) as amount
        FROM daily_summary ds
        CROSS JOIN LATERAL jsonb_each_text(COALESCE(ds.category_breakdown, '{}'::jsonb)) AS stats
        WHERE ds.user_id = target_user_id AND ds.date BETWEEN curr_start AND curr_end
        GROUP BY stats.key
        ORDER BY amount DESC
        LIMIT 3
    ) item;

    -- 5. Activity Average (Daily average spend on active days)
    SELECT COALESCE(round(curr_total / NULLIF(COUNT(*), 0)), 0) INTO avg_activity
    FROM daily_summary
    WHERE user_id = target_user_id AND date BETWEEN curr_start AND curr_end AND entry_count > 0;

    -- 6. Total Lifetime
    SELECT COALESCE(SUM(total_amount), 0) INTO total_lifetime
    FROM daily_summary
    WHERE user_id = target_user_id;

    -- Return Unified Object
    RETURN jsonb_build_object(
        'weeklyTotal', COALESCE(curr_total, 0),
        'previousWeeklyTotal', COALESCE(prev_total, 0),
        'wowMomentum', COALESCE(momentum::text, 'New'),
        'categoryFocus', COALESCE(cat_focus, '[]'::jsonb),
        'activityAverage', COALESCE(avg_activity, 0),
        'totalAmount', COALESCE(total_lifetime, 0)
    );
END;
$function$
;

-- Function: get_weekly_stats
CREATE OR REPLACE FUNCTION public.get_weekly_stats(p_user_id uuid, p_start_date date, p_end_date date)
 RETURNS TABLE(total_amount numeric, entry_count bigint, category_breakdown jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ds.total_amount), 0),
    COALESCE(SUM(ds.entry_count), 0),
    COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
  FROM 
    daily_summary ds,
    jsonb_each_text(ds.category_breakdown)
  WHERE 
    ds.user_id = p_user_id
    AND ds.date >= p_start_date
    AND ds.date <= p_end_date;
END;
$function$
;

-- 5. TRIGGERS
-- Trigger: trigger_set_user_id
CREATE TRIGGER trigger_set_user_id BEFORE INSERT ON public.entries FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- Trigger: trigger_set_user_id
CREATE TRIGGER trigger_set_user_id BEFORE INSERT ON public.weekly_goals FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- Trigger: trigger_update_daily_summary
CREATE TRIGGER trigger_update_daily_summary AFTER INSERT OR DELETE OR UPDATE ON public.entries FOR EACH ROW EXECUTE FUNCTION recompute_daily_summary();

-- 6. ROW LEVEL SECURITY POLICIES
ALTER TABLE public."payments_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ai_usage_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."user_feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."recurrent_spends" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."category_budgets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."financial_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."weekly_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."daily_summary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."savings_goals" ENABLE ROW LEVEL SECURITY;

-- Policy: payments_log_select_policy_vFINAL on payments_log
CREATE POLICY "payments_log_select_policy_vFINAL" ON public."payments_log" FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

-- Policy: ai_usage_insert_policy_vFINAL on ai_usage_logs
CREATE POLICY "ai_usage_insert_policy_vFINAL" ON public."ai_usage_logs" FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

-- Policy: ai_usage_select_policy_vFINAL on ai_usage_logs
CREATE POLICY "ai_usage_select_policy_vFINAL" ON public."ai_usage_logs" FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

-- Policy: user_feedback_insert_policy_vFINAL on user_feedback
CREATE POLICY "user_feedback_insert_policy_vFINAL" ON public."user_feedback" FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

-- Policy: user_feedback_select_policy_vFINAL on user_feedback
CREATE POLICY "user_feedback_select_policy_vFINAL" ON public."user_feedback" FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

-- Policy: audit_logs_select_policy_vFINAL on audit_logs
CREATE POLICY "audit_logs_select_policy_vFINAL" ON public."audit_logs" FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

-- Policy: user_profiles_select_policy_vFINAL on user_profiles
CREATE POLICY "user_profiles_select_policy_vFINAL" ON public."user_profiles" FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

-- Policy: user_profiles_update_policy_vFINAL on user_profiles
CREATE POLICY "user_profiles_update_policy_vFINAL" ON public."user_profiles" FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

-- Policy: recurrent_spends_all_policy_vFINAL on recurrent_spends
CREATE POLICY "recurrent_spends_all_policy_vFINAL" ON public."recurrent_spends" FOR ALL TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

-- Policy: category_budgets_all_policy_vFINAL on category_budgets
CREATE POLICY "category_budgets_all_policy_vFINAL" ON public."category_budgets" FOR ALL TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

-- Policy: financial_profiles_all_policy_vFINAL on financial_profiles
CREATE POLICY "financial_profiles_all_policy_vFINAL" ON public."financial_profiles" FOR ALL TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

-- Policy: entries_delete_policy_vFINAL on entries
CREATE POLICY "entries_delete_policy_vFINAL" ON public."entries" FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

-- Policy: entries_insert_policy_vFINAL on entries
CREATE POLICY "entries_insert_policy_vFINAL" ON public."entries" FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

-- Policy: entries_select_policy_vFINAL on entries
CREATE POLICY "entries_select_policy_vFINAL" ON public."entries" FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

-- Policy: entries_update_policy_vFINAL on entries
CREATE POLICY "entries_update_policy_vFINAL" ON public."entries" FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

-- Policy: weekly_goals_all_policy_vFINAL on weekly_goals
CREATE POLICY "weekly_goals_all_policy_vFINAL" ON public."weekly_goals" FOR ALL TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

-- Policy: daily_summary_all_policy_vFINAL on daily_summary
CREATE POLICY "daily_summary_all_policy_vFINAL" ON public."daily_summary" FOR ALL TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

-- Policy: savings_goals_all_policy_vFINAL on savings_goals
CREATE POLICY "savings_goals_all_policy_vFINAL" ON public."savings_goals" FOR ALL TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

-- 7. VIEWS
