"use client";

import { useSpends } from "@/context/SpendsContext";
import {
    CalendarBody,
    CalendarDatePagination,
    CalendarHeader,
    CalendarMonthPicker,
    CalendarProvider,
    CalendarYearPicker,
    type Feature,
} from "@/features/calendar/components";
import { CalendarLegend } from "@/features/calendar/components/legend";
import { QuickAddModal } from "@/features/calendar/components/quick-add";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, Grid3x3, BookOpen } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { MonthlyJournal } from "@/features/calendar/components/MonthlyJournal";

import { cn } from "@/lib/utils";


// Category color map for visual distinction
const CATEGORY_COLORS: Record<string, string> = {
    food: "bg-amber-500/70",
    transport: "bg-blue-500/70",
    entertainment: "bg-purple-500/70",
    shopping: "bg-pink-500/70",
    utilities: "bg-gray-500/70",
    health: "bg-green-500/70",
    misc: "bg-indigo-500/70",
    // Income entries (distinct upward-triangle visual in legend)
    income: "bg-horizon-gain/70",
    salary: "bg-horizon-gain/70",
    // Fallback
    default: "bg-brand-moss"
};

export default function CalendarPage() {
    const { spends } = useSpends();

    const isPro = true; // MOCK until Stripe integration

    // Density mode toggle (Pro only)
    const [densityMode, setDensityMode] = useState(false);

    // UI Improvements State
    const [quickAddDate, setQuickAddDate] = useState<Date | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [showNotepad, setShowNotepad] = useState(false);
    const notepadRef = useRef<HTMLDivElement>(null);

    const router = useRouter();

    const handleClose = useCallback(() => {
        router.push("/");
    }, [router]);

    // Esc listener for the main "Reflect" card
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleClose]);

    // Transform spends into "Features" for the calendar
    const features = useMemo<Feature[]>(() => {
        return spends.map((spend) => {
            const category = spend.category?.toLowerCase() || "default";
            const isIncome = category === "income" || category === "salary";
            const colorKey = CATEGORY_COLORS[category] ? category : "default";
            return {
                id: spend.id,
                name: spend.description,
                startAt: new Date(spend.date),
                endAt: new Date(spend.date),
                status: {
                    id: spend.category || "uncategorized",
                    name: spend.category || "Uncategorized",
                    color: isIncome
                        ? "bg-horizon-gain/70"   // income = distinct green
                        : (CATEGORY_COLORS[colorKey] || CATEGORY_COLORS.default),
                },
                // Extra flag consumed by legend / future shape overrides
                original: spend,
            };
        });
    }, [spends]);

    // UX FIX: Dynamic year range based on data and current year
    const yearRange = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const oldestSpendYear = spends.length > 0
            ? Math.min(...spends.map(s => new Date(s.date).getFullYear()))
            : currentYear - 1;

        return {
            start: Math.min(oldestSpendYear, currentYear - 5),
            end: currentYear + 1
        };
    }, [spends]);

    return (
        <motion.main
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen text-brand-ink font-sans selection:bg-brand-moss/20 flex flex-col w-full relative"
        >
            <Navbar />
            <div className="w-full flex-grow flex flex-col px-4 md:px-8 lg:px-12 pt-20 md:pt-32 pb-28">
                <div className="w-full h-full flex flex-col bg-white/40 backdrop-blur-sm rounded-3xl shadow-sm ring-1 ring-brand-lichen/10 transition-all duration-700">
                    <CalendarProvider className="flex-grow p-4 md:p-8">
                        <div className="flex flex-col md:flex-row items-center justify-between mb-8 md:mb-12 gap-6">
                            {/* Reflect Title & Close Button - Top Row on Mobile */}
                            <div className="flex w-full md:w-auto items-center justify-between gap-4 md:gap-6">
                                <div className="flex items-center gap-4">
                                    <h1 className="text-3xl md:text-5xl font-black font-sans uppercase tracking-tight text-brand-ink lowercase leading-none">Reflect</h1>
                                </div>
                                <Link href="/" className="md:hidden">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-full hover:bg-brand-moss/5 text-brand-moss transition-all"
                                    >
                                        <X className="w-5 h-5" strokeWidth={1.5} />
                                    </Button>
                                </Link>
                            </div>

                            {/* Filters Row */}
                            <div className="flex flex-wrap flex-1 items-center justify-start md:justify-end gap-3 md:gap-6 mt-4 md:mt-0 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide snap-x snap-mandatory">
                                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                                    <CalendarMonthPicker className="w-32 md:w-40 bg-white/50 border-brand-lichen/20 hover:bg-white transition-all rounded-xl" />
                                    <CalendarYearPicker start={yearRange.start} end={yearRange.end} className="w-24 md:w-28 bg-white/50 border-brand-lichen/20 hover:bg-white transition-all rounded-xl" />
                                    <div className="hidden sm:block w-px h-8 bg-brand-lichen/10 mx-1 md:mx-3" />
                                    <CalendarDatePagination className="gap-1 md:gap-2" />
                                </div>

                                <div className="hidden md:block w-px h-8 bg-brand-lichen/10 mx-3 shrink-0" />

                                {/* Category Filter */}
                                <div className="flex items-center gap-1.5 shrink-0 bg-white/50 p-1.5 rounded-2xl border border-brand-lichen/10 shadow-sm">
                                    {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'default').map(([cat, color]) => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(activeCategory === cat ? null : color)}
                                            className={cn(
                                                "w-6 h-6 rounded-full transition-all border border-transparent shadow-sm",
                                                color,
                                                activeCategory === color ? "ring-2 ring-brand-moss scale-110" : "opacity-40 hover:opacity-100 hover:scale-105"
                                            )}
                                            title={`Filter by ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
                                        />
                                    ))}
                                    {activeCategory && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActiveCategory(null)}
                                            className="ml-1 h-6 text-[10px] uppercase tracking-wider text-brand-rust hover:bg-brand-rust/5"
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </div>


                                {/* Density Toggle (Pro Only) */}
                                {isPro && (
                                    <>
                                        <div className="hidden md:block w-px h-8 bg-brand-lichen/10 mx-1 shrink-0" />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDensityMode(!densityMode)}
                                            className={cn(
                                                "h-10 w-10 shrink-0 rounded-full transition-all",
                                                densityMode
                                                    ? "bg-brand-moss/10 text-brand-moss"
                                                    : "hover:bg-brand-moss/5 text-brand-sage"
                                            )}
                                            title="Toggle density view"
                                        >
                                            <Grid3x3 className="w-5 h-5" strokeWidth={1.5} />
                                        </Button>
                                    </>
                                )}
                            </div>

                            <Link href="/" className="hidden md:flex shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-12 w-12 rounded-full hover:bg-brand-moss/5 text-brand-moss transition-all"
                                >
                                    <X className="w-6 h-6" strokeWidth={1.5} />
                                </Button>
                            </Link>

                        </div>

                        <CalendarHeader className="mb-4" />

                        <div className="flex-grow overflow-visible">
                            <CalendarBody
                                features={features}
                                densityMode={isPro && densityMode}
                                onDayDoubleClick={(date) => setQuickAddDate(date)}
                                activeCategory={activeCategory}
                            />
                        </div>

                        <div className="mt-4 flex justify-end px-4">
                            <CalendarLegend />
                        </div>

                        <QuickAddModal
                            date={quickAddDate}
                            isOpen={!!quickAddDate}
                            onClose={() => setQuickAddDate(null)}
                        />

                    </CalendarProvider>
                </div>

                {/* ── Monthly Notepad Toggle & Panel ──────────────────────── */}
                <div className="w-full flex flex-col items-center mt-6 gap-6">
                    <button
                        onClick={() => {
                            setShowNotepad(!showNotepad);
                            if (!showNotepad) {
                                setTimeout(() => {
                                    notepadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }, 300);
                            }
                        }}
                        className="group flex items-center gap-3 px-8 py-3.5 rounded-full bg-white/60 backdrop-blur-sm border border-brand-lichen/20 hover:border-orange-500/30 text-brand-ink hover:text-orange-600 transition-all duration-500 shadow-sm hover:shadow-md font-sans font-bold text-sm uppercase tracking-[0.15em]"
                    >
                        <BookOpen className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                        {showNotepad ? 'Close your notepad' : 'Open your monthly notepad'}
                    </button>

                    <AnimatePresence>
                        {showNotepad && (
                            <motion.div
                                ref={notepadRef}
                                initial={{ opacity: 0, height: 0, scale: 0.97 }}
                                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                exit={{ opacity: 0, height: 0, scale: 0.97 }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                className="w-full overflow-hidden"
                            >
                                <MonthlyJournal />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.main>
    );
}
