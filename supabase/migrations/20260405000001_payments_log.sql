-- Create table for tracking successful payments (Idempotency)
CREATE TABLE IF NOT EXISTS public.payments_log (
    payment_id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL,
    amount INTEGER NOT NULL, -- in paise
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'captured',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.payments_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own payments
CREATE POLICY "Users can view their own payment logs"
    ON public.payments_log FOR SELECT
    USING (auth.uid() = user_id);

-- Add subscription metadata to user_profiles if missing
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS plan_type TEXT; -- 'monthly', 'quarterly', 'yearly'
