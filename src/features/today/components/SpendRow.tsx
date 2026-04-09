"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ParsedSpend, SpendCategory } from "@/lib/parser";
import { CATEGORY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatAmount, getCurrencySymbol } from "@/lib/money";

type SpendRowProps = {
    spend: ParsedSpend;
    onUpdate: (id: string, updates: Partial<ParsedSpend>) => void;
    onDelete: (id: string) => void;
};

const CATEGORIES: SpendCategory[] = [
    "food", "transport", "groceries", "shopping", "subscriptions", "health", "entertainment", "misc"
];

export const SpendRow = ({ spend, onUpdate, onDelete }: SpendRowProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [editValue, setEditValue] = useState(spend.amount.toString());
    const [editDesc, setEditDesc] = useState(spend.description || "");
    const [editCat, setEditCat] = useState(spend.category);

    const containerRef = useRef<HTMLDivElement>(null);

    // Commit on click outside or collapse
    useEffect(() => {
        if (!isExpanded) {
            const amount = parseFloat(editValue);
            if (!isNaN(amount) && (amount !== spend.amount || editDesc !== spend.description || editCat !== spend.category)) {
                onUpdate(spend.id, {
                    amount,
                    description: editDesc,
                    category: editCat
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isExpanded]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
            }
        };

        if (isExpanded) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isExpanded]);

    return (
        <motion.div
            ref={containerRef}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => !isExpanded && setIsExpanded(true)}
            className={cn(
                "group relative w-full rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden",
                isExpanded
                    ? "bg-brand-mist/40 shadow-sm p-5 md:p-12"
                    : "bg-white/40 border border-brand-mist hover:border-brand-lichen/50 p-5 md:p-10"
            )}
        >
            <AnimatePresence mode="wait">
                {!isExpanded ? (
                    <motion.div
                        key="collapsed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: CATEGORY_COLORS[spend.category] || CATEGORY_COLORS.misc }}
                            />
                            <div className="flex flex-col min-w-0">
                                <span className="text-xl md:text-3xl text-brand-ink font-serif tracking-tight truncate">{spend.description}</span>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-brand-sage font-sans mt-0.5">
                                    {spend.category}
                                </span>
                            </div>
                        </div>
                        <div className="text-2xl md:text-5xl text-brand-ink font-serif tracking-tight ml-4 flex-shrink-0">
                            {formatAmount(spend.amount, spend.currency || 'INR')}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="flex flex-col gap-4">
                            {/* Description Edit */}
                            <input
                                autoFocus
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="bg-transparent text-2xl md:text-4xl text-brand-ink font-serif focus:outline-none border-b border-brand-lichen/20 pb-2 w-full"
                                placeholder="Description"
                                onClick={(e) => e.stopPropagation()}
                            />

                            {/* Amount Edit */}
                            <div className="flex items-baseline gap-3">
                                <span className="text-2xl text-brand-sage font-serif">{getCurrencySymbol(spend.currency || 'INR')}</span>
                                <input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="bg-transparent text-4xl md:text-7xl text-brand-ink font-serif focus:outline-none w-full tracking-tighter"
                                    placeholder="0"
                                    type="number"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>

                        {/* Category Picker */}
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditCat(cat);
                                    }}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-sans transition-all",
                                        editCat === cat
                                            ? "bg-brand-moss text-white shadow-md"
                                            : "bg-brand-mist/50 text-brand-sage hover:bg-brand-mist"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(spend.id);
                                }}
                                className="text-red-800/60 hover:text-red-800 text-xs uppercase tracking-widest font-sans px-2 py-1 transition-colors"
                            >
                                Remove
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(false);
                                }}
                                className="text-brand-moss hover:text-brand-ink text-xs uppercase tracking-widest font-sans px-4 py-2 bg-brand-lichen/20 rounded-full transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
