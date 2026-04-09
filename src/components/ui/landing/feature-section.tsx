"use client";

import { cn } from "@/lib/utils";
import type React from "react";
import {
    TrendingUpIcon,
    ZapIcon,
    GlobeIcon,
    ShieldCheckIcon,
    BrainCircuitIcon,
    LockIcon,
} from "lucide-react";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";

/* ─── Feature grid config ─── */
const features = [
    {
        id: "instant-log",
        children: <InstantLogVisual />,
        className: "md:col-span-2",
    },
    {
        id: "ai-narrative",
        children: <AiNarrativeVisual />,
        className: "md:col-span-2",
    },
    {
        id: "analytics",
        children: <AnalyticsVisual />,
        className: "sm:col-span-2 md:col-span-2",
    },
    {
        id: "privacy",
        children: <PrivacyVisual />,
        className: "sm:col-span-2 md:col-span-3 p-0",
    },
    {
        id: "global",
        children: <GlobalVisual />,
        className: "sm:col-span-2 md:col-span-3 p-0",
    },
];

/* ─── Public Section ─── */
export function FeatureSection() {
    return (
        <section id="philosophy" className="relative z-10 py-28 px-6 bg-brand-cream">
            <div className="max-w-5xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-moss/5 border border-brand-moss/10 text-brand-moss text-[10px] tracking-widest uppercase mb-8 font-bold">
                        what you get
                    </div>
                    <h2 className="text-5xl md:text-7xl text-brand-ink tracking-tighter lowercase font-black mb-6">
                        built for <span className="font-serif italic font-light text-orange-500">awareness</span>
                    </h2>
                    <p className="text-xl text-brand-sage max-w-xl mx-auto font-light lowercase">
                        every feature designed around one idea — understand money, don&apos;t fight it.
                    </p>
                </div>

                <div className="relative grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6">
                    {features.map((feature, i) => (
                        <FeatureCard className={feature.className} key={feature.id} index={i}>
                            {feature.children}
                        </FeatureCard>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── Card shell ─── */
function FeatureCard({
    children,
    className,
    index,
}: {
    children: React.ReactNode;
    className?: string;
    index: number;
}) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className={cn(
                "group relative overflow-hidden rounded-3xl border border-brand-lichen/20 bg-white px-8 pt-8 pb-6 shadow-sm hover:shadow-xl hover:shadow-brand-moss/5 transition-all duration-500",
                className
            )}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                style={{
                    background: useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, rgba(249,115,22,0.06), transparent 80%)`,
                }}
            />
            {children}
        </motion.div>
    );
}

/* ─── Typography helpers ─── */
function FeatureTitle({ className, ...props }: React.ComponentProps<"h3">) {
    return (
        <h3
            className={cn("font-bold text-brand-ink text-lg lowercase tracking-tight", className)}
            {...props}
        />
    );
}

function FeatureDescription({ className, ...props }: React.ComponentProps<"p">) {
    return (
        <p className={cn("text-brand-sage text-sm font-light lowercase leading-relaxed", className)} {...props} />
    );
}

/* ─── Visual: Instant Log ─── */
function InstantLogVisual() {
    const entries = [
        { label: "coffee", cat: "food", amount: "₹150", color: "bg-orange-400" },
        { label: "uber home", cat: "transport", amount: "₹320", color: "bg-brand-moss" },
        { label: "netflix", cat: "subscriptions", amount: "₹649", color: "bg-blue-400" },
    ];
    return (
        <>
            <div className="relative min-h-32 mb-4 space-y-2">
                {entries.map((e, i) => (
                    <motion.div
                        key={e.label}
                        initial={{ opacity: 0, x: -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
                        viewport={{ once: true }}
                        className="flex items-center justify-between rounded-2xl bg-brand-cream border border-brand-lichen/20 px-4 py-3"
                    >
                        <div className="flex items-center gap-3">
                            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", e.color)} />
                            <span className="text-brand-ink font-medium text-sm lowercase">{e.label}</span>
                            <span className="text-[10px] uppercase tracking-widest text-brand-sage">{e.cat}</span>
                        </div>
                        <span className="text-brand-ink font-bold text-sm">{e.amount}</span>
                    </motion.div>
                ))}
                {/* Blinking cursor input */}
                <div className="flex items-center rounded-2xl border-2 border-orange-400/30 bg-orange-50/30 px-4 py-3 gap-2">
                    <ZapIcon className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-brand-sage text-sm lowercase font-light">how did money flow today?</span>
                    <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-0.5 h-4 bg-orange-400 rounded-full"
                    />
                </div>
            </div>
            <div className="relative space-y-1.5">
                <FeatureTitle>instant natural logging</FeatureTitle>
                <FeatureDescription>type it like you&apos;d say it. &ldquo;coffee 150&rdquo; is all it takes.</FeatureDescription>
            </div>
        </>
    );
}

/* ─── Visual: AI Narrative ─── */
function AiNarrativeVisual() {
    return (
        <>
            <div className="relative mx-auto flex size-32 items-center justify-center rounded-full border-4 border-dashed border-brand-lichen/40 bg-brand-cream shadow-inner">
                <div className="absolute inset-0 rounded-full bg-gradient-radial from-brand-moss/10 to-transparent blur-xl" />
                <BrainCircuitIcon className="size-12 text-brand-moss" />
            </div>
            <div className="relative mt-8 space-y-1.5 text-center">
                <FeatureTitle>ai narrative engine</FeatureTitle>
                <FeatureDescription>
                    our llm reads your entries and writes a beautiful daily story of your capital. awareness, not accounting.
                </FeatureDescription>
            </div>
        </>
    );
}

/* ─── Visual: Analytics ─── */
function AnalyticsVisual() {
    return (
        <>
            <div className="min-h-32 relative overflow-hidden">
                <div className="absolute top-0 left-0 flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                        <TrendingUpIcon className="size-4" />
                    </div>
                    <div className="font-bold text-brand-sage text-sm">+4.5% this week</div>
                </div>
                {/* Animated chart bars */}
                <div className="flex items-end gap-1.5 h-28 pt-10">
                    {[40, 65, 48, 80, 60, 90, 72, 55, 85, 70].map((h, i) => (
                        <motion.div
                            key={i}
                            initial={{ scaleY: 0, originY: 1 }}
                            whileInView={{ scaleY: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 + i * 0.05, ease: "easeOut" }}
                            viewport={{ once: true }}
                            style={{ height: `${h}%` }}
                            className={cn(
                                "flex-1 rounded-t-md",
                                i === 7 ? "bg-orange-400" : "bg-brand-lichen/60"
                            )}
                        />
                    ))}
                </div>
            </div>
            <div className="relative z-10 mt-6 space-y-1.5 text-center">
                <FeatureTitle>reports & analytics</FeatureTitle>
                <FeatureDescription>weekly, monthly, horizon-level. see patterns before they become problems.</FeatureDescription>
            </div>
        </>
    );
}

/* ─── Visual: Privacy ─── */
function PrivacyVisual() {
    return (
        <div className="grid h-full sm:grid-cols-2">
            <div className="relative z-10 space-y-6 py-8 pl-8 pr-4">
                <div className="flex size-12 items-center justify-center rounded-full border border-brand-lichen/30 bg-white shadow-sm">
                    <LockIcon className="size-5 text-brand-moss" />
                </div>
                <div className="space-y-2">
                    <FeatureTitle className="text-base !lowercase">end-to-end privacy</FeatureTitle>
                    <FeatureDescription>
                        your data is yours. row-level security, auth-gated apis, zero third-party data sharing.
                    </FeatureDescription>
                </div>
            </div>
            {/* Animated shield rings */}
            <div className="relative flex items-center justify-center overflow-hidden">
                {[1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.12, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.6 }}
                        className="absolute rounded-full border-2 border-orange-500/30"
                        style={{ width: i * 80, height: i * 80 }}
                    />
                ))}
                <ShieldCheckIcon className="size-10 text-orange-500 relative z-10" />
            </div>
        </div>
    );
}

/* ─── Visual: Global ─── */
function GlobalVisual() {
    return (
        <div className="grid max-h-72 sm:grid-cols-2">
            <div className="space-y-6 pt-8 pb-4 pl-8 sm:pb-8">
                <div className="flex size-12 items-center justify-center rounded-full border border-brand-lichen/30 bg-white shadow-sm">
                    <GlobeIcon className="size-5 text-brand-moss" />
                </div>
                <div className="space-y-2">
                    <FeatureTitle className="text-base">multi-currency, anywhere</FeatureTitle>
                    <FeatureDescription>
                        log in inr, usd, eur — switch currencies and your entire history recalculates instantly.
                    </FeatureDescription>
                </div>
            </div>
            <div className="relative overflow-hidden min-h-[250px] sm:min-h-[300px]">
                <img
                    src="/images/earth.webp"
                    alt="Globe"
                    className="absolute -right-3 w-[320px] sm:w-[450px] md:w-[500px] h-auto pointer-events-none transition-transform group-hover:scale-105 duration-700"
                />
            </div>
        </div>
    );
}
