"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, RotateCcw, ChevronDown, ChevronUp, Archive as ArchiveIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { TemporalEngine } from '@/lib/temporal'
import { formatAmount } from '@/lib/money'
import {
    getArchiveHistoryByMonth,
    getArchivedEntriesByMonth,
    type MonthlyArchive
} from '@/lib/archive-service'
import { exportTransactionsCSV } from '@/lib/csv-export'
import { useToast } from '@/components/ui/toast'
import { ArchiveRestoreDialog } from '@/features/archive/components/ArchiveRestoreDialog' // Dialog component

export function ArchiveHistoryView() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [history, setHistory] = useState<MonthlyArchive[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null)
    const [restoreMonth, setRestoreMonth] = useState<Date | null>(null)

    // Load archive history
    useEffect(() => {
        async function loadHistory() {
            if (!user) return

            setIsLoading(true)
            const data = await getArchiveHistoryByMonth(user.id)
            setHistory(data)
            setIsLoading(false)
        }

        loadHistory()
    }, [user])

    const handleDownloadMonth = async (month: Date) => {
        if (!user) return

        try {
            const entries = await getArchivedEntriesByMonth(user.id, month)

            if (!entries || entries.length === 0) {
                toast({
                    type: 'info',
                    message: 'No Data',
                    description: 'No archived entries found for this month'
                })
                return
            }

            const monthStr = TemporalEngine.getLocalDateString(month)
            const filename = `monetarz-archive-${monthStr}.csv`

            exportTransactionsCSV(entries, filename)

            toast({
                type: 'success',
                message: 'Download Complete',
                description: `Downloaded ${entries.length} entries`,
                duration: 3000
            })
        } catch (error) {
            console.error('Download failed:', error)
            toast({
                type: 'error',
                message: 'Download Failed',
                description: 'Unable to export archive data'
            })
        }
    }

    const handleRestoreMonth = (month: Date) => {
        setRestoreMonth(month)
    }

    const handleRestoreComplete = () => {
        setRestoreMonth(null)
        // Reload history
        if (user) {
            getArchiveHistoryByMonth(user.id).then(setHistory)
        }
    }

    const formatMonth = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC'
        }).format(date)
    }

    const formatCurrency = (minor: number) => {
        return formatAmount(minor / 100)
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-lg border border-[#C2CDBE]/20 bg-white/50 p-6">
                        <div className="animate-pulse">
                            <div className="h-5 bg-[#C2CDBE]/20 rounded w-1/3 mb-3"></div>
                            <div className="h-3 bg-[#C2CDBE]/20 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-16">
                <ArchiveIcon className="mx-auto h-12 w-12 text-[#C2CDBE] mb-4" />
                <h3 className="text-lg font-serif text-[#2D3A2E] mb-2">No Archived Data</h3>
                <p className="text-sm text-[#5A6B5C]">
                    You haven't archived any transactions yet.
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-serif text-[#2D3A2E]">Archive History</h2>
                        <p className="text-sm text-[#5A6B5C] mt-1">
                            {history.length} archived {history.length === 1 ? 'month' : 'months'}
                        </p>
                    </div>
                </div>

                {history.map((monthData) => {
                    const monthKey = monthData.month.toISOString()
                    const isExpanded = expandedMonth === monthKey

                    return (
                        <motion.div
                            key={monthKey}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-lg border border-[#C2CDBE]/30 bg-white/80 backdrop-blur-sm overflow-hidden"
                        >
                            {/* Month Header */}
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-serif text-[#2D3A2E] mb-2">
                                            {formatMonth(monthData.month)}
                                        </h3>
                                        <div className="flex items-center gap-6 text-sm">
                                            <div>
                                                <span className="text-[#8FA18F]">Entries: </span>
                                                <span className="font-medium text-[#4A5D4E]">
                                                    {monthData.totalEntries.toLocaleString()}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[#8FA18F]">Total: </span>
                                                <span className="font-medium text-[#4A5D4E]">
                                                    {formatCurrency(monthData.totalAmountMinor)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDownloadMonth(monthData.month)}
                                            className="p-2 text-[#5A6B5C] hover:bg-[#F5F7F4] rounded-md transition-colors"
                                            title="Download CSV"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleRestoreMonth(monthData.month)}
                                            className="p-2 text-[#5A6B5C] hover:bg-[#F5F7F4] rounded-md transition-colors"
                                            title="Restore Month"
                                        >
                                            <RotateCcw size={18} />
                                        </button>
                                        <button
                                            onClick={() => setExpandedMonth(isExpanded ? null : monthKey)}
                                            className="p-2 text-[#5A6B5C] hover:bg-[#F5F7F4] rounded-md transition-colors"
                                        >
                                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Category Breakdown */}
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="border-t border-[#C2CDBE]/20 bg-[#F5F7F4]/50 p-6"
                                >
                                    <h4 className="text-sm font-medium text-[#2D3A2E] mb-4">Category Breakdown</h4>
                                    <div className="space-y-3">
                                        {monthData.categories.map(cat => (
                                            <div key={cat.category} className="flex items-center justify-between text-sm">
                                                <span className="text-[#5A6B5C]">{cat.category}</span>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[#8FA18F]">
                                                        {cat.count} {cat.count === 1 ? 'entry' : 'entries'}
                                                    </span>
                                                    <span className="font-medium text-[#4A5D4E]">
                                                        {formatCurrency(cat.totalMinor)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )
                })}
            </div>

            {/* Restore Dialog */}
            {restoreMonth && (
                <ArchiveRestoreDialog
                    month={restoreMonth}
                    monthData={history.find(h => h.month.toISOString() === restoreMonth.toISOString())}
                    onClose={() => setRestoreMonth(null)}
                    onRestoreComplete={handleRestoreComplete}
                />
            )}
        </>
    )
}
