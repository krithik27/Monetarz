"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AnimatedOTPInput } from "@/components/ui/auth/animated-o-t-p-input";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, ArrowRight, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
    const { signInWithOtp, signInWithGoogle, verifyOtp, user } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();
    const redirectTarget = searchParams.get('redirect') || "/";
    const [step, setStep] = useState<"main" | "otp">("main");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);

    React.useEffect(() => {
        if (user && step === 'main') {
            router.push(redirectTarget);
        }
    }, [user, router, step, redirectTarget]);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            const { error } = await signInWithGoogle();
            if (error) throw error;
        } catch (err: any) {
            toast({ type: "error", message: "Error", description: err.message });
            setIsLoading(false);
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        // Production-only OTP flow

        setIsLoading(true);
        try {
            const { error } = await signInWithOtp(email);
            if (error) throw error;
            setStep("otp");
            toast({
                type: "info",
                message: "Code sent",
                description: "Check your email for the 6-digit code."
            });
        } catch (err: any) {
            toast({ type: "error", message: "Error", description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (token: string) => {
        setIsLoading(true);
        try {
            const { error } = await verifyOtp(email, token);
            if (error) throw error;
            toast({
                type: "success",
                message: "Welcome back",
                description: "Your identity has been verified."
            });
        } catch (err: any) {
            toast({
                type: "error",
                message: "Invalid code",
                description: "Please try again."
            });
            setOtp("");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen w-full relative overflow-hidden bg-brand-cream text-brand-ink font-sans selection:bg-orange-500/30">
            <div className="polymath-glow" />

            <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">

                {/* LEFT PANEL — Brand Showcase */}
                <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative overflow-hidden">
                        {/* Logo */}
                        <Link href="/" className="text-2xl font-bold tracking-light text-brand-ink lowercase hover:opacity-70 transition-opacity">
                            monetarz<span className="text-orange-500">.</span>
                        </Link>

                        {/* Center Brand Content */}
                        <div className="flex-1 flex flex-col justify-center items-center max-w-2xl mx-auto text-center lg:text-left lg:items-start">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                className="space-y-8"
                            >
                                <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black lowercase tracking-tighter leading-[0.85] text-brand-ink">
                                    money that{" "}
                                    <span className="font-serif italic font-light text-orange-500">
                                        breathes.
                                    </span>
                                </h2>
                                <p className="text-base xl:text-lg text-brand-sage font-light leading-relaxed lowercase max-w-md">
                                    a mindful flow of capital through elegant narratives and reflection. Feel the flow.
                                </p>
                            </motion.div>

                            {/* Cactus Decoration */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{ delay: 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                className="mt-1 relative w-full flex justify-center lg:justify-start"
                            >
                                <img
                                    src="/images/ppr_frog.webp"
                                    alt="paper frog"
                                    className="w-48 h-48 xl:w-56 xl:h-56 object-contain drop-shadow-2xl"
                                />
                            </motion.div>
                        </div>

                        {/* Footer Note */}
                        <p className="text-brand-sage/40 text-[10px] tracking-widest font-bold uppercase">
                            &copy; {new Date().getFullYear()} monetarz. designed for the mindful.
                        </p>
                    </div>

                    {/* RIGHT PANEL — Auth */}
                    <div className="flex-1 lg:w-1/2 flex flex-col min-h-screen lg:border-l border-brand-lichen/20">
                        {/* Top Bar */}
                        <div className="flex justify-between items-center p-6 lg:p-10">
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-sm font-medium text-brand-sage hover:text-brand-ink transition-colors lowercase"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                back to home
                            </Link>

                            {/* Mobile Logo */}
                            <Link href="/" className="lg:hidden text-xl font-bold tracking-tight text-brand-ink lowercase hover:opacity-70 transition-opacity">
                                monetarz<span className="text-orange-500">.</span>
                            </Link>
                        </div>

                    {/* Auth Form */}
                    <div className="flex-1 flex items-center justify-center px-8 lg:px-16 pb-12">
                        <div className="w-full max-w-md">
                            <AnimatePresence mode="wait">
                                {step === "main" ? (
                                    <motion.div
                                        key="main"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.5 }}
                                        className="space-y-10"
                                    >
                                        {/* Heading */}
                                        <div className="space-y-3">
                                            <h1 className="text-5xl md:text-6xl font-serif italic text-brand-ink tracking-tight">
                                                Welcome
                                            </h1>
                                            <p className="text-brand-sage text-base font-light lowercase">
                                                sign in to continue to monetarz
                                            </p>
                                        </div>

                                        {/* Google Button — Primary */}
                                        <button
                                            onClick={handleGoogleSignIn}
                                            disabled={isLoading}
                                            className="w-full flex items-center justify-center gap-3 bg-brand-ink text-brand-cream font-bold text-base py-4 px-8 rounded-full hover:bg-brand-moss transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-brand-ink/10 lowercase"
                                        >
                                            {isLoading && !showEmailForm ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                    </svg>
                                                    continue with google
                                                </>
                                            )}
                                        </button>

                                        {/* Email Toggle */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-px flex-1 bg-brand-lichen/30" />
                                                <button
                                                    onClick={() => setShowEmailForm(!showEmailForm)}
                                                    className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 transition-colors font-medium lowercase"
                                                >
                                                    {showEmailForm ? "hide" : "sign in with"} email{!showEmailForm && " instead"}
                                                    {showEmailForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                </button>
                                                <div className="h-px flex-1 bg-brand-lichen/30" />
                                            </div>

                                            {/* Email Form — Secondary */}
                                            <AnimatePresence>
                                                {showEmailForm && (
                                                    <motion.form
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                                        className="space-y-4 overflow-hidden"
                                                        onSubmit={handleSendOtp}
                                                    >
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-bold text-brand-ink lowercase">email</label>
                                                            <input
                                                                type="text"
                                                                placeholder="you@example.com"
                                                                value={email}
                                                                onChange={(e) => setEmail(e.target.value)}
                                                                className="w-full bg-brand-cream/80 border border-brand-lichen/40 rounded-xl py-3.5 px-5 text-brand-ink placeholder:text-brand-sage/40 focus:outline-none focus:border-brand-moss/50 focus:ring-2 focus:ring-brand-moss/10 transition-all duration-300 font-sans text-base"
                                                                required
                                                                autoFocus
                                                            />
                                                        </div>

                                                        <button
                                                            type="submit"
                                                            disabled={isLoading || !email}
                                                            className="w-full bg-brand-cream border border-brand-lichen/40 text-brand-ink font-medium text-base py-3.5 rounded-xl hover:bg-brand-mist/60 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed lowercase"
                                                        >
                                                            {isLoading ? (
                                                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                                            ) : (
                                                                "send magic link"
                                                            )}
                                                        </button>
                                                    </motion.form>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Trust Signal */}
                                        <p className="text-brand-sage/50 text-xs font-light lowercase leading-relaxed">
                                            by continuing, you agree to our <Link href="/terms" className="underline hover:text-brand-moss">terms of service</Link> and <Link href="/privacy" className="underline hover:text-brand-moss">privacy policy</Link>.
                                            your data is private and yours alone.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="otp"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.5 }}
                                        className="space-y-10 flex flex-col items-center"
                                    >
                                        <div className="space-y-3 text-center w-full">
                                            <h1 className="text-5xl md:text-6xl font-serif italic text-brand-ink tracking-tight">
                                                Verify
                                            </h1>
                                            <p className="text-brand-sage text-base font-light lowercase">
                                                we sent a code to{" "}
                                                <span className="text-brand-ink font-medium not-italic">
                                                    {email}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="py-4 w-full flex justify-center">
                                            <AnimatedOTPInput
                                                value={otp}
                                                onChange={setOtp}
                                                onComplete={handleVerifyOtp}
                                                maxLength={6}
                                            />
                                        </div>

                                        <button
                                            onClick={() => { setStep("main"); setShowEmailForm(true); }}
                                            className="text-brand-sage text-sm hover:text-brand-moss flex items-center gap-2 transition-all duration-500 lowercase font-medium"
                                        >
                                            <RefreshCw className="w-3 h-3" /> use a different email
                                        </button>

                                        {isLoading && (
                                            <div className="flex items-center gap-2 text-brand-sage text-sm animate-pulse lowercase">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                verifying...
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
