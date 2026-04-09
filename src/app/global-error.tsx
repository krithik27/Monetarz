"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * GLOBAL ERROR BOUNDARY (App Router)
 * 
 * Catches unhandled errors in Server Components and client-side renders.
 * Provides a clean recovery path for the user.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    // Log the error for diagnostics (in a real app, send to Sentry/Logtail)
    React.useEffect(() => {
        console.error("Critical System Error:", error);
    }, [error]);

    return (
        <html lang="en">
            <body className="bg-brand-cream min-h-screen flex items-center justify-center p-6 antialiased">
                <main className="max-w-md w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/60 backdrop-blur-xl border border-red-100 rounded-3xl p-10 shadow-2xl text-center space-y-8"
                    >
                        {/* Error Icon */}
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                        </div>

                        {/* Text */}
                        <div className="space-y-3">
                            <h1 className="text-3xl font-serif text-brand-ink tracking-tight">
                                Something went wrong
                            </h1>
                            <p className="text-brand-sage font-serif italic text-lg leading-relaxed">
                                A critical error occurred while rendering this page. Your data is safe, but we need to restart the session.
                            </p>
                            {error.digest && (
                                <p className="text-[10px] font-mono text-brand-sage/40 uppercase tracking-widest pt-4">
                                    Error ID: {error.digest}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={() => reset()}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-brand-moss text-brand-cream rounded-2xl font-serif text-lg hover:bg-brand-ink transition-all duration-500"
                            >
                                <RefreshCw className="w-4 h-4" /> Try Again
                            </button>

                            <button
                                onClick={() => router.push("/")}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-brand-mist/40 text-brand-sage rounded-2xl font-serif text-lg hover:bg-brand-cream transition-all duration-500"
                            >
                                <ArrowLeft className="w-4 h-4" /> Return to Dashboard
                            </button>
                        </div>
                    </motion.div>
                </main>
            </body>
        </html>
    );
}
