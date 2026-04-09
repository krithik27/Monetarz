/**
 * useWeeklyAggregation
 * 
 * CRITICAL FIX: Bypasses pagination to fetch complete weekly data.
 * This hook fetches ONLY the current week's entries directly from Supabase,
 * ensuring accurate aggregation regardless of user's total transaction count.
 */

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSpends } from "@/context/SpendsContext";
import { supabase } from "@/lib/supabase/client";
import { ParsedSpend, SpendCategory } from "@/lib/parser";
import { Money, MoneyEngine } from "@/lib/money";
import { TemporalEngine } from "@/lib/temporal";
import { deriveWeeklyStats, WeeklyStats } from "@/lib/aggregation";

export function useWeeklyAggregation(currentDate: Date, weeklyGoal: number) {
    const { user } = useAuth();
    const { dataVersion, spends: contextSpends } = useSpends();
    const [dbWeeklySpends, setDbWeeklySpends] = useState<ParsedSpend[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const DEV_USER_ID = '00000000-0000-0000-0000-000000000123';
        const isDevUser = user?.id === DEV_USER_ID;
        const IS_PROXY_MODE = process.env.NODE_ENV === 'development' && isDevUser;

        async function fetchWeeklyData() {
            if (!IS_PROXY_MODE && !user) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const range = TemporalEngine.getThisWeekRange(currentDate);

                let rawData = [];

                if (IS_PROXY_MODE) {
                    // DEV PROXY: Fetch via API to bypass RLS
                    const res = await fetch('/api/persistence');
                    if (!res.ok) throw new Error("Proxy fetch failed");
                    const data = await res.json();

                    // Filter for the current week specifically (unlike SpendsContext which takes all)
                    rawData = (data.spends || []).filter((s: any) => {
                        const d = new Date(s.date);
                        return d >= range.start && d <= range.end;
                    });
                } else {
                    // LIVE MODE: Direct Supabase Fetch
                    const { data, error: fetchError } = await supabase
                        .from('entries')
                        .select('*')
                        .eq('user_id', user!.id)
                        .eq('is_archived', false)
                        .gte('date', range.start.toISOString())
                        .lte('date', range.end.toISOString())
                        .order('date', { ascending: false });

                    if (fetchError) throw fetchError;
                    rawData = data || [];
                }

                const hydratedSpends: ParsedSpend[] = rawData.map((s: any) => ({
                    ...s,
                    date: new Date(s.date),
                    amount: Number(s.amount),
                    money: MoneyEngine.fromMajor(Number(s.amount)),
                    confidence: Number(s.confidence)
                }));

                setDbWeeklySpends(hydratedSpends);
                setError(null);
            } catch (err: any) {
                console.error("Weekly aggregation failed:", err);
                setError(err.message || "Failed to load weekly data");
            } finally {
                setIsLoading(false);
            }
        }

        fetchWeeklyData();
    }, [user?.id, currentDate, dataVersion]);

    const weeklySpends = useMemo(() => {
        const range = TemporalEngine.getThisWeekRange(currentDate);
        const contextSpendsForWeek = contextSpends.filter(s => s.date >= range.start && s.date <= range.end);
        
        const mergedMap = new Map<string, ParsedSpend>();
        dbWeeklySpends.forEach(s => mergedMap.set(s.id, s));
        contextSpendsForWeek.forEach(s => mergedMap.set(s.id, s));
        
        return Array.from(mergedMap.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [dbWeeklySpends, contextSpends, currentDate]);

    const stats = useMemo(() => {
        if (isLoading) {
            return {
                total: 0,
                money: MoneyEngine.fromMinor(0),
                spends: [],
                breakdown: {} as Record<SpendCategory, Money>, // Cast to satisfy component requirements
                progress: 0,
                goal: weeklyGoal,
                completeness: "full" as const,
                predictedTotal: 0,
                comparisonPhrase: ""
            } as WeeklyStats;
        }
        return deriveWeeklyStats(weeklySpends, weeklyGoal, { isFullSet: true, today: currentDate });
    }, [weeklySpends, weeklyGoal, currentDate, isLoading]);

    return { stats, isLoading, error };
}
