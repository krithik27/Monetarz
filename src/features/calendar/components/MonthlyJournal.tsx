"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCalendarMonth, useCalendarYear } from "@/features/calendar/components";
import { useAuth } from "@/context/AuthContext";
import { getRecentJournalEntry, upsertJournalEntry } from "@/lib/journal-service";
import { Loader2, Save, CheckCircle2 } from "lucide-react";

// ── Monthly Prompts ────────────────────────────────────────────────────────────
const MONTHLY_PROMPTS: Record<number, string> = {
    0: "What financial habits do you want to build this January?",
    1: "What does financial love look like to you this February?",
    2: "What seeds of awareness are you planting this March?",
    3: "What does financial peace look like to you this April?",
    4: "What are you grateful for in your financial journey this May?",
    5: "What does a lighter relationship with money feel like this June?",
    6: "What patterns have you noticed in your spending this July?",
    7: "What does financial rest mean to you this August?",
    8: "What intentions are you setting for your money this September?",
    9: "What are you letting go of financially this October?",
    10: "What abundance are you recognizing this November?",
    11: "What did your money teach you this December?",
};

// ── Month Display Names ────────────────────────────────────────────────────────
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function MonthlyJournal() {
    const [month] = useCalendarMonth();
    const [year] = useCalendarYear();
    const { user } = useAuth();

    const [note, setNote] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    // Derive the prompt_id for the currently viewed month
    const promptId = useMemo(
        () => `monthly_note_${year}_${String(month + 1).padStart(2, "0")}`,
        [month, year]
    );

    const saveStatusRef = useRef<SaveStatus>("idle");
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedRef = useRef<string>("");
    const noteRef = useRef(note);
    const promptIdRef = useRef(promptId);

    const monthLabel = MONTH_NAMES[month];
    const prompt = MONTHLY_PROMPTS[month];

    // ── Load note when month/year changes ──────────────────────────────────────
    useEffect(() => {
        if (!user?.id) return;

        let cancelled = false;
        setIsLoading(true);
        setSaveStatus("idle");

        (async () => {
            const entry = await getRecentJournalEntry(user.id, promptId);
            if (!cancelled) {
                const text = entry?.response ?? "";
                setNote(text);
                lastSavedRef.current = text;
                setIsLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [user?.id, promptId]);


    useEffect(() => {
        noteRef.current = note;
    }, [note]);

    useEffect(() => {
        promptIdRef.current = promptId;
    }, [promptId]);

    // ── Debounced auto-save ────────────────────────────────────────────────────
    const saveNote = useCallback(async (text: string, pid: string) => {
        if (!user?.id || !text.trim() && !lastSavedRef.current) return;
        if (text === lastSavedRef.current) return;

        setSaveStatus("saving");
        const result = await upsertJournalEntry(user.id, pid, text, "monthly_reflection");
        if (result.success) {
            lastSavedRef.current = text;
            setSaveStatus("saved");
            // Keep "saved" status visible for 3s
            setTimeout(() => setSaveStatus("idle"), 3000);
        } else {
            setSaveStatus("error");
            setTimeout(() => setSaveStatus("idle"), 4000);
        }
    }, [user?.id]);

    const debouncedSave = useCallback(
        (text: string) => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            setSaveStatus("idle");
            saveTimerRef.current = setTimeout(() => saveNote(text, promptIdRef.current), 1200);
        },
        [saveNote]
    );

    const handleNoteChange = (value: string) => {
        setNote(value);
        debouncedSave(value);
    };

    // ── Flush pending save on unmount or navigation ───────────────────────────
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
            // Use refs to get absolute latest values in cleanup
            const currentNote = noteRef.current;
            const currentPid = promptIdRef.current;
            
            if (currentNote !== lastSavedRef.current) {
                // Fire and forget final save
                upsertJournalEntry(user?.id || "", currentPid, currentNote, "monthly_reflection");
            }
        };
    }, [user?.id]); // Only runs on unmount or user change

    // ── Manual Save ───────────────────────────────────────────────────────────
    const handleManualSave = () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveNote(note, promptId);
    };

    const hasUnsavedChanges = note !== lastSavedRef.current && note.length > 0;

    // ── Save status indicator ──────────────────────────────────────────────────
    const renderSaveStatus = () => {
        switch (saveStatus) {
            case "saving":
                return (
                    <span className="flex items-center gap-1.5 text-xs font-sans text-orange-500 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" /> saving…
                    </span>
                );
            case "saved":
                return (
                    <span className="flex items-center gap-1.5 text-xs font-sans text-brand-moss">
                        <CheckCircle2 className="w-3 h-3" /> saved
                    </span>
                );
            case "error":
                return (
                    <span className="flex items-center gap-1.5 text-xs font-sans text-brand-coral">
                        couldn't save — will retry
                    </span>
                );
            default:
                return hasUnsavedChanges ? (
                    <span className="text-[10px] uppercase font-sans font-bold text-orange-400/60 tracking-widest animate-pulse">
                        Unsaved changes
                    </span>
                ) : (
                    <span className="text-[10px] uppercase font-sans font-bold text-brand-sage/40 tracking-widest">
                        Draft safe
                    </span>
                );
        }
    };

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-[4fr_6fr] gap-0 rounded-3xl overflow-hidden bg-white/40 backdrop-blur-sm ring-1 ring-brand-lichen/10 shadow-sm min-h-[380px]">

            {/* ── LEFT: Hero (40%) ──────────────────────────────────────────── */}
            <div className="relative flex flex-col items-center justify-center p-8 lg:p-12 bg-gradient-to-br from-orange-50 via-brand-cream to-brand-mist overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-brand-moss/5 rounded-full blur-3xl" />

                {/* Image */}
                <motion.img
                    src="/images/cactus_deco.webp"
                    alt="Monthly reflection"
                    className="w-48 h-48 lg:w-64 lg:h-64 object-contain drop-shadow-xl relative z-10"
                    initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* Month Label */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="mt-6 text-center relative z-10"
                >
                    <p className="text-sm uppercase tracking-[0.3em] font-sans font-black text-orange-500/60">
                        {year}
                    </p>
                    <h3 className="text-5xl lg:text-7xl font-sans font-black text-brand-ink lowercase tracking-tight leading-none mt-2">
                        {monthLabel}
                    </h3>
                    <p className="text-lg font-sans text-brand-sage/70 mt-2 lowercase font-medium">
                        awareness
                    </p>
                </motion.div>
            </div>

            {/* ── RIGHT: Note (60%) ─────────────────────────────────────────── */}
            <div className="flex flex-col p-6 lg:p-10 bg-white/20">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="font-sans font-bold text-brand-ink text-xl uppercase tracking-tight">
                            Monthly Note
                        </h4>
                        <p className="font-sans font-medium text-brand-sage/60 text-sm lowercase mt-0.5">
                            a note to yourself — only you can see this
                        </p>
                    </div>
                </div>

                {/* Status & Save bar */}
                <div className="flex items-center justify-between gap-2 h-8 mb-4">
                    <div className="flex items-center gap-2">
                        {renderSaveStatus()}
                    </div>
                    
                    <AnimatePresence>
                        {hasUnsavedChanges && (
                            <motion.button
                                initial={{ opacity: 0, x: 5 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 5 }}
                                onClick={handleManualSave}
                                disabled={saveStatus === "saving"}
                                className="flex items-center gap-2 pr-1 text-orange-500 hover:text-orange-600 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-sans font-black uppercase tracking-widest">Save Now</span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Prompt */}
                <motion.div
                    key={month}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-4 px-4 py-3 rounded-2xl bg-orange-500/[0.04] border border-orange-500/10"
                >
                    <p className="text-sm font-sans text-orange-600/80 italic leading-relaxed">
                        &ldquo;{prompt}&rdquo;
                    </p>
                </motion.div>

                {/* Textarea Area */}
                <div className="flex-1 relative">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full min-h-[200px]">
                            <Loader2 className="w-6 h-6 animate-spin text-brand-sage/40" />
                        </div>
                    ) : (
                        <textarea
                            value={note}
                            onChange={(e) => handleNoteChange(e.target.value)}
                            placeholder="Start writing your thoughts…"
                            className="w-full h-full min-h-[200px] resize-none bg-transparent font-sans italic text-brand-ink text-lg leading-[2.2] placeholder:text-brand-sage/30 focus:outline-none p-2"
                            style={{
                                backgroundImage: "repeating-linear-gradient(transparent, transparent 2.15em, rgba(194, 205, 190, 0.18) 2.15em, rgba(194, 205, 190, 0.18) 2.2em)",
                                backgroundSize: "100% 2.2em",
                                backgroundAttachment: "local",
                            }}
                            spellCheck={false}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-brand-lichen/10">
                    <div className="flex items-center gap-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-brand-sage/30">
                            {monthLabel.toLowerCase()}
                        </p>
                        <div className="w-px h-3 bg-brand-lichen/20" />
                        <p className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-brand-sage/30">
                            {year}
                        </p>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-brand-sage/30">
                        {note.length} characters of awareness
                    </p>
                </div>
            </div>
        </div>
    );
}
