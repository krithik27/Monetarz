-- Monetarz: Performance Tuning Migration
-- Addresses suggestions from the Supabase Advisor regarding indexes.

-- 1. Add missing indexes on foreign keys (Performance Info Warnings)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_summary_user_id ON public.daily_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_log_user_id ON public.payments_log(user_id);
CREATE INDEX IF NOT EXISTS idx_recurrent_spends_user_id ON public.recurrent_spends(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON public.savings_goals(user_id);

-- 2. Remove unused indexes (Performance Info Suggestions)
DROP INDEX IF EXISTS public.idx_entries_user_archived;
DROP INDEX IF EXISTS public.idx_journal_entries_created_at;
