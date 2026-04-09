"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

import { TemporalEngine } from "@/lib/temporal";
import { differenceInDays, isToday as dateFnsIsToday } from "date-fns";
import { useSpends } from "@/context/SpendsContext";
import { useWeeklyAggregation } from "@/hooks/useWeeklyAggregation";
import { IntentionCard } from "./components/IntentionCard";
import { RhythmStrip } from "./components/RhythmStrip";
import { CategoryObservations } from "./components/CategoryObservations";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    MiniCalendar,
    MiniCalendarDay,
    MiniCalendarDays,
    MiniCalendarNavigation,
} from "@/components/ui/mini-calendar";
import { formatAmount } from "@/lib/money";
import { useCurrency } from "@/context/CurrencyContext";

export default function WeeklyPage() {
    const { weeklyGoal } = useSpends();
    const { activeCurrency } = useCurrency();

    const isPro = true; // MOCK until Stripe integration

    // State for navigation (Starting from Today's week)
    const [currentDate, setCurrentDate] = useState(() => TemporalEngine.getThisWeekRange(new Date()).start);

    // CRITICAL FIX: Use dedicated weekly aggregation hook to bypass pagination
    const { stats, isLoading: weeklyLoading } = useWeeklyAggregation(currentDate, weeklyGoal);

    return (
        <motion.main
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen text-brand-ink font-sans pb-32 overflow-y-auto selection:bg-brand-moss/20 relative"
        >
            <Navbar />
            <div className="max-w-4xl mx-auto pt-20 md:pt-32 px-6 md:px-12">

                {/* 0. Navigation & Context */}
                <div className="flex flex-col md:flex-row justify-between items-center md:items-center mb-10 md:mb-12 gap-6">
                    <div className="md:hidden pt-4">
                        <h1 className="text-3xl md:text-5xl font-black font-sans uppercase tracking-tighter text-brand-moss lowercase">Reflections</h1>
                    </div>
                    <div className="hidden md:block" />

                    <div className="w-full md:w-auto bg-white/50 p-2 rounded-xl backdrop-blur-sm border border-brand-mist/20 overflow-x-auto">
                        {/* Dynamic Mini Calendar: Controls the week view */}
                        <MiniCalendar
                            className="border-none bg-transparent p-0 gap-4"
                            startDate={currentDate}
                            onStartDateChange={(date) => date && setCurrentDate(date)}
                            days={7} // Show full week
                        >
                            <div className="flex items-center gap-2">
                                <MiniCalendarNavigation direction="prev" variant="ghost" className="h-8 w-8 text-brand-sage" />
                                <MiniCalendarDays className="gap-1">
                                    {(date) => (
                                        <MiniCalendarDay
                                            key={date.toISOString()}
                                            date={date}
                                            className={cn(
                                                "h-12 w-10 text-brand-ink p-1",
                                                // Only highlight today - clear, unambiguous styling
                                                dateFnsIsToday(date)
                                                    ? "bg-brand-moss text-white ring-2 ring-brand-coral/50 ring-offset-1 rounded-md"
                                                    : "hover:bg-brand-mist/50"
                                            )}
                                        />
                                    )}
                                </MiniCalendarDays>
                                <MiniCalendarNavigation direction="next" variant="ghost" className="h-8 w-8 text-brand-sage" />
                            </div>
                        </MiniCalendar>
                    </div>
                </div>

                {/* 1. LAYER A: THE INTENTION (Anchor) */}
                <IntentionCard />

                {/* 2. LAYER B: PROGRESS (Grounded) */}
                <div className="mb-16 bg-white/20 p-8 md:p-12 rounded-3xl border border-brand-mist/50">
                    <div className="flex justify-between items-baseline mb-6 px-1">
                        <span className="text-brand-sage text-xl uppercase tracking-[0.2em] font-sans font-bold">
                            {stats.progress >= 100 ? "Limit Exceeded" : "Weekly Pulse"}
                        </span>
                        <div className="text-right text-brand-sage text-xl tracking-[0.2em] font-sans font-bold">
                            <span className={cn(
                                "transition-colors duration-500",
                                stats.progress >= 100 ? "text-red-800/60 font-black" : "text-brand-moss"
                            )}>
                                {Math.round(stats.progress)}%
                            </span>
                        </div>
                    </div>
                    <div className="w-full h-10 bg-brand-mist/30 rounded-full overflow-hidden relative shadow-inner">
                        <motion.div
                            className={cn(
                                "absolute top-0 left-0 bottom-0 rounded-full transition-colors duration-1000",
                                stats.progress >= 100 ? "bg-red-800/40" : "bg-brand-moss"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(stats.progress, 100)}%` }} // Visually capped at 100%
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    </div>
                    {isPro && stats.comparisonPhrase && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 px-1 text-brand-sage/80 text-sm tracking-wide font-sans italic"
                        >
                            {stats.comparisonPhrase}
                        </motion.div>
                    )}

                    {/* ── Spend Velocity Sentence ─────────────────────── */}
                    {stats.progress < 100 && stats.total > 0 && (() => {
                        const daysElapsed = Math.max(1, differenceInDays(new Date(), currentDate) + 1);
                        const dailyRate = stats.total / daysElapsed;
                        const remaining = Math.max(0, stats.goal - stats.total);
                        const daysToGoal = dailyRate > 0 ? Math.ceil(remaining / dailyRate) : null;
                        return (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="mt-3 px-1 text-sm text-brand-sage font-sans italic"
                            >
                                Spending ~{formatAmount(Math.round(dailyRate), activeCurrency)}/day
                                {daysToGoal !== null && daysToGoal > 0
                                    ? ` — goal reached in ~${daysToGoal} day${daysToGoal !== 1 ? "s" : ""}`
                                    : " — on track"}
                            </motion.p>
                        );
                    })()}
                    {stats.progress >= 100 && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 px-1 text-brand-sage/80 text-base font-serif leading-relaxed"
                        >
                            Flow has exceeded your weekly intention by {formatAmount((stats.total - stats.goal), activeCurrency)}.
                        </motion.div>
                    )}
                </div>

                {/* 3. LAYER C: RHYTHM (Visual Pulse / Skiper52) */}
                <div className="mb-20">
                    <div className="mb-8 px-1">
                        <span className="text-brand-sage text-xl uppercase tracking-[0.2em] font-sans font-bold">
                            Shape of the Week
                        </span>
                    </div>
                    <RhythmStrip
                        weeklySpends={stats.spends}
                        today={currentDate}
                        isPro={isPro}
                        predictedTotal={stats.predictedTotal}
                    /> {/* Sync rhythm strip to view */}
                </div>

                {/* 4. LAYER D: OBSERVATIONS */}
                <div className="max-w-4xl mx-auto">
                    <CategoryObservations breakdown={stats.breakdown} />
                </div>

                {/* 5. FUTURE LAYERS (Gap) */}
                <div className="h-32" />

            </div>
        </motion.main>
    );
}
