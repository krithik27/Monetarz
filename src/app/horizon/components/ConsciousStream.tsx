"use client";

import React, { useMemo } from "react";
import type { ParsedSpend } from "@/lib/parser";
import { isInflow } from "@/lib/parser";
import { formatAmount } from "@/lib/money";
import { useCurrency } from "@/context/CurrencyContext";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

import { type IncomeSource } from "@/context/SpendsContext";

interface Props {
    transactions: ParsedSpend[];
    incomeSources?: IncomeSource[];
}

// ─── Natural-language date labels ──────────────────────────────────────────
function getRelativeLabel(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);

    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff <= 6) return `${diff} days ago`;
    return date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

// ─── Category colour dots ───────────────────────────────────────────────────
const CATEGORY_DOT: Record<string, string> = {
    food: "bg-orange-400",
    groceries: "bg-emerald-400",
    transport: "bg-blue-400",
    shopping: "bg-purple-400",
    health: "bg-rose-400",
    entertainment: "bg-indigo-400",
    subscriptions: "bg-sky-400",
    utilities: "bg-amber-400",
    income: "bg-green-400",
    salary: "bg-green-400",
};
function categoryDot(cat: string | undefined): string {
    return CATEGORY_DOT[cat?.toLowerCase() ?? ""] ?? "bg-brand-lichen";
}

type DayGroup = {
    label: string;
    dateKey: string;
    entries: ParsedSpend[];
    totalOutflow: number;
};

export function ConsciousStream({ transactions, incomeSources }: Props) {
    const { activeCurrency } = useCurrency();

    // ── Group by calendar day ────────────────────────────────────────────────
    const groups = useMemo<DayGroup[]>(() => {
        const map = new Map<string, (ParsedSpend & { isProjected?: boolean })[]>();
        
        // 1. Process actual transactions
        for (const t of transactions) {
            const key = (t.date instanceof Date ? t.date : new Date(t.date)).toISOString().slice(0, 10);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(t);
        }

        // 2. Inject Virtual Inflows from Wallet
        if (incomeSources) {
            const today = new Date();
            // We look at the last 30 days to match the chart's window
            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(today.getDate() - i);
                const dayOfMonth = date.getDate();
                const dateKey = date.toISOString().slice(0, 10);

                const sourcesForDay = (incomeSources || []).filter((s: IncomeSource) => (s.dayOfMonth || 1) === dayOfMonth);
                
                if (sourcesForDay.length > 0) {
                    if (!map.has(dateKey)) map.set(dateKey, []);
                    
                    sourcesForDay.forEach((source: IncomeSource) => {
                        // Check if an actual transaction with same description/amount exists to avoid clutter?
                        // For now, project them as distinct entries.
                        map.get(dateKey)!.push({
                            id: `projected-${source.id}-${dateKey}`,
                            description: source.name,
                            amount: source.amount,
                            category: "income",
                            money: { amountMinor: source.amount * 100, currency: activeCurrency },
                            date: new Date(dateKey),
                            isProjected: true,
                            source: "regex", // Dummy
                            needsReview: false,
                            reviewReasons: [],
                            categoryCandidates: [{ category: "income", score: 1 }],
                        } as any);
                    });
                }
            }
        }

        return [...map.entries()]
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([dateKey, entries]) => ({
                label: getRelativeLabel(new Date(dateKey)),
                dateKey,
                entries,
                totalOutflow: entries.filter(e => !isInflow(e)).reduce((s, e) => s + e.amount, 0),
            }));
    }, [transactions, incomeSources, activeCurrency]);

    if (groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-30">
                <Waves className="h-10 w-10 text-brand-lichen" />
                <p className="font-serif italic text-brand-ink text-lg text-center">
                    Your stream of awareness is empty.<br />Start logging to see your flow.
                </p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[1.85rem] top-0 bottom-0 w-px bg-gradient-to-b from-brand-lichen/60 via-brand-lichen/20 to-transparent pointer-events-none" />

            <div className="flex flex-col gap-10">
                {groups.map((group, gi) => (
                    <motion.div
                        key={group.dateKey}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: gi * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* ── Day Header ──────────────────────────────────── */}
                        <div className="flex items-center gap-4 mb-5">
                            {/* Node dot on timeline */}
                            <div className="relative flex-shrink-0 w-[3.7rem] flex justify-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-brand-moss ring-4 ring-brand-cream" />
                            </div>
                            <div className="flex items-baseline gap-3 flex-1">
                                <span className="text-xl font-sans font-bold text-brand-ink tracking-tight leading-none">
                                    {group.label}
                                </span>
                                {group.totalOutflow > 0 && (
                                    <span className="text-xs font-sans text-brand-sage font-medium italic">
                                        spent {formatAmount(group.totalOutflow, activeCurrency)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* ── Transaction entries ──────────────────────────── */}
                        <div className="flex flex-col gap-2 pl-[3.7rem]">
                            {group.entries.map((t, ti) => {
                                const inflow = isInflow(t);
                                return (
                                    <motion.div
                                        key={t.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.35, delay: gi * 0.06 + ti * 0.03 }}
                                        className="group flex items-center justify-between px-5 py-4 bg-white/60 hover:bg-white rounded-2xl border border-white/80 hover:border-brand-lichen/30 hover:shadow-sm transition-all duration-300 cursor-default"
                                    >
                                        {/* Left: icon + description */}
                                        <div className="flex items-center gap-4 min-w-0">
                                            {/* Category dot + icon */}
                                            <div className={cn(
                                                "flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300",
                                                inflow
                                                    ? (t as any).isProjected 
                                                        ? "bg-brand-mist text-brand-moss border border-brand-lichen/20 shadow-inner" 
                                                        : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
                                                    : "bg-brand-cream/80 text-brand-sage group-hover:bg-orange-50 group-hover:text-orange-500"
                                            )}>
                                                {inflow
                                                    ? (t as any).isProjected ? <Waves className="h-4 w-4 animate-pulse" /> : <ArrowDownLeft className="h-4 w-4" />
                                                    : <ArrowUpRight className="h-4 w-4" />
                                                }
                                            </div>

                                            <div className="min-w-0">
                                                <p className="font-sans font-semibold text-brand-ink text-base capitalize leading-snug truncate">
                                                    {t.description}
                                                    {(t as any).isProjected && (
                                                        <span className="ml-2 text-[9px] uppercase tracking-widest text-emerald-600/60 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
                                                            Wallet
                                                        </span>
                                                    )}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {t.category && (
                                                        <>
                                                            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", categoryDot(t.category))} />
                                                            <span className="text-[11px] text-brand-sage font-sans font-medium capitalize">
                                                                {t.category}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: amount */}
                                        <div className={cn(
                                            "flex-shrink-0 text-lg font-sans font-bold tracking-tight transition-colors duration-300 ml-4 tabular-nums",
                                            inflow
                                                ? "text-emerald-600 group-hover:text-emerald-700"
                                                : "text-red-500/80 group-hover:text-red-600"
                                        )}>
                                            {inflow ? "+" : "−"}{formatAmount(t.amount, t.currency || activeCurrency)}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                ))}

                {/* Soft end cap */}
                <div className="pl-[3.7rem] mt-2">
                    <p className="text-xs font-serif italic text-brand-lichen/60">
                        — end of recent stream —
                    </p>
                </div>
            </div>
        </div>
    );
}
