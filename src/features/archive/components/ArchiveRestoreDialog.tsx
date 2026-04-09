"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, RotateCcw } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { restoreArchivedEntries, type MonthlyArchive } from '@/lib/archive-service'
import { useToast } from '@/components/ui/toast'

type ArchiveRestoreDialogProps = {
    month: Date;
    monthData?: MonthlyArchive;
    onClose: () => void;
    onRestoreComplete: () => void;
}

export function ArchiveRestoreDialog({
    month,
    monthData,
    onClose,
    onRestoreComplete
}: ArchiveRestoreDialogProps) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [isRestoring, setIsRestoring] = useState(false)

    const formatMonth = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            year: 'numeric'
        }).format(date)
    }

    const handleRestore = async () => {
        if (!user) return

        setIsRestoring(true)
        try {
            const result = await restoreArchivedEntries(user.id, undefined, month)

            if (result?.success) {
                toast({
                    type: 'success',
                    message: 'Restore Complete',
                    description: `Restored ${result.restoredCount} entries from ${formatMonth(month)}`,
                    duration: 5000
                })

                onRestoreComplete()
            } else {
                toast({
                    type: 'error',
                    message: 'Restore Failed',
                    description: result?.message || 'Unable to restore archive'
                })
            }
        } catch (error) {
            console.error('Restore failed:', error)
            toast({
                type: 'error',
                message: 'Restore Failed',
                description: 'An unexpected error occurred'
            })
        } finally {
            setIsRestoring(false)
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-50 rounded-full">
                                <AlertTriangle className="text-amber-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-serif text-lg text-[#2D3A2E] mb-1">
                                    Restore Archived Data?
                                </h3>
                                <p className="text-sm text-[#5A6B5C]">
                                    {formatMonth(month)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-[#8FA18F] hover:text-[#4A5D4E] transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Details */}
                    {monthData && (
                        <div className="bg-[#F5F7F4] rounded-md p-4 mb-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-[#8FA18F] mb-1">Entries</p>
                                    <p className="text-base font-semibold text-[#2D3A2E]">
                                        {monthData.totalEntries.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[#8FA18F] mb-1">Categories</p>
                                    <p className="text-base font-semibold text-[#2D3A2E]">
                                        {monthData.categories.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Warning Message */}
                    <div className="bg-amber-50/50 border border-amber-100 rounded-md p-4 mb-6">
                        <p className="text-sm text-[#2D3A2E]">
                            <strong>Note:</strong> Restored entries will return to your active transaction data.
                            This will increase query times and may affect performance if you have a large dataset.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isRestoring}
                            className="flex-1 px-4 py-3 border border-[#C2CDBE] text-[#5A6B5C] 
                                       rounded-md hover:bg-[#F5F7F4] transition-colors
                                       disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRestore}
                            disabled={isRestoring}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 
                                       bg-[#4A5D4E] text-white rounded-md
                                       hover:bg-[#3A4D3E] transition-colors
                                       disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RotateCcw size={18} />
                            <span className="font-medium">
                                {isRestoring ? 'Restoring...' : 'Restore'}
                            </span>
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
