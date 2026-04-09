"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSpends } from "@/context/SpendsContext";
import { motion, AnimatePresence } from "framer-motion";
import { formatAmount } from "@/lib/money";
import { useCurrency } from "@/context/CurrencyContext";
import { Wallet, Trash2, RefreshCcw, ArrowRight, Loader2 } from "lucide-react";

// ── NLP Income Parser ────────────────────────────────────────────────────────
// Accepts: "Salary 45000", "Freelance 15k", "₹20,000 rent income", "20000 side hustle"
function parseIncomeInput(raw: string): { name: string; amount: number; dayOfMonth: number } | null {
    const cleaned = raw.trim();
    if (!cleaned) return null;

    // 1. Extract amount (with optional currency, commas, and k suffix)
    const amountMatch = cleaned.match(/[₹$€]?\s*([\d,]+(?:\.\d+)?)\s*(k|K)?/i);
    if (!amountMatch) return null;

    let amount = parseFloat(amountMatch[1].replace(/,/g, ""));
    if (amountMatch[2]) amount *= 1000;
    if (isNaN(amount) || amount <= 0) return null;

    // 2. Name = everything else cleaned up
    let namePart = cleaned
        .replace(amountMatch[0], "")
        .replace(/[₹$€]/g, "");
    
    // 3. Extract day of month from the remaining text (avoids matching the amount)
    const dayMatch = namePart.match(/(?:on\s+|day\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/i);
    const dayOfMonth = dayMatch ? Math.min(31, Math.max(1, parseInt(dayMatch[1]))) : new Date().getDate();

    if (dayMatch) {
        namePart = namePart.replace(dayMatch[0], "");
    }

    const name = namePart.trim().replace(/\s+/g, " ") || "Income";
    return { name: name.charAt(0).toUpperCase() + name.slice(1), amount, dayOfMonth };
}

const EXAMPLES = [
    "Salary 45000",
    "Freelance 15k",
    "Dividends 8000",
    "Part-time 12k",
];

export const IncomeWalletCard = () => {
    const {
        monthlyIncome,
        incomeSources,
        addIncomeSource,
        removeIncomeSource,
        clearAutoInflows,
    } = useSpends();
    const { activeCurrency } = useCurrency();

    const [inputVal, setInputVal] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [parseError, setParseError] = useState("");
    const [exampleIdx, setExampleIdx] = useState(0);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Cycle placeholder examples
    useEffect(() => {
        const t = setInterval(() => setExampleIdx(i => (i + 1) % EXAMPLES.length), 3000);
        return () => clearInterval(t);
    }, []);

    // Live parse preview
    const preview = inputVal.trim() ? parseIncomeInput(inputVal) : null;

    const handleSubmit = async () => {
        const parsed = parseIncomeInput(inputVal);
        if (!parsed) {
            setParseError("Try: \"Salary 45000\" or \"Freelance 15k\"");
            setTimeout(() => setParseError(""), 3000);
            return;
        }
        setIsAdding(true);
        setParseError("");
        try {
            await addIncomeSource(parsed);
            setInputVal("");
        } finally {
            setIsAdding(false);
            inputRef.current?.focus();
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await removeIncomeSource(id);
        } finally {
            setDeletingId(null);
        }
    };


    return (
        <div className="bg-white/80 backdrop-blur-xl p-7 rounded-[3rem] border border-white/20 shadow-sm flex flex-col h-full relative overflow-hidden">
            {/* Subtle ambient glow */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

            {/* ── Header ── */}
            <div className="relative flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-sm">
                        <Wallet className="size-5 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-serif text-horizon-ink tracking-tight">Income Wallet</h3>
                        <p className="text-[11px] text-horizon-muted font-serif italic">Monthly inflow sources</p>
                    </div>
                </div>
            </div>

            {/* ── Total Hero ── */}
            <div className="relative mb-5 px-6 py-5 rounded-[2rem] bg-gradient-to-br from-emerald-50 to-green-50/60 border border-emerald-100/80">
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-600/50 font-sans font-bold mb-1">
                    Projected Monthly Total
                </p>
                <p className="text-4xl font-sans font-bold text-emerald-700 tracking-tight">
                    {formatAmount(monthlyIncome, activeCurrency)}
                </p>
                {incomeSources.length > 0 && (
                    <p className="text-xs text-emerald-600/40 mt-1 font-serif italic">
                        across {incomeSources.length} source{incomeSources.length !== 1 ? "s" : ""}
                    </p>
                )}
            </div>

            {/* ── Sources List ── */}
            <div
                className="flex-1 space-y-1 overflow-y-auto min-h-0 mb-4 -mx-1 px-1"
                style={{
                    maskImage: 'linear-gradient(to bottom, transparent, black 20px, black calc(100% - 40px), transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20px, black calc(100% - 40px), transparent)'
                }}
            >
                <AnimatePresence initial={false}>
                    {incomeSources.length === 0 && (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="py-5 text-center"
                        >
                            <p className="text-sm text-horizon-muted/50 font-serif italic">Add your first income source below</p>
                        </motion.div>
                    )}
                    {incomeSources.map((source) => (
                        <motion.div
                            key={source.id}
                            layout
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                            className="group flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/70 hover:shadow-sm border border-transparent hover:border-white transition-all cursor-default"
                        >
                            <div className="min-w-0">
                                <p className="text-sm font-sans font-medium text-horizon-ink leading-tight truncate">{source.name}</p>
                                <p className="text-xs text-horizon-muted font-sans font-medium tabular-nums">
                                    {formatAmount(source.amount, activeCurrency)}
                                    <span className="text-emerald-500/40 mx-2">·</span>
                                    <span className="text-[10px] uppercase tracking-wider text-emerald-600/60 transition-colors group-hover:text-emerald-600">
                                        Day {source.dayOfMonth || 1}
                                    </span>
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(source.id)}
                                disabled={deletingId === source.id}
                                className="ml-3 shrink-0 size-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                            >
                                {deletingId === source.id
                                    ? <Loader2 className="size-3.5 animate-spin" />
                                    : <Trash2 className="size-3.5" />
                                }
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* ── NLP Entry ── */}
            <div className="mt-auto pt-5 space-y-2">
                {/* Parse feedback */}
                <AnimatePresence mode="wait">
                    {preview && !parseError && (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, y: 3 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 3 }}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100"
                        >
                            <ArrowRight className="size-3 text-emerald-500 shrink-0" />
                            <p className="text-xs text-emerald-700 font-sans font-medium">
                                <span className="font-bold">{preview.name}</span>
                                <span className="text-emerald-500/70 ml-1">·</span>
                                <span className="ml-1">{formatAmount(preview.amount, activeCurrency)}</span>
                                <span className="text-emerald-500/70 ml-1">·</span>
                                <span className="ml-1 text-[10px] italic">Day {preview.dayOfMonth}</span>
                            </p>
                        </motion.div>
                    )}
                    {parseError && (
                        <motion.p
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-red-400 font-sans font-medium px-1"
                        >
                            {parseError}
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* Input row */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputVal}
                            onChange={(e) => { setInputVal(e.target.value); setParseError(""); }}
                            onKeyDown={(e) => e.key === "Enter" && !isAdding && handleSubmit()}
                            placeholder={`e.g. ${EXAMPLES[exampleIdx]}`}
                            className="w-full bg-white/70 text-sm font-sans font-medium text-horizon-ink placeholder:text-horizon-muted/40 px-4 py-3.5 rounded-2xl border border-emerald-200/60 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none transition-all hover:border-emerald-300/80"
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isAdding || !inputVal.trim()}
                        className="px-5 py-3 rounded-2xl bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-sans font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-green-200"
                    >
                        {isAdding ? <Loader2 className="size-3.5 animate-spin" /> : "Add"}
                    </button>
                </div>
                <p className="text-[10px] text-horizon-muted/40 text-center font-sans font-medium uppercase tracking-tight">
                    Type naturally — name then amount, or reverse
                </p>
            </div>
        </div>
    );
};
