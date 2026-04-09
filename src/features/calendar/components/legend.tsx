"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

type LegendItem = {
    label: string;
    color: string;
    /** If true, renders an upward-triangle shape marker instead of a circle */
    isIncome?: boolean;
};

const LEGEND_ITEMS: LegendItem[] = [
    { label: "Food",          color: "bg-amber-500/70"    },
    { label: "Transport",     color: "bg-blue-500/70"     },
    { label: "Entertainment", color: "bg-purple-500/70"   },
    { label: "Shopping",      color: "bg-pink-500/70"     },
    { label: "Utilities",     color: "bg-gray-500/70"     },
    { label: "Health",        color: "bg-green-500/70"    },
    { label: "Education",     color: "bg-indigo-500/70"   },
    { label: "Income",        color: "bg-horizon-gain/70", isIncome: true },
];

export function CalendarLegend() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex items-center gap-4">
            {/* ── Keyboard hint (hidden on mobile) ── */}
            <span className="hidden sm:block text-[10px] uppercase tracking-widest text-brand-mist font-sans opacity-60 select-none">
                dbl-click a day to add
            </span>

            {/* ── Legend popover ── */}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 text-brand-sage hover:text-brand-moss transition-colors text-sm font-medium"
                >
                    <Info size={16} />
                    <span>Legend</span>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 bottom-full mb-4 p-4 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-brand-lichen/20 w-52 z-50 origin-bottom-right"
                        >
                            <div className="grid grid-cols-1 gap-2">
                                {LEGEND_ITEMS.map((item) => (
                                    <div key={item.label} className="flex items-center gap-3">
                                        {item.isIncome ? (
                                            /* Upward-triangle for income entries */
                                            <div
                                                className={cn("w-3 h-3 shrink-0 shadow-sm", item.color)}
                                                style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
                                            />
                                        ) : (
                                            <div className={cn("w-3 h-3 rounded-full shrink-0 shadow-sm", item.color)} />
                                        )}
                                        <span className="text-xs text-brand-ink/80 font-medium">{item.label}</span>
                                        {item.isIncome && (
                                            <span className="ml-auto text-[9px] uppercase tracking-wider text-horizon-gain font-sans font-bold">
                                                inflow
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
