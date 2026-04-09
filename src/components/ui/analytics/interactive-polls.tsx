"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { TransitionPanel } from '@/components/ui/analytics/transition-panel'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/money'
import { ChevronLeft, ChevronRight, CheckCircle2, Plus } from 'lucide-react'

export type Sentiment = 'grounded' | 'balanced' | 'anxious' | null

// Prompt Pools for Rotation
const EMOTIONAL_PROMPTS = [
    {
        id: 'pulse_check_1',
        title: "State of Mind",
        question: "Thinking about your financial flow this week, how do you feel right now?",
        options: ["🌿 Calm & Grounded", "⚖️ Balanced", "🌪️ Anxious & Scattered"],
        sentiments: ['grounded', 'balanced', 'anxious']
    },
    {
        id: 'pulse_check_2',
        title: "Financial Gratitude",
        question: "What's one thing your money made possible for you today that you're grateful for?",
        options: ["🥪 A good meal", "🏠 Safety/Shelter", "✨ A moment of joy"],
    },
    {
        id: 'pulse_check_3',
        title: "Stress Level",
        question: "How much weight does your financial future carry on your mind today?",
        options: ["🪶 Light as a feather", "🧱 Manageable", "🏔️ Quite heavy"],
    },
    {
        id: 'pulse_check_4',
        title: "Energy Check",
        question: "Where is your financial energy focused right now?",
        options: ["🌱 Growth & Possibility", "🏠 Stability", "🛡️ Preservation"],
    },
    {
        id: 'pulse_check_5',
        title: "Abundance Mindset",
        question: "Do you feel like you are flowing with enough, or searching for more?",
        options: ["🌊 Plenty in the flow", "⚖️ Just right", "🏜️ Feeling the dry spell"],
    }
];

const REFLECTION_PROMPTS = [
    {
        id: 'true_cost_1',
        title: "True Cost",
        question: (amt: string, title: string) => `You spent ${amt} on ${title}. Did this purchase buy you joy, convenience, or just habit?`,
        options: ["✨ Absolute Joy", "⏱️ Pure Convenience", "😶 Unconscious Habit"]
    },
    {
        id: 'true_cost_2',
        title: "Utility Check",
        question: (amt: string, title: string) => `₹${amt} went to ${title}. If you could take it back, would you?`,
        options: ["✅ No, it was worth it", "🤔 Maybe, undecided", "❌ Yes, it was impulse"],
    },
    {
        id: 'true_cost_3',
        title: "Presence Check",
        question: (amt: string, title: string) => `₹${amt} for ${title}. Were you fully present during this purchase?`,
        options: ["🧘 Yes, mindful", "🌪️ No, distracted", "🤖 On autopilot"],
    }
];

const ACTION_PROMPTS = [
    {
        id: 'heavy_hitter_1',
        title: "Heavy Hitter",
        question: (cat: string, perc: number, amt: string) => `${cat} claimed ${perc}% of your flow (${amt}). Was this a conscious choice?`,
        options: ["🎯 Conscious Allocation", "💧 Unplanned Leak"]
    },
    {
        id: 'heavy_hitter_2',
        title: "Course Correction",
        question: (cat: string, perc: number, amt: string) => `${cat} is your biggest volume area today (${amt}). Do you want to try a 'Fast' on this category tomorrow?`,
        options: ["🚀 Yes, I'm in", "🛋️ Not right now"]
    },
    {
        id: 'heavy_hitter_3',
        title: "Intentional Pause",
        question: (cat: string, perc: number, amt: string) => `₹${amt} flow into ${cat}. Could we try a 24-hour pause on this category?`,
        options: ["🛑 I'll try the pause", "💨 Not this time"]
    }
];

interface InteractivePollsProps {
    className?: string
    topDiscretionaryTransaction?: { title: string; amount: number; category: string } | null
    topDiscretionaryCategory?: { category: string; amount: number; percentage: number } | null
    aiPrompt?: string | null
    onSentimentSelect?: (sentiment: Sentiment) => void
    onHoverOption?: (isHovering: boolean) => void
    onJournalSubmit?: (promptId: string, response: string, category: string) => void
    initialSubmittedIndices?: number[]
}

export function InteractivePolls({ 
    className,
    topDiscretionaryTransaction,
    topDiscretionaryCategory,
    aiPrompt,
    onSentimentSelect,
    onHoverOption,
    onJournalSubmit,
    initialSubmittedIndices = []
}: InteractivePollsProps) {
    const [activeIndex, setActiveIndex] = useState(0)
    
    // Track submission state for each card independently
    const [submittedCards, setSubmittedCards] = useState<Record<number, boolean>>(() => {
        const initial: Record<number, boolean> = {};
        initialSubmittedIndices.forEach(idx => initial[idx] = true);
        return initial;
    })

    // Session-based randomization (stable for the duration of the component instance)
    const sessionSeed = React.useMemo(() => Math.floor(Math.random() * 1000), []);
    
    const emotionalPrompt = EMOTIONAL_PROMPTS[sessionSeed % EMOTIONAL_PROMPTS.length];
    const reflectionPrompt = REFLECTION_PROMPTS[sessionSeed % REFLECTION_PROMPTS.length];
    const actionPrompt = ACTION_PROMPTS[sessionSeed % ACTION_PROMPTS.length];

    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % 3)
    }

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + 3) % 3)
    }

    const markSubmitted = (index: number, promptId: string, response: string, category: string) => {
        setSubmittedCards(prev => ({ ...prev, [index]: true }))
        onJournalSubmit?.(promptId, response, category);
    }

    // Custom Sub-components for each "Poll" state
    const renderCard1 = () => {
        const isSubmitted = submittedCards[0]
        
        return (
            <PollCardTemplate 
                title={emotionalPrompt.title}
                subtitle="Pulse Check"
                isSubmitted={isSubmitted}
                thankYouMessage="Your state of mind has been logged. The Siri Orb has shifted to reflect your frequency."
            >
                <p className="font-serif tracking-tight text-brand-moss text-lg mb-6 leading-snug">
                    {emotionalPrompt.question}
                </p>
                <div className="flex flex-col gap-2">
                    {emotionalPrompt.options.map((opt, idx) => (
                        <PollOption 
                            key={opt}
                            label={opt} 
                            onMouseEnter={() => onHoverOption?.(true)}
                            onMouseLeave={() => onHoverOption?.(false)}
                            onClick={() => { 
                                if (emotionalPrompt.sentiments) {
                                    onSentimentSelect?.(emotionalPrompt.sentiments[idx] as Sentiment);
                                }
                                markSubmitted(0, emotionalPrompt.id, opt, 'emotional');
                            }} 
                        />
                    ))}
                </div>
            </PollCardTemplate>
        )
    }

    const renderCard2 = () => {
        const isSubmitted = submittedCards[1]
        const transaction = topDiscretionaryTransaction;
        
        return (
            <PollCardTemplate 
                title={aiPrompt ? "AI Reflection" : reflectionPrompt.title}
                subtitle="Micro-Reflection"
                isSubmitted={isSubmitted}
                thankYouMessage="Insight recorded. Tracking the return-on-joy for your discretionary spending."
            >
                {aiPrompt || transaction?.title ? (
                    <>
                        <p className="font-serif tracking-tight text-brand-moss text-lg mb-6 leading-snug">
                            {aiPrompt 
                                ? aiPrompt 
                                : typeof reflectionPrompt.question === 'function' ? 
                                    reflectionPrompt.question(formatAmount(transaction!.amount), transaction!.title) : 
                                    reflectionPrompt.question}
                        </p>
                        <div className="flex flex-col gap-2">
                            {reflectionPrompt.options.map((opt) => (
                                <PollOption 
                                    key={opt}
                                    label={opt} 
                                    onMouseEnter={() => onHoverOption?.(true)}
                                    onMouseLeave={() => onHoverOption?.(false)}
                                    onClick={() => markSubmitted(1, aiPrompt ? 'ai_reflection' : `${reflectionPrompt.id}_${transaction?.title}`, opt, 'reflection')} 
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <EmptyStateCard
                        message="No discretionary transactions found to reflect on."
                        ctaText="Log a Spend"
                        ctaHref="/"
                    />
                )}
            </PollCardTemplate>
        )
    }

    const renderCard3 = () => {
        const isSubmitted = submittedCards[2]
        const category = topDiscretionaryCategory;
        
        return (
            <PollCardTemplate 
                title={actionPrompt.title}
                subtitle="Evaluating the Leak"
                isSubmitted={isSubmitted}
                thankYouMessage="Acknowledged. Labeling this block of flow."
            >
                {category?.category ? (
                    <>
                        <p className="font-serif tracking-tight text-brand-moss text-lg mb-6 leading-snug">
                            {typeof actionPrompt.question === 'function' ? 
                                actionPrompt.question(category.category, Math.round(category.percentage), formatAmount(category.amount)) : 
                                actionPrompt.question}
                        </p>
                        <div className="flex flex-col gap-2">
                            {actionPrompt.options.map((opt) => (
                                <PollOption 
                                    key={opt}
                                    label={opt} 
                                    onMouseEnter={() => onHoverOption?.(true)}
                                    onMouseLeave={() => onHoverOption?.(false)}
                                    onClick={() => markSubmitted(2, `${actionPrompt.id}_${category.category}`, opt, 'action')} 
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <EmptyStateCard
                        message="No discretionary category patterns detected yet."
                        ctaText="Log a Spend"
                        ctaHref="/"
                    />
                )}
            </PollCardTemplate>
        )
    }

    const cards = [renderCard1(), renderCard2(), renderCard3()]

    return (
        <Card className={cn("flex flex-col bg-white/60 border-brand-mist/20 rounded-3xl overflow-hidden backdrop-blur-md shadow-[0_4px_20px_rgb(0,0,0,0.03)] border transition-all duration-500 w-full max-w-md mx-auto min-h-[340px]", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-0 px-6 pt-6">
                <div className="space-y-0.5">
                    <CardTitle className="font-serif text-brand-moss text-lg tracking-tight">Interactive Journal</CardTitle>
                    <CardDescription className="text-brand-sage/60 uppercase tracking-widest text-[9px] font-bold">Mindful Reflections</CardDescription>
                </div>
                
                {/* Navigation Controls */}
                <div className="flex items-center gap-1 bg-brand-mist/20 rounded-full p-1 border border-brand-mist/30">
                    <button 
                        onClick={handlePrev}
                        className="p-1 rounded-full text-brand-sage hover:text-brand-moss hover:bg-white transition-colors"
                        aria-label="Previous poll"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-sans font-medium text-brand-sage px-1">
                        {activeIndex + 1} / 3
                    </span>
                    <button 
                        onClick={handleNext}
                        className="p-1 rounded-full text-brand-sage hover:text-brand-moss hover:bg-white transition-colors"
                        aria-label="Next poll"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </CardHeader>
            
            <CardContent className="flex-1 pb-6 pt-6 px-6 relative flex flex-col justify-center">
                <TransitionPanel
                    activeIndex={activeIndex}
                    transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }} // spring-like ease
                    variants={{
                        enter: { opacity: 0, x: 20, filter: 'blur(4px)' },
                        center: { opacity: 1, x: 0, filter: 'blur(0px)' },
                        exit: { opacity: 0, x: -20, filter: 'blur(4px)' },
                    }}
                    className="w-full flex-1"
                >
                    {cards.map((card, index) => (
                        <div key={index} className="w-full h-full">
                            {card}
                        </div>
                    ))}
                </TransitionPanel>
            </CardContent>
            
            {/* Subtle Progress Track */}
            <div className="h-1 w-full bg-brand-mist/20 absolute bottom-0 left-0">
                <motion.div 
                    className="h-full bg-brand-moss"
                    initial={{ width: '33%' }}
                    animate={{ width: `${((activeIndex + 1) / 3) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
        </Card>
    )
}

// Sub-components for cleaner rendering
function PollCardTemplate({ 
    title, 
    subtitle, 
    children, 
    isSubmitted, 
    thankYouMessage 
}: { 
    title: string; 
    subtitle: string; 
    children: React.ReactNode;
    isSubmitted: boolean;
    thankYouMessage: string;
}) {
    return (
        <div className="h-full flex flex-col justify-center relative min-h-[200px]">
            <div className="mb-2">
                <span className="text-[10px] uppercase tracking-wider text-brand-sage font-bold bg-brand-mist/20 px-2 py-1 rounded-md">
                    {subtitle}
                </span>
            </div>
            
            <AnimatePresence mode="wait">
                {!isSubmitted ? (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        {children}
                    </motion.div>
                ) : (
                    <motion.div
                        key="thank-you"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center text-center py-6 h-full space-y-4"
                    >
                        <div className="w-12 h-12 rounded-full bg-[#E8F3E6] flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-[#6B8E65]" />
                        </div>
                        <p className="font-serif text-brand-moss text-base max-w-[80%] leading-relaxed">
                            {thankYouMessage}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function PollOption({ label, onClick, onMouseEnter, onMouseLeave }: { 
    label: string; 
    onClick: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}) {
    return (
        <button 
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="w-full text-left px-4 py-3 rounded-xl border border-brand-mist/30 bg-white/50 hover:bg-white hover:border-brand-moss/30 hover:shadow-sm transition-all duration-200 group flex items-center justify-between"
        >
            <span className="text-sm font-medium text-brand-ink group-hover:text-brand-moss transition-colors">
                {label}
            </span>
            <ChevronRight className="w-4 h-4 text-brand-sage opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
        </button>
    )
}

function EmptyStateCard({ message, ctaText, ctaHref }: { message: string; ctaText: string; ctaHref: string }) {
    return (
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-4">
            <div className="relative w-24 h-24">
                <Image
                    src="/images/empty_wallet.webp"
                    alt="Empty wallet"
                    fill
                    className="object-contain opacity-60"
                />
            </div>
            <p className="text-brand-sage/70 font-serif text-sm max-w-[200px]">
                {message}
            </p>
            <Link 
                href={ctaHref}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-moss/10 text-brand-moss text-xs font-medium hover:bg-brand-moss/20 transition-colors"
            >
                <Plus className="w-3 h-3" />
                {ctaText}
            </Link>
        </div>
    )
}
