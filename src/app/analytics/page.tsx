"use client"
import CardFlip from "@/components/ui/analytics/card-flip"
import { computeRecentChanges, RecentChangesInsight, computeTodayVsUsual, TodayVsUsualInsight } from '@/lib/insights'
import { Sentiment } from '@/components/ui/analytics/interactive-polls'

import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useAnalytics } from '@/context/AnalyticsContext'
import { useSpends } from '@/context/SpendsContext'
import { Navbar } from '@/components/navbar'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/money'
import { SpendFilters, applySpendFilters } from '@/lib/spend-filters'
import { SpendDataGrid } from '@/components/spend-data-grid'
import { SpendGridFilters } from '@/components/spend-grid-filters'
import { LayoutGrid, BarChart3, TrendingUp } from 'lucide-react'
import { TemporalBoundSelector, TemporalBound } from '@/features/analytics/components/TemporalBoundSelector'
import { AnalyticsConfidence } from '@/lib/analytics-confidence'
import { isDevAiEnabled } from '@/lib/intelligence/feature-gate'
import { ArchiveGate } from '@/features/archive/components/ArchiveGate'
import { ArchiveStatusBadge } from '@/features/archive/components/ArchiveStatusBadge'
import { ArchiveHistoryView } from '@/features/archive/components/ArchiveHistoryView'
import { isArchiveEnabledForUser } from '@/lib/archive-service'
import { useArchiveStats } from '@/features/analytics/hooks/useArchiveStats'
import { useAiInsights } from '@/features/analytics/hooks/useAiInsights'
import { useAuth } from '@/context/AuthContext'
import { TemporalEngine } from '@/lib/temporal'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const SiriOrb = dynamic(() => import("@/components/ui/analytics/siri-orb"), { ssr: false });
const InteractivePolls = dynamic(() => import("@/components/ui/analytics/interactive-polls").then(mod => mod.InteractivePolls), { ssr: false });
const DistributionRadialBoard = dynamic(() => import("@/components/ui/analytics/distribution-radial-board").then(mod => mod.DistributionRadialBoard), { ssr: false });
const FlowVelocityBoard = dynamic(() => import("@/components/ui/analytics/flow-velocity-board").then(mod => mod.FlowVelocityBoard), { ssr: false });
const TransitionInsights = dynamic(() => import("@/components/ui/analytics/transition-insights").then(mod => mod.TransitionInsights), { ssr: false });
import { generateAdvisorInsights, generatePollQuestion } from '@/app/actions/intelligence'
import { saveJournalEntry, getRecentJournalEntry } from '@/lib/journal-service'
import { useCurrency } from '@/context/CurrencyContext'
import { PolarGrid, RadialBar, RadialBarChart, CartesianGrid, LabelList, Area, AreaChart, XAxis, PolarAngleAxis, Radar, RadarChart } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import Image from 'next/image'

export default function AnalyticsPage() {
    const { dailySummaries, isLoading: analyticsLoading, refreshAnalytics } = useAnalytics()
    const { spends, isLoading: spendsLoading } = useSpends()
    const { user: authUser } = useAuth()
    const { activeCurrency } = useCurrency()
    const isLoading = analyticsLoading || spendsLoading

    const [viewMode, setViewMode] = React.useState<'charts' | 'grid'>('charts')
    const [filters, setFilters] = React.useState<SpendFilters>({})

    const { archiveStats, isArchiveEnabled, showArchiveGate, handleArchiveComplete: _handleArchiveComplete } = useArchiveStats(authUser, spends);
    const handleArchiveCompleteLocal = () => _handleArchiveComplete(refreshAnalytics);

    // Grid View Sub-mode: Transactions or Archive History
    const [gridViewMode, setGridViewMode] = React.useState<'transactions' | 'archive'>('transactions')

    const isPro = true; // MOCK until Stripe integration
    const [timeBound, setTimeBound] = React.useState<TemporalBound>('week');

    // Poll Interaction State
    const [activeSentiment, setActiveSentiment] = React.useState<Sentiment>(null);
    const [submittedJournalIndices, setSubmittedJournalIndices] = React.useState<number[]>([]);
    const [isCalibrating, setIsCalibrating] = React.useState(false);

    // Fetch previously submitted journal entries for the current rotation
    React.useEffect(() => {
        if (!authUser) return;

        const checkJournalStatus = async () => {
            // Rotation seed (must match InteractivePolls)
            const rotationSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 12 * 7));

            // Hardcoded IDs for the 3 categories in the current rotation
            // Emotional prompt is always index 0
            const emotionalIds = ['pulse_check_1', 'pulse_check_2', 'pulse_check_3'];
            const promId = emotionalIds[rotationSeed % emotionalIds.length];

            const entry = await getRecentJournalEntry(authUser.id, promId);
            if (entry) {
                // If they answered the emotional one, we mark it as submitted
                // To be robust, we could check all 3, but starting with 1 for now
                setSubmittedJournalIndices([0]);
            }
        };

        checkJournalStatus();
    }, [authUser]);

    const handleJournalSubmit = async (promptId: string, response: string, category: string) => {
        if (!authUser) return;

        const result = await saveJournalEntry(authUser.id, promptId, response, category);
        if (result.success) {
            // Provide visual feedback if needed

        }
    };

    // Smooth Revert Timer (~20s) for the Pulse Check
    React.useEffect(() => {
        if (activeSentiment) {
            setIsCalibrating(true);
            const timer = setTimeout(() => {
                setActiveSentiment(null);
                setIsCalibrating(false);
            }, 15000);
            return () => clearTimeout(timer);
        }
    }, [activeSentiment]);

    // Archive state is now managed via useArchiveStats hook

    // 1. Grid Data: Filtered Raw Spends (Paginated)
    const filteredSpends = useMemo(() => {
        return applySpendFilters(spends, filters);
    }, [spends, filters]);

    // 2. Filter Options: Categories from History
    const categories = useMemo(() => {
        const s = new Set<string>();
        dailySummaries.forEach(ds => Object.keys(ds.category_breakdown || {}).forEach(k => s.add(k)));
        return Array.from(s).sort();
    }, [dailySummaries]);

    // Insights State
    const [recentChanges, setRecentChanges] = React.useState<RecentChangesInsight | null>(null);
    const [todayVsUsualInsight, setTodayVsUsualInsight] = React.useState<TodayVsUsualInsight | null>(null);

    React.useEffect(() => {
        if (!isLoading && dailySummaries.length > 0) {
            const fetchInsights = async () => {
                const changes = computeRecentChanges(spends);
                const todayVsUsual = await computeTodayVsUsual(spends);
                setRecentChanges(changes);
                setTodayVsUsualInsight(todayVsUsual);
            }
            fetchInsights();
        }
    }, [spends, isLoading, dailySummaries]);

    // 3. Chart Engine: Derived from Bounded Daily Summaries
    const aggregated = useMemo(() => {
        const today = new Date()
        const activeCategory = filters.categories?.[0];

        // --- TEMPORAL BOUNDING LOGIC ---
        let boundedSummaries = dailySummaries;
        let daysToProcess = 7;
        let lookbackStart = new Date(today);

        if (timeBound === 'week') {
            const thisWeek = TemporalEngine.getThisWeekRange(today);
            boundedSummaries = dailySummaries.filter(s => {
                const d = new Date(s.date);
                return d >= thisWeek.start && d < thisWeek.end;
            });
            daysToProcess = 7;
        } else if (timeBound === 'month') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            boundedSummaries = dailySummaries.filter(s => new Date(s.date) >= startOfMonth);
            daysToProcess = today.getDate();
        } else if (timeBound === 'last-month') {
            const startOfPrev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const endOfPrev = new Date(today.getFullYear(), today.getMonth(), 0);
            boundedSummaries = dailySummaries.filter(s => {
                const d = new Date(s.date);
                return d >= startOfPrev && d <= endOfPrev;
            });
            daysToProcess = endOfPrev.getDate();
            lookbackStart = endOfPrev;
        }

        // CONFIDENCE CALCULATION
        const confidence = AnalyticsConfidence.calculate(boundedSummaries, timeBound);

        // MAPS for O(1) Lookup
        const summaryMap = new Map<string, any>();
        boundedSummaries.forEach(s => {
            const dateKey = new Date(s.date).toDateString();
            summaryMap.set(dateKey, s);
        });

        let totalInBound = 0;
        boundedSummaries.forEach(s => {
            const amt = activeCategory ? (Number(s.category_breakdown?.[activeCategory]) || 0) : Number(s.total_amount);
            totalInBound += amt;
        });

        const totalTransactions = boundedSummaries.reduce((sum, s) => sum + s.entry_count, 0);

        // 3. Dominance (Restored for CloudOrbit)
        const categoryMap: Record<string, number> = {}
        boundedSummaries.forEach(s => {
            Object.entries(s.category_breakdown || {}).forEach(([cat, amount]) => {
                categoryMap[cat] = (categoryMap[cat] || 0) + Number(amount)
            })
        })
        const dominance: { category: string; total: number }[] = Object.entries(categoryMap)
            .map(([category, total]) => ({ category, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 6)

        // Calculate Net Flow Health (Normalized comparison)
        const flowSum = boundedSummaries.reduce((acc, s) => acc + Number(s.total_amount), 0);

        // Normalize: Compare Daily Average of current period vs Previous period
        const dailyAvgCurrent = flowSum / Math.max(1, daysToProcess);

        const prevBoundStart = new Date(lookbackStart);
        prevBoundStart.setDate(prevBoundStart.getDate() - daysToProcess);
        const prevSummaries = dailySummaries.filter(s => {
            const d = new Date(s.date);
            return d >= prevBoundStart && d < lookbackStart;
        });
        const prevSum = prevSummaries.reduce((acc, s) => acc + Number(s.total_amount), 0);
        const dailyAvgPrev = prevSum / Math.max(1, prevSummaries.length || daysToProcess);

        // Healthy if current daily burn is less than or equal to previous daily burn
        const netFlowHealth = dailyAvgCurrent <= (dailyAvgPrev * 1.05);

        return {
            confidence,
            netFlowHealth,
            dominance,
            metrics: {
                avgDailySpend: totalInBound / Math.max(1, daysToProcess),
                topCategory: 'Category Detection',
                entryCount: totalTransactions,
                totalFilteredAmount: totalInBound,
            },
            boundedSummaries
        }
    }, [dailySummaries, filters.categories, timeBound])

    const { metrics, confidence, netFlowHealth, dominance, boundedSummaries } = aggregated

    // Generate Poll Context Data (Cards 2 and 3)
    const pollData = useMemo(() => {
        // Discretionary heuristic list (lowercase)
        const nonEssentialKeywords = ['dining', 'entertainment', 'shopping', 'fun', 'coffee', 'starbucks', 'movie', 'subscriptions']
        const isDiscretionary = (cat: string) => nonEssentialKeywords.some(k => cat.toLowerCase().includes(k))

        // Find top non-essential category for Card 3
        const discretionaryCategories = dominance.filter(d => isDiscretionary(d.category));
        const topCategory = discretionaryCategories.length > 0 ? discretionaryCategories[0] : null;
        let categoryData = null;
        if (topCategory && metrics.totalFilteredAmount > 0) {
            categoryData = {
                category: topCategory.category,
                amount: topCategory.total,
                percentage: (topCategory.total / metrics.totalFilteredAmount) * 100
            }
        }

        // Find top single discretionary transaction for Card 2
        // We filter the raw `spends` by the active timebound dates to search individual transactions
        let topTransaction = null;
        if (boundedSummaries.length > 0) {
            const startStr = boundedSummaries[0].date;
            const endStr = boundedSummaries[boundedSummaries.length - 1].date;
            const start = new Date(startStr);
            const end = new Date(endStr);
            end.setHours(23, 59, 59, 999);

            const recentSpends = spends.filter(s => {
                const d = new Date(s.date);
                return d >= start && d <= end;
            })

            // Sort by amount desc
            const discretionaryTrans = recentSpends
                .filter(s => isDiscretionary(s.category))
                .sort((a, b) => Number(b.amount) - Number(a.amount));

            if (discretionaryTrans.length > 0) {
                // Return the biggest one
                const t = discretionaryTrans[0];
                topTransaction = {
                    title: t.category, // ParsedSpend may not have a title field, fall back to category
                    amount: Number(t.amount),
                    category: t.category
                }
            }
        }

        return {
            topTransaction,
            topCategory: categoryData
        }
    }, [dominance, metrics.totalFilteredAmount, spends, boundedSummaries])

    // 4. MILD ADVISOR: Generate 4 Insights for Transition Panel
    const advisorInsights = useMemo(() => {
        const insights: string[] = []

        // Insight 1: Health Pulse
        if (netFlowHealth) {
            insights.push("Your financial momentum feels steady and grounded today.")
        } else {
            insights.push("Your burn rate is drifting above the usual threshold. Might want to pace the rest of the week.")
        }

        // Insight 2: Core Dominance
        if (dominance.length > 0) {
            insights.push(`A significant portion of recent volume is flowing into ${dominance[0].category.toLowerCase()}. Does this align with your intentions?`)
        } else {
            insights.push("Observing your spending patterns to find where your volume flows.")
        }

        // Insight 3: Temporal Comparison
        if (todayVsUsualInsight?.hasData && todayVsUsualInsight.insight) {
            insights.push(todayVsUsualInsight.insight.message)
        } else {
            insights.push("Gathering enough days of history to compare today against your baseline.")
        }

        return insights
    }, [netFlowHealth, dominance, todayVsUsualInsight])

    const { aiInsights, aiPollPrompt, isInsightCached, insightCacheTime } = useAiInsights({
        authUser,
        isPro,
        netFlowHealth,
        dominance,
        metrics,
        pollData,
        timeBound
    });

    return (
        <motion.main
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen w-full bg-transparent pb-20 relative"
        >
            <ErrorBoundary>
                <Navbar />

                <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pt-20 md:pt-40 space-y-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-serif text-brand-moss mb-1 md:mb-2 text-center md:text-left">Analytics</h1>
                            </div>
                            {/* Archive Status Badge */}
                            <div className="flex justify-center md:justify-start">
                                {archiveStats && (
                                    <ArchiveStatusBadge
                                        lastArchiveDate={archiveStats.lastArchiveDate ? new Date(archiveStats.lastArchiveDate) : null}
                                        archivedCount={archiveStats.archivedEntries}
                                    />
                                )}
                                {!archiveStats && <Skeleton className="h-8 w-32 rounded-full" />}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 md:gap-4">
                            {isPro && (
                                <div className="hidden md:block px-3 py-1 rounded-full bg-brand-mist/10 border border-brand-mist/20">
                                    <span className="text-xs font-sans font-medium text-brand-sage mt-[1px] block tracking-wide">
                                        {confidence.label}
                                    </span>
                                </div>
                            )}

                            <TemporalBoundSelector value={timeBound} onChange={setTimeBound} />

                            <div className="flex bg-[#F2F8EF] p-1 rounded-full border border-[#E2E8DF]">
                                <button
                                    onClick={() => setViewMode('charts')}
                                    className={cn(
                                        "p-2 rounded-full transition-all",
                                        viewMode === 'charts' ? "bg-white shadow-sm text-brand-moss" : "text-brand-sage hover:text-brand-moss"
                                    )}
                                >
                                    <BarChart3 size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        "p-2 rounded-full transition-all",
                                        viewMode === 'grid' ? "bg-white shadow-sm text-brand-moss" : "text-brand-sage hover:text-brand-moss"
                                    )}
                                >
                                    <LayoutGrid size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12">
                            {/* Archive Gate Check (Pro Feature) */}
                            {!isArchiveEnabled && viewMode !== 'charts' && showArchiveGate ? (
                                <ArchiveGate onClose={handleArchiveCompleteLocal} />
                            ) : null}
                        </div>

                        <div className="col-span-12">
                            {isLoading ? (
                                <div className="grid grid-cols-12 gap-6">
                                    <Skeleton className="col-span-12 h-[300px] rounded-3xl bg-brand-lichen/5" />
                                    <Skeleton className="col-span-12 lg:col-span-4 h-[450px] rounded-3xl bg-brand-lichen/5" />
                                    <Skeleton className="col-span-12 lg:col-span-8 h-[450px] rounded-3xl bg-brand-lichen/5" />
                                </div>
                            ) : (
                                <>
                                    {viewMode === 'charts' ? (
                                        <div className="space-y-12 md:space-y-16">

                                            {/* 1. HERO SECTION: Pulse & Orbit */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center py-6 md:py-12">

                                                {/* LEFT: Financial Pulse (Siri Orb) */}
                                                <div className="relative flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px]">
                                                    {/* Base Data Orb */}
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-100 scale-75 md:scale-100">
                                                        <SiriOrb
                                                            size="320px"
                                                            breathing={true}
                                                            calibrating={isCalibrating}
                                                            colors={metrics.entryCount === 0 ? {
                                                                bg: "oklch(80% 0.05 40)",
                                                                c1: "oklch(70% 0.15 30)",
                                                                c2: "oklch(75% 0.12 50)",
                                                                c3: "oklch(72% 0.14 40)",
                                                            } : netFlowHealth ? {
                                                                bg: "oklch(80% 0.05 142)",
                                                                c1: "oklch(70% 0.12 142)",
                                                                c2: "oklch(75% 0.1 160)",
                                                                c3: "oklch(72% 0.12 150)",
                                                            } : {
                                                                bg: "oklch(60% 0.2 40)",
                                                                c1: "oklch(55% 0.25 35)",
                                                                c2: "oklch(65% 0.22 45)",
                                                                c3: "oklch(58% 0.24 40)",
                                                            }
                                                            }
                                                        />
                                                    </div>

                                                    {/* Overlay Sentiment Orb */}
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none scale-75 md:scale-100">
                                                        <AnimatePresence>
                                                            {activeSentiment && (
                                                                <motion.div
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    exit={{ opacity: 0 }}
                                                                    transition={{ duration: 2, ease: "easeInOut" }}
                                                                    className="absolute inset-0 flex items-center justify-center"
                                                                >
                                                                    <SiriOrb
                                                                        size="320px"
                                                                        breathing={true}
                                                                        colors={activeSentiment === 'anxious' ? {
                                                                            bg: "oklch(40% 0.1 140)",
                                                                            c1: "oklch(35% 0.1 135)",
                                                                            c2: "oklch(45% 0.12 145)",
                                                                            c3: "oklch(38% 0.15 150)",
                                                                        } : {
                                                                            bg: "oklch(65% 0.18 250)",
                                                                            c1: "oklch(60% 0.2 240)",
                                                                            c2: "oklch(70% 0.16 260)",
                                                                            c3: "oklch(62% 0.2 255)",
                                                                        }
                                                                        }
                                                                    />
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>

                                                    <div className="relative z-10 text-center space-y-2">
                                                        <h2 className="text-brand-ink text-[10px] md:text-sm uppercase tracking-[0.3em]">
                                                            Financial Pulse
                                                        </h2>
                                                        <div className="font-serif text-5xl md:text-7xl text-brand-ink tracking-tight">
                                                            {formatAmount(metrics.totalFilteredAmount, activeCurrency)}
                                                        </div>
                                                        <p className="text-brand-ink/80 font-medium text-xs md:text-base transition-colors duration-1000">
                                                            {metrics.entryCount === 0 ? "No pattern detected."
                                                                : activeSentiment === 'anxious' ? "It is okay to pause and breathe."
                                                                    : activeSentiment === 'grounded' ? "You are firmly rooted in your flow."
                                                                        : netFlowHealth ? "Healthy flow pattern detected."
                                                                            : "Higher burn rate than usual."}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* RIGHT: Interactive Polls */}
                                                <div className="relative flex items-center justify-center w-full">
                                                    {metrics.entryCount === 0 ? (
                                                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                                                            <div className="relative w-56 h-56 md:w-64 md:h-64">
                                                                <Image
                                                                    src="/images/empty_wallet.webp"
                                                                    alt="Empty wallet"
                                                                    fill
                                                                    className="object-contain drop-shadow-lg"
                                                                    priority
                                                                />
                                                            </div>
                                                            <p className="text-brand-sage italic font-serif text-sm max-w-xs">
                                                                Add a spend to begin reflecting.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <InteractivePolls
                                                            topDiscretionaryTransaction={pollData.topTransaction}
                                                            topDiscretionaryCategory={pollData.topCategory}
                                                            aiPrompt={aiPollPrompt}
                                                            onSentimentSelect={setActiveSentiment}
                                                            onHoverOption={setIsCalibrating}
                                                            onJournalSubmit={handleJournalSubmit}
                                                            initialSubmittedIndices={submittedJournalIndices}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            {metrics.entryCount === 0 ? (
                                                /* EMPTY STATE — No spending data yet */
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between px-2 mb-2 md:mb-6">
                                                        <h3 className="text-brand-sage/40 text-[10px] md:text-sm uppercase tracking-[0.2em] whitespace-nowrap">Insight Stream</h3>
                                                        <div className="h-px w-full bg-brand-mist/30 ml-4 md:ml-6"></div>
                                                    </div>

                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.6, delay: 0.2 }}
                                                        className="flex flex-col items-center justify-center text-center py-16 md:py-24 rounded-3xl border-2 border-dashed border-brand-lichen/20 bg-white/20 backdrop-blur-sm"
                                                    >
                                                        <div className="w-3 h-3 rounded-full bg-brand-sage/20 animate-pulse mb-6" />
                                                        <h3 className="font-serif text-2xl md:text-3xl text-brand-moss/60 tracking-tight mb-3">
                                                            {spends.length < 5 ? "Awaiting Initial Flow" : "Recalibrating Baseline"}
                                                        </h3>
                                                        <p className="text-brand-sage/50 text-sm md:text-base max-w-sm leading-relaxed font-light lowercase">
                                                            {spends.length < 5
                                                                ? "your mild advisor needs ~5 logged spends to begin seeing the rhythm of your flow."
                                                                : "gathering a few more days of data to establish a stable reference point for your insights."}
                                                        </p>
                                                        <div className="flex items-center gap-6 mt-8">
                                                            {["today vs usual", "recent changes", "mild advisor"].map((label, i) => (
                                                                <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-brand-sage/25">
                                                                    {label}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* 2. INSIGHTS STREAM (Card Flip) */}
                                                    <div className="space-y-6">
                                                        <div className="flex items-center justify-between px-2 mb-2 md:mb-6">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="text-brand-sage text-[10px] md:text-sm uppercase tracking-[0.2em] whitespace-nowrap">Insight Stream</h3>
                                                                {isInsightCached && insightCacheTime && (
                                                                    <span className="text-[10px] text-orange-500/80 italic lowercase hidden sm:inline-block">
                                                                        (cached {insightCacheTime})
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="h-px w-full bg-brand-mist/50 ml-4 md:ml-6"></div>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                                            {/* Card 1: Today vs Your Usual */}
                                                            <CardFlip
                                                                title="Today vs Your Usual"
                                                                subtitle="How today compares to your normal"
                                                                description="A quick comparison of today's spending against your typical day."
                                                                className="backdrop-blur-2xl bg-white/40 border-white/50"
                                                                features={
                                                                    todayVsUsualInsight?.hasData && todayVsUsualInsight.insight
                                                                        ? [{
                                                                            text: todayVsUsualInsight.insight.message,
                                                                            color: todayVsUsualInsight.insight.badge_color
                                                                        }]
                                                                        : [todayVsUsualInsight?.zeroStateMessage || "Observing your patterns..."]
                                                                }
                                                            />

                                                            {/* Card 2: What Changed Recently */}
                                                            <CardFlip
                                                                title="Recent Changes"
                                                                subtitle="Your recent trends"
                                                                description="A quick look at how your spending has shifted lately."
                                                                className="backdrop-blur-2xl bg-white/40 border-white/50"
                                                                features={
                                                                    recentChanges?.hasData
                                                                        ? recentChanges.insights.map(i => ({
                                                                            text: i.message,
                                                                            color: i.badge_color
                                                                        }))
                                                                        : [recentChanges?.zeroStateMessage || "Insufficient Baseline"]
                                                                }
                                                            />

                                                            {/* Mild Advisor / Transition Insights */}
                                                            <div className="col-span-1 sm:col-span-2">
                                                                <TransitionInsights insights={aiInsights || advisorInsights} className="h-full min-h-[220px]" />
                                                            </div>

                                                        </div>
                                                    </div>

                                                    {/* 3. DEEP DIVE */}
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                                                        {/* Radial Distribution Card */}
                                                        <DistributionRadialBoard dominance={dominance} />

                                                        {/* Velocity Distribution Card */}
                                                        <FlowVelocityBoard boundedSummaries={boundedSummaries} />
                                                    </div>
                                                </>
                                            )}

                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Grid View Tabs: Transactions | Archive History (Pro) */}
                                            <div className="flex items-center gap-3 border-b border-[#C2CDBE]/20 pb-4">
                                                <button
                                                    onClick={() => setGridViewMode('transactions')}
                                                    className={cn(
                                                        "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                                        gridViewMode === 'transactions'
                                                            ? "bg-[#4A5D4E] text-white"
                                                            : "text-[#5A6B5C] hover:bg-[#F5F7F4]"
                                                    )}
                                                >
                                                    Transactions
                                                </button>
                                                <button
                                                    onClick={() => setGridViewMode('archive')}
                                                    className={cn(
                                                        "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                                        gridViewMode === 'archive'
                                                            ? "bg-[#4A5D4E] text-white"
                                                            : "text-[#5A6B5C] hover:bg-[#F5F7F4]"
                                                    )}
                                                >
                                                    Archive History
                                                    {!isArchiveEnabled && (
                                                        <span className="text-[10px] px-2 py-0.5 bg-brand-sage/20 text-brand-sage rounded-full">
                                                            Restore
                                                        </span>
                                                    )}
                                                    {isArchiveEnabled && (
                                                        <span className="text-xs px-2 py-0.5 bg-[#8FA18F] text-white rounded-full">
                                                            Pro
                                                        </span>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Conditional Grid View Content */}
                                            <motion.div
                                                key={gridViewMode}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                {gridViewMode === 'transactions' ? (
                                                    <div className="space-y-4">
                                                        <SpendGridFilters filters={filters} onFiltersChange={setFilters} categories={categories} />
                                                        <SpendDataGrid
                                                            data={filteredSpends}
                                                            totalAmount={metrics.totalFilteredAmount}
                                                            isLoading={isLoading}
                                                        />
                                                    </div>
                                                ) : (
                                                    <ArchiveHistoryView />
                                                )}
                                            </motion.div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        </motion.main>
    )
}

