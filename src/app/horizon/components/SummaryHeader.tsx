"use client";

import React, { useMemo } from "react";
import { useSpends } from "@/context/SpendsContext";
import { motion } from "framer-motion";
import { formatAmount } from "@/lib/money";
import { useCurrency } from "@/context/CurrencyContext";
import { TemporalEngine } from "@/lib/temporal";
import { isInflow } from "@/lib/parser";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SummaryHeader — Sticky "Available Balance" header for Horizon Pro.
 * Shows: Total Earned, Total Spent, and Net Balance for this month.
 */
export const SummaryHeader = () => {
    const { spends, monthlyIntention, monthlyIncome } = useSpends();
    const { activeCurrency } = useCurrency();

    const monthRange = TemporalEngine.getThisMonthRange();

    const stats = useMemo(() => {
        const monthSpends = spends.filter(s => TemporalEngine.isInRange(s.date, monthRange));

        // Always use actual outflow from transactions
        const totalOutflow = monthSpends
            .filter(s => !isInflow(s))
            .reduce((sum, s) => sum + s.amount, 0);

        // Always use wallet-projected income as the canonical inflow.
        // Transaction-based income entries (category=income/salary) belong in analytics,
        // not the summary banner — they cause stale cache issues and user confusion.
        const netBalance = monthlyIncome - totalOutflow;

        return { effectiveInflow: monthlyIncome, totalOutflow, netBalance };
    }, [spends, monthlyIncome]);

    const isPositive = stats.netBalance >= 0;

    // Spend pace: how much of the monthly intention has been spent
    const spendPacePercent = monthlyIntention > 0
        ? Math.min(100, (stats.totalOutflow / monthlyIntention) * 100)
        : 0;
    const paceColor = spendPacePercent >= 90 ? "from-brand-coral to-rose-500" : spendPacePercent >= 70 ? "from-amber-400 to-orange-500" : "from-brand-moss to-emerald-500";
    const paceGlow = spendPacePercent >= 90 ? "shadow-[0_0_12px_rgba(244,63,94,0.3)]" : spendPacePercent >= 70 ? "shadow-[0_0_12px_rgba(245,158,11,0.3)]" : "shadow-[0_0_12px_rgba(16,185,129,0.25)]";

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border border-brand-lichen/30 ring-1 ring-white/50 rounded-[2rem] p-6 md:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.04)]"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                {/* Net Balance — Hero Number */}
                <div className="flex items-center gap-5">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg ${isPositive
                        ? "bg-gradient-to-br from-emerald-400 to-green-600 shadow-emerald-200/50"
                        : "bg-gradient-to-br from-red-400 to-rose-600 shadow-rose-200/50"
                        }`}>
                        <Wallet className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.25em] text-brand-sage/80 font-sans font-medium mb-1">
                            Available This Month
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-4xl md:text-5xl font-sans font-bold tracking-tight ${isPositive ? "text-brand-ink" : "text-brand-coral"
                                }`}>
                                {formatAmount(Math.abs(stats.netBalance), activeCurrency)}
                            </span>
                            {!isPositive && (
                                <span className="text-sm font-sans font-medium italic text-brand-rust uppercase tracking-wider">overdrawn</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sub-stats: Earned & Spent */}
                <div className="flex flex-wrap gap-3 md:gap-4">
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        aria-label={`Inflow: ${formatAmount(stats.effectiveInflow, activeCurrency)}`}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-100"
                    >
                        <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-emerald-700/80 font-sans font-medium">Wallet</p>
                            <p className="text-base font-sans font-bold text-emerald-700 tracking-tight">
                                {formatAmount(stats.effectiveInflow, activeCurrency)}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        aria-label={`Spent this month: ${formatAmount(stats.totalOutflow, activeCurrency)}`}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-red-50/80 border border-red-100"
                    >
                        <div className="h-8 w-8 rounded-xl bg-red-100 flex items-center justify-center">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-red-600/80 font-sans font-medium">Outflow</p>
                            <p className="text-base font-sans font-bold text-red-600 tracking-tight">
                                {formatAmount(stats.totalOutflow, activeCurrency)}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Spend Pace Bar — only shown when monthly intention is set */}
            {monthlyIntention > 0 && (
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-1.5">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-brand-sage/80 font-sans font-medium">Spend Pace</p>
                        <p className="text-[10px] font-sans text-brand-sage/80">
                            {Math.round(spendPacePercent)}% of {formatAmount(monthlyIntention, activeCurrency)} intention
                        </p>
                    </div>
                    <div className="h-1.5 w-full bg-brand-lichen/20 rounded-full overflow-hidden">
                        <motion.div
                            className={cn("h-full rounded-full bg-gradient-to-r", paceColor, paceGlow)}
                            initial={{ width: 0 }}
                            animate={{ width: `${spendPacePercent}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                    </div>
                </div>
            )}
        </motion.div>
    );
};
