"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from "react";
import { ParsedSpend } from "@/lib/parser";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "./AuthContext";
import { useAnalytics } from "./AnalyticsContext";
import { TemporalEngine } from "@/lib/temporal";
import { MoneyEngine, formatAmount, CurrencyCode } from "@/lib/money";
import { RecurrentSpend } from "@/lib/horizon-prediction";
import { exchangeProvider } from "@/lib/exchange";
import { useCurrency } from "./CurrencyContext";

// Narrows a DB string into the typed source union (defaults to 'regex' for unknown values)
function toParseSource(s: string | undefined): 'regex' | 'llm' {
    return s === 'llm' ? 'llm' : 'regex';
}

// ── Horizon Extension Types ─────────────────────────────────────────────────
export interface SavingsGoal {
    id: string;
    user_id?: string;
    name: string;
    emoji?: string;
    targetAmount: number;   // major units (e.g. 10000 = ₹10,000)
    savedAmount: number;    // major units
    deadline?: string;      // ISO date string
    createdAt: string;
}

export interface IncomeSource {
    id: string;
    name: string;
    amount: number;
    dayOfMonth?: number;
}

type Feedback = {
    id: string;
    text: string;
    rating?: number;
    createdAt: string;
    adminReaction?: 'noted' | 'acknowledged' | null;
    userId?: string;
};

type SpendsContextType = {
    spends: ParsedSpend[];
    weeklyGoal: number;
    addSpend: (spend: ParsedSpend) => Promise<void>;
    removeSpend: (id: string) => Promise<void>;
    updateSpend: (id: string, updates: Partial<ParsedSpend>) => Promise<void>;
    setWeeklyGoal: (amount: number) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    loadMore: () => Promise<void>;
    hasMore: boolean;
    feedback: Feedback[];
    addFeedback: (text: string, rating?: number) => Promise<void>;
    removeFeedback: (id: string) => Promise<void>;
    updateFeedbackReaction: (id: string, reaction: 'noted' | 'acknowledged' | null) => Promise<void>;
    isDevUser: boolean;
    dataVersion: number;
    // Horizon extension
    goals: SavingsGoal[];
    addGoal: (goal: Omit<SavingsGoal, "id" | "createdAt" | "savedAmount">) => Promise<void>;
    updateGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
    removeGoal: (id: string) => Promise<void>;
    monthlyIntention: number;
    setMonthlyIntention: (amount: number) => void;
    monthlyIncome: number;
    incomeSources: IncomeSource[];
    addIncomeSource: (source: Omit<IncomeSource, "id">) => Promise<void>;
    updateIncomeSource: (id: string, updates: Partial<Omit<IncomeSource, "id">>) => Promise<void>;
    removeIncomeSource: (id: string) => Promise<void>;
    clearAutoInflows: () => Promise<void>;
    recurrentSpends: RecurrentSpend[];
    addRecurrentSpend: (spend: Omit<RecurrentSpend, "id">) => void;
    removeRecurrentSpend: (id: string) => void;
    categoryBudgets: Record<string, number>;
    updateCategoryBudget: (category: string, amount: number) => void;
    removeCategoryBudget: (category: string) => void;
};

const SpendsContext = createContext<SpendsContextType | undefined>(undefined);

// ── Database Row Types ───────────────────────────────────────────────────
interface SupabaseEntry {
    id: string;
    user_id: string;
    amount: number;
    currency: string;
    category: string;
    description: string;
    date: string;
    confidence: number;
    is_archived: boolean;
    metadata: Record<string, unknown>;
    created_at: string;
    // Optional fields populated by AI parser
    source?: string;
    category_candidates?: { category: string; score: number }[];
    needs_review?: boolean;
    review_reasons?: string[];
}

interface SupabaseFeedback {
    id: string;
    user_id: string;
    message: string;
    rating?: number;
    admin_reaction?: 'noted' | 'acknowledged' | null;
    created_at: string;
}

interface SupabaseGoal {
    id: string;
    user_id: string;
    name: string;
    emoji?: string;
    target_amount: number;
    current_amount: number;
    target_date?: string;
    created_at: string;
}

export function SpendsProvider({ children }: { children: ReactNode }) {
    const { user, isLoading: authLoading } = useAuth();
    const { activeCurrency } = useCurrency();
    const { refreshAnalytics } = useAnalytics();
    const { toast } = useToast();
    const [spends, setSpends] = useState<ParsedSpend[]>([]);
    const [weeklyGoal, setWeeklyGoal] = useState<number>(0);
    const [monthlyIntention, setMonthlyIntentionState] = useState<number>(0);
    const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
    const [recurrentSpends, setRecurrentSpends] = useState<RecurrentSpend[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [dataVersion, setDataVersion] = useState(0);
    const [isOffline, setIsOffline] = useState(false);

    // Horizon state
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});

    const monthlyIncome = useMemo(() =>
        incomeSources.reduce((sum, s) => sum + s.amount, 0),
        [incomeSources]
    );

    const incrementVersion = useCallback(() => setDataVersion(v => v + 1), []);

    const PAGE_SIZE = 50;
    // CRITICAL FIX: Only use the proxy if we are actually using the specific Dev User ID.
    // Real authenticated users in dev mode should still connect properly to Supabase.
    const DEV_USER_ID = '00000000-0000-0000-0000-000000000123';
    const isDevUser = user?.id === DEV_USER_ID;
    const IS_PROXY_MODE = process.env.NODE_ENV === 'development' && isDevUser;

    // Hydration
    const loadData = useCallback(async (isInitial = true) => {
        // DEV PROXY MODE: Bypass Auth check for local data
        if (!IS_PROXY_MODE && !user) {
            if (!authLoading) setIsLoading(false);
            return;
        }

        try {
            if (isInitial) setIsLoading(true);

            if (IS_PROXY_MODE) {
                // DEV PROXY: Fetch from Local API (Supabase Service Key bypass)
                const res = await fetch('/api/persistence', { cache: 'no-store' });
                if (!res.ok) throw new Error('Failed to fetch local data');
                const data = await res.json();

                const hydratedSpends: ParsedSpend[] = (data.spends || [])
                    .map((s: SupabaseEntry) => ({
                        ...s,
                        date: new Date(s.date || s.created_at),
                        category: s.category as ParsedSpend['category'],
                        amount: Number(s.amount), // Major
                        amountMinor: Math.round(Number(s.amount) * 100), // Minor
                        money: MoneyEngine.fromMajor(Number(s.amount)),
                        confidence: Number(s.confidence || 1),
                        source: toParseSource(s.source),
                        categoryCandidates: (s.category_candidates || [{ category: s.category, score: 1 }]).map((c: any) => ({ category: c.category as ParsedSpend['category'], score: c.score })),
                        needsReview: s.needs_review || false,
                        reviewReasons: s.review_reasons || []
                    }))
                    .sort((a: ParsedSpend, b: ParsedSpend) => b.date.getTime() - a.date.getTime());

                setSpends(hydratedSpends);
                setWeeklyGoal(data.weeklyGoal ?? 0);
                setHasMore(false);

                // Hydrate all Horizon data from proxy (KEY FIX for persistence across reloads)
                if (data.monthlyIntention !== undefined) setMonthlyIntentionState(Number(data.monthlyIntention));
                if (Array.isArray(data.incomeSources) && data.incomeSources.length > 0) {
                    setIncomeSources(data.incomeSources);
                }
                if (Array.isArray(data.recurrentSpends)) {
                    setRecurrentSpends(data.recurrentSpends);
                }
                if (data.categoryBudgets && typeof data.categoryBudgets === 'object') {
                    const budgetMap: Record<string, number> = {};
                    Object.entries(data.categoryBudgets).forEach(([k, v]) => { budgetMap[k] = Number(v); });
                    setCategoryBudgets(budgetMap);
                }
                if (Array.isArray(data.goals)) {
                    setGoals(data.goals);
                }

                // Hydrate Feedback from proxy (with 7-day expiry)
                if (Array.isArray(data.feedback)) {
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    setFeedback(data.feedback
                        .filter((f: SupabaseFeedback) => new Date(f.created_at) > sevenDaysAgo)
                        .map((f: SupabaseFeedback) => ({
                            id: f.id,
                            text: f.message,
                            rating: f.rating,
                            createdAt: f.created_at,
                            adminReaction: f.admin_reaction || null,
                            userId: f.user_id,
                        }))
                    );
                }
            } else {
                // PROD: Supabase
                const currentPage = isInitial ? 0 : page + 1;

                const [entriesRes, weeklyGoalsRes, profileRes, recurrentRes, budgetsRes, goalsDataRes, feedbackRes] = await Promise.all([
                    supabase
                        .from('entries')
                        .select('*')
                        .eq('user_id', user!.id)
                        .eq('is_archived', false)
                        .order('date', { ascending: false })
                        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
                    supabase
                        .from('weekly_goals')
                        .select('*')
                        .eq('user_id', user!.id)
                        .order('created_at', { ascending: false })
                        .limit(1),
                    supabase
                        .from('financial_profiles')
                        .select('*')
                        .eq('user_id', user!.id)
                        .single(),
                    supabase
                        .from('recurrent_spends')
                        .select('*')
                        .eq('user_id', user!.id),
                    supabase
                        .from('category_budgets')
                        .select('*')
                        .eq('user_id', user!.id),
                    supabase
                        .from('savings_goals')
                        .select('*')
                        .eq('user_id', user!.id),
                    isDevUser
                        ? supabase
                            .from('user_feedback')
                            .select('*')
                            .order('created_at', { ascending: false })
                        : supabase
                            .from('user_feedback')
                            .select('*')
                            .eq('user_id', user!.id)
                            .order('created_at', { ascending: false })
                ]);

                if (entriesRes.error) throw entriesRes.error;

                const fetchedData = entriesRes.data || [];
                const hasMoreData = fetchedData.length > PAGE_SIZE;

                const hydratedSpends: ParsedSpend[] = fetchedData
                    .slice(0, PAGE_SIZE)
                    .map((s: SupabaseEntry) => ({
                        ...s,
                        date: new Date(s.date),
                        category: s.category as ParsedSpend['category'],
                        currency: s.currency as CurrencyCode,
                        amount: Number(s.amount),
                        amountMinor: Math.round(Number(s.amount) * 100),
                        money: MoneyEngine.fromMajor(Number(s.amount)),
                        confidence: Number(s.confidence),
                        source: toParseSource(s.source),
                        categoryCandidates: (s.category_candidates || [{ category: s.category, score: 1 }]).map((c: any) => ({ category: c.category as ParsedSpend['category'], score: c.score })),
                        needsReview: s.needs_review || false,
                        reviewReasons: s.review_reasons || []
                    }));

                if (isInitial) {
                    setSpends(hydratedSpends);
                    setPage(0);
                } else {
                    setSpends(prev => [...prev, ...hydratedSpends]);
                    setPage(currentPage);
                }

                setHasMore(hasMoreData);

                if (weeklyGoalsRes.data && weeklyGoalsRes.data.length > 0) {
                    const goal = Number(weeklyGoalsRes.data[0].amount);
                    setWeeklyGoal(goal > 0 ? goal : 0);
                }

                if (profileRes.data) {
                    setMonthlyIntentionState(Number(profileRes.data.monthly_intention));
                }

                if (recurrentRes.data) {
                    interface SupabaseRecurrentEntry {
                        id: string;
                        category: string;
                        name: string;
                        amount: number | string;
                        frequency?: string;
                        is_active?: boolean;
                    }
                    const allRecurrent = recurrentRes.data as SupabaseRecurrentEntry[];
                    const incomes = allRecurrent
                        .filter(r => r.category === 'income' || r.category === 'salary')
                        .map(r => ({
                            id: r.id,
                            name: r.name,
                            amount: Number(r.amount),
                            dayOfMonth: parseInt((r.frequency || "1").replace("day-", "")) || 1
                        }));
                    const outbound = allRecurrent.filter(r => r.category !== 'income' && r.category !== 'salary');
                    
                    if (incomes.length > 0) {
                        setIncomeSources(incomes);
                    } else if (profileRes.data && profileRes.data.monthly_income > 0) {
                        // Migration fallback
                        setIncomeSources([{
                            id: 'legacy-primary',
                            name: 'Primary Income',
                            amount: Number(profileRes.data.monthly_income)
                        }]);
                    }
                    setRecurrentSpends(outbound as RecurrentSpend[]);
                }

                if (budgetsRes.data) {
                    const budgetMap: Record<string, number> = {};
                    budgetsRes.data.forEach((b: { category: string; amount: number }) => {
                        budgetMap[b.category] = Number(b.amount);
                    });
                    setCategoryBudgets(budgetMap);
                }

                // Hydrate Savings Goals
                if (goalsDataRes.data) {
                    setGoals(goalsDataRes.data.map((g: SupabaseGoal) => ({
                        id: g.id,
                        name: g.name,
                        emoji: g.emoji,
                        targetAmount: Number(g.target_amount),
                        savedAmount: Number(g.current_amount),
                        deadline: g.target_date,
                        createdAt: g.created_at
                    })));
                }

                // Hydrate Feedback (filter 7-day expiry)
                if (feedbackRes.data) {
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    setFeedback(feedbackRes.data
                        .filter((f: SupabaseFeedback) => new Date(f.created_at) > sevenDaysAgo)
                        .map((f: SupabaseFeedback) => ({
                            id: f.id,
                            text: f.message,
                            rating: f.rating,
                            createdAt: f.created_at,
                            adminReaction: f.admin_reaction || null,
                            userId: f.user_id,
                        })));
                }
            }

        } catch (err: any) {
            console.error("Hydration Failed:", err);
            setError(err.message || "Failed to load data");
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, authLoading, page, IS_PROXY_MODE]);

    useEffect(() => {
        if (!authLoading) {
            loadData(true);
        }

        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [authLoading, loadData]);




    // We use a Supabase-first strategy for Horizon features.

    // ── Horizon: Persistence transition ─────────────────────────────────────────
    // We are moving to a Supabase-first strategy. 
    // LocalStorage will only be used as a "Quick Load" cache or offline fallback.

    const setMonthlyIntention = async (amount: number) => {
        if (!IS_PROXY_MODE && !user) return;
        setMonthlyIntentionState(amount);
        try {
            if (IS_PROXY_MODE) {
                await fetch('/api/persistence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ monthlyIntention: amount })
                });
            } else {
                await supabase.from('financial_profiles').upsert({
                    user_id: user!.id,
                    monthly_intention: amount,
                    updated_at: new Date().toISOString()
                });
            }
        } catch (e) {
            console.error("Failed to sync intention:", e);
        }
    };

    const syncIncomeSources = async (sources: IncomeSource[]) => {
        if (!IS_PROXY_MODE && !user) return;
        try {
            const total = sources.reduce((sum, s) => sum + s.amount, 0);
            if (IS_PROXY_MODE) {
                await fetch('/api/persistence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ monthlyIncome: total, incomeSources: sources })
                });
            } else {
                await supabase.from('financial_profiles').upsert({
                    user_id: user!.id,
                    monthly_income: total,
                    updated_at: new Date().toISOString()
                });
                
                // Route income sources safely into recurrent_spends
                await supabase.from('recurrent_spends').delete()
                    .eq('user_id', user!.id)
                    .in('category', ['income', 'salary']);
                
                if (sources.length > 0) {
                    const mapped = sources.map(s => ({
                        id: s.id || crypto.randomUUID(),
                        user_id: user!.id,
                        name: s.name || 'Income',
                        amount: s.amount || 0,
                        category: 'income',
                        frequency: `day-${s.dayOfMonth || 1}`,
                        is_active: true,
                    }));
                    await supabase.from('recurrent_spends').insert(mapped);
                }
            }
        } catch (e) {
            console.error("Failed to sync income sources:", e);
        }
    };

    const addIncomeSource = async (source: Omit<IncomeSource, "id">) => {
        if (!user) return;
        const newSource = { ...source, id: crypto.randomUUID() };
        const next = [newSource, ...incomeSources];
        setIncomeSources(next);
        await syncIncomeSources(next);
    };

    const updateIncomeSource = async (id: string, updates: Partial<Omit<IncomeSource, "id">>) => {
        if (!user) return;
        const next = incomeSources.map(s => s.id === id ? { ...s, ...updates } : s);
        setIncomeSources(next);
        await syncIncomeSources(next);
    };

    const removeIncomeSource = async (id: string) => {
        if (!user) return;
        const next = incomeSources.filter(s => s.id !== id);
        setIncomeSources(next);
        await syncIncomeSources(next);
    };

    const clearAutoInflows = async () => {
        if (!user) return;
        try {
            // Step 1: Find all inflow entries for this user (category = 'income' or 'salary')
            const { data: inflowEntries, error: fetchError } = await supabase
                .from('entries')
                .select('id, category')
                .eq('user_id', user.id)
                .in('category', ['income', 'salary']);
                
            if (fetchError) throw fetchError;
            if (!inflowEntries || inflowEntries.length === 0) {

                return;
            }

            // Step 2: Delete those IDs
            const ids = inflowEntries.map((e: { id: string }) => e.id);
            const { error: deleteError } = await supabase
                .from('entries')
                .delete()
                .in('id', ids)
                .eq('user_id', user.id);
                
            if (deleteError) throw deleteError;
            
            // Step 3: Update local state immediately
            setSpends(prev => prev.filter(s => !ids.includes(s.id)));

        } catch (e) {
            console.error("Failed to clear auto inflows:", e);
        }
    };

    const addRecurrentSpend = async (spend: Omit<RecurrentSpend, "id">) => {
        if (!IS_PROXY_MODE && !user) return;
        const newSpend: RecurrentSpend = { ...spend, id: crypto.randomUUID() };
        const next = [newSpend, ...recurrentSpends];
        setRecurrentSpends(next);
        try {
            if (IS_PROXY_MODE) {
                await fetch('/api/persistence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recurrentSpends: next })
                });
            } else {
                await supabase.from('recurrent_spends').insert({
                    id: newSpend.id,
                    user_id: user!.id,
                    name: newSpend.name,
                    amount: newSpend.amount,
                    category: newSpend.category,
                    frequency: newSpend.frequency || 'monthly',
                    is_active: newSpend.is_active !== false
                });
            }
        } catch (e) {
            console.error("Failed to sync recurrent spend:", e);
        }
    };

    const removeRecurrentSpend = async (id: string) => {
        if (!IS_PROXY_MODE && !user) return;
        const next = recurrentSpends.filter(s => s.id !== id);
        setRecurrentSpends(next);
        try {
            if (IS_PROXY_MODE) {
                await fetch('/api/persistence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recurrentSpends: next })
                });
            } else {
                await supabase.from('recurrent_spends').delete().eq('id', id);
            }
        } catch (e) {
            console.error("Failed to delete recurrent spend:", e);
        }
    };

    const updateCategoryBudget = async (category: string, amount: number) => {
        if (!IS_PROXY_MODE && !user) return;
        const next = { ...categoryBudgets, [category]: amount };
        setCategoryBudgets(next);
        try {
            if (IS_PROXY_MODE) {
                await fetch('/api/persistence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ categoryBudgets: next })
                });
            } else {
                await supabase.from('category_budgets').upsert({
                    user_id: user!.id,
                    category,
                    amount,
                    updated_at: new Date().toISOString()
                });
            }
        } catch (e) {
            console.error("Failed to sync budget:", e);
        }
    };

    const removeCategoryBudget = async (category: string) => {
        if (!IS_PROXY_MODE && !user) return;
        const next = { ...categoryBudgets };
        delete next[category];
        setCategoryBudgets(next);
        try {
            if (IS_PROXY_MODE) {
                await fetch('/api/persistence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ categoryBudgets: next })
                });
            } else {
                await supabase.from('category_budgets').delete().eq('user_id', user!.id).eq('category', category);
            }
        } catch (e) {
            console.error("Failed to delete budget:", e);
        }
    };

    // ── User Feedback CRUD ───────────────────────────────────────────
    const addFeedback = async (text: string, rating?: number) => {
        if (!user) return;
        
        // Enforce character limit
        if (text.length > 1000) {
            console.error("Feedback exceeds 1000 characters");
            return;
        }

        try {
            if (IS_PROXY_MODE) {
                const newFeedback = {
                    id: crypto.randomUUID(),
                    text: text,
                    rating: rating,
                    createdAt: new Date().toISOString(),
                    adminReaction: null,
                    userId: user.id
                };
                const updatedFeedback = [newFeedback, ...feedback];
                const res = await fetch('/api/persistence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ feedback: updatedFeedback })
                });
                if (!res.ok) throw new Error("Local proxy sync failed");
                setFeedback(updatedFeedback);
            } else {
                const { data, error } = await supabase.from('user_feedback').insert({
                    user_id: user.id,
                    message: text,
                    rating: rating,
                    context_page: window.location.pathname,
                    created_at: new Date().toISOString()
                }).select().single();

                if (error) {
                    console.error("Supabase error inserting feedback:", error.message, error.details, error.hint);
                    throw error;
                }
                if (data) {
                    setFeedback(prev => [{
                        id: data.id,
                        text: data.message,
                        rating: data.rating,
                        createdAt: data.created_at,
                        adminReaction: null,
                        userId: data.user_id,
                    }, ...prev]);
                }
            }
        } catch (e) {
            console.error("Failed to sync feedback:", e);
        }
    };

    const removeFeedback = async (id: string) => {
        if (!user) return;
        const updatedFeedback = feedback.filter(f => f.id !== id);
        setFeedback(updatedFeedback);
        try {
            if (IS_PROXY_MODE) {
                await fetch('/api/persistence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ feedback: updatedFeedback })
                });
            } else {
                await supabase.from('user_feedback').delete().eq('id', id);
            }
        } catch (e) {
            console.error("Failed to delete feedback:", e);
        }
    };

    const updateFeedbackReaction = async (id: string, reaction: 'noted' | 'acknowledged' | null) => {
        if (!user || !isDevUser) return;
        const updatedFeedback = feedback.map(f => f.id === id ? { ...f, adminReaction: reaction } : f);
        setFeedback(updatedFeedback);
        try {
            if (IS_PROXY_MODE) {
                await fetch('/api/persistence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ feedback: updatedFeedback })
                });
            } else {
                await supabase.from('user_feedback').update({ admin_reaction: reaction }).eq('id', id);
            }
        } catch (e) {
            console.error("Failed to update feedback reaction:", e);
        }
    };

    const addGoal = async (goal: Omit<SavingsGoal, "id" | "createdAt" | "savedAmount">) => {
        if (!IS_PROXY_MODE && !user) return;

        // Optimistic: add with a temp id so it appears immediately
        const tempId = crypto.randomUUID();
        const tempGoal: SavingsGoal = {
            ...goal,
            id: tempId,
            savedAmount: 0,
            createdAt: new Date().toISOString(),
        };
        setGoals(prev => [tempGoal, ...prev]);

        try {
            let data: any = null;
            if (IS_PROXY_MODE) {
                // In proxy mode, we treat the temp goal as final
                data = {
                    id: tempId,
                    name: goal.name,
                    emoji: goal.emoji || null,
                    target_amount: goal.targetAmount,
                    current_amount: 0,
                    target_date: goal.deadline || null,
                    created_at: tempGoal.createdAt
                };
            } else {
                if (!user?.id) throw new Error("Authentication session expired.");
                const { data: res, error } = await supabase.from('savings_goals')
                    .insert({
                        user_id: user.id,
                        name: goal.name,
                        emoji: goal.emoji || null,
                        target_amount: goal.targetAmount,
                        current_amount: 0,
                        target_date: goal.deadline || null
                    })
                    .select()
                    .single();

                if (error) {
                    if (error.code === '42501') {
                        throw new Error("Permission denied. Your account doesn't have access to create goals.");
                    }
                    throw error;
                }
                data = res;
            }

            if (data) {
                const finalGoal = {
                    id: data.id,
                    name: data.name,
                    emoji: data.emoji,
                    targetAmount: Number(data.target_amount),
                    savedAmount: Number(data.current_amount),
                    deadline: data.target_date,
                    createdAt: data.created_at || data.createdAt,
                };
                
                // Swap the temp entry with the real DB row
                const currentGoals = [finalGoal, ...goals.filter(g => g.id !== tempId)];
                setGoals(currentGoals);

                if (IS_PROXY_MODE) {
                    await fetch('/api/persistence', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ goals: currentGoals })
                    });
                }
            }
        } catch (e: any) {
            console.error("Failed to sync goal:", e);
            // Rollback the optimistic add
            setGoals(prev => prev.filter(g => g.id !== tempId));
            toast({
                type: "error",
                message: "Goal sync failed",
                description: e?.message || "Check your permission or internet connection.",
                duration: 5000,
            });
        }
    };

    const updateGoal = async (id: string, updates: Partial<SavingsGoal>) => {
        if (!IS_PROXY_MODE && !user) return;
        const next = goals.map(g => g.id === id ? { ...g, ...updates } : g);
        setGoals(next);
        try {
            if (IS_PROXY_MODE) {
                await fetch('/api/persistence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ goals: next })
                });
            } else {
                const payload: Partial<Record<string, any>> = {};
                if (updates.name !== undefined) payload.name = updates.name;
                if (updates.emoji !== undefined) payload.emoji = updates.emoji;
                if (updates.targetAmount !== undefined) payload.target_amount = updates.targetAmount;
                if (updates.savedAmount !== undefined) payload.current_amount = updates.savedAmount;
                if (updates.deadline !== undefined) payload.target_date = updates.deadline;

                await supabase.from('savings_goals').update(payload).eq('id', id);
            }
        } catch (e) {
            console.error("Failed to update goal:", e);
        }
    };

    const removeGoal = async (id: string) => {
        if (!IS_PROXY_MODE && !user) return;
        const next = goals.filter(g => g.id !== id);
        setGoals(next);
        try {
            if (IS_PROXY_MODE) {
                await fetch('/api/persistence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ goals: next })
                });
            } else {
                await supabase.from('savings_goals').delete().eq('id', id);
            }
        } catch (e) {
            console.error("Failed to delete goal:", e);
        }
    };


    const addSpend = async (spend: ParsedSpend) => {
        if (!IS_PROXY_MODE && !user) {
            toast({ type: "error", message: "Not Authenticated", description: "You must be signed in to add spends." });
            return;
        }

        let normalizedAmount = spend.amount;
        let normalizedSpend = { ...spend };

        // Normalize currency to active base currency before saving
        try {
            const inputCurrency = (spend.currency as CurrencyCode) || activeCurrency;
            if (inputCurrency !== activeCurrency) {
                const rate = await exchangeProvider.getRate(inputCurrency, activeCurrency);
                normalizedAmount = spend.amount * rate;

                // Update the spend object to reflect the normalized base value
                // In a true multi-currency setup we'd save both, but per constraints we normalize to base for simplicity
                normalizedSpend = {
                    ...spend,
                    amount: normalizedAmount,
                    currency: activeCurrency
                };
            } else {
                normalizedSpend.currency = activeCurrency;
            }
        } catch (e) {
            console.error("Currency conversion failed during addSpend, using original amount", e);
        }

        // Optimistic Update
        setSpends((prev) => [normalizedSpend, ...prev]);

        try {
            if (IS_PROXY_MODE) {
                // DEV PROXY: Save to Local API
                // Use a functional update to get the absolute latest state if possible,
                // but since we need to send it to the server via await, we'll use the current captured state
                // and trust React's render cycle for now, as addSpend is recreated on every 'spends' change.
                const newSpendsList = [normalizedSpend, ...spends];
                const res = await fetch('/api/persistence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ spends: newSpendsList })
                });
                if (!res.ok) throw new Error("Cloud sync failed");
            } else {
                // PROD: Supabase
                const { error: insertError } = await supabase.from('entries').insert({
                    id: normalizedSpend.id,
                    user_id: user!.id,
                    amount: normalizedAmount,
                    currency_code: normalizedSpend.currency,
                    confidence: spend.confidence || 1,
                    is_archived: false,
                    category: spend.category,
                    description: spend.description || '',
                    date: spend.date.toISOString(),
                    metadata: { ...spend.metadata, confidence: spend.confidence }
                });

                if (insertError) {
                    // Handle offline or error case
                    if (isOffline) {
                        const queue = JSON.parse(localStorage.getItem('monetarz_offline_queue') || '[]');
                        queue.push({ type: 'add', data: normalizedSpend });
                        localStorage.setItem('monetarz_offline_queue', JSON.stringify(queue));
                        toast({ type: "success", message: "Saved Locally", description: "You are offline. Data will sync when you're back online." });
                    } else {
                        throw insertError;
                    }
                }

            }

            // Trigger authoritative analytics refresh

            // Trigger authoritative analytics refresh (Context-aware refresh not implemented, assume local updates)
            refreshAnalytics();
            incrementVersion();

            toast({
                type: "success",
                message: "Spend Recorded",
                description: `${formatAmount(spend.amount, spend.currency as CurrencyCode || activeCurrency)} added to ${spend.category}`,
                duration: 3000
            });

        } catch (err: any) {
            console.error("Failed to add spend:", err.message, err.details, err);
            // Rollback optimistic update
            setSpends((prev) => prev.filter(s => s.id !== spend.id));
            toast({
                type: "error",
                message: "Failed to save spend",
                description: err.message || "There was an error syncing with the server."
            });
        }
    };

    const removeSpend = async (id: string) => {
        if (!IS_PROXY_MODE && !user) return;

        const spendToRemove = spends.find(s => s.id === id);
        if (!spendToRemove) return;

        setSpends((prev) => prev.filter((s) => s.id !== id));

        try {
            if (IS_PROXY_MODE) {
                // DEV PROXY: Update local file
                const newSpendsList = spends.filter(s => s.id !== id);
                await fetch('/api/persistence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ spends: newSpendsList })
                });
            } else {
                // PROD: Supabase
                const { error: deleteError } = await supabase
                    .from('entries')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', user!.id);

                if (deleteError) throw deleteError;
            }

            // Trigger authoritative analytics refresh
            refreshAnalytics();
            incrementVersion();

            toast({
                type: "info",
                message: "Spend Deleted",
                description: "The entry has been removed.",
                duration: 3000
            });

        } catch (err) {
            console.error("Failed to delete spend:", err);
            // Rollback
            setSpends(prev => [spendToRemove, ...prev]);
            toast({
                type: "error",
                message: "Failed to delete spend",
                description: "Please try again."
            });
        }
    };

    const updateSpend = async (id: string, updates: Partial<ParsedSpend>) => {
        if (!IS_PROXY_MODE && !user) return;

        const oldSpend = spends.find(s => s.id === id);
        if (!oldSpend) return;

        setSpends((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));

        try {
            if (IS_PROXY_MODE) {
                // DEV PROXY: Update local file
                const newSpendsList = spends.map((s) => s.id === id ? { ...s, ...updates } : s);
                await fetch('/api/persistence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ spends: newSpendsList })
                });
            } else {
                // PROD: Supabase
                const payload: any = { ...updates };
                if (updates.date) payload.date = updates.date.toISOString();

                const { error: updateError } = await supabase
                    .from('entries')
                    .update(payload)
                    .eq('id', id)
                    .eq('user_id', user!.id);

                if (updateError) throw updateError;
            }

            // Trigger authoritative analytics refresh
            refreshAnalytics();
            incrementVersion();

        } catch (err) {
            console.error("Failed to update spend:", err);
            // Rollback
            setSpends((prev) => prev.map((s) => s.id === id ? oldSpend : s));
        }
    };

    const handleSetWeeklyGoal = async (amount: number) => {
        if (!IS_PROXY_MODE && !user) return;
        setWeeklyGoal(amount);
        try {
            if (IS_PROXY_MODE) {
                // If setting to 0, remove it from settings entirely
                if (amount === 0) {
                    await fetch('/api/persistence', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ weeklyGoal: null })
                    });
                } else {
                    await fetch('/api/persistence', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ weeklyGoal: amount })
                    });
                }
            } else {
                if (amount === 0) {
                    // Delete all weekly goals for this user when setting to 0
                    const { error } = await supabase.from('weekly_goals').delete().eq('user_id', user!.id);
                    if (error) {
                        const errorMessage = error.message || error.code || JSON.stringify(error);
                        console.error("Failed to delete goal:", errorMessage);
                    }
                } else {
                    // Insert or update the weekly goal
                    const { error } = await supabase.from('weekly_goals').upsert({
                        user_id: user!.id,
                        amount: amount,
                    }, { onConflict: 'user_id' });
                    if (error) {
                        const errorMessage = error.message || error.code || JSON.stringify(error);
                        console.error("Failed to save goal:", errorMessage);
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const contextValue = useMemo(() => ({
        spends,
        weeklyGoal,
        addSpend,
        removeSpend,
        updateSpend,
        setWeeklyGoal: handleSetWeeklyGoal,
        isLoading: isLoading || (authLoading && !IS_PROXY_MODE),
        error,
        loadMore: () => loadData(false),
        hasMore,
        feedback,
        addFeedback,
        removeFeedback,
        updateFeedbackReaction,
        isDevUser,
        dataVersion,
        // Horizon extension
        goals,
        addGoal,
        updateGoal,
        removeGoal,
        monthlyIntention,
        setMonthlyIntention,
        monthlyIncome,
        incomeSources,
        addIncomeSource,
        updateIncomeSource,
        removeIncomeSource,
        clearAutoInflows,
        recurrentSpends,
        addRecurrentSpend,
        removeRecurrentSpend,
        categoryBudgets,
        updateCategoryBudget,
        removeCategoryBudget,
    }), [spends, weeklyGoal, isLoading, authLoading, error, hasMore, loadData, feedback, IS_PROXY_MODE, dataVersion, goals, monthlyIntention, monthlyIncome, recurrentSpends, categoryBudgets, isDevUser]);

    return (
        <SpendsContext.Provider value={contextValue}>
            {children}
        </SpendsContext.Provider>
    );
}

export function useSpends() {
    const context = useContext(SpendsContext);
    if (context === undefined) {
        throw new Error("useSpends must be used within a SpendsProvider");
    }
    return context;
}
