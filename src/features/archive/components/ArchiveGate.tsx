"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Archive, X, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
    checkArchiveEligibility,
    executeArchive,
    getTransactionsToArchive,
    requiresLargeDatasetWarning
} from '@/lib/archive-service'
import { exportTransactionsCSV, getLargeDatasetWarningMessage } from '@/lib/csv-export'
import { useToast } from '@/components/ui/toast'

type ArchiveGateProps = {
    onClose?: () => void;
    onArchiveComplete?: () => void;
}

export function ArchiveGate({ onClose, onArchiveComplete }: ArchiveGateProps) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [eligibility, setEligibility] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isArchiving, setIsArchiving] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [showLargeDatasetWarning, setShowLargeDatasetWarning] = useState(false)

    // Check eligibility on mount
    React.useEffect(() => {
        async function checkEligibility() {
            if (!user) return

            const result = await checkArchiveEligibility(user.id)
            setEligibility(result)
            setIsLoading(false)
        }

        checkEligibility()
    }, [user])

    const handleDownloadCSV = async () => {
        if (!user || !eligibility) return

        // Check if dataset is large
        if (requiresLargeDatasetWarning(eligibility.oldEntriesCount)) {
            setShowLargeDatasetWarning(true)
            return
        }

        await performDownload()
    }

    const performDownload = async () => {
        if (!user) return

        setIsDownloading(true)
        try {
            const transactions = await getTransactionsToArchive(user.id)

            if (!transactions || transactions.length === 0) {
                toast({
                    type: 'info',
                    message: 'No Data to Export',
                    description: 'There are no transactions eligible for archiving.'
                })
                return
            }

            // Generate filename with date range
            const oldestDate = eligibility?.oldestDate
                ? new Date(eligibility.oldestDate).toISOString().split('T')[0]
                : 'archive'
            const filename = `monetarz-archive-${oldestDate}.csv`

            exportTransactionsCSV(transactions, filename)

            toast({
                type: 'success',
                message: 'Download Complete',
                description: `Exported ${transactions.length} transactions`,
                duration: 3000
            })
        } catch (error) {
            console.error('CSV export failed:', error)
            toast({
                type: 'error',
                message: 'Export Failed',
                description: 'Failed to generate CSV file'
            })
        } finally {
            setIsDownloading(false)
            setShowLargeDatasetWarning(false)
        }
    }

    const handleArchive = async () => {
        if (!user) return

        setIsArchiving(true)
        try {
            const result = await executeArchive(user.id)

            if (result?.success) {
                toast({
                    type: 'success',
                    message: 'Archive Complete',
                    description: result.message,
                    duration: 5000
                })

                onArchiveComplete?.()
                onClose?.()
            } else {
                toast({
                    type: 'error',
                    message: 'Archive Failed',
                    description: result?.message || 'An error occurred'
                })
            }
        } catch (error) {
            console.error('Archive execution failed:', error)
            toast({
                type: 'error',
                message: 'Archive Failed',
                description: 'Unable to complete archive operation'
            })
        } finally {
            setIsArchiving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="rounded-lg border border-[#C2CDBE]/20 bg-white/50 backdrop-blur-sm p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-[#C2CDBE]/20 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-[#C2CDBE]/20 rounded w-1/2"></div>
                </div>
            </div>
        )
    }

    if (!eligibility?.shouldArchive) {
        return null
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-lg border border-[#8FA18F]/30 bg-gradient-to-br from-white/90 to-[#F5F7F4]/80 backdrop-blur-sm p-6 shadow-lg"
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="font-serif text-xl text-[#2D3A2E] mb-1">
                            Optimize your Journal
                        </h3>
                        <p className="text-sm text-[#5A6B5C]">
                            Archive older transactions to improve performance
                        </p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-[#8FA18F] hover:text-[#4A5D4E] transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Data Summary */}
                <div className="bg-[#F5F7F4] rounded-md p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-[#8FA18F] mb-1">Entries to Archive</p>
                            <p className="text-lg font-semibold text-[#2D3A2E]">
                                {eligibility.oldEntriesCount.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-[#8FA18F] mb-1">Oldest Entry</p>
                            <p className="text-lg font-semibold text-[#2D3A2E]">
                                {eligibility.oldestDate
                                    ? new Date(eligibility.oldestDate).toLocaleDateString()
                                    : 'N/A'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Message */}
                <div className="bg-[#E8F5E9]/30 border border-[#8FA18F]/20 rounded-md p-4 mb-6">
                    <p className="text-sm text-[#2D3A2E]">
                        <strong>What happens:</strong> Your data will be preserved and optimized.
                        All transactions remain accessible for analytics, and you can download a
                        backup before archiving.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleDownloadCSV}
                        disabled={isDownloading || isArchiving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 
                                   border border-[#8FA18F] text-[#4A5D4E] rounded-md
                                   hover:bg-[#F5F7F4] transition-all duration-200
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={18} />
                        <span className="font-medium">
                            {isDownloading ? 'Downloading...' : 'Download Backup'}
                        </span>
                    </button>

                    <button
                        onClick={handleArchive}
                        disabled={isArchiving || isDownloading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 
                                   bg-[#4A5D4E] text-white rounded-md
                                   hover:bg-[#3A4D3E] transition-all duration-200
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Archive size={18} />
                        <span className="font-medium">
                            {isArchiving ? 'Archiving...' : 'Archive Now'}
                        </span>
                    </button>
                </div>
            </motion.div>

            {/* Large Dataset Warning Modal */}
            <AnimatePresence>
                {showLargeDatasetWarning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowLargeDatasetWarning(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-2 bg-amber-50 rounded-full">
                                    <AlertTriangle className="text-amber-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-serif text-lg text-[#2D3A2E] mb-2">
                                        Large Dataset Detected
                                    </h3>
                                    <p className="text-sm text-[#5A6B5C]">
                                        {getLargeDatasetWarningMessage(eligibility.oldEntriesCount)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowLargeDatasetWarning(false)}
                                    className="flex-1 px-4 py-2 border border-[#C2CDBE] text-[#5A6B5C] 
                                               rounded-md hover:bg-[#F5F7F4] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={performDownload}
                                    className="flex-1 px-4 py-2 bg-[#4A5D4E] text-white rounded-md 
                                               hover:bg-[#3A4D3E] transition-colors"
                                >
                                    Continue
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
