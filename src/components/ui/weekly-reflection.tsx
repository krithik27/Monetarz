"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalytics } from "@/context/AnalyticsContext";
import { TemporalEngine } from "@/lib/temporal";
import { X } from "lucide-react";

export function WeeklyReflectionBanner() {
    const { reflections } = useAnalytics();
    const currentWeekId = TemporalEngine.getCurrentWeekId();

    // Persist dismissal state in localStorage
    const [isDismissed, setIsDismissed] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const dismissedWeek = localStorage.getItem('dismissed-weekly-reflection');
        if (dismissedWeek === currentWeekId) {
            setIsDismissed(true);
        }
        setHydrated(true);
    }, [currentWeekId]);

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem('dismissed-weekly-reflection', currentWeekId);
    };
    
    // Find reflection for this week
    const reflection = reflections.find(r => r.weekId === currentWeekId);

    if (!hydrated || !reflection || isDismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-4xl mx-auto mb-8 p-4 bg-brand-mist/20 border border-brand-mist/30 rounded-xl relative"
            >
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-brand-mist/40 transition-colors"
                    aria-label="Dismiss reflection"
                >
                    <X className="w-4 h-4 text-brand-sage" />
                </button>

                <div className="flex items-start gap-3 pr-8">
                    <div className="w-1 h-full bg-brand-moss/50 rounded-full mt-1" />

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs uppercase tracking-wider text-brand-sage font-sans">
                                Weekly Reflection
                            </span>
                        </div>

                        <h4 className="text-lg text-brand-ink font-serif mb-2">
                            {reflection.title}
                        </h4>

                        <p className="text-brand-ink/70 font-serif leading-relaxed text-sm">
                            {reflection.message}
                        </p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Not currently used externally — kept for potential future use
function WeeklyReflectionCard() {
    const { reflections } = useAnalytics();
    const currentWeekId = TemporalEngine.getCurrentWeekId();

    // Find reflection for this week
    const reflection = reflections.find(r => r.weekId === currentWeekId);

    if (!reflection) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl mx-auto mb-8 p-6 md:p-8 bg-brand-mist/30 border border-brand-mist rounded-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-moss/50" />

                <h3 className="text-sm uppercase tracking-widest text-brand-sage font-serif mb-2">
                    Weekly Reflection
                </h3>

                <h4 className="text-xl md:text-2xl text-brand-ink font-serif mb-4">
                    {reflection.title}
                </h4>

                <p className="text-lg text-brand-ink/80 font-serif leading-relaxed">
                    {reflection.message}
                </p>
            </motion.div>
        </AnimatePresence>
    );
}
