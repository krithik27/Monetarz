"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { LogOut, ArrowLeft, ShieldAlert, ChevronRight, Bot, Zap, Download } from "lucide-react";
import DeleteButton from "@/components/delete-button";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { useCurrency } from "@/context/CurrencyContext";
import { CurrencyCode } from "@/lib/money";
import { motion, AnimatePresence } from "framer-motion";
import { exportTransactionsCSV } from "@/lib/csv-export";
import { useSpends } from "@/context/SpendsContext";

// ── Local High-End Switch Component ──────────────────────────────────────────
const Switch = ({ enabled, onChange, disabled, color = "bg-orange-500" }: {
    enabled: boolean;
    onChange: () => void;
    disabled?: boolean;
    color?: string;
}) => (
    <button
        onClick={onChange}
        disabled={disabled}
        className={cn(
            "relative w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 disabled:opacity-50",
            enabled ? color : "bg-orange-500/40"
        )}
    >
        <motion.div
            animate={{ x: enabled ? 24 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="w-4 h-4 bg-white rounded-full shadow-md"
        />
    </button>
);

const SUPPORTED_CURRENCIES: { code: CurrencyCode; label: string }[] = [
    { code: "USD", label: "US Dollar ($)" },
    { code: "INR", label: "Indian Rupee (₹)" },
    { code: "PHP", label: "Philippine Peso (₱)" },
];

/**
 * SETTINGS PAGE: User Agency & Data Control
 * 
 * Minimalist by design. Two actions only:
 * 1. Sign Out — immediate, no confirmation needed
 * 2. Delete Account — requires explicit confirmation
 * 
 * No profile editing. No preferences. Pure data control.
 */
export default function SettingsPage() {
    const { user, signOut, isAdmin, isPro, updateUserMetadata, toggleProTier } = useAuth();
    const router = useRouter();
    const { activeCurrency, setActiveCurrency } = useCurrency();

    const [aiEnabled, setAiEnabled] = useState(true);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [isPurging, setIsPurging] = useState(false);
    const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
    const [showExportConfirm, setShowExportConfirm] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);

    const { spends = [] } = useSpends();
    const retentionDays = user?.user_metadata?.data_retention_days || 90;
    const isAiDisabled = user?.user_metadata?.intelligence_disabled === true;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('DEV_AI_ENABLED');
            if (stored !== null) setAiEnabled(stored === 'true');
        }
    }, []);

    const toggleAi = () => {
        const newVal = !aiEnabled;
        setAiEnabled(newVal);
        localStorage.setItem('DEV_AI_ENABLED', String(newVal));
    };


    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut();
            // Force a full page reload to the landing page to clear all client memory/state
            window.location.href = "/";
        } catch (error) {
            console.error("Sign out failed:", error);
            window.location.href = "/";
        }
    };

    const handleDeleteAccount = async () => {
        try {
            // DEV PROXY MODE: Skip server-side purge if using local persistence
            const DEV_USER_ID = '00000000-0000-0000-0000-000000000123';
            const isDevUser = user?.id === DEV_USER_ID;
            const IS_PROXY_MODE = process.env.NODE_ENV === 'development' && isDevUser;

            if (IS_PROXY_MODE) {
                // Clear local persistence via API
                await fetch('/api/persistence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        spends: [],
                        memories: [],
                        reflections: []
                    })
                });
            } else {
                // 1. Purge data from Supabase first
                const { error } = await supabase.rpc("purge_user_data");
                if (error) {
                    console.error("Failed to purge user data:", error);
                }
            }

            // 2. Clear local browser data
            if (typeof window !== "undefined") {
                localStorage.clear();
                // Clear cookies
                document.cookie.split(";").forEach((c) => {
                    document.cookie = c
                        .replace(/^ +/, "")
                        .replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/");
                });
            }

            // 3. Sign out
            await signOut();
            router.push("/");
        } catch (error) {
            console.error("Failed to delete account:", error);
        }
    };

    const userEmail = user?.user_metadata?.email || user?.email || "Developer";

    return (
        <main className="min-h-screen bg-brand-cream text-brand-ink font-sans selection:bg-orange-500/30 px-6 py-12 relative overflow-hidden">
            {/* Polymath Glow Background */}
            <div className="polymath-glow" />

            <div className="max-w-xl mx-auto space-y-10 relative z-10">
                {/* Header */}
                <div className="space-y-6">
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 text-brand-moss/60 hover:text-brand-moss transition-all duration-300 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-sans tracking-widest uppercase font-bold">back to journal</span>
                    </button>

                    <div className="space-y-1">
                        <h1 className="text-6xl font-sans font-black tracking-tight text-brand-ink/90 lowercase leading-none">
                            Settings
                        </h1>
                        <p className="text-orange-500 font-serif italic text-xl lowercase">
                            Signed in as <span className="text-brand-ink not-italic font-sans font-bold"> {userEmail}</span>
                        </p>
                    </div>
                </div>

                {/* --- GROUP 1: SUBSCRIPTION --- */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-sm tracking-[0.2em] font-sans uppercase font-black text-brand-ink/50">Tier & Identity</h2>
                        {isPro && (
                            <motion.div
                                animate={{
                                    opacity: [0.8, 1, 0.8],
                                    scale: [0.98, 1, 0.98],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="flex items-center gap-2 text-sm font-sans text-brand-ink bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-green-500/30"
                            >
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                                </span>
                                ACTIVE
                            </motion.div>
                        )}
                    </div>

                    <div className="w-full grid grid-cols-1 gap-4">
                        {!isPro && (
                            <button
                                onClick={() => router.push("/pricing")}
                                className="w-full p-6 rounded-3xl bg-orange-500 text-white shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-sans font-bold text-xl uppercase tracking-tight">Upgrade to Horizon Pro</p>
                                        <p className="font-sans text-orange-100 text-sm font-medium lowercase">Unlock AI insights, forecasts, and more.</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                            </button>
                        )}

                        {/* Profile Summary Card */}
                        <div className="p-6 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-sm relative overflow-hidden group">
                            <div className=" flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-moss/10 flex items-center justify-center text-brand-moss shadow-inner">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-sans font-bold text-brand-ink text-xl uppercase tracking-tight">Intelligence Layer</p>
                                        <p className="font-sans text-brand-sage/70 text-sm font-medium lowercase">AI-driven patterns and insights.</p>
                                    </div>
                                </div>
                                <Switch
                                    enabled={!isAiDisabled}
                                    disabled={isSavingSettings}
                                    onChange={async () => {
                                        setIsSavingSettings(true);
                                        try {
                                            await updateUserMetadata({ intelligence_disabled: !isAiDisabled });
                                        } finally {
                                            setIsSavingSettings(false);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Pro Features Header */}
                        {isPro && (
                            <div className="p-6 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-sm transition-all duration-500 hover:shadow-md">
                                <div className="space-y-6">
                                    {/* Base Currency Item */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-brand-moss/10 flex items-center justify-center text-brand-moss shadow-inner">
                                                <span className="text-xl font-bold font-sans">{activeCurrency === 'INR' ? '₹' : activeCurrency === 'USD' ? '$' : '₱'}</span>
                                            </div>
                                            <div className="text-left">
                                                <p className="font-sans font-bold text-brand-ink text-xl uppercase tracking-tight">Base Currency</p>
                                                <p className="font-sans text-brand-sage/70 text-sm font-medium lowercase leading-tight">Live exchange rates baseline.</p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={activeCurrency}
                                                disabled={isSavingSettings}
                                                onChange={async (e) => {
                                                    const newCurrency = e.target.value as CurrencyCode;
                                                    setIsSavingSettings(true);
                                                    try {
                                                        await updateUserMetadata({ base_currency: newCurrency });
                                                        setActiveCurrency(newCurrency);
                                                    } finally {
                                                        setIsSavingSettings(false);
                                                    }
                                                }}
                                                className="appearance-none bg-brand-moss/[0.03] border border-brand-moss/10 text-brand-moss rounded-xl pl-4 pr-10 py-2 outline-none focus:border-brand-moss/40 transition-all font-sans disabled:opacity-50 text-sm font-bold tracking-widest uppercase"
                                            >
                                                {SUPPORTED_CURRENCIES.map((c) => (
                                                    <option key={c.code} value={c.code}>
                                                        {c.code}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-brand-moss">
                                                <ChevronRight className="w-4 h-4 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- GROUP 2: DATA & PRIVACY --- */}
                <div className="space-y-4">
                    <h2 className="text-sm tracking-[0.2em] font-sans uppercase font-black text-brand-ink/50 px-2">Data Control & Reality Check</h2>

                    <div className="w-full grid grid-cols-1 gap-4">
                        {/* Data Retention & Export Card */}
                        <div className="rounded-3xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-sm overflow-hidden">
                            {/* Retention Row */}
                            <div className="p-6 flex items-center justify-between border-b border-white/60">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-moss/10 flex items-center justify-center text-brand-moss shadow-inner">
                                        <ShieldAlert className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-sans font-bold text-brand-ink text-xl uppercase tracking-tight">Data Retention</p>
                                        <p className="font-sans text-brand-sage/70 text-sm font-medium lowercase">Journal entry lifecycle.</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <select
                                        value={retentionDays}
                                        disabled={isSavingSettings}
                                        onChange={async (e) => {
                                            const days = parseInt(e.target.value);
                                            setIsSavingSettings(true);
                                            try {
                                                await updateUserMetadata({ data_retention_days: days });
                                            } finally {
                                                setIsSavingSettings(false);
                                            }
                                        }}
                                        className="appearance-none bg-brand-moss/[0.03] border border-brand-moss/10 text-brand-moss rounded-xl pl-4 pr-10 py-2 outline-none focus:border-brand-moss/40 transition-all font-sans disabled:opacity-50 text-xs font-bold tracking-widest uppercase"
                                    >
                                        <option value={30}>1 Month</option>
                                        <option value={60}>2 Months</option>
                                        <option value={90}>3 Months</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-brand-moss">
                                        <ChevronRight className="w-4 h-4 rotate-90" />
                                    </div>
                                </div>
                            </div>

                            {/* Export Row (Pro Only) */}
                            {isPro && (
                                <button
                                    onClick={() => setShowExportConfirm(true)}
                                    className="w-full p-6 flex items-center justify-between hover:bg-white/40 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-moss/10 flex items-center justify-center text-brand-moss group-hover:bg-brand-moss group-hover:text-white transition-all duration-500 shadow-inner">
                                            <Download className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-sans font-bold text-brand-ink text-xl uppercase tracking-tight">Export Journal</p>
                                            <p className="font-sans text-brand-sage/70 text-sm font-medium lowercase">Download all records as CSV.</p>
                                        </div>
                                    </div>
                                    <div className="text-brand-sage/40 group-hover:translate-x-1 transition-transform">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </button>
                            )}

                            {/* Apply Retention Policy Row */}
                            <button
                                disabled={isPurging}
                                onClick={() => setShowPurgeConfirm(true)}
                                className="w-full p-6 flex items-center justify-between bg-brand-coral/[0.04] hover:bg-brand-coral/[0.08] border-t border-brand-coral/10 transition-all group disabled:opacity-50"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-moss/10 flex items-center justify-center text-brand-moss shadow-inner">
                                        <ShieldAlert className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-sans font-bold text-brand-coral text-xl uppercase tracking-tight">Apply Retention Policy</p>
                                        <p className="font-sans text-brand-coral/70 text-sm font-medium lowercase">Purge entries older than {Math.floor(retentionDays / 30)} mo.</p>
                                    </div>
                                </div>
                                <div className="text-brand-coral/40 group-hover:translate-x-1 transition-transform">
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Export Journal Modal Overlay */}
                <AnimatePresence>
                    {showExportConfirm && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowExportConfirm(false)}
                                className="absolute inset-0 bg-brand-ink/40 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl border border-brand-moss/20 text-center space-y-6"
                            >
                                <div className="w-16 h-16 bg-brand-moss/10 rounded-3xl flex items-center justify-center text-brand-moss mx-auto shadow-inner">
                                    <Download className="w-8 h-8" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-serif text-brand-ink tracking-tight">Journal Export</h3>
                                    <p className="text-brand-sage text-base leading-relaxed lowercase font-medium">
                                        You are about to export <span className="font-bold text-brand-moss">{spends.length} entries</span>.
                                        Keep this file safe as it contains your unique flow history.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => {
                                            setShowExportConfirm(false);
                                            const csvData = spends.map((s: any) => ({
                                                id: s.id || Math.random().toString(36).substr(2, 9),
                                                date: s.date,
                                                title: s.title,
                                                amount: s.amount,
                                                category: s.category,
                                                currency_code: activeCurrency
                                            }));
                                            exportTransactionsCSV(csvData);
                                        }}
                                        className="w-full py-4 bg-brand-moss text-white rounded-2xl font-sans font-bold uppercase tracking-[0.2em] text-xs hover:bg-brand-moss/90 transition-all shadow-lg shadow-brand-moss/20"
                                    >
                                        Download CSV
                                    </button>
                                    <button
                                        onClick={() => setShowExportConfirm(false)}
                                        className="w-full py-4 bg-brand-mist/40 text-brand-moss rounded-2xl font-sans font-bold uppercase tracking-[0.2em] text-xs hover:bg-brand-mist/60 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {showPurgeConfirm && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowPurgeConfirm(false)}
                                className="absolute inset-0 bg-brand-ink/40 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl border border-brand-coral/20 text-center space-y-6"
                            >
                                <div className="w-16 h-16 bg-brand-coral rounded-3xl flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-coral/20">
                                    <ShieldAlert className="w-8 h-8" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-serif text-brand-ink tracking-tight">This is reality.</h3>
                                    <p className="text-brand-sage text-base leading-relaxed lowercase font-medium">
                                        Deleting entries older than <span className="font-bold text-brand-coral">{retentionDays} days</span> is irreversible.
                                        Once the flow is cut, it cannot be recovered.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={async () => {
                                            setShowPurgeConfirm(false);
                                            setIsPurging(true);
                                            try {
                                                const { error } = await supabase.rpc('apply_retention_policy', {
                                                    days_to_keep: retentionDays
                                                });
                                                if (error) throw error;
                                                alert("Flow pruned. Reality updated.");
                                            } catch (err) {
                                                console.error("Purge failed:", err);
                                            } finally {
                                                setIsPurging(false);
                                            }
                                        }}
                                        className="w-full py-4 bg-brand-moss text-white rounded-2xl font-sans font-bold uppercase tracking-[0.2em] text-xs hover:bg-brand-moss/90 transition-all shadow-lg shadow-brand-coral/20"
                                    >
                                        Prune History
                                    </button>
                                    <button
                                        onClick={() => setShowPurgeConfirm(false)}
                                        className="w-full py-4 bg-brand-mist/40 text-brand-moss rounded-2xl font-sans font-bold uppercase tracking-[0.2em] text-xs hover:bg-brand-mist/60 transition-all"
                                    >
                                        Keep Alive
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- GROUP 3: SYSTEM --- */}
                <div className="space-y-4">
                    <h2 className="text-sm tracking-[0.2em] font-sans uppercase font-black text-brand-ink/50 px-2">Lifecycle & Account</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {/* Sign Out */}
                        <button
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            className="p-6 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-sm flex items-center gap-4 hover:bg-white/60 transition-all group disabled:opacity-50"
                        >
                            <div className="w-10 h-10 rounded-xl bg-brand-mist/40 flex items-center justify-center text-brand-moss group-hover:bg-brand-moss group-hover:text-white transition-all duration-500">
                                <LogOut className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-sans font-bold text-brand-ink text-lg uppercase tracking-tight">{isSigningOut ? "signing out..." : "Sign Out"}</p>
                                <p className="font-sans text-brand-sage/60 text-sm lowercase leading-tight">Your data stays safe until you return.</p>
                            </div>
                        </button>

                        {/* Admin Controls */}
                        {isAdmin && (
                            <div className="space-y-4">
                                <button
                                    onClick={() => router.push("/admin")}
                                    className="w-full p-6 rounded-3xl bg-brand-moss/5 backdrop-blur-xl border border-brand-moss/20 shadow-sm flex items-center justify-between hover:bg-brand-moss/10 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-brand-moss/10 flex items-center justify-center text-brand-moss group-hover:bg-brand-moss group-hover:text-white transition-all">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-sans font-bold text-brand-moss text-lg uppercase tracking-tight">Admin Console</p>
                                            <p className="font-sans text-brand-sage/60 text-sm lowercase leading-tight">Diagnostics and global metrics.</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-brand-moss/40 group-hover:translate-x-1 transition-all" />
                                </button>
                                
                                {/* Admin Pro Toggle */}
                                <div className="w-full p-6 rounded-3xl bg-orange-500/5 backdrop-blur-xl border border-orange-500/20 shadow-sm flex items-center justify-between transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 transition-all">
                                            <ShieldAlert className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-sans font-bold text-orange-500 text-lg uppercase tracking-tight">Force Pro Mode</p>
                                            <p className="font-sans text-brand-sage/60 text-sm lowercase leading-tight">Override subscription status for testing.</p>
                                        </div>
                                    </div>
                                    <Switch
                                        enabled={isPro}
                                        onChange={toggleProTier}
                                        color="bg-orange-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Delete Account */}
                        <div className="w-full flex items-center justify-center p-6 rounded-3xl bg-red-50/20 backdrop-blur-xl border border-red-100/40 shadow-sm">
                            <DeleteButton onConfirm={handleDeleteAccount} />
                        </div>
                    </div>
                </div>

                {/* Trust Footer */}
                <p className="text-center text-brand-sage/30 text-xs font-sans font-medium tracking-[0.3em] uppercase pt-8">
                    Monetarz — Immutable Agency
                </p>
            </div>
        </main >
    );
}
