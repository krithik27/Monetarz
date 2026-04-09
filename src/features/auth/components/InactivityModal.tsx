"use client"

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'

type InactivityModalProps = {
    isOpen: boolean
    countdown: number
    onStaySignedIn: () => void
}

export function InactivityModal({ isOpen, countdown, onStaySignedIn }: InactivityModalProps) {
    // Auto-trigger action on Enter key
    useEffect(() => {
        if (!isOpen) return

        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                onStaySignedIn()
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [isOpen, onStaySignedIn])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    role="alertdialog"
                    aria-labelledby="inactivity-title"
                    aria-describedby="inactivity-description"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 border-2 border-amber-500/30"
                    >
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-amber-100 rounded-full">
                                <AlertTriangle className="text-amber-600" size={40} />
                            </div>
                        </div>

                        {/* Title */}
                        <h2
                            id="inactivity-title"
                            className="text-2xl font-serif text-[#2D3A2E] text-center mb-4"
                        >
                            Session Inactive
                        </h2>

                        {/* Description */}
                        <p
                            id="inactivity-description"
                            className="text-center text-[#5A6B5C] mb-6"
                        >
                            You will be logged out in <strong className="text-amber-600">{countdown} seconds</strong> for your security.
                        </p>

                        {/* Countdown Circle */}
                        <div className="flex justify-center mb-8">
                            <div className="relative w-24 h-24">
                                <svg className="transform -rotate-90 w-24 h-24">
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="44"
                                        stroke="#F3F4F6"
                                        strokeWidth="8"
                                        fill="none"
                                    />
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="44"
                                        stroke="#F59E0B"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray={`${2 * Math.PI * 44}`}
                                        strokeDashoffset={`${2 * Math.PI * 44 * (1 - countdown / 60)}`}
                                        className="transition-all duration-1000 ease-linear"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-3xl font-bold text-amber-600">
                                        {countdown}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={onStaySignedIn}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 
                                       bg-[#4A5D4E] text-white rounded-xl font-medium text-lg
                                       hover:bg-[#3A4D3E] transition-colors
                                       focus:outline-none focus:ring-4 focus:ring-[#8FA18F]/50"
                            autoFocus
                        >
                            <RefreshCw size={20} />
                            <span>Stay Signed In</span>
                        </button>

                        {/* Helper Text */}
                        <p className="text-xs text-center text-[#8FA18F] mt-4">
                            Press <kbd className="px-2 py-1 bg-[#F5F7F4] rounded text-[#2D3A2E]">Enter</kbd> to continue
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
