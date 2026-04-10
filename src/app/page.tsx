"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, KeyboardEvent, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { CurrencyCode, Money, MoneyEngine } from "@/lib/money";
import { PRO_FEATURES } from "@/lib/intelligence/feature-gate";
import { parseSpend, ParsedSpend } from "@/lib/parser";
import { deriveDailyStats, deriveWeeklyStats, deriveNarrativeHistory } from "@/lib/aggregation";
import { useSpends } from "@/context/SpendsContext";
import { SpendRow } from "@/features/today/components/SpendRow";
import { UndoToast } from "@/features/today/components/UndoToast";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WeeklyReflectionBanner } from "@/components/ui/weekly-reflection";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencySelector } from "@/components/CurrencySelector";
import { useCurrency } from "@/context/CurrencyContext";
import { formatAmount, getCurrencySymbol } from "@/lib/money";
import { useAuth } from "@/context/AuthContext";
import { LandingContent } from "@/components/ui/landing/landing";
import { JournalHero } from "@/components/ui/journal-hero";

function JournalPage() {
  const [input, setInput] = useState("");
  const { spends, addSpend, removeSpend, updateSpend, weeklyGoal, isLoading, error: contextError } = useSpends();
  const { activeCurrency } = useCurrency();
  const [inputError, setInputError] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [showOlderEntries, setShowOlderEntries] = useState(false);
  const { user, isPro } = useAuth();

  // Focus Management
  const inputRef = useRef<HTMLInputElement>(null);

  // Undo Logic
  const [lastDeletedSpend, setLastDeletedSpend] = useState<ParsedSpend | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  // All spends (excluding inflows) are included. Aggregation handles conversion.
  const filteredSpends = useMemo(() => {
    return spends.filter(s =>
      s.category !== "income" &&
      s.category !== "salary"
    );
  }, [spends]);

  // Derived State
  const todayStats = useMemo(() => {
    if (isLoading) return { total: 0, count: 0 };
    return deriveDailyStats(filteredSpends, { isFullSet: true, activeCurrency });
  }, [filteredSpends, isLoading, activeCurrency]);

  const narrativeGroups = useMemo(() => {
    if (isLoading) return [];
    return deriveNarrativeHistory(filteredSpends);
  }, [filteredSpends, isLoading]);

  // Removed auto-focus to show header on page load
  // useEffect(() => {
  //   if (!isLoading && inputRef.current) {
  //     inputRef.current.focus();
  //   }
  // }, [isLoading]);

  // Scroll to top on page load to show header first (input below fold)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      try {
        setInputError(null);
        if (!input.trim()) return;

        let parsedSpend = parseSpend(input);

        if (parsedSpend.needsReview || parsedSpend.confidence < 0.8) {
          setIsAiProcessing(true);
          const aiEnhanced = await PRO_FEATURES.llmParse(user?.id, isPro, input, parsedSpend);
          if (aiEnhanced) {
            parsedSpend = { ...parsedSpend, ...aiEnhanced };
          }
          setIsAiProcessing(false);
        }

        const spendWithCurrency = { ...parsedSpend, currency: activeCurrency };
        await addSpend(spendWithCurrency);
        setInput("");

      } catch {
        setInputError(`Try 'coffee ${getCurrencySymbol(activeCurrency)}150' or 'uber ${getCurrencySymbol(activeCurrency)}300'`);
        setIsAiProcessing(false);
      }
    }
  };

  const onDelete = (id: string) => {
    const spend = spends.find(s => s.id === id);
    if (spend) {
      setLastDeletedSpend(spend);
      setShowUndo(true);
      removeSpend(id);
      inputRef.current?.focus();
    }
  };

  const onUndo = () => {
    if (lastDeletedSpend) {
      addSpend(lastDeletedSpend);
      setLastDeletedSpend(null);
      setShowUndo(false);
      inputRef.current?.focus();
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen text-brand-ink font-serif overflow-hidden relative selection:bg-brand-moss/20"
    >
      <CurrencySelector />
      <Navbar />

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pt-20 md:pt-40 pb-12 flex flex-col items-center">
        <AnimatePresence>
          {contextError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-xl mb-8 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-lg p-3 flex items-start gap-3 text-red-800/80 text-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Sync/Persistence Error</p>
                <p>{contextError}. Your data is safe locally.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.header
          id="journal-header"
          className="mb-10 md:mb-16 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-6xl md:text-7xl text-brand-ink">
            Monetarz
          </h1>
          <p className="mt-2 md:mt-4 text-brand-sage text-md md:text-xl italic">
            <span className="text-orange-500">Awareness,</span> not control.
          </p>
        </motion.header>

        <WeeklyReflectionBanner />

        {/* ── Personalised Hero Greeting ── */}
        <JournalHero />

        <motion.div
          layout
          className="w-full max-w-2xl relative mb-12"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setInputError(null); }}
            onKeyDown={handleKeyDown}
            placeholder={isAiProcessing ? "AI is processing..." : "How did money flow today?"}
            className={cn(
              "w-full bg-transparent border-b-2 border-brand-lichen/50 text-2xl md:text-5xl py-4 text-center text-brand-ink placeholder:text-brand-sage/40 focus:outline-none focus:border-brand-moss transition-colors",
              isAiProcessing && "animate-pulse opacity-70 border-brand-moss"
            )}
            disabled={isLoading || isAiProcessing}
            spellCheck={false}
          />

          <AnimatePresence>
            {inputError && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute left-0 right-0 text-center mt-4 text-red-800/60 font-serif text-lg"
              >
                {inputError}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          layout
          className="w-full max-w-lg mb-8 md:mb-12 flex flex-col items-center"
        >
          <span className="text-brand-sage text-xs md:text-md uppercase tracking-[0.2em] mb-2">
            Today&apos;s Total
          </span>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Skeleton className="h-12 w-40 md:h-20 md:w-64 bg-brand-lichen/10" />
              </motion.div>
            ) : (
              <motion.div
                key={todayStats.total}
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-4xl md:text-7xl text-brand-moss font-serif"
              >
                {formatAmount(todayStats.total, activeCurrency)}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="w-full max-w-4xl pb-32">
          <div className="space-y-12">
            {isLoading ? (
              <div className="space-y-12">
                {[1, 2].map(i => (
                  <div key={i} className="space-y-4">
                    <div className="flex items-center px-4">
                      <Skeleton className="h-3 w-24 bg-brand-lichen/10" />
                      <div className="h-px bg-brand-lichen/10 flex-grow ml-4"></div>
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3].map(j => (
                        <Skeleton key={j} className="h-24 md:h-28 w-full rounded-2xl bg-brand-lichen/10 border border-brand-mist/20" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : narrativeGroups.length > 0 ? (
              <AnimatePresence initial={false} mode="popLayout">
                {(showOlderEntries ? narrativeGroups : narrativeGroups.slice(0, 3)).map((group) => (
                  <motion.div
                    key={group.label}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center px-4">
                      <span className="text-[10px] uppercase tracking-[0.3em] text-brand-sage font-sans">
                        {group.label}
                      </span>
                      <div className="h-px bg-brand-lichen/20 flex-grow ml-4"></div>
                    </div>
                    <div className="space-y-3">
                      {group.spends.map((spend, index) => (
                        <motion.div
                          key={spend.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.8,
                            delay: index * 0.1,
                            ease: "easeOut"
                          }}
                        >
                          <SpendRow
                            spend={spend}
                            onUpdate={updateSpend}
                            onDelete={onDelete}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
                {narrativeGroups.length > 3 && (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="pt-8 flex flex-col items-center gap-4"
                  >
                    <div className="w-12 h-px bg-brand-lichen/20" />
                    <button
                      onClick={() => setShowOlderEntries(!showOlderEntries)}
                      className="px-8 py-3 rounded-full border border-brand-lichen/30 text-brand-sage font-serif italic hover:bg-brand-lichen/5 hover:border-brand-lichen transition-all group"
                    >
                      <span className="flex items-center gap-2">
                        {showOlderEntries ? "Show fewer entries" : "Show older entries"}
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2 }}
                className="text-center py-32 flex flex-col items-center justify-center"
              >
                <div className="w-24 h-px bg-brand-lichen/20 mb-12" />
                <p className="text-brand-sage italic font-serif text-2xl md:text-3xl opacity-70 max-w-md leading-[1.8] tracking-wide">
                  Your journal is open.
                  <br />
                  <span className="text-xl md:text-2xl opacity-50 block mt-4">
                    There is no rush.
                  </span>
                </p>
                <div className="w-24 h-px bg-brand-lichen/20 mt-12" />
              </motion.div>
            )}
          </div>
        </div>

      </div>

      <UndoToast
        show={showUndo}
        onUndo={onUndo}
        onClose={() => setShowUndo(false)}
      />
    </motion.main>
  );
}

export default function Home() {
  const { user, isLoading } = useAuth();

  // If loading session, show a minimalist spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-lichen border-t-brand-moss animate-spin" />
      </div>
    );
  }

  // Route to landing if not authenticated
  if (!user) {
    return <LandingContent />;
  }

  // Authenticated: Render the Journal
  return (
    <ErrorBoundary>
      <JournalPage />
    </ErrorBoundary>
  );
}
