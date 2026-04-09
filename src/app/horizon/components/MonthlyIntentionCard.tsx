"use client";

import React, { useState, useMemo } from "react";
import { useSpends } from "@/context/SpendsContext";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrencySymbol, formatAmount } from "@/lib/money";
import { useCurrency } from "@/context/CurrencyContext";
import { TemporalEngine } from "@/lib/temporal";
import { isInflow } from "@/lib/parser";

// SVG Radial Progress Arc
const RadialProgress = ({ percent, size = 120 }: { percent: number; size?: number }) => {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    const status = percent >= 90 ? "over" : percent >= 70 ? "warn" : "good";
    const gradientId = `grad-${status}`;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="rotate-[-90deg] relative z-10 overflow-visible">
                <defs>
                    <linearGradient id="grad-good" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8BA888" />
                        <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                    <linearGradient id="grad-warn" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#F97316" />
                    </linearGradient>
                    <linearGradient id="grad-over" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F43F5E" />
                        <stop offset="100%" stopColor="#E11D48" />
                    </linearGradient>
                </defs>

                {/* Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={8}
                    className="text-brand-lichen/20"
                />

                {/* Glow Layer */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    style={{ filter: "blur(8px)", opacity: 0.3 }}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ strokeDashoffset: { duration: 1.2, ease: "easeOut" } }}
                />

                {/* Progress Layer */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ strokeDashoffset: { duration: 1.2, ease: "easeOut" } }}
                />
            </svg>
        </div>
    );
};

export const MonthlyIntentionCard = () => {
    const { monthlyIntention, setMonthlyIntention, spends } = useSpends();
    const { activeCurrency } = useCurrency();
    const [inputValue, setInputValue] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    const hasIntention = monthlyIntention > 0;

    // Compute this-month's outflow
    const monthRange = TemporalEngine.getThisMonthRange();
    const spentThisMonth = useMemo(() => {
        return spends
            .filter(s => !isInflow(s) && TemporalEngine.isInRange(s.date, monthRange))
            .reduce((sum, s) => sum + s.amount, 0);
    }, [spends]);

    const spendPercent = monthlyIntention > 0
        ? Math.min(100, (spentThisMonth / monthlyIntention) * 100)
        : 0;
    const remaining = Math.max(0, monthlyIntention - spentThisMonth);

    const handleSetIntention = () => {
        if (!inputValue.trim()) return;
        const val = parseInt(inputValue.replace(/,/g, ""), 10);
        if (!isNaN(val) && val > 0) {
            setMonthlyIntention(val);
            setIsEditing(false);
        }
    };

    const clearIntention = () => {
        setMonthlyIntention(0);
        setInputValue("");
        setIsEditing(false);
    };

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {!hasIntention || isEditing ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-8 rounded-[2rem] border-2 border-dashed border-brand-lichen/20 bg-brand-lichen/5 flex flex-col items-center justify-center text-center space-y-4"
                    >
                        <h2 className="text-2xl font-serif text-brand-ink/60 italic">
                            {isEditing ? "Update your monthly intention" : "What's the intention for this month?"}
                        </h2>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl text-brand-ink/40 font-serif">{getCurrencySymbol()}</span>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="0"
                                className="bg-transparent text-6xl font-sans font-bold text-brand-ink placeholder:text-brand-ink/20 outline-none text-center w-64 border-b-2 border-brand-lichen/20 focus:border-brand-moss/30 transition-colors"
                                onKeyDown={(e) => e.key === "Enter" && handleSetIntention()}
                                autoFocus={isEditing}
                            />
                        </div>
                        <p className="text-sm text-brand-ink/40 italic font-serif">
                            A guiding light, not a hard limit.
                        </p>
                        <div className="flex gap-4">
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={handleSetIntention}
                                className="mt-2 px-8 py-3 border-2 text-black rounded-full text-lg font-serif italic hover:shadow-lg transition-all disabled:opacity-30"
                                disabled={!inputValue}
                            >
                                Set Path
                            </motion.button>
                            {isEditing && (
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="mt-2 px-4 py-3 text-horizon-blue/60 text-lg font-serif italic hover:text-horizon-blue"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="set"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/80 backdrop-blur-md p-8 rounded-[3rem] border border-white/20 shadow-sm relative"
                    >
                        <div className="flex flex-col sm:flex-row items-center gap-8">
                            {/* Radial arc */}
                            <div className="relative flex-shrink-0">
                                <RadialProgress percent={spendPercent} size={128} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-sans font-bold text-brand-ink tabular-nums">
                                        {Math.round(spendPercent)}%
                                    </span>
                                    <span className="text-[9px] uppercase tracking-widest text-horizon-muted/80 font-sans">spent</span>
                                </div>
                            </div>

                            {/* Text */}
                            <div className="flex-1 text-center sm:text-left space-y-1">
                                <p className="text-brand-sage/80 text-[10px] uppercase tracking-[0.3em] font-sans font-medium">
                                    Monthly Intention
                                </p>
                                <div className="text-5xl font-sans font-bold text-brand-ink tracking-tight">
                                    {formatAmount(monthlyIntention, activeCurrency)}
                                </div>
                                <p className="text-sm font-serif text-horizon-muted italic">
                                    <span className="text-emerald-600 font-medium not-italic">{formatAmount(remaining, activeCurrency)}</span> remaining
                                </p>
                            </div>
                        </div>

                        {/* Action buttons — always visible for mobile */}
                        <div className="flex gap-3 mt-6 justify-center sm:justify-end">
                            <button
                                onClick={() => {
                                    setInputValue(monthlyIntention.toString());
                                    setIsEditing(true);
                                }}
                                className="text-sm text-brand-ink/60 hover:text-brand-ink font-serif italic bg-brand-lichen/10 px-4 py-2 rounded-full transition-colors"
                            >
                                Edit Intention
                            </button>
                            <button
                                onClick={clearIntention}
                                className="text-sm text-red-400 hover:text-red-500 font-serif italic bg-red-50 px-4 py-2 rounded-full transition-colors"
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
