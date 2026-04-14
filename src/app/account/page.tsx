"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { AvatarPicker } from "@/components/ui/avatar-picker";
import { useAvatar } from "@/hooks/useAvatar";
import {
    Sparkles, LogOut, CheckCircle2, ShieldCheck, Zap,
    BarChart3, MessageSquareQuote, ChevronDown, User,
} from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSpends } from "@/context/SpendsContext";
import { useRazorpay } from "@/components/RazorpayCheckout";

// ─── Pricing ──────────────────────────────────────────────────────────────────
const PricingComponent = () => {
    const { openCheckout, isLoading } = useRazorpay();

    return (
        <div className="bg-white/40 backdrop-blur-md border border-brand-lichen/20 rounded-[2.5rem] p-8 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6 opacity-5 flex gap-2">
                <Zap className="w-20 h-20 -rotate-12" />
            </div>
            <div className="relative z-10">
                <Badge className="bg-brand-moss/10 text-brand-moss border-none mb-4 px-3 py-1 text-[10px] uppercase tracking-widest font-sans font-bold">
                    Premium Tier
                </Badge>
                <h3 className="text-3xl font-black font-sans uppercase tracking-light text-brand-ink mb-1">
                    Monetarz Pro
                </h3>
                <p className="text-sm text-brand-sage italic mb-8 font-serif">
                    Unlock deep awareness and financial foresight.
                </p>
                <ul className="space-y-4 mb-10">
                    {[
                        { icon: BarChart3, text: "Horizon Dashboard & Forecasts" },
                        { icon: Sparkles, text: "AI Advisor Narrative Insights" },
                        { icon: MessageSquareQuote, text: "Reflective AI Questions" },
                        { icon: Zap, text: "Infinite Journal History" },
                    ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-brand-ink/80 font-sans font-medium">
                            <item.icon className="w-4 h-4 text-brand-moss" />
                            {item.text}
                        </li>
                    ))}
                </ul>
                <button 
                    onClick={() => openCheckout('pro_monthly')}
                    disabled={isLoading}
                    className="w-full py-5 rounded-2xl font-bold font-sans text-lg bg-brand-moss text-brand-cream shadow-xl hover:bg-brand-ink hover:shadow-2xl transition-all duration-700 active:scale-95 disabled:opacity-50 lowercase"
                >
                    {isLoading ? "starting..." : "Upgrade to Pro"}
                </button>
                <p className="text-center text-[10px] text-brand-sage mt-4 uppercase tracking-widest opacity-60">
                    Secure payment via Razorpay
                </p>
            </div>
        </div>
    );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="bg-white/40 backdrop-blur-sm border border-brand-lichen/20 rounded-2xl p-6 flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-brand-sage font-sans">{label}</p>
            <p className="text-3xl font-black font-sans text-brand-ink lowercase">{value}</p>
        </div>
    );
}

// ─── Page Content ─────────────────────────────────────────────────────────────
function AccountPageContent() {
    const { user, isPro, signOut, updateUserMetadata } = useAuth();
    const { spends } = useSpends();
    const { config: avatarConfig } = useAvatar();
    const router = useRouter();

    const [financialContext, setFinancialContext] = useState(user?.user_metadata?.financial_context || "");
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
    const [gender, setGender] = useState(user?.user_metadata?.gender || "");
    const [role, setRole] = useState(user?.user_metadata?.role || "");

    const [isSavingDetails, setIsSavingDetails] = useState(false);
    const [savedDetails, setSavedDetails] = useState(false);
    const [isSavingContext, setIsSavingContext] = useState(false);
    const [savedContext, setSavedContext] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);

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

    const handleSaveDetails = async () => {
        if (!user) return;
        setIsSavingDetails(true);
        setSavedDetails(false);
        const { error } = await updateUserMetadata({ full_name: fullName, gender, role });
        setIsSavingDetails(false);
        if (!error) {
            setSavedDetails(true);
            setTimeout(() => setSavedDetails(false), 3000);
        }
    };

    const handleSaveContext = async () => {
        if (!user) return;
        setIsSavingContext(true);
        setSavedContext(false);
        const { error } = await updateUserMetadata({ financial_context: financialContext });
        setIsSavingContext(false);
        if (!error) {
            setSavedContext(true);
            setTimeout(() => setSavedContext(false), 3000);
        }
    };

    const totalEntries = spends.length;
    const oldestEntry = spends[spends.length - 1]?.date;
    const memberSince = oldestEntry
        ? new Date(oldestEntry).toLocaleDateString(undefined, { month: "long", year: "numeric" })
        : "Joining…";

    return (
        <main className="min-h-screen bg-brand-cream selection:bg-brand-moss/20 pb-32">
            <Navbar />

            <div className="max-w-5xl mx-auto pt-28 px-6 md:px-12">
                <motion.header
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="mb-16 text-center md:text-left"
                >
                    <Badge className="bg-orange-500/5 text-orange-500 border-none mb-4 px-4 py-1.5 text-[11px] uppercase tracking-widest font-sans font-bold">
                        Identity & Context
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-bold font-sans uppercase tracking-tight text-brand-ink">
                        Your Account
                    </h1>
                    <p className="text-orange-500 text-lg italic mt-4 font-serif leading-relaxed max-w-xl">
                        Deep configurations for a personalized financial journey.
                    </p>
                </motion.header>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24">
                    <div className="md:col-span-12 lg:col-span-7 space-y-16">
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-brand-moss/5">
                                    <User className="w-5 h-5 text-brand-moss" />
                                </div>
                                <h2 className="text-2xl font-bold font-sans uppercase tracking-tight text-brand-ink">
                                    Your Avatar
                                </h2>
                            </div>
                            <div className="bg-white/30 backdrop-blur-sm border border-brand-lichen/20 rounded-[2.5rem] p-6 md:p-8">
                                <AvatarPicker currentConfig={avatarConfig} />
                            </div>
                        </section>

                        <section className="space-y-8">
                            <h2 className="text-2xl font-bold font-sans uppercase tracking-tight text-brand-ink">
                                Personal Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-brand-sage ml-1 font-sans">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="Your name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-white/40 border border-brand-lichen/30 rounded-2xl px-6 py-4 font-sans font-medium text-brand-ink focus:outline-none focus:border-brand-moss transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-brand-sage ml-1 font-sans">Role</label>
                                    <input
                                        type="text"
                                        placeholder="what you do…"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full bg-white/40 border border-brand-lichen/30 rounded-2xl px-6 py-4 font-sans font-medium text-brand-ink focus:outline-none focus:border-brand-moss transition-all"
                                    />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <button
                                        onClick={handleSaveDetails}
                                        disabled={isSavingDetails}
                                        className="h-12 px-8 rounded-2xl bg-brand-ink text-brand-cream text-sm font-bold font-sans shadow-xl hover:bg-brand-moss active:scale-95 disabled:opacity-30 transition-all duration-700 lowercase"
                                    >
                                        {isSavingDetails ? "Saving..." : "Save Details"}
                                    </button>
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-2 gap-4">
                            <StatCard label="Journal Entries" value={totalEntries} />
                            <StatCard label="Member Since" value={memberSince} />
                        </div>

                        <section className="relative">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-2.5 rounded-xl bg-brand-moss/5">
                                    <Sparkles className="w-5 h-5 text-brand-moss" />
                                </div>
                                <h2 className="text-2xl font-bold font-sans uppercase tracking-tight text-brand-ink">
                                    AI Context
                                </h2>
                            </div>
                            <textarea
                                className="w-full h-48 bg-white/40 border border-brand-lichen/30 rounded-[2rem] p-8 font-sans font-medium text-brand-ink text-lg placeholder:text-brand-sage/40 focus:outline-none focus:border-brand-moss transition-all resize-none shadow-sm"
                                placeholder="Your financial intentions…"
                                value={financialContext}
                                onChange={(e) => setFinancialContext(e.target.value)}
                            />
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={handleSaveContext}
                                    disabled={isSavingContext}
                                    className="h-12 px-8 rounded-2xl bg-brand-ink text-brand-cream text-sm font-bold font-sans shadow-xl hover:bg-brand-moss active:scale-95 disabled:opacity-30 transition-all duration-700 lowercase"
                                >
                                    {isSavingContext ? "Syncing..." : "Save Context"}
                                </button>
                            </div>
                        </section>

                        <section className="pt-12 border-t border-brand-lichen/20">
                            <div className="flex items-center gap-4 mb-6">
                                <ShieldCheck className="w-5 h-5 text-brand-sage" />
                                <h2 className="text-2xl font-bold font-sans uppercase tracking-wide text-brand-ink">
                                    Privacy & Session
                                </h2>
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-brand-moss/5 rounded-3xl p-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-widest font-sans font-bold text-orange-500">Active User</p>
                                    <p className="text-lg font-black font-sans text-brand-ink">{user?.email}</p>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    disabled={isSigningOut}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl border border-brand-lichen/30 text-brand-ink/60 hover:text-red-600 hover:bg-red-50 transition-all duration-500 font-sans font-bold lowercase disabled:opacity-50"
                                >
                                    <LogOut className="w-4 h-4" /> {isSigningOut ? "Signing Out..." : "Sign Out"}
                                </button>
                            </div>
                        </section>
                    </div>

                    <div className="md:col-span-12 lg:col-span-5">
                        <section className="sticky top-32">
                            {isPro ? (
                                <div className="bg-orange-500/5 border border-orange-500/20 p-8 rounded-[2.5rem] relative overflow-hidden group">
                                    <div className="absolute -top-12 -right-12 opacity-5 text-orange-500">
                                        <Sparkles className="w-40 h-40" />
                                    </div>
                                    <div className="flex items-center justify-between mb-8 relative z-10">
                                        <div>
                                            <h3 className="text-2xl font-black font-sans uppercase tracking-normal text-brand-ink mb-1">Monetarz Pro</h3>
                                            <p className="text-xs text-brand-moss uppercase tracking-widest font-sans font-bold">Active Subscription</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-lg text-orange-500 mb-10 font-sans font-medium leading-relaxed relative z-10">
                                        You have full access to the Horizon Dashboard, AI foresight, and a history with no bounds.
                                    </p>
                                    <button className="w-full text-center py-4 rounded-2xl border border-brand-lichen/40 hover:bg-brand-lichen/10 text-brand-ink font-sans font-bold text-sm transition-all duration-700 lowercase">
                                        Manage Billing
                                    </button>
                                </div>
                            ) : (
                                <PricingComponent />
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function AccountPage() {
    return (
        <ErrorBoundary>
            <AccountPageContent />
        </ErrorBoundary>
    );
}
