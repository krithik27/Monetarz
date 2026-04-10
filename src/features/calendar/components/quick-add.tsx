"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { format } from "date-fns";
import { useSpends } from "@/context/SpendsContext";
import { parseSpend } from "@/lib/parser";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { PRO_FEATURES } from "@/lib/intelligence/feature-gate";
import { useCurrency } from "@/context/CurrencyContext";
import { getCurrencySymbol } from "@/lib/money";


interface QuickAddModalProps {
    date: Date | null;
    isOpen: boolean;
    onClose: () => void;
}

export function QuickAddModal({ date, isOpen, onClose }: QuickAddModalProps) {
    const [input, setInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { addSpend } = useSpends();
    const { user, isPro } = useAuth();
    const { activeCurrency } = useCurrency();

    // Focus input when opened

    useEffect(() => {
        if (isOpen && inputRef.current) {
            // Small delay to allow animation to start
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !date) return;

        setIsSubmitting(true);
        try {
            // Parse spend but override date
            let parsed = parseSpend(input);

            // --- AI FALLBACK ---
            if (parsed.needsReview || parsed.confidence < 0.8) {
                const aiEnhanced = await PRO_FEATURES.llmParse(user?.id, isPro, input, parsed);
                if (aiEnhanced) {
                    parsed = { ...parsed, ...aiEnhanced };
                }
            }

            const spendWithDate = {
                ...parsed,
                date: date, // Force the selected date
            };

            await addSpend(spendWithDate);
            setInput("");
            onClose();
        } catch (error) {
            console.error("Quick add failed", error);
            // Ideally trigger a toast here via context if not already handled
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && date && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-brand-cream/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden"
                    >
                        <form onSubmit={handleSubmit} className="flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b border-brand-lichen/10">
                                <div className="flex flex-col">
                                    <span className="text-xs uppercase tracking-widest text-brand-sage font-bold">
                                        Quick Add
                                    </span>
                                    <span className="font-serif text-xl text-brand-ink">
                                        {format(date, "EEEE, MMMM do")}
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="rounded-full hover:bg-brand-mist/50 text-brand-sage"
                                >
                                    <X size={20} />
                                </Button>
                            </div>

                            <div className="p-8">
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isSubmitting ? "AI is processing..." : `coffee ${getCurrencySymbol(activeCurrency)}150...`}
                                    className={cn(
                                        "w-full bg-transparent text-3xl font-serif text-brand-ink placeholder:text-brand-lichen/50 focus:outline-none text-center transition-all",
                                        isSubmitting && "animate-pulse opacity-70"
                                    )}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="p-4 bg-brand-mist/20 flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={onClose}
                                    className="text-brand-sage hover:text-brand-ink"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!input.trim() || isSubmitting}
                                    className={cn(
                                        "bg-brand-moss text-white hover:bg-brand-moss/90 rounded-xl px-6",
                                        isSubmitting && "opacity-70"
                                    )}
                                >
                                    {isSubmitting ? "Adding..." : "Add Spend"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
