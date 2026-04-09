"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from "react";
import { useCurrency } from "./CurrencyContext";
import { UserMemory, processMemories } from "@/lib/memory";
import { WeeklyReflection, generateReflection } from "@/lib/reflection";
import { TemporalEngine } from "@/lib/temporal";
import { supabase, fetchDailySummariesInRange } from "@/lib/supabase/client";
import { DailySummary, convertSpendsToSummaries } from "@/lib/metrics";
export type { DailySummary };
import { useAuth } from "./AuthContext";
import { MoneyEngine } from "@/lib/money";
import { ParsedSpend } from "@/lib/parser";

type AnalyticsContextType = {
    dailySummaries: DailySummary[];
    weeklyMetrics: any | null;
    memories: UserMemory[];
    reflections: WeeklyReflection[];
    isLoading: boolean;
    error: string | null;
    refreshAnalytics: () => Promise<void>;
};

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { activeCurrency } = useCurrency();
    const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
    const [weeklyMetrics, setWeeklyMetrics] = useState<any | null>({
        weeklyTotal: 0,
        previousWeeklyTotal: 0,
        wowMomentum: 0,
        categoryFocus: [],
        activityAverage: 0,
        totalAmount: 0
    });
    const [memories, setMemories] = useState<UserMemory[]>([]);
    const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // TRUST FIX: Load reflections asynchronously without blocking metrics
    const loadReflectionsAsync = async (userId: string, weeklyGoal: number) => {
        const DEV_USER_ID = '00000000-0000-0000-0000-000000000123';
        const isDevUser = userId === DEV_USER_ID;
        const IS_PROXY_MODE = process.env.NODE_ENV === 'development' && isDevUser;

        try {
            if (IS_PROXY_MODE) {
                // In Dev Proxy, reflections are loaded via loadAnalytics main flow
                return;
            }

            const reflectionStart = new Date();
            reflectionStart.setDate(reflectionStart.getDate() - 30);

            const { data: recentSpendsData, error: spendsError } = await supabase
                .from('entries')
                .select('*')
                .eq('user_id', userId)
                .eq('is_archived', false)
                .gte('date', reflectionStart.toISOString())
                .order('date', { ascending: false });

            if (!spendsError && recentSpendsData) {
                const recentSpends: any[] = recentSpendsData.map((s: any) => ({
                    ...s,
                    date: new Date(s.date),
                    amount: Number(s.amount),
                    money: MoneyEngine.fromMajor(Number(s.amount)),
                    confidence: Number(s.confidence)
                }));

                const newMemories = processMemories(recentSpends, weeklyGoal, []);
                setMemories(newMemories);

                const newReflection = generateReflection(newMemories, recentSpends, reflections);
                if (newReflection) {
                    setReflections(prev => {
                        if (prev.some(r => r.weekId === newReflection.weekId)) return prev;
                        return [newReflection, ...prev];
                    });
                }
            }
        } catch (err) {
            console.error("Reflection loading failed (non-blocking):", err);
        }
    };

    const loadAnalytics = async () => {
        const DEV_USER_ID = '00000000-0000-0000-0000-000000000123';
        const isDevUser = user?.id === DEV_USER_ID;
        const IS_PROXY_MODE = process.env.NODE_ENV === 'development' && isDevUser;

        if (!IS_PROXY_MODE && !user) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            let hydratedSummaries: DailySummary[] = [];

            if (IS_PROXY_MODE) {
                // DEV PROXY MODE: Fetch from Local Persistence (or Supabase via Service Key)
                const res = await fetch('/api/persistence', { cache: 'no-store' });
                if (!res.ok) throw new Error("Failed to fetch local analytics data");
                const data = await res.json();

                const spends = (data.spends || []).map((s: any) => ({
                    ...s,
                    date: new Date(s.date || s.createdAt),
                    amount: Number(s.amount),
                    currency: (s.currency || "INR") as any,
                    money: MoneyEngine.fromMajor(Number(s.amount), (s.currency || "INR") as any),
                    category: s.category || 'Uncategorized',
                }));

                const { convertSpendsToSummaries } = require("@/lib/metrics");
                hydratedSummaries = convertSpendsToSummaries(spends, activeCurrency);

                // Set memories/reflections from local data if needed, or let them handle themselves
                // The context has separate state for memories/reflections
                setMemories(data.memories || []);
                setReflections(data.reflections || []);

            } else {
                // PROD: Supabase
                // Bounded Context: Only fetch last 180 days
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 180);

                // CRITICAL IMPROVEMENT: Fetch both summaries and TODAY'S entries to ensure real-time charts
                const [summaryRes, todayEntriesRes] = await Promise.all([
                    fetchDailySummariesInRange(user!.id, start, end),
                    supabase
                        .from('entries')
                        .select('*')
                        .eq('user_id', user!.id)
                        .eq('is_archived', false)
                        .gte('date', TemporalEngine.getLocalDateString()) // Today onwards (Timezone Aware)
                ]);

                if (summaryRes.error) throw summaryRes.error;

                const remoteSummaries = (summaryRes.data || []).map((s: any) => ({
                    ...s,
                    money: MoneyEngine.fromMajor(Number(s.total_amount)),
                    category_money: Object.entries(s.category_breakdown || {}).reduce((acc, [cat, amt]) => ({
                        ...acc,
                        [cat]: MoneyEngine.fromMajor(Number(amt))
                    }), {})
                }));

                // Live Augmentation: If we have entries for today, compute a "live" summary to override stale cloud summary
                if (todayEntriesRes.data && todayEntriesRes.data.length > 0) {
                    const todayStr = TemporalEngine.getLocalDateString();
                    const todayEntries: ParsedSpend[] = todayEntriesRes.data.map(s => ({
                        ...s,
                        date: new Date(s.date),
                        amount: Number(s.amount),
                        currency: (s.currency || "INR") as any,
                        money: MoneyEngine.fromMajor(Number(s.amount), (s.currency || "INR") as any)
                    }));

                    const { convertSpendsToSummaries } = require("@/lib/metrics");
                    const [liveTodaySummary] = convertSpendsToSummaries(todayEntries, activeCurrency);

                    if (liveTodaySummary) {
                        // Blend: Filter out the cloud's potentially stale 'today' and inject our live one
                        hydratedSummaries = [
                            liveTodaySummary,
                            ...remoteSummaries.filter(s => s.date !== todayStr)
                        ];
                    } else {
                        hydratedSummaries = remoteSummaries;
                    }
                } else {
                    hydratedSummaries = remoteSummaries;
                }
            }

            setDailySummaries(hydratedSummaries);

            // Calculate Weekly Metrics from Daily Summaries
            // Using the new universal multi-currency helper
            const now = new Date();
            const { computeWeeklyMetrics } = require("@/lib/metrics");
            const metrics = computeWeeklyMetrics(hydratedSummaries, {
                pivotDate: now,
                activeCurrency: activeCurrency
            });

            setWeeklyMetrics({
                weeklyTotal: metrics.weeklyTotal,
                previousWeeklyTotal: metrics.previousWeeklyTotal,
                wowMomentum: metrics.wowMomentum,
                categoryFocus: metrics.categoryFocus,
                activityAverage: metrics.activityAverage,
                totalAmount: metrics.totalAmount
            });

            // TRUST FIX: Load reflections asynchronously to not block metrics
            // Fetch goal separately for reflection
            const { data: goalData } = await supabase
                .from('weekly_goals')
                .select('amount')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            const currentWeeklyGoal = goalData?.amount || 2000;
            if (!IS_PROXY_MODE) {
                loadReflectionsAsync(user!.id, currentWeeklyGoal);
            }

        } catch (err: any) {
            console.error("Detailed Analytics Error:", {
                message: err.message || "No message",
                details: err.details,
                hint: err.hint,
                code: err.code,
                errorObject: err, // Log the full object
                context: "loadAnalytics"
            });
            setError(err.message || "An unknown error occurred while loading analytics.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, [user, activeCurrency]);

    const value = useMemo(() => ({
        dailySummaries,
        weeklyMetrics,
        memories,
        reflections,
        isLoading,
        error,
        refreshAnalytics: loadAnalytics
    }), [dailySummaries, weeklyMetrics, memories, reflections, isLoading, error]);

    return (
        <AnalyticsContext.Provider value={value}>
            {children}
        </AnalyticsContext.Provider>
    );
}

export function useAnalytics() {
    const context = useContext(AnalyticsContext);
    if (context === undefined) {
        throw new Error("useAnalytics must be used within an AnalyticsProvider");
    }
    return context;
}
