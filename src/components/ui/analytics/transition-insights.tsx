"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TransitionPanel } from '@/components/ui/analytics/transition-panel'
import { cn } from '@/lib/utils'

interface TransitionInsightsProps {
    insights: string[]
    className?: string
}

export function TransitionInsights({ insights, className }: TransitionInsightsProps) {
    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
        if (!insights || insights.length <= 1) return

        // [CHANGE TIME HERE] Interval in milliseconds (e.g., 5000 = 5 seconds)
        const INTERVAL_MS = 6000

        const interval = setInterval(() => {
            setActiveIndex((current) => (current + 1) % insights.length)
        }, INTERVAL_MS)

        return () => clearInterval(interval)
    }, [insights])

    if (!insights || insights.length === 0) return null

    return (
        <div className={cn(
            "relative flex flex-col justify-between p-6 rounded-3xl border backdrop-blur-2xl bg-white/60 border-brand-mist/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden",
            className
        )}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#8fa18f] animate-pulse" />
                <h3 className="text-brand-sage text-[10px] uppercase tracking-[0.2em] font-medium">Mild Advisor</h3>
            </div>

            {/* Transitioning Content */}
            <div className="flex-1 min-h-[80px] flex items-center">
                <TransitionPanel
                    activeIndex={activeIndex}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    variants={{
                        enter: { opacity: 0, y: 10, filter: 'blur(4px)' },
                        center: { opacity: 1, y: 0, filter: 'blur(0px)' },
                        exit: { opacity: 0, y: -10, filter: 'blur(4px)' },
                    }}
                    className="w-full"
                >
                    {insights.map((insight, index) => (
                        <div key={index} className="w-full">
                            <p className="font-serif text-lg md:text-xl text-brand-moss leading-relaxed">
                                {insight}
                            </p>
                        </div>
                    ))}
                </TransitionPanel>
            </div>

            {/* Dot Indicators */}
            {insights.length > 1 && (
                <div className="flex items-center gap-1.5 mt-6">
                    {insights.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-300",
                                index === activeIndex 
                                    ? "w-4 bg-brand-moss" 
                                    : "w-1.5 bg-brand-sage/30 hover:bg-brand-sage/50"
                            )}
                            aria-label={`Go to insight ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
