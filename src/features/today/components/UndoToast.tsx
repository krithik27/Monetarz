"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type UndoToastProps = {
    show: boolean;
    onUndo: () => void;
    onClose: () => void;
};

export const UndoToast = ({ show, onUndo, onClose }: UndoToastProps) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] min-w-[300px]"
                >
                    <div className="bg-brand-ink text-brand-cream px-6 py-4 rounded-full shadow-2xl flex items-center justify-between gap-8 backdrop-blur-md bg-opacity-90 border border-white/10">
                        <span className="text-sm font-sans tracking-wide">Spend removed</span>
                        <button
                            onClick={onUndo}
                            className="text-brand-sage hover:text-white text-xs uppercase tracking-[0.2em] font-sans font-bold transition-colors"
                        >
                            Undo
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
