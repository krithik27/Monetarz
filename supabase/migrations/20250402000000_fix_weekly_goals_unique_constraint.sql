-- Add unique constraint on user_id for weekly_goals table to support upsert
-- This fixes the "no unique or exclusion constraint matching the ON CONFLICT specification" error

-- First, handle any existing duplicate rows (keep only the most recent per user)
WITH latest_goals AS (
    SELECT DISTINCT ON (user_id) id
    FROM weekly_goals
    ORDER BY user_id, created_at DESC
)
DELETE FROM weekly_goals
WHERE id NOT IN (SELECT id FROM latest_goals);

-- Add the unique constraint
ALTER TABLE weekly_goals
    ADD CONSTRAINT weekly_goals_user_id_unique UNIQUE (user_id);

-- Also ensure the table has the right structure
-- If weekly_goals table doesn't exist, create it
CREATE TABLE IF NOT EXISTS weekly_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT weekly_goals_user_id_unique UNIQUE (user_id)
);

-- Add RLS policies for weekly_goals (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'weekly_goals' AND policyname = 'Users can view own weekly goals'
    ) THEN
        CREATE POLICY "Users can view own weekly goals" ON weekly_goals
            FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'weekly_goals' AND policyname = 'Users can insert own weekly goals'
    ) THEN
        CREATE POLICY "Users can insert own weekly goals" ON weekly_goals
            FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'weekly_goals' AND policyname = 'Users can update own weekly goals'
    ) THEN
        CREATE POLICY "Users can update own weekly goals" ON weekly_goals
            FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'weekly_goals' AND policyname = 'Users can delete own weekly goals'
    ) THEN
        CREATE POLICY "Users can delete own weekly goals" ON weekly_goals
            FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
    END IF;
END $$;

-- Enable RLS on the table
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;
