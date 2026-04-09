"use client";

import { useMemo, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useSpends } from "@/context/SpendsContext";
import { Home, Layers, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { SummaryHeader } from "./components/SummaryHeader";
import { MonthlyIntentionCard } from "./components/MonthlyIntentionCard";
import { IncomeWalletCard } from "./components/IncomeWalletCard";
import { HorizonPredictor } from "./components/HorizonPredictor";
import { RecurrentSpendsBoard } from "./components/RecurrentSpendsBoard";
import { RhythmBoard } from "./components/RhythmBoard";
import { GoalTracker } from "./components/GoalTracker";
import { ConsciousStream } from "./components/ConsciousStream";

import { RippleButton } from "@/components/ui/ripple-button";

const InteractiveFinancialChart = dynamic(() => import("@/components/interactive-sales-chart").then(m => m.InteractiveFinancialChart), { ssr: false });
const TransactionFrequencyChart = dynamic(() => import("@/components/interactive-logs-chart").then(m => m.TransactionFrequencyChart), { ssr: false });
const CategorySpendChart = dynamic(() => import("@/components/category-spend-chart").then(m => m.CategorySpendChart), { ssr: false });
const WeeklySpendChart = dynamic(() => import("@/components/weekly-spend-chart").then(m => m.WeeklySpendChart), { ssr: false });

export default function HorizonPage() {
    const { spends, incomeSources, isLoading } = useSpends();
    const [showAnalytics, setShowAnalytics] = useState(false);
    const analyticsRef = useRef<HTMLDivElement>(null);

    const today = new Date();
    const recentTransactions = useMemo(() => {
        return [...spends]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 30);
    }, [spends]);

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="space-y-8 pt-10 px-6 md:px-12">
                <div className="h-10 w-48 rounded-full bg-brand-lichen/20 animate-breathing" />
                <div className="h-24 rounded-[2rem] bg-white animate-breathing border border-brand-lichen/40" />
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-56 rounded-[2rem] bg-white animate-breathing border border-brand-lichen/20" />
                    <div className="h-56 rounded-[2rem] bg-white animate-breathing border border-brand-lichen/20" />
                </div>
                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-64 rounded-[2rem] bg-white animate-breathing border border-brand-lichen/20" />
                    <div className="h-64 rounded-[2rem] bg-white animate-breathing border border-brand-lichen/20" />
                </div>
                {/* Row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-72 rounded-[2rem] bg-white animate-breathing border border-brand-lichen/20" />
                    <div className="h-72 rounded-[2rem] bg-white animate-breathing border border-brand-lichen/20" />
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="space-y-10 pt-10 md:pt-12 px-6 md:px-12 relative z-10 pb-28">


                {/* ── Page Header ──────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">

                        {/* Title block */}
                        <div className="text-center md:text-left flex flex-col justify-center h-full">
                            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                                <span className="text-[10px] uppercase tracking-[0.3em] text-orange-500  font-sans font-semibold bg-orange-500/5 px-3 py-1 rounded-full ring-1 ring-orange-500/30">
                                    ✦ Pro
                                </span>
                            </div>
                            {/* Enlarged title */}
                            <h1 className="text-5xl md:text-6xl font-sans font-bold text-orange-500 leading-tight tracking-tight drop-shadow-sm">
                                Financial Horizon ❋
                            </h1>
                            {/* Date as sans uppercase label (Horizon-specific voice) */}
                            <p className="text-orange-500 font-sans font-medium text-xs uppercase tracking-[0.25em] mt-2">
                                {today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                            </p>
                        </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-3">
                            <a href="/">
                                <RippleButton
                                    className="h-10 w-10 p-0 flex items-center justify-center bg-orange-50 text-orange-500 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_16px_rgba(255,199,8,0.15)] transition-all border border-orange-500/20"
                                    rippleColor="rgba(255, 199, 8, 0.2)"
                                    duration="600ms"
                                >
                                    <Home className="h-5 w-5 text-orange-500" />
                                </RippleButton>
                            </a>
                        </div>
                        {/* Live badge */}
                        <div className="flex items-center gap-2 text-sm font-serif italic text-brand-ink bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-green-500/30">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                            </span>
                            Live
                        </div>
                    </div>
                </div>

                {/* ── Summary Header (Sticky) ───────────────────────────── */}
                <div className="relative z-20">
                    <SummaryHeader />
                </div>

                {/* ── Main Content — 3 Stacked Rows ────────────────────── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative z-10 space-y-8"
                >
                    {/* Row 1: Monthly Intention + Recurrent Commitments */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch"
                    >
                        <MonthlyIntentionCard />
                        <RecurrentSpendsBoard />
                    </motion.div>

                    {/* Row 2: Income Wallet + Predictive Burn Rate */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch"
                    >
                        <IncomeWalletCard />
                        <HorizonPredictor />
                    </motion.div>

                    {/* Row 3: Goal Tracker + Monthly Rhythms */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch"
                    >
                        <GoalTracker />
                        <RhythmBoard />
                    </motion.div>
                </motion.div>

                {/* ── Progressive Disclosure: Deep Dive Toggle ───────────── */}
                <div className="flex flex-col items-center gap-6 mt-4">
                    <button
                        onClick={() => {
                            setShowAnalytics(v => !v);
                            if (!showAnalytics) {
                                setTimeout(() => {
                                    analyticsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                }, 350);
                            }
                        }}
                        className="group flex items-center gap-3 px-10 py-4 rounded-full bg-brand-ink text-white border border-brand-ink hover:bg-white hover:text-brand-ink transition-all duration-500 shadow-lg hover:shadow-xl font-sans font-extrabold text-xs uppercase tracking-[0.2em]"
                    >
                        <Layers className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        {showAnalytics ? "Close Deep Dive" : "Deep Dive Analysis"}
                        {showAnalytics
                            ? <ChevronUp className="w-3.5 h-3.5" />
                            : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <AnimatePresence>
                        {showAnalytics && (
                            <motion.div
                                ref={analyticsRef}
                                key="analytics"
                                initial={{ opacity: 0, height: 0, scale: 0.98 }}
                                animate={{ opacity: 1, height: "auto", scale: 1 }}
                                exit={{ opacity: 0, height: 0, scale: 0.98 }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                className="w-full overflow-hidden"
                            >
                                {/* ── Analytics Charts ──────────────────────────── */}
                                <div className="flex flex-col gap-8 pt-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <InteractiveFinancialChart data={spends} />
                                        <TransactionFrequencyChart data={spends} />
                                        <CategorySpendChart data={spends} />
                                        <WeeklySpendChart data={spends} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Conscious Stream (Timeline Feed) ─────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="pt-16 border-t border-brand-lichen/20"
                >
                    <div className="flex items-center gap-4 mb-10">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-lichen/40 to-transparent" />
                        <span className="text-4xl flex items-center gap-3 font-sans font-bold text-brand-ink tracking-tight">
                            ⧓ Conscious Stream ⧓
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-lichen/40 to-transparent" />
                    </div>
                    <p className="text-center text-sm font-sans font-medium text-brand-sage mb-10 -mt-6 uppercase tracking-widest">
                        A timeline of your conscious choices
                    </p>
                    <ConsciousStream transactions={recentTransactions} incomeSources={incomeSources} />
                </motion.div>
            </div>
        </ErrorBoundary>
    );
}
