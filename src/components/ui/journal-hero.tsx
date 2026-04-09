"use client";

/**
 * JournalHero
 *
 * Lightweight personalized greeting block rendered above the journal input.
 * - Time-of-day greeting  + first name from user_metadata
 * - DiceBear avatar bubble (links to /account for quick re-access)
 * - Serif italic date
 * - Rotating micro-copy phrase (picked once per mount)
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAvatar } from "@/hooks/useAvatar";

const MICRO_COPY = [
    "Your journal is open.",
    "What flowed today?",
    "Passive observations only.",
    "Every entry is a signal.",
    "No rush. Just presence.",
    "Fluidity over rigidity.",
];

function getGreeting(hour: number): string {
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function getTimeEmoji(hour: number): string {
    if (hour < 6) return "🌃";  // Late night
    if (hour < 9) return "🌅";  // Sunrise
    if (hour < 12) return "🌄"; // Morning
    if (hour < 16) return "🌤️";  // Afternoon
    if (hour < 19) return "🏙️";  // Late afternoon
    if (hour < 21) return "🌇"; // Sunset
    return "🌃";              // Night
}

function formatDate(date: Date): string {
    return date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
}

export function JournalHero() {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar();

    const { greeting, timeEmoji, firstName, dateStr, microCopy } = useMemo(() => {
        const now = new Date();
        const hour = now.getHours();
        const meta = user?.user_metadata ?? {};
        const full = meta.full_name as string | undefined;
        const fname = full?.split(" ")[0] ?? "you";

        return {
            greeting: getGreeting(hour),
            timeEmoji: getTimeEmoji(hour),
            firstName: fname,
            dateStr: formatDate(now),
            microCopy: MICRO_COPY[Math.floor(Math.random() * MICRO_COPY.length)],
        };
    }, [user]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl mb-8 md:mb-10 mx-auto"
        >
            {/* Mobile: stacked center  |  SM+: flex row */}
            <div className="flex flex-col items-center gap-4 sm:gap-5">
                {/* Avatar bubble → links to /account */}
                <Link
                    href="/account"
                    title="Edit your profile"
                    className="shrink-0 group"
                >
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-brand-lichen/40 shadow-md group-hover:border-brand-moss/60 transition-all duration-300 group-hover:scale-105">
                        <img
                            src={avatarUrl}
                            alt="Your avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </Link>

                {/* Text block */}
                <div className="text-center flex flex-col gap-1">
                    {/* Greeting + name */}
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-sans font-semibold text-brand-ink leading-tight">
                        {greeting} {timeEmoji},{" "}
                        <span className="text-orange-500">{firstName}</span>
                    </h2>

                    {/* Date — serif */}
                    <p className="font-serif text-brand-sage text-base sm:text-lg md:text-xl">
                        {dateStr}
                    </p>

                    {/* Micro-copy */}
                    <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-brand-lichen font-sans mt-1 hidden sm:block">
                        {microCopy}
                    </p>
                </div>
            </div>

            {/* Micro-copy on mobile (below the row) */}
            <p className="sm:hidden text-xs sm:text-sm uppercase tracking-[0.25em] text-brand-lichen font-sans text-center mt-2">
                {microCopy}
            </p>
        </motion.div>
    );
}
