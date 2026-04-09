"use client"

import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { secureLogout } from '@/lib/auth/secureLogout'

const IDLE_TIMEOUT = 20 * 60 * 1000 // 20 minutes in milliseconds
const PERFORMANCE_IDLE_TIMEOUT = 2 * 60 * 1000 // 2 minutes to pause animations
const WARNING_DURATION = 60 // 60 seconds warning countdown
const THROTTLE_DELAY = 500 // Throttle mousemove/scroll to 500ms
const DEV_USER_ID = '00000000-0000-0000-0000-000000000123'

/**
 * IDLE GUARD HOOK
 * 
 * Monitors user activity and triggers automatic logout after 20 minutes of inactivity.
 * Provides a 60-second warning period before logout.
 * 
 * Features:
 * - Throttled activity detection (mousemove, scroll, keydown, click, touchstart)
 * - Graceful 60-second warning countdown
 * - Performance optimization: exposes isIdle state to pause heavy animations
 * - Dev mode skip (no idle detection for dev user)
 * - Auto-cleanup on unmount
 */
export function useIdleGuard() {
    const { user } = useAuth()
    const [isWarningOpen, setIsWarningOpen] = useState(false)
    const [isIdle, setIsIdle] = useState(false)
    const [countdown, setCountdown] = useState(WARNING_DURATION)

    const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
    const performanceIdleTimerRef = useRef<NodeJS.Timeout | null>(null)
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const lastActivityRef = useRef<number>(0)

    // Initialize last activity time
    useEffect(() => {
        lastActivityRef.current = Date.now()
    }, [])

    // Skip idle guard entirely for dev user
    const isDevMode = user?.id === DEV_USER_ID

    /**
     * Handle idle timeout - show warning modal
     */
    const handleIdleTimeout = useCallback(() => {
        setIsWarningOpen(true)
        setCountdown(WARNING_DURATION)

        // Start countdown interval
        countdownIntervalRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    // Countdown finished - trigger logout
                    if (countdownIntervalRef.current) {
                        clearInterval(countdownIntervalRef.current)
                    }
                    secureLogout('inactivity')
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }, [])

    /**
     * Reset the idle timer on user activity
     */
    const resetIdleTimer = useCallback(() => {
        lastActivityRef.current = Date.now()

        // Clear existing timers
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current)
        }
        if (performanceIdleTimerRef.current) {
            clearTimeout(performanceIdleTimerRef.current)
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
        }

        // Reset states
        setIsIdle(false)
        setIsWarningOpen(false)

        // Start new performance idle timer (shorter)
        performanceIdleTimerRef.current = setTimeout(() => {
            setIsIdle(true)
        }, PERFORMANCE_IDLE_TIMEOUT)

        // Start new idle logout timer
        idleTimerRef.current = setTimeout(() => {
            handleIdleTimeout()
        }, IDLE_TIMEOUT)
    }, [handleIdleTimeout])

    /**
     * Handle "Stay Signed In" button click
     */
    const handleStaySignedIn = useCallback(() => {
        resetIdleTimer()
    }, [resetIdleTimer])

    /**
     * Throttle helper function
     */
    const throttle = (func: () => void, delay: number) => {
        let lastCall = 0
        return () => {
            const now = Date.now()
            if (now - lastCall >= delay) {
                lastCall = now
                func()
            }
        }
    }

    /**
     * Setup activity listeners
     */
    useEffect(() => {
        // Skip if dev mode or not authenticated
        if (isDevMode || !user) {
            return
        }

        // Create throttled handlers for expensive events
        const throttledReset = throttle(resetIdleTimer, THROTTLE_DELAY)

        // Event handlers
        const handleMouseMove = throttledReset
        const handleScroll = throttledReset
        const handleKeyDown = resetIdleTimer
        const handleClick = resetIdleTimer
        const handleTouchStart = resetIdleTimer

        // Add event listeners
        window.addEventListener('mousemove', handleMouseMove, { passive: true })
        window.addEventListener('scroll', handleScroll, { passive: true })
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('click', handleClick)
        window.addEventListener('touchstart', handleTouchStart, { passive: true })

        // Initialize idle timers
        resetIdleTimer()

        // Cleanup on unmount
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('scroll', handleScroll)
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('click', handleClick)
            window.removeEventListener('touchstart', handleTouchStart)

            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current)
            }
            if (performanceIdleTimerRef.current) {
                clearTimeout(performanceIdleTimerRef.current)
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current)
            }
        }
    }, [user, isDevMode, resetIdleTimer])

    // Return modal state and handlers
    return {
        isWarningOpen,
        isIdle,
        countdown,
        handleStaySignedIn,
    }
}
