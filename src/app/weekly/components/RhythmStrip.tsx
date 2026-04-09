"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TemporalEngine } from "@/lib/temporal";
import { ParsedSpend } from "@/lib/parser";
import { CATEGORY_COLORS } from "@/lib/constants";
import { formatAmount } from "@/lib/money";
import { useCurrency } from "@/context/CurrencyContext";

type RhythmStripProps = {
    weeklySpends: ParsedSpend[];
    today: Date;
    isPro?: boolean;
    predictedTotal?: number;
};

export const RhythmStrip = ({ weeklySpends, today, isPro, predictedTotal }: RhythmStripProps) => {
    const { activeCurrency } = useCurrency();
    // 1. Prepare Data: Mon-Sun
    const days = Array.from({ length: 7 }, (_, i) => {
        const weekRange = TemporalEngine.getThisWeekRange(today);
        const currentDay = new Date(weekRange.start);
        currentDay.setDate(currentDay.getDate() + i);
        return currentDay;
    });

    // 2. Calculate Spends per Day & Category Breakdown
    const dayData = days.map((date) => {
        const dailySpends = weeklySpends.filter((s) => TemporalEngine.isSameDay(s.date, date));
        const dailyTotal = dailySpends.reduce((sum, s) => sum + s.amount, 0);

        // Group by category for gradient
        const categoryMap: Record<string, number> = {};
        dailySpends.forEach(s => {
            categoryMap[s.category] = (categoryMap[s.category] || 0) + s.amount;
        });

        // Generate gradient stops
        let currentPercent = 0;
        const gradientStops = Object.entries(categoryMap)
            .sort((a, b) => b[1] - a[1]) // Largest chunks at bottom
            .map(([cat, amount]) => {
                const percent = (amount / dailyTotal) * 100;
                const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.misc;
                const start = currentPercent;
                currentPercent += percent;
                const end = currentPercent;
                return `${color} ${start}%, ${color} ${end}%`;
            }).join(", ");

        const backgroundStyle = dailyTotal > 0
            ? `linear-gradient(to top, ${gradientStops})`
            : undefined;

        // Default to brand logic if empty
        const defaultBg = TemporalEngine.isSameDay(date, today) ? "bg-brand-moss" : "bg-brand-lichen/40 hover:bg-brand-sage/60";

        return {
            date,
            total: dailyTotal,
            isToday: TemporalEngine.isSameDay(date, today),
            dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
            backgroundStyle,
            defaultBg
        };
    });

    // 3. Find Max Spend for relative height
    const maxSpend = Math.max(...dayData.map((d) => d.total), 1); // Avoid div/0

    // 4. Calculate Predicted Line Height (Pro Only)
    const predictedDailyAverage = isPro && predictedTotal ? (predictedTotal / 100 / 7) : 0;
    const predictedLineHeight = (predictedDailyAverage / maxSpend) * 100;

    // 5. State for interaction (Skiper52 logic)
    const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);

    return (
        <div className="w-full h-80 mb-12 flex items-end justify-center gap-2 select-none relative">
            {/* Trajectory Line (Pro Only) */}
            {isPro && predictedLineHeight > 0 && predictedLineHeight <= 105 && (
                <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 0.4, width: "100%" }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="absolute border-t border-dashed border-brand-sage z-20 pointer-events-none flex justify-end"
                    style={{ bottom: `${predictedLineHeight}%` }}
                >
                    <span className="text-[10px] uppercase tracking-widest text-brand-sage pr-2 -mt-4 bg-brand-cream/80 px-1">
                        Trajectory
                    </span>
                </motion.div>
            )}

            {dayData.map((data, index) => {
                // ── Empty non-today day: hollow dashed ring ───────────────
                if (data.total === 0 && !data.isToday) {
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.7 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="w-10 h-10 rounded-full border-2 border-dashed border-brand-lichen/50 self-center flex items-center justify-center group cursor-default"
                            title={data.dayName}
                        >
                            <span className="text-[9px] text-brand-lichen/60 font-sans group-hover:text-brand-sage transition-colors">
                                —
                            </span>
                        </motion.div>
                    );
                }

                // ── Empty today: also show hollow ring (no stub) ──────────
                if (data.total === 0 && data.isToday) {
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.7 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="w-10 h-10 rounded-full border-2 border-dashed border-brand-moss/40 self-center flex items-center justify-center group cursor-default"
                            title={`${data.dayName} (Today)`}
                        >
                            <span className="text-[9px] text-brand-moss/50 font-sans">
                                —
                            </span>
                        </motion.div>
                    );
                }

                const heightPercentage = (data.total / maxSpend) * 100;
                const displayHeight = Math.max(heightPercentage, data.isToday ? 5 : 2) + "%";
                const isActive = activeDayIndex === index;

                return (
                    <motion.div
                        key={index}
                        className={cn(
                            "relative rounded-2xl cursor-pointer overflow-hidden opacity-90 hover:opacity-100",
                            !data.backgroundStyle && data.defaultBg,
                            isActive ? "shadow-xl z-10" : "z-0"
                        )}
                        style={{ background: data.backgroundStyle }}
                        initial={{ height: "0%", opacity: 0 }}
                        whileInView={{ height: displayHeight, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
                        animate={{
                            width: isActive ? "8rem" : "2.5rem",
                            height: displayHeight,
                            opacity: 1
                        }}
                        layout
                        onHoverStart={() => setActiveDayIndex(index)}
                        onHoverEnd={() => setActiveDayIndex(null)}
                        onClick={() => setActiveDayIndex(index === activeDayIndex ? null : index)}
                    >
                        <AnimatePresence>
                            {isActive && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.8 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute inset-0 flex flex-col items-center justify-end p-2 pb-4 bg-black/20 backdrop-blur-[1px]"
                                >
                                    <span className="text-xs font-sans uppercase tracking-widest text-white/100 shadow-sm">
                                        {data.dayName}
                                    </span>
                                    <span className="text-lg font-serif text-white shadow-sm">
                                        {formatAmount(data.total, activeCurrency)}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
};
