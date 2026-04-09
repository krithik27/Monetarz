"use client";

import React, { useMemo, useState } from "react";
import { useSpends } from "@/context/SpendsContext";
import { useCurrency } from "@/context/CurrencyContext";
import { formatAmount } from "@/lib/money";
import { TemporalEngine } from "@/lib/temporal";
import { isInflow } from "@/lib/parser";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingDown, TrendingUp, Calendar, AlertTriangle, Info, ChevronDown, ChevronUp } from "lucide-react";

export const HorizonPredictor = () => {
    const { monthlyIncome, monthlyIntention, recurrentSpends, spends } = useSpends();
    const { activeCurrency } = useCurrency();
    const [showBreakdown, setShowBreakdown] = useState(false);

    const stats = useMemo(() => {
        const now = new Date();
        const monthRange = TemporalEngine.getThisMonthRange();

        // Planning Ceiling: Prioritize Intention if set, otherwise fallback to Income
        const planningCeiling = monthlyIntention > 0 ? monthlyIntention : monthlyIncome;

        // 1. Fixed Commitments (monthly total)
        const totalRecurrent = recurrentSpends
            .filter(s => s.is_active !== false)
            .reduce((sum, s) => sum + s.amount, 0);

        // 2. Variable Spend so far
        const currentOutflow = spends
            .filter(s => !isInflow(s) && TemporalEngine.isInRange(s.date, monthRange))
            .reduce((sum, s) => sum + s.amount, 0);

        // 3. Temporal Context
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dayOfMonth = now.getDate();
        const daysRemaining = Math.max(1, daysInMonth - dayOfMonth + 1);
        const daysPassed = dayOfMonth - 1;

        // --- AMORTIZED LOGIC ---
        const totalMonthlyBudget = Math.max(0, planningCeiling - totalRecurrent);
        const standardDailyAllowance = totalMonthlyBudget / daysInMonth;

        const expectedSpendSoFar = standardDailyAllowance * daysPassed;
        const paceVariance = expectedSpendSoFar - currentOutflow;

        const dailyBurnLimit = Math.max(0, standardDailyAllowance + (paceVariance / daysRemaining));

        // 4. Progress & Health
        const totalSpent = totalRecurrent + currentOutflow;
        const budgetUsedPercent = planningCeiling > 0 ? Math.min(100, (totalSpent / planningCeiling) * 100) : 0;
        const isOverbudget = totalSpent > planningCeiling && planningCeiling > 0;
        const hasNoBudget = planningCeiling === 0;

        // Contextual insight
        let insight = "";
        let insightType: "good" | "warn" | "over" | "empty" = "empty";

        if (hasNoBudget) {
            insight = "Set up a monthly intention or income to activate your horizon.";
            insightType = "empty";
        } else if (isOverbudget) {
            const over = formatAmount(totalSpent - planningCeiling, activeCurrency);
            insight = `You're ${over} over your monthly plan. Try to minimize costs.`;
            insightType = "over";
        } else if (paceVariance < -(standardDailyAllowance * 0.5)) {
            insight = "Spending slightly faster than your baseline. Try a 'Zero Day' tomorrow.";
            insightType = "warn";
        } else if (paceVariance > 0) {
            const savings = formatAmount(paceVariance, activeCurrency);
            insight = `You've banked ${savings} in relative savings so far this month!`;
            insightType = "good";
        } else {
            insight = "You're pacing perfectly with your monthly intention.";
            insightType = "good";
        }

        return {
            totalRecurrent,
            currentOutflow,
            totalMonthlyBudget,
            standardDailyAllowance,
            paceVariance,
            dailyBurnLimit,
            daysRemaining,
            daysInMonth,
            dayOfMonth,
            budgetUsedPercent,
            isOverbudget,
            hasNoBudget,
            insight,
            insightType
        };
    }, [monthlyIntention, monthlyIncome, recurrentSpends, spends, activeCurrency]);

    const barColor = stats.isOverbudget
        ? "from-brand-coral to-rose-500"
        : stats.paceVariance < 0
            ? "from-amber-400 to-orange-500"
            : "from-brand-moss to-emerald-500";

    const barGlow = stats.isOverbudget
        ? "shadow-[0_0_12px_rgba(244,63,94,0.3)]"
        : stats.paceVariance < 0
            ? "shadow-[0_0_12px_rgba(245,158,11,0.3)]"
            : "shadow-[0_0_12px_rgba(16,185,129,0.25)]";

    return (
        <div className="bg-white/80 backdrop-blur-xl p-7 rounded-[3rem] border border-white/20 shadow-sm flex flex-col h-full relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-300/10 blur-3xl rounded-full pointer-events-none group-hover:bg-amber-300/20 transition-all duration-700" />

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h3 className="text-lg font-serif text-horizon-ink tracking-tight flex items-center gap-2 font-medium">
                            <Zap className="size-5 text-amber-500 fill-amber-500/20" />
                            Daily Horizon
                        </h3>
                        <p className="text-[11px] text-horizon-muted font-serif italic mt-0.5">Predictive allowance logic</p>
                    </div>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold font-sans tracking-tight">
                        <Calendar className="size-3" /> {stats.daysRemaining}d left
                    </span>
                </div>

                {/* Main Metric */}
                <div className="flex-1 flex flex-col justify-center">
                    {stats.hasNoBudget ? (
                        <div className="text-center py-6 space-y-2">
                            <Info className="size-8 text-horizon-muted/30 mx-auto" />
                            <p className="text-sm text-horizon-muted/60 font-serif italic">Add a spending intention or income to see your Daily Horizon</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-horizon-muted font-sans font-bold mb-1">Max Per Day</p>
                            <motion.div
                                key={stats.dailyBurnLimit}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`text-6xl font-sans font-bold tracking-tight ${stats.dailyBurnLimit === 0 ? "text-red-500" : "text-horizon-ink"}`}
                            >
                                {formatAmount(stats.dailyBurnLimit, activeCurrency)}
                            </motion.div>

                            {/* Budget progress bar */}
                            <div className="mt-5 space-y-1">
                                <div className="flex justify-between text-[10px] text-horizon-muted/60 font-sans uppercase tracking-wider">
                                    <span>Pace relative to budget</span>
                                    <span className={stats.paceVariance >= 0 ? "text-emerald-600" : "text-amber-600"}>
                                        {stats.paceVariance >= 0 ? "+" : ""}{formatAmount(stats.paceVariance, activeCurrency)}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-brand-lichen/20 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full bg-gradient-to-r ${barColor} ${barGlow}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.budgetUsedPercent}%` }}
                                        transition={{ duration: 1.2, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Insight pill */}
                {stats.insight && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-6 px-5 py-4 rounded-2xl flex items-start gap-3 text-xs font-serif leading-relaxed
                            ${stats.insightType === "good" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" :
                                stats.insightType === "warn" ? "bg-amber-50 text-amber-800 border border-amber-100" :
                                    stats.insightType === "over" ? "bg-red-50 text-red-800 border border-red-100" :
                                        "bg-slate-50 text-slate-500 border border-slate-100"}`}
                    >
                        {stats.insightType === "good" ? <TrendingDown className="size-4 shrink-0 text-emerald-500" /> :
                            stats.insightType === "over" ? <AlertTriangle className="size-4 shrink-0 text-red-500" /> :
                                <TrendingUp className="size-4 shrink-0 text-amber-500" />}
                        <span>{stats.insight}</span>
                    </motion.div>
                )}

                {/* Breakdown toggle (Improvement 4) */}
                {!stats.hasNoBudget && (
                    <>
                        <button
                            onClick={() => setShowBreakdown(v => !v)}
                            className="mt-5 flex items-center justify-center w-full gap-2 px-1 py-1 text-[11px] text-horizon-muted/50 hover:text-horizon-muted font-serif italic transition-colors"
                        >
                            <span>{showBreakdown ? "Hide math" : "How is this calculated?"}</span>
                            {showBreakdown ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                        </button>

                        <AnimatePresence>
                            {showBreakdown && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-4 mt-2 border-t border-horizon-ink/5 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[9px] uppercase tracking-widest text-horizon-muted/70 font-sans mb-0.5">Base Daily</p>
                                                <p className="text-sm font-sans font-medium text-horizon-ink/80">{formatAmount(stats.standardDailyAllowance, activeCurrency)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] uppercase tracking-widest text-horizon-muted/70 font-sans mb-0.5">Fixed Commitments</p>
                                                <p className="text-sm font-sans font-medium text-horizon-muted">{formatAmount(stats.totalRecurrent, activeCurrency)}</p>
                                            </div>
                                        </div>
                                        <div className="bg-horizon-ink/[0.02] p-3 rounded-xl border border-horizon-ink/5">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-sans text-horizon-muted/80">Monthly Pool</span>
                                                <span className="text-[10px] font-sans font-medium">{formatAmount(stats.totalMonthlyBudget, activeCurrency)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-sans text-horizon-muted/80">Variable Spend</span>
                                                <span className="text-[10px] font-sans font-medium text-horizon-spend">-{formatAmount(stats.currentOutflow, activeCurrency)}</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-horizon-muted/50 font-serif italic text-center">
                                            Standard daily adjusted by your month-to-date variance of {formatAmount(stats.paceVariance, activeCurrency)}.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>
        </div>
    );
};
