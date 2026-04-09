"use client"

import React from 'react'
import { Archive } from 'lucide-react'

type ArchiveStatusBadgeProps = {
    lastArchiveDate?: Date | null;
    archivedCount?: number;
}

export function ArchiveStatusBadge({ lastArchiveDate, archivedCount }: ArchiveStatusBadgeProps) {
    if (!lastArchiveDate && !archivedCount) {
        return null
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            year: 'numeric'
        }).format(date)
    }

    return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 
                        bg-[#F5F7F4] border border-[#C2CDBE]/30 rounded-full
                        text-xs text-[#5A6B5C]">
            <Archive size={14} className="text-[#8FA18F]" />
            <span>
                {lastArchiveDate && (
                    <span>Last archived: {formatDate(lastArchiveDate)}</span>
                )}
                {archivedCount && archivedCount > 0 && (
                    <span className="ml-2 font-medium text-[#4A5D4E]">
                        {archivedCount.toLocaleString()} archived
                    </span>
                )}
            </span>
        </div>
    )
}
