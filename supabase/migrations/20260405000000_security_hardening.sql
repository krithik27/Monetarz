-- Phase 1: Security Hardening Migration

-- 1. Create user_profiles table for secure is_pro tracking
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_pro boolean default false,
  created_at timestamp default now()
);

-- Enable RLS on user_profiles
alter table public.user_profiles enable row level security;

-- Policy: Users can read their own profile
create policy "Users can read own profile"
on public.user_profiles for select
using (auth.uid() = user_id);

-- Note: No INSERT or UPDATE policies for clients. Only the service_role key can modify this table.

-- 2. Add missing INSERT policy to ai_usage_logs
create policy "Users can insert their own usage"
on public.ai_usage_logs for insert
with check (auth.uid() = user_id);
