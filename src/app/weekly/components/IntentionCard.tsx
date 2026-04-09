"use client";

import React, { useState, useMemo } from "react";
import { useSpends } from "@/context/SpendsContext";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrencySymbol, formatAmount } from "@/lib/money";
import { TemporalEngine } from "@/lib/temporal";
import { isInflow } from "@/lib/parser";

/**
 * Computes how many consecutive completed weeks the user stayed under their
 * weekly goal (outflow < goal). Looks backwards from the most-recent completed
 * week (i.e. excludes the current in-progress week unless today is Sunday).
 *
 * Returns 0 if no streak, or if goal is 0.
 */
function computeWeekStreak(spends: ReturnType<typeof useSpends>["spends"], goal: number): number {
    if (goal <= 0 || spends.length === 0) return 0;

    // Build a map: ISO week key → total outflow
    const weekTotals: Record<string, number> = {};
    spends
        .filter(s => !isInflow(s))
        .forEach(s => {
            const d = new Date(s.date);
            // ISO week start = Monday
            const day = d.getDay(); // 0=Sun
            const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
            const mon = new Date(d);
            mon.setDate(d.getDate() + diff);
            mon.setHours(0, 0, 0, 0);
            const key = mon.toISOString().slice(0, 10);
            weekTotals[key] = (weekTotals[key] ?? 0) + s.amount;
        });

    // Find the oldest spend to know when to stop looking backwards
    const oldestSpend = spends.reduce((min, s) => s.date < min ? s.date : min, new Date());
    const oldestMon = TemporalEngine.getThisWeekRange(oldestSpend).start;
    const oldestKey = oldestMon.toISOString().slice(0, 10);

    const thisWeekRange = TemporalEngine.getThisWeekRange(new Date());
    const thisWeekKey = thisWeekRange.start.toISOString().slice(0, 10);

    // If the current week is already blown, streak is 0
    if ((weekTotals[thisWeekKey] ?? 0) > goal) {
        return 0;
    }

    let streak = 0;
    let checkMon = new Date(thisWeekRange.start);
    checkMon.setDate(checkMon.getDate() - 7);

    for (let i = 0; i < 52; i++) { // check up to 1 year
        const key = checkMon.toISOString().slice(0, 10);
        const total = weekTotals[key] ?? 0;

        if (total <= goal) {
            streak++;
        } else {
            break; // Streak broken
        }

        // If we reached the oldest recorded week, stop checking
        if (key <= oldestKey) {
            break;
        }

        checkMon.setDate(checkMon.getDate() - 7);
    }

    return streak;
}

export const IntentionCard = () => {
    const { weeklyGoal, setWeeklyGoal, spends, isLoading } = useSpends();
    const [inputValue, setInputValue] = useState("");
    const [isEditing, setIsEditing]   = useState(false);

    const hasIntention = weeklyGoal > 0;

    const streak = useMemo(() => computeWeekStreak(spends, weeklyGoal), [spends, weeklyGoal]);

    const handleSetIntention = () => {
        if (!inputValue.trim()) return;
        const val = parseInt(inputValue.replace(/,/g, ""), 10);
        if (!isNaN(val) && val > 0) {
            setWeeklyGoal(val);
            setIsEditing(false);
        }
    };

    const clearIntention = () => {
        setWeeklyGoal(0);
        setInputValue("");
    };

    return (
        <div className="w-full mb-8">
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-48 bg-brand-mist/20 rounded-3xl animate-pulse"
                    />
                ) : !hasIntention || isEditing ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="bg-brand-mist/30 p-8 rounded-3xl border border-brand-mist/50 flex flex-col items-center justify-center text-center space-y-4"
                    >
                        <h2 className="text-xl font-serif text-brand-moss opacity-80">
                            {isEditing ? "Update your intention." : "Set an intention for this week."}
                        </h2>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl text-brand-moss/50 font-serif">{getCurrencySymbol()}</span>
                            <input
                                type="number"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="0"
                                className="bg-transparent text-4xl font-serif text-brand-ink placeholder:text-brand-lichen outline-none text-center w-32 border-b border-brand-lichen disabled:bg-transparent"
                                onKeyDown={(e) => e.key === "Enter" && handleSetIntention()}
                                autoFocus={isEditing}
                            />
                        </div>
                        <p className="text-sm text-brand-sage italic">
                            This is a gentle reference, not a rule.
                        </p>
                        {inputValue && (
                            <div className="flex gap-2">
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={handleSetIntention}
                                    className="mt-4 px-6 py-2 bg-brand-moss text-brand-cream rounded-full text-sm hover:bg-brand-ink transition-colors"
                                >
                                    Set Intention
                                </motion.button>
                                {isEditing && (
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="mt-4 px-4 py-2 text-brand-sage text-sm hover:text-brand-ink"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="set"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.4 }}
                        className="bg-brand-cream p-8 rounded-3xl border border-brand-lichen/30 flex flex-col items-center shadow-sm relative group"
                    >
                        <p className="text-brand-sage text-sm uppercase tracking-widest mb-2 font-sans font-medium">
                            Weekly Intention
                        </p>
                        <div className="text-5xl font-serif text-brand-moss">
                            {formatAmount(weeklyGoal)}
                        </div>

                        {/* ── Streak badge ──────────────────────────────── */}
                        <AnimatePresence>
                            {streak >= 2 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="mt-3 text-[10px] uppercase tracking-widest text-brand-moss font-sans font-bold bg-brand-moss/10 px-3 py-1 rounded-full"
                                >
                                    🔥 {streak} week{streak !== 1 ? "s" : ""} on track
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Change / Clear controls */}
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => { setInputValue(weeklyGoal.toString()); setIsEditing(true); }}
                                className="text-xs text-brand-lichen hover:text-brand-moss bg-brand-mist/20 px-2 py-1 rounded"
                            >
                                Change
                            </button>
                            <button
                                onClick={clearIntention}
                                className="text-xs text-red-400 hover:text-red-600 bg-red-50 px-2 py-1 rounded"
                            >
                                Clear
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
