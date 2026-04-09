"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useCurrency } from "@/context/CurrencyContext";
import { CurrencyCode } from "@/lib/money";

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
    INR: "₹",
    USD: "$",
    PHP: "₱",
    EUR: "€",
};

const CURRENCIES: CurrencyCode[] = ["INR", "USD", "PHP"];

export function CurrencySelector() {
    const { activeCurrency, setActiveCurrency } = useCurrency();
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (e: PointerEvent) => {
            const root = rootRef.current;
            if (!root) return;
            if (e.target instanceof Node && root.contains(e.target)) return;
            setIsOpen(false);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };

        window.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    return (
        <div ref={rootRef} className="fixed top-6 left-6 z-50">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-full bg-brand-moss/10 backdrop-blur-sm border border-brand-lichen/30 flex items-center justify-center text-brand-ink hover:bg-brand-moss/20 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {/* Placeholder for user-provided PNG image */}
                {/* User should place their image at: /public/currency-icon.png (1544kb - consider optimizing) */}
                {/* For now, showing active currency symbol */}
                <span className="text-xl font-serif">{CURRENCY_SYMBOLS[activeCurrency]}</span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-14 left-0 flex flex-col gap-2 bg-brand-cream/95 backdrop-blur-md border border-brand-lichen/30 rounded-2xl p-2 shadow-lg"
                    >
                        {CURRENCIES.map((currency) => (
                            <motion.button
                                key={currency}
                                onClick={() => {
                                    setActiveCurrency(currency);
                                    setIsOpen(false);
                                }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-serif transition-colors ${activeCurrency === currency
                                        ? "bg-brand-moss text-brand-cream"
                                        : "bg-brand-lichen/20 text-brand-ink hover:bg-brand-lichen/40"
                                    }`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                {CURRENCY_SYMBOLS[currency]}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
