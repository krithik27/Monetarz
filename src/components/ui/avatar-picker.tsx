"use client";

/**
 * AvatarPicker
 *
 * Full-featured avatar selector built on DiceBear Adventurer SVG URL API.
 * - 4×3 grid of pre-generated avatars (randomisable)
 * - Background-colour swatches (4 brand presets)
 * - Flip toggle (mirror)
 * - AnimatePresence stagger on grid items
 * - Save → writes seed + bg + flip to user_metadata via useAuth
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, FlipHorizontal, CheckCircle2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    buildAvatarUrl,
    AVATAR_BG_PRESETS,
    type AvatarConfig,
} from "@/hooks/useAvatar";
import { useAuth } from "@/context/AuthContext";

// ─── Seed wordlist for expressive, distinct avatars ──────────────────────────
const SEED_WORDS = [
    // Nature
    "maple", "river", "cloud", "ember", "stone", "dusk", "grove", "tide",
    "frost", "luna", "cedar", "vale", "pines", "hawk", "reef", "solstice",
    "prism", "echo", "zephyr", "fern", "quartz", "briar", "cove", "onyx",
    "sage", "moss", "dawn", "peak", "lark", "gale", "forest", "ocean",
    // Animals
    "wolf", "fox", "bear", "owl", "raven", "stag", "lynx", "crane",
    "falcon", "wren", "otter", "seal", "orca", "elk", "bison", "badger",
    // Celestial
    "nebula", "comet", "aurora", "eclipse", "stellar", "cosmos", "nova", "orbit",
    "quasar", "pulsar", "zenith", "nadir", "sol", "lunar", "astro", "void",
    // Elements
    "flame", "spark", "surge", "thorn", "rust", "crystal", "magma", "obsidian",
    "pewter", "marble", "granite", "slate", "copper", "bronze", "silver", "gold",
    // Colors
    "crimson", "indigo", "amber", "violet", "azure", "jade", "rose", "teal",
    "ochre", "umber", "sepia", "cerulean", "magenta", "vermilion", "turquoise", "saffron",
    // Mythic & Archetypes
    "phoenix", "drake", "nymph", "titan", "oracle", "wanderer", "nomad", "bard",
    "ranger", "sentry", "mender", "weaver", "seeker", "pioneer", "hermit", "keeper",
    // Textures & Materials
    "velvet", "ivory", "silk", "denim", "canvas", "clay", "resin", "jet",
    "bone", "coral", "pearl", "opal", "topaz", "garnet", "malachite", "jasper",
];

function pickSeeds(count: number, exclude: string[] = []): string[] {
    const pool = SEED_WORDS.filter((w) => !exclude.includes(w));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    // If the pool is exhausted, generate random suffixes
    while (shuffled.length < count) {
        shuffled.push(`seed-${Math.floor(Math.random() * 9999)}`);
    }
    return shuffled.slice(0, count);
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface AvatarPickerProps {
    currentConfig: AvatarConfig;
    onSaved?: () => void;
    className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AvatarPicker({ currentConfig, onSaved, className }: AvatarPickerProps) {
    const { updateUserMetadata } = useAuth();

    // Working state (uncommitted until Save is hit)
    const [selectedSeed, setSelectedSeed] = useState(currentConfig.seed);
    const [selectedBg, setSelectedBg] = useState(currentConfig.bg);
    const [isFlipped, setIsFlipped] = useState(currentConfig.flip);
    const [gridSeeds, setGridSeeds] = useState<string[]>(() =>
        // Always include the current seed in the grid at position 0
        [currentConfig.seed, ...pickSeeds(23, [currentConfig.seed])]
    );

    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);

    // Derived: has anything changed from the persisted config?
    const isDirty =
        selectedSeed !== currentConfig.seed ||
        selectedBg !== currentConfig.bg ||
        isFlipped !== currentConfig.flip;

    const previewUrl = buildAvatarUrl({ seed: selectedSeed, bg: selectedBg, flip: isFlipped });

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleRandomize = useCallback(() => {
        const newSeeds = [selectedSeed, ...pickSeeds(23, [selectedSeed])].sort(() => Math.random() - 0.5);
        setGridSeeds(newSeeds);
    }, [selectedSeed]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        const { error } = await updateUserMetadata({
            avatar_seed: selectedSeed,
            avatar_bg: selectedBg,
            avatar_flip: isFlipped,
        });
        setIsSaving(false);
        if (!error) {
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2500);
            onSaved?.();
        }
    }, [selectedSeed, selectedBg, isFlipped, updateUserMetadata, onSaved]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {/* ── Top: Preview + controls row ─────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Large avatar preview */}
                <motion.div
                    key={previewUrl}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="relative shrink-0"
                >
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-brand-moss/30 to-brand-lichen/20 blur-md" />
                    <div
                        className={cn(
                            "relative w-28 h-28 rounded-full overflow-hidden border-2 shadow-xl",
                            AVATAR_BG_PRESETS.find((p) => p.value === selectedBg)?.tailwind ?? "border-brand-lichen/40"
                        )}
                    >
                        <img
                            src={previewUrl}
                            alt="Your avatar preview"
                            className="w-full h-full object-cover"
                        // no onError — DiceBear always returns an SVG
                        />
                    </div>
                    {/* Checkmark overlay when saved */}
                    <AnimatePresence>
                        {justSaved && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute -bottom-1 -right-1 bg-brand-moss rounded-full p-1 shadow-lg"
                            >
                                <CheckCircle2 className="w-4 h-4 text-white" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Controls column */}
                <div className="flex flex-col gap-4 flex-1 w-full">
                    {/* Seed label */}
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-brand-sage font-sans mb-1">
                            Current Seed
                        </p>
                        <p className="text-sm font-sans font-medium text-brand-ink/70 lowercase">
                            {selectedSeed}
                        </p>
                    </div>

                    {/* Background Swatches */}
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-brand-sage font-sans mb-2">
                            Background
                        </p>
                        <div className="flex items-center gap-2">
                            {AVATAR_BG_PRESETS.map((preset) => (
                                <button
                                    key={preset.value}
                                    onClick={() => setSelectedBg(preset.value)}
                                    title={preset.label}
                                    className={cn(
                                        "w-7 h-7 rounded-full border-2 transition-all duration-200 shadow-sm",
                                        preset.tailwind,
                                        selectedBg === preset.value
                                            ? "ring-2 ring-brand-moss ring-offset-2 scale-110"
                                            : "opacity-60 hover:opacity-100 hover:scale-105"
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Action row: Flip + Randomize + Save */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={() => setIsFlipped((f) => !f)}
                            title="Mirror avatar"
                            className={cn(
                                "h-9 w-9 rounded-xl flex items-center justify-center border transition-all duration-200",
                                isFlipped
                                    ? "bg-brand-moss text-white border-brand-moss shadow-md"
                                    : "bg-white/60 text-brand-sage border-brand-lichen/30 hover:border-brand-moss hover:text-brand-moss"
                            )}
                        >
                            <FlipHorizontal className="w-4 h-4" />
                        </button>

                        <button
                            onClick={handleRandomize}
                            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-white/60 border border-brand-lichen/30 text-brand-sage text-xs font-sans font-semibold uppercase tracking-wider hover:border-brand-moss hover:text-brand-moss transition-all duration-200"
                        >
                            <Shuffle className="w-3.5 h-3.5" />
                            Shuffle
                        </button>

                        <motion.button
                            onClick={handleSave}
                            disabled={isSaving || !isDirty}
                            whileTap={{ scale: 0.96 }}
                            className={cn(
                                "flex items-center gap-2 h-9 px-5 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all duration-300",
                                isDirty
                                    ? "bg-brand-ink text-brand-cream hover:bg-brand-moss shadow-md cursor-pointer"
                                    : "bg-brand-mist/40 text-brand-sage cursor-not-allowed"
                            )}
                        >
                            <Save className="w-3.5 h-3.5" />
                            {isSaving ? "Saving…" : justSaved ? "Saved ✓" : "Save Avatar"}
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* ── Grid: 4×3 avatar picker ──────────────────────────────────── */}
            <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-brand-sage font-sans mb-3">
                    Choose your look
                </p>
                <div className="grid grid-cols-6 gap-3">
                    <AnimatePresence mode="popLayout">
                        {gridSeeds.map((seed, idx) => {
                            const url = buildAvatarUrl({ seed, bg: selectedBg, flip: isFlipped });
                            const isSelected = seed === selectedSeed;
                            return (
                                <motion.button
                                    key={seed}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.3, delay: idx * 0.03, ease: "easeOut" }}
                                    onClick={() => setSelectedSeed(seed)}
                                    className={cn(
                                        "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-200 group",
                                        isSelected
                                            ? "border-brand-moss ring-2 ring-brand-moss/30 scale-105 shadow-lg"
                                            : "border-brand-lichen/20 hover:border-brand-moss/50 hover:scale-105"
                                    )}
                                >
                                    <img
                                        src={url}
                                        alt={`Avatar option: ${seed}`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    {/* Selected checkmark overlay */}
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-brand-moss/10 flex items-end justify-end p-1">
                                            <div className="bg-brand-moss rounded-full p-0.5 shadow">
                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                    )}
                                    {/* Hover overlay for non-selected */}
                                    {!isSelected && (
                                        <div className="absolute inset-0 bg-brand-moss/0 group-hover:bg-brand-moss/5 transition-all duration-200" />
                                    )}
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
