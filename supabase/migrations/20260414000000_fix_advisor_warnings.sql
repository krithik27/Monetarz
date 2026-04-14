-- Monetarz: Supabase Optimization & Security Hardening
-- Resolves Auth RLS Initialization Plan (Performance) and Anonymous Access (Security) warnings.

-- 1. UTILITY: Drop and recreate policies with best practices
-- Note: Using '(SELECT auth.uid())' instead of 'auth.uid()' for cached evaluation (performance).
-- Note: Specifying 'TO authenticated' to prevent anonymous access (security).

-- Table: entries
DROP POLICY IF EXISTS "entries_select_v2" ON public.entries;
CREATE POLICY "entries_select_v2" ON public.entries AS PERMISSIVE FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "entries_update_v2" ON public.entries;
CREATE POLICY "entries_update_v2" ON public.entries AS PERMISSIVE FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "entries_delete_v2" ON public.entries;
CREATE POLICY "entries_delete_v2" ON public.entries AS PERMISSIVE FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Table: weekly_goals
DROP POLICY IF EXISTS "weekly_goals_select_v2" ON public.weekly_goals;
CREATE POLICY "weekly_goals_select_v2" ON public.weekly_goals AS PERMISSIVE FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "weekly_goals_update_v2" ON public.weekly_goals;
CREATE POLICY "weekly_goals_update_v2" ON public.weekly_goals AS PERMISSIVE FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "weekly_goals_delete_v2" ON public.weekly_goals;
CREATE POLICY "weekly_goals_delete_v2" ON public.weekly_goals AS PERMISSIVE FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Table: user_profiles
DROP POLICY IF EXISTS "user_profiles_select_v2" ON public.user_profiles;
CREATE POLICY "user_profiles_select_v2" ON public.user_profiles AS PERMISSIVE FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- Table: daily_summary
DROP POLICY IF EXISTS "unified_access_policy" ON public.daily_summary;
CREATE POLICY "unified_access_policy" ON public.daily_summary AS PERMISSIVE FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- Table: user_feedback
DROP POLICY IF EXISTS "user_feedback_insert_v2" ON public.user_feedback;
CREATE POLICY "user_feedback_insert_v2" ON public.user_feedback AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "user_feedback_select_v2" ON public.user_feedback;
CREATE POLICY "user_feedback_select_v2" ON public.user_feedback AS PERMISSIVE FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Table: category_budgets
DROP POLICY IF EXISTS "Users can manage their own category_budgets" ON public.category_budgets;
CREATE POLICY "Users can manage their own category_budgets" ON public.category_budgets AS PERMISSIVE FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- Table: financial_profiles
DROP POLICY IF EXISTS "Users can manage their own financial_profiles" ON public.financial_profiles;
CREATE POLICY "Users can manage their own financial_profiles" ON public.financial_profiles AS PERMISSIVE FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- Table: recurrent_spends
DROP POLICY IF EXISTS "Users can manage their own recurrent_spends" ON public.recurrent_spends;
CREATE POLICY "Users can manage their own recurrent_spends" ON public.recurrent_spends AS PERMISSIVE FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- Table: savings_goals
DROP POLICY IF EXISTS "Users can manage their own savings_goals" ON public.savings_goals;
CREATE POLICY "Users can manage their own savings_goals" ON public.savings_goals AS PERMISSIVE FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- Table: ai_usage_logs
DROP POLICY IF EXISTS "Users can view their own AI usage" ON public.ai_usage_logs;
CREATE POLICY "Users can view their own AI usage" ON public.ai_usage_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert their own usage" ON public.ai_usage_logs;
CREATE POLICY "Users can insert their own usage" ON public.ai_usage_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

-- Table: audit_logs
DROP POLICY IF EXISTS "Users can enable read access for their own audit_logs" ON public.audit_logs;
CREATE POLICY "Users can enable read access for their own audit_logs" ON public.audit_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Table: journal_entries
DROP POLICY IF EXISTS "Users can view their own journal entries" ON public.journal_entries;
CREATE POLICY "Users can view their own journal entries" ON public.journal_entries AS PERMISSIVE FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Table: monthly_summary
DROP POLICY IF EXISTS "Users can read their own monthly summaries" ON public.monthly_summary;
CREATE POLICY "Users can read their own monthly summaries" ON public.monthly_summary AS PERMISSIVE FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Table: monthly_trends
DROP POLICY IF EXISTS "Users can enable read access for their own monthly_trends" ON public.monthly_trends;
CREATE POLICY "Users can enable read access for their own monthly_trends" ON public.monthly_trends AS PERMISSIVE FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Table: payments_log
DROP POLICY IF EXISTS "Users can view their own payment logs" ON public.payments_log;
CREATE POLICY "Users can view their own payment logs" ON public.payments_log AS PERMISSIVE FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Verify RLS is enabled on all targeted tables (Safe if already enabled)
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurrent_spends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_trends ENABLE ROW LEVEL SECURITY; -- Stale table or alias
ALTER TABLE public.payments_log ENABLE ROW LEVEL SECURITY;
