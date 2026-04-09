"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";

// --- Types ---

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastData {
    id: string;
    message: string;
    description?: string;
    type: ToastType;
    duration?: number; // ms, default 4000
    onRetry?: () => void;
}

interface ToastContextType {
    toast: (props: Omit<ToastData, "id">) => void;
    dismiss: (id: string) => void;
}

// --- Context ---

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

// --- Constants ---

const TOAST_ICONS = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
    info: <Info className="h-5 w-5 text-brand-sage" />,
};

const TOAST_STYLES = {
    success: "border-emerald-500/10 bg-emerald-50/40 text-emerald-900 shadow-emerald-500/5",
    error: "border-red-500/10 bg-red-50/40 text-red-900 shadow-red-500/5",
    warning: "border-amber-500/10 bg-amber-50/40 text-amber-900 shadow-amber-500/5",
    info: "border-brand-mist/10 bg-white/40 text-brand-ink shadow-brand-mist/5",
};

// --- Component: Toast Item ---

function ToastItem({
    data,
    onDismiss,
}: {
    data: ToastData;
    onDismiss: (id: string) => void;
}) {
    const shouldReduceMotion = useReducedMotion();
    const [isExiting, setIsExiting] = useState(false);

    // Auto-dismiss
    useEffect(() => {
        if (data.duration === 0) return; // 0 = persistent
        const timer = setTimeout(() => {
            onDismiss(data.id);
        }, data.duration || 4000);
        return () => clearTimeout(timer);
    }, [data.id, data.duration, onDismiss]);

    return (
        <motion.div
            layout
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`
                pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all
                ${TOAST_STYLES[data.type]}
            `}
            role="alert"
        >
            <div className="mt-0.5 flex-shrink-0">{TOAST_ICONS[data.type]}</div>

            <div className="flex-1 space-y-1">
                <p className="font-serif text-sm font-medium leading-relaxed">{data.message}</p>
                {data.description && (
                    <p className="font-sans text-xs opacity-80">{data.description}</p>
                )}
                {data.type === "error" && data.onRetry && (
                    <button
                        onClick={data.onRetry}
                        className="mt-2 text-xs font-semibold underline decoration-red-500/50 underline-offset-4 transition-colors hover:text-red-700 hover:decoration-red-500"
                    >
                        Try Again
                    </button>
                )}
            </div>

            <button
                onClick={() => onDismiss(data.id)}
                className="group -mr-1 -mt-1 rounded-full p-1 transition-colors hover:bg-black/5"
                aria-label="Dismiss"
            >
                <X className="h-4 w-4 opacity-50 transition-opacity group-hover:opacity-100" />
            </button>
        </motion.div>
    );
}

// --- Provider ---

export function ToastProvider({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const [toasts, setToasts] = useState<ToastData[]>([]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toast = useCallback((props: Omit<ToastData, "id">) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { ...props, id }]);
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // Clean up persistent toasts if needed, or handle max queue size
    useEffect(() => {
        if (toasts.length > 5) {
            setToasts((prev) => prev.slice(prev.length - 5));
        }
    }, [toasts.length]);

    return (
        <ToastContext.Provider value={{ toast, dismiss }}>
            {children}
            {/* Portal for rendering toasts */}
            {mounted && createPortal(
                <div
                    className="fixed bottom-0 right-0 z-[100] flex w-full flex-col gap-2 p-4 sm:max-w-[420px] sm:items-end"
                    aria-live="polite"
                >
                    <AnimatePresence mode="popLayout">
                        {toasts.map((t) => (
                            <ToastItem key={t.id} data={t} onDismiss={dismiss} />
                        ))}
                    </AnimatePresence>
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}
