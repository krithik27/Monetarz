-- Monetarz: Supabase Hardened RLS (Corrected One-Shot Edition)
-- This script safely drops existing policies using PL/pgSQL and then recreates them with correct SQL syntax.

DO $$ 
DECLARE 
    target_tables TEXT[] := ARRAY[
        'entries', 'weekly_goals', 'ai_usage_logs', 'audit_logs', 
        'category_budgets', 'daily_summary', 'financial_profiles', 
        'journal_entries', 'monthly_summary', 'monthly_trends', 
        'payments_log', 'recurrent_spends', 'savings_goals', 
        'user_feedback', 'user_profiles'
    ];
    t TEXT;
    p RECORD;
BEGIN
    -- 1. CLEANUP PHASE: Remove every existing policy on targeted tables
    FOREACH t IN ARRAY target_tables LOOP
        -- Only check public schema
        FOR p IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t) LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
        END LOOP;
        
        -- Force-enable RLS on the table if it exists
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Table public.% does not exist, skipping enabling RLS.', t;
        END;
    END LOOP;
END $$;

-- 2. HARDENING & RESTORATION PHASE (Plain SQL to avoid DO block constraints)

-- Table: entries
CREATE POLICY "entries_select_policy_vFINAL" ON public.entries FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "entries_insert_policy_vFINAL" ON public.entries FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "entries_update_policy_vFINAL" ON public.entries FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "entries_delete_policy_vFINAL" ON public.entries FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Table: weekly_goals
CREATE POLICY "weekly_goals_all_policy_vFINAL" ON public.weekly_goals FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- Table: ai_usage_logs
CREATE POLICY "ai_usage_select_policy_vFINAL" ON public.ai_usage_logs FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "ai_usage_insert_policy_vFINAL" ON public.ai_usage_logs FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

-- Table: audit_logs
CREATE POLICY "audit_logs_select_policy_vFINAL" ON public.audit_logs FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Table: category_budgets
CREATE POLICY "category_budgets_all_policy_vFINAL" ON public.category_budgets FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- Table: daily_summary
CREATE POLICY "daily_summary_all_policy_vFINAL" ON public.daily_summary FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- Table: financial_profiles
CREATE POLICY "financial_profiles_all_policy_vFINAL" ON public.financial_profiles FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- Table: journal_entries (Restored to ALL to fix save/upsert issues)
CREATE POLICY "journal_entries_all_policy_vFINAL" ON public.journal_entries FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- Table: monthly_summary
CREATE POLICY "monthly_summary_select_policy_vFINAL" ON public.monthly_summary FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Table: monthly_trends
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'monthly_trends') THEN
        EXECUTE 'CREATE POLICY "monthly_trends_select_policy_vFINAL" ON public.monthly_trends FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id)';
    END IF;
END $$;

-- Table: payments_log
CREATE POLICY "payments_log_select_policy_vFINAL" ON public.payments_log FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Table: recurrent_spends
CREATE POLICY "recurrent_spends_all_policy_vFINAL" ON public.recurrent_spends FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- Table: savings_goals
CREATE POLICY "savings_goals_all_policy_vFINAL" ON public.savings_goals FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- Table: user_feedback
CREATE POLICY "user_feedback_insert_policy_vFINAL" ON public.user_feedback FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "user_feedback_select_policy_vFINAL" ON public.user_feedback FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Table: user_profiles
CREATE POLICY "user_profiles_select_policy_vFINAL" ON public.user_profiles FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "user_profiles_update_policy_vFINAL" ON public.user_profiles FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
