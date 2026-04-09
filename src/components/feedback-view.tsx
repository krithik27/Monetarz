"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpends } from "@/context/SpendsContext";
import { RippleButton } from "@/components/ui/ripple-button";
import { cn } from "@/lib/utils";
import { Check, Trash2, MessageSquare, Send, CheckCircle2, Bookmark } from "lucide-react";
import Image from "next/image";

function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

function daysRemaining(dateString: string) {
    const created = new Date(dateString);
    const expiry = new Date(created);
    expiry.setDate(expiry.getDate() + 7);
    const now = new Date();
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
}

export function FeedbackView() {
    const { feedback, addFeedback, removeFeedback, updateFeedbackReaction, isDevUser } = useSpends();
    const [input, setInput] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTimeout(() => setMounted(true), 0);
    }, []);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        try {
            addFeedback(input);
            setInput("");
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 3000);
        } catch (error) {
            console.error("Failed to submit feedback", error);
        }
    };

    if (!mounted) return null;

    return (
        <div className="w-full max-w-5xl mx-auto space-y-16">
            {/* Hero Image Section */}
            <motion.section
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="w-full flex flex-col items-center gap-6"
            >
                <div className="relative w-56 h-56 md:w-64 md:h-64">
                    <Image
                        src="/images/wwtubeman.webp"
                        alt="Waving tubeman mascot"
                        fill
                        className="object-contain drop-shadow-lg"
                        priority
                    />
                </div>
                <div className="text-center space-y-1">
                    <h1 className="font-sans text-4xl md:text-5xl lg:text-6xl font-medium text-brand-moss tracking-tight leading-tight">
                        Shape the future of <span className="text-orange-500 font-bold">Monetarz</span>
                    </h1>
                    <p className="text-brand-sage/70 text-sm font-medium text-orange-400 max-w-md mx-auto">
                        Your feedback lives for 7 days, just enough time for us to absorb it.
                    </p>
                </div>
            </motion.section>

            {/* Hero Input Section */}
            <section className="w-full">
                <div className="w-full max-w-4xl mx-auto border border-brand-ink/10 shadow-xl rounded-3xl bg-brand-cream/60 backdrop-blur-sm p-8 md:p-12">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="bg-orange-400/10 border border-orange-400 rounded-2xl p-6 relative overflow-hidden group mb-8"
                    >
                        <p className="text-center font-sans text-2xl md:text-3xl leading-relaxed bg-gradient-to-r from-orange-400 via-orange-600 to-orange-400 bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent">
                            &ldquo;This app is evolving. Early feedback helps decide what gets built, fixed, or removed. We&apos;re building this for you.&rdquo;
                        </p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="relative w-full group">
                        <div className="relative overflow-hidden rounded-2xl border border-brand-lichen/30 bg-brand-cream/50 backdrop-blur-md focus-within:ring-2 focus-within:ring-brand-moss/10 transition-all duration-500 shadow-inner">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                maxLength={1000}
                                placeholder="What's on your mind? Feature requests, bugs, or just a hello..."
                                className="w-full min-h-[180px] p-8 bg-transparent border-none outline-none resize-none text-orange-400 placeholder:text-orange-400/40 font-sans text-lg leading-relaxed transition-all"
                                disabled={isSuccess}
                            />

                            <div className="flex justify-between items-center p-4 bg-brand-lichen/5 border-t border-brand-lichen/10">
                                <span className={cn(
                                    "text-xs font-medium px-4 transition-colors duration-300",
                                    input.length > 800 ? "text-red-500" : "text-brand-moss/50"
                                )}>
                                    {input.length > 0 ? `${input.length} / 800 characters` : "🤔💭💡🗣️"}
                                </span>
                                <RippleButton
                                    type="submit"
                                    duration="600ms"
                                    rippleColor="rgba(253, 252, 248, 0.3)"
                                    disabled={!input.trim() || input.length > 1000 || isSuccess}
                                    className={cn(
                                        "rounded-full transition-all duration-500 min-w-[140px] h-12 text-sm font-semibold tracking-wide uppercase",
                                        isSuccess
                                            ? "bg-brand-moss text-brand-cream"
                                            : "bg-orange-400 text-brand-cream hover:bg-orange-500 shadow-lg shadow-brand-moss/20 hover:shadow-brand-moss/30 hover:-translate-y-0.5"
                                    )}
                                >
                                    <AnimatePresence mode="wait">
                                        {isSuccess ? (
                                            <motion.span
                                                key="success"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex items-center justify-center gap-2"
                                            >
                                                <Check className="size-4 stroke-[3px]" />
                                                Received
                                            </motion.span>
                                        ) : (
                                            <motion.span
                                                key="idle"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex items-center justify-center gap-2"
                                            >
                                                <Send className="size-4" />
                                                Submit
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </RippleButton>
                            </div>
                        </div>
                    </form>
                </div>
            </section>

            {/* List Section */}
            <section className="w-full pb-20">
                <div className="flex items-center gap-4 mb-12">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-ink/10 to-transparent" />
                    <div className="flex items-center gap-2 px-6 py-2 rounded-full border border-brand-lichen/20 bg-brand-cream/90 backdrop-blur-md shadow-sm">
                        <MessageSquare className="size-4 text-brand-sage" />
                        <span className="text-xs font-bold uppercase tracking-widest text-brand-sage">
                            {isDevUser ? "All Feedback" : "Recent Musings"}
                        </span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-lichen/30 to-transparent" />
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {!feedback || feedback.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full text-center py-20 border-2 border-dashed border-brand-lichen/20 rounded-3xl"
                            >
                                <p className="text-brand-sage/60 text-base font-serif italic">
                                    No feedback yet. Your thoughts could be the first.
                                </p>
                            </motion.div>
                        ) : (
                            feedback.map((item, index) => (
                                <motion.div
                                    key={item.id || index}
                                    layout
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                    className="group relative flex flex-col gap-4 p-8 rounded-[2rem] bg-brand-cream/90 border border-brand-lichen/20 hover:border-brand-moss/20 transition-all duration-500 shadow-sm hover:shadow-md backdrop-blur-md"
                                >
                                    {/* Top-right actions */}
                                    <div className="absolute top-6 right-6 flex items-center gap-1.5">
                                        {/* Expiry badge */}
                                        {item.createdAt && (
                                            <span className="text-[10px] font-bold text-brand-sage/40 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                {daysRemaining(item.createdAt)}d left
                                            </span>
                                        )}

                                        {/* Dev Reaction Buttons */}
                                        {isDevUser && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <button
                                                    onClick={() => updateFeedbackReaction(item.id, item.adminReaction === 'acknowledged' ? null : 'acknowledged')}
                                                    className={cn(
                                                        "p-2 rounded-full transition-all duration-300",
                                                        item.adminReaction === 'acknowledged'
                                                            ? "bg-emerald-50 text-emerald-600"
                                                            : "hover:bg-emerald-50/50 text-brand-sage/40 hover:text-emerald-500"
                                                    )}
                                                    title="Mark as acknowledged"
                                                >
                                                    <CheckCircle2 className="size-4" />
                                                </button>
                                                <button
                                                    onClick={() => updateFeedbackReaction(item.id, item.adminReaction === 'noted' ? null : 'noted')}
                                                    className={cn(
                                                        "p-2 rounded-full transition-all duration-300",
                                                        item.adminReaction === 'noted'
                                                            ? "bg-amber-50 text-amber-600"
                                                            : "hover:bg-amber-50/50 text-brand-sage/40 hover:text-amber-500"
                                                    )}
                                                    title="Mark as noted"
                                                >
                                                    <Bookmark className="size-4" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Delete feedback */}
                                        <button
                                            onClick={() => removeFeedback(item.id)}
                                            className="p-2.5 rounded-full bg-white/0 text-brand-sage/0 group-hover:text-brand-sage/40 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
                                            title="Delete feedback"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-brand-moss text-lg leading-relaxed whitespace-pre-wrap font-serif pr-20">
                                            {item.text}
                                        </p>

                                        <div className="flex items-center gap-3 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <div className="size-1.5 rounded-full bg-brand-moss/20" />
                                                <p className="text-brand-moss/50 text-[10px] font-bold uppercase tracking-[0.2em]">
                                                    {item.createdAt ? timeAgo(item.createdAt) : "Just now"}
                                                </p>
                                            </div>

                                            {/* Admin Reaction Badge (visible to everyone) */}
                                            {item.adminReaction && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                                                        item.adminReaction === 'acknowledged'
                                                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200/50"
                                                            : "bg-amber-50 text-amber-600 border border-amber-200/50"
                                                    )}
                                                >
                                                    {item.adminReaction === 'acknowledged' ? (
                                                        <>
                                                            <CheckCircle2 className="size-3" />
                                                            Acknowledged
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Bookmark className="size-3" />
                                                            Noted
                                                        </>
                                                    )}
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </section>
        </div>
    );
}
