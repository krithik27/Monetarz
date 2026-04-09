import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
);

/**
 * Fetch daily summaries with a strict inclusive time window.
 * Used to power bounded analytics charts.
 */
export async function fetchDailySummariesInRange(userId: string, start: Date, end: Date) {
    return await supabase
        .from('daily_summary')
        .select('*')
        .eq('user_id', userId)
        .gte('date', start.toISOString())
        .lte('date', end.toISOString()) // Inclusive for summaries usually
        .order('date', { ascending: false });
}
