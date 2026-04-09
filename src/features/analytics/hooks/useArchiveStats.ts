import { useState, useEffect } from 'react';
import { getArchiveStats, isArchiveEnabledForUser, ArchiveStats } from '@/lib/archive-service';
import { ParsedSpend } from '@/lib/parser';

export function useArchiveStats(authUser: any | null, spends: ParsedSpend[]) {
    const [archiveStats, setArchiveStats] = useState<ArchiveStats | null>(null);
    const [isArchiveEnabled, setIsArchiveEnabled] = useState(false);
    const [showArchiveGate, setShowArchiveGate] = useState(true);

    useEffect(() => {
        async function fetchArchiveData() {
            if (!authUser) return;

            // DEV PROXY MODE: Skip direct Supabase calls
            const DEV_USER_ID = '00000000-0000-0000-0000-000000000123';
            const isDevUser = authUser?.id === DEV_USER_ID;
            const IS_PROXY_MODE = process.env.NODE_ENV === 'development' && isDevUser;

            if (IS_PROXY_MODE) {
                // Return mock stats for dev environment
                setArchiveStats({
                    totalEntries: spends.length,
                    activeEntries: spends.filter(s => !s.is_archived).length,
                    archivedEntries: spends.filter(s => s.is_archived).length,
                    lastArchiveDate: null,
                    oldestActiveDate: spends.length > 0 ? new Date(Math.min(...spends.map(s => new Date(s.date).getTime()))) : null,
                });
                setIsArchiveEnabled(true);
                return;
            }

            const [stats, enabled] = await Promise.all([
                getArchiveStats(authUser.id),
                isArchiveEnabledForUser(authUser.id)
            ]);

            setArchiveStats(stats);
            setIsArchiveEnabled(enabled);
        }
        fetchArchiveData();
    }, [authUser, spends]);

    const handleArchiveComplete = (refreshAnalytics: () => void) => {
        setShowArchiveGate(false);
        refreshAnalytics();
        // Refresh stats
        if (authUser) {
            getArchiveStats(authUser.id).then(setArchiveStats);
        }
    };

    return { archiveStats, setArchiveStats, isArchiveEnabled, showArchiveGate, handleArchiveComplete };
}
