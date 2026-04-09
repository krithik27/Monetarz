"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type TemporalBound = "week" | "month" | "last-month";

interface TemporalBoundSelectorProps {
    value: TemporalBound;
    onChange: (bound: TemporalBound) => void;
    className?: string;
}

export const TemporalBoundSelector = ({ value, onChange, className }: TemporalBoundSelectorProps) => {
    const options: { id: TemporalBound; label: string }[] = [
        { id: "week", label: "Week" },
        { id: "month", label: "Month" },
        { id: "last-month", label: "Last Month" },
    ];

    return (
        <div className={cn("flex bg-white/10 backdrop-blur-sm p-1 rounded-2xl border border-brand-mist/20 shadow-sm", className)}>
            {options.map((option) => (
                <button
                    key={option.id}
                    onClick={() => onChange(option.id)}
                    className={cn(
                        "relative px-4 py-2 rounded-xl text-sm font-medium transition-all z-10",
                        value === option.id
                            ? "text-white"
                            : "text-brand-sage hover:bg-brand-moss/5"
                    )}
                >
                    {value === option.id && (
                        <motion.div
                            layoutId="bound-pill"
                            className="absolute inset-0 bg-brand-moss rounded-xl shadow-md -z-10"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}
                    {option.label}
                </button>
            ))}
        </div>
    );
};
