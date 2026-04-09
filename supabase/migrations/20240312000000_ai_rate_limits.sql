-- Create table for tracking AI usage
create table if not exists public.ai_usage_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    date date not null default current_date,
    calls_count integer not null default 1,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, date)
);

-- Turn on RLS
alter table public.ai_usage_logs enable row level security;

-- Policy: Users can only see their own usage
create policy "Users can view their own AI usage"
    on public.ai_usage_logs for select
    using (auth.uid() = user_id);

-- Function to increment AI usage and check limit
-- Returns TRUE if allowed (under limit), FALSE if blocked
create or replace function public.increment_ai_usage(p_user_id uuid, p_max_calls integer default 5)
returns boolean
language plpgsql
security definer
as $$
declare
    v_current_calls integer;
begin
    -- Check if user is trying to act as themselves
    if auth.uid() != p_user_id then
        return false;
    end if;

    -- Upsert the daily record
    insert into public.ai_usage_logs (user_id, date, calls_count)
    values (p_user_id, current_date, 1)
    on conflict (user_id, date)
    do update set 
        calls_count = public.ai_usage_logs.calls_count + 1,
        updated_at = now()
    returning calls_count into v_current_calls;

    -- Hardcoded safety limit (e.g. 15) to prevent client-side bypass of the p_max_calls parameter.
    if v_current_calls <= 15 then
        return true;
    else
        return false;
    end if;
end;
$$;
