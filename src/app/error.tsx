"use client";

import { useEffect } from "react";
import { logError } from "@/lib/log";

/**
 * GLOBAL ERROR BOUNDARY
 * 
 * Catches any unhandled runtime error in the app tree.
 * Displays a calm, reassuring fallback — never a white screen.
 * Logs structured error details for developer triage.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        logError("Unhandled runtime error caught by global boundary", {
            module: "error-boundary",
            action: "catch",
            digest: error.digest,
            name: error.name,
            message: error.message,
        }, error);
    }, [error]);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-brand-cream">
            <div className="max-w-md text-center space-y-8">
                {/* Calm Icon */}
                <div className="text-6xl opacity-60">🌿</div>

                {/* Reassurance */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-serif text-brand-ink tracking-tight">
                        Something went quiet
                    </h1>
                    <p className="text-brand-sage text-lg font-serif italic leading-relaxed">
                        An unexpected moment occurred. Your data is safe —
                        nothing was lost or changed.
                    </p>
                </div>

                {/* Recovery Action */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={reset}
                        className="bg-brand-moss text-white font-serif text-base px-8 py-3 rounded-2xl hover:bg-brand-ink transition-all duration-700 shadow-lg"
                    >
                        Try again
                    </button>
                    <a href="/" className="inline-block">
                        <button
                            className="w-full bg-white border border-brand-mist/40 text-brand-sage font-serif text-base px-8 py-3 rounded-2xl hover:bg-brand-cream transition-all duration-700 shadow-sm"
                        >
                            Return to Dashboard
                        </button>
                    </a>
                </div>

                {/* Developer Hint (dev only) */}
                {process.env.NODE_ENV !== "production" && (
                    <details className="text-left mt-8 p-4 bg-red-50 rounded-xl border border-red-200 text-sm">
                        <summary className="cursor-pointer text-red-700 font-medium">
                            Developer Details
                        </summary>
                        <pre className="mt-2 text-red-600 overflow-auto text-xs whitespace-pre-wrap">
                            {error.name}: {error.message}
                            {"\n\n"}
                            {error.stack}
                        </pre>
                    </details>
                )}
            </div>
        </main>
    );
}
