import { supabase } from './supabase/client';
import { logEvent, logError, logWarn } from './log';
import { TemporalEngine } from './temporal';

/**
 * ARCHIVE SERVICE
 * 
 * Handles all archive-related operations with Supabase backend.
 * Uses soft-delete architecture (is_archived flag) to preserve data
 * for future intelligence layer reprocessing.
 * 
 * Key Features:
 * - Configurable threshold via NEXT_PUBLIC_ARCHIVE_THRESHOLD_DAYS
 * - Large dataset CSV export guard (>5000 entries)
 * - Soft-delete preservation of raw data
 * - Statistical aggregation into monthly_summary
 */

// Configuration
const ARCHIVE_THRESHOLD_DAYS = parseInt(
    process.env.NEXT_PUBLIC_ARCHIVE_THRESHOLD_DAYS || '90',
    10
);

const LARGE_CSV_THRESHOLD = 5000; // Trigger warning for datasets larger than this

// =====================================================
// Type Definitions
// =====================================================

export type ArchiveEligibilityResult = {
    shouldArchive: boolean;
    oldEntriesCount: number;
    oldestDate: Date | null;
    thresholdDate: Date;
};

export type ArchiveMigrationResult = {
    archivedCount: number;
    summariesCreated: number;
    success: boolean;
    message: string;
};

export type ArchiveStats = {
    totalEntries: number;
    activeEntries: number;
    archivedEntries: number;
    lastArchiveDate: Date | null;
    oldestActiveDate: Date | null;
};

export type MonthlyArchive = {
    month: Date;
    categories: { category: string; count: number; totalMinor: number; maxMinor: number; minMinor: number; avgMinor: number }[];
    totalEntries: number;
    totalAmountMinor: number;
};

export type RestoreResult = {
    success: boolean;
    restoredCount: number;
    message: string;
};

export type ArchivedEntry = {
    id: string;
    amount: number;
    category: string;
    description: string;
    date: Date;
    confidence: number;
};

// --- Internal RPC Types ---

interface ArchiveHistoryRow {
    month: string;
    category: string;
    entry_count: number;
    total_amount_minor: string;
    max_amount_minor: string;
    min_amount_minor: string;
    avg_amount_minor: string;
}

interface ArchivedEntryRow {
    id: string;
    amount: string;
    category: string;
    description: string;
    date: string;
    confidence: string;
}

// =====================================================
// Archive Eligibility Check
// =====================================================

/**
 * Check if user has enough old data to warrant archiving
 * Calls Supabase RPC: check_archive_threshold
 */
export async function checkArchiveEligibility(
    userId: string
): Promise<ArchiveEligibilityResult | null> {
    try {
        logEvent('Checking archive eligibility', {
            module: 'archive-service',
            action: 'check_eligibility',
            userId,
            thresholdDays: ARCHIVE_THRESHOLD_DAYS,
        });

        const { data, error } = await supabase.rpc('check_archive_threshold', {
            p_user_id: userId,
            p_threshold_days: ARCHIVE_THRESHOLD_DAYS,
        });

        if (error) {
            logError('Failed to check archive eligibility', {
                module: 'archive-service',
                action: 'check_eligibility_failed',
                error: error.message,
                userId,
            });
            return null;
        }

        // RPC returns array, take first result
        const result = data && data[0];
        if (!result) {
            return {
                shouldArchive: false,
                oldEntriesCount: 0,
                oldestDate: null,
                thresholdDate: new Date(Date.now() - ARCHIVE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000),
            };
        }

        return {
            shouldArchive: result.should_archive,
            oldEntriesCount: parseInt(result.old_entries_count, 10),
            oldestDate: result.oldest_date ? new Date(result.oldest_date) : null,
            thresholdDate: new Date(result.threshold_date),
        };
    } catch (err) {
        logError('Exception in checkArchiveEligibility', {
            module: 'archive-service',
            action: 'check_eligibility_exception',
            error: err instanceof Error ? err.message : String(err),
        });
        return null;
    }
}

// =====================================================
// Execute Archive Migration
// =====================================================

/**
 * Executes soft-archive migration:
 * 1. Aggregates old entries into monthly_summary (with max/min/avg)
 * 2. Sets is_archived = true on old entries
 * 3. Logs operation in audit_logs
 * 
 * CRITICAL: Does NOT delete any data. All entries are preserved.
 */
export async function executeArchive(
    userId: string
): Promise<ArchiveMigrationResult | null> {
    try {
        logEvent('Executing archive migration', {
            module: 'archive-service',
            action: 'execute_migration',
            userId,
            thresholdDays: ARCHIVE_THRESHOLD_DAYS,
        });

        const { data, error } = await supabase.rpc('execute_archive_migration', {
            p_user_id: userId,
            p_threshold_days: ARCHIVE_THRESHOLD_DAYS,
        });

        if (error) {
            logError('Failed to execute archive migration', {
                module: 'archive-service',
                action: 'execute_migration_failed',
                error: error.message,
                userId,
            });
            return null;
        }

        // RPC returns array, take first result
        const result = data && data[0];
        if (!result) {
            return {
                archivedCount: 0,
                summariesCreated: 0,
                success: false,
                message: 'No result returned from archive migration',
            };
        }

        const migrationResult: ArchiveMigrationResult = {
            archivedCount: parseInt(result.archived_count, 10),
            summariesCreated: parseInt(result.summaries_created, 10),
            success: result.success,
            message: result.message,
        };

        if (migrationResult.success) {
            logEvent('Archive migration completed successfully', {
                module: 'archive-service',
                action: 'migration_success',
                userId,
                ...migrationResult,
            });
        } else {
            logError('Archive migration failed', {
                module: 'archive-service',
                action: 'migration_failed',
                userId,
                message: migrationResult.message,
            });
        }

        return migrationResult;
    } catch (err) {
        logError('Exception in executeArchive', {
            module: 'archive-service',
            action: 'execute_archive_exception',
            error: err instanceof Error ? err.message : String(err),
        });
        return null;
    }
}

/**
 * TIMEOUT UTILITY: Ensures cloud fetch doesn't block local experience.
 */
async function withTimeout<T>(promise: Promise<T> | PromiseLike<T>, timeoutMs: number, operationName: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
            reject(new Error(`TIMEOUT: ${operationName} exceeded ${timeoutMs}ms`));
        }, timeoutMs);
    });
    return Promise.race([promise, timeout]);
}

// =====================================================
// Archive Statistics
// =====================================================

/**
 * Get archive statistics for a user
 */
export async function getArchiveStats(userId: string): Promise<ArchiveStats | null> {
    try {
        // Wrap Supabase calls in timeout to prevent hanging UI
        const { data, error } = await withTimeout<any>(
            supabase
                .from('entries')
                .select('id, is_archived, date')
                .eq('user_id', userId),
            2000,
            'Archive Stats (entries)'
        );

        if (error) {
            logError('Failed to fetch archive stats', {
                module: 'archive-service',
                action: 'fetch_stats_failed',
                error: error.message,
                userId,
            });
            // Return safe default instead of null to prevent UI flickering/hangs
            return {
                totalEntries: 0,
                activeEntries: 0,
                archivedEntries: 0,
                lastArchiveDate: null,
                oldestActiveDate: null,
            };
        }

        const totalEntries = data.length;
        const archivedEntries = data.filter((e: any) => e.is_archived).length;
        const activeEntries = totalEntries - archivedEntries;

        // Find oldest active (non-archived) entry
        const activeData = data.filter((e: any) => !e.is_archived);
        const oldestActiveDate =
            activeData.length > 0
                ? new Date(Math.min(...activeData.map((e: any) => new Date(e.date).getTime())))
                : null;

        // Find last archive date from audit logs
        const { data: auditData } = await withTimeout(
            supabase
                .from('audit_logs')
                .select('timestamp')
                .eq('user_id', userId)
                .eq('entity_type', 'archive_migration')
                .order('timestamp', { ascending: false })
                .limit(1),
            1500,
            'Archive Stats (audit_logs)'
        );

        const lastArchiveDate =
            auditData && auditData.length > 0 ? new Date(auditData[0].timestamp) : null;

        return {
            totalEntries,
            activeEntries,
            archivedEntries,
            lastArchiveDate,
            oldestActiveDate,
        };
    } catch (err: any) {
        logError('Exception in getArchiveStats', {
            module: 'archive-service',
            action: 'get_stats_exception',
            error: err?.message || err?.error_description || (typeof err === 'object' ? JSON.stringify(err) : String(err)),
            userId,
        }, err instanceof Error ? err : undefined);

        // Return fallback stats so UI can still render
        return {
            totalEntries: 0,
            activeEntries: 0,
            archivedEntries: 0,
            lastArchiveDate: null,
            oldestActiveDate: null,
        };
    }
}

// =====================================================
// Large Dataset Guard
// =====================================================

/**
 * Check if dataset requires warning before CSV export
 * Returns true if count exceeds LARGE_CSV_THRESHOLD
 */
export function requiresLargeDatasetWarning(count: number): boolean {
    const isLarge = count > LARGE_CSV_THRESHOLD;

    if (isLarge) {
        logWarn('Large dataset detected for CSV export', {
            module: 'archive-service',
            action: 'large_csv_detected',
            count,
            threshold: LARGE_CSV_THRESHOLD,
        });
    }

    return isLarge;
}

/**
 * Fetch transactions to be archived (for CSV export)
 * Does NOT modify any data
 */
export async function getTransactionsToArchive(userId: string) {
    try {
        const thresholdDate = new Date(Date.now() - ARCHIVE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

        const { data, error } = await supabase
            .from('entries')
            .select('*')
            .eq('user_id', userId)
            .eq('is_archived', false)
            .lt('date', TemporalEngine.getLocalDateString(thresholdDate))
            .order('date', { ascending: true });

        if (error) {
            logError('Failed to fetch transactions to archive', {
                module: 'archive-service',
                action: 'fetch_transactions_failed',
                error: error.message,
                userId,
            });
            return null;
        }

        return data;
    } catch (err) {
        logError('Exception in getTransactionsToArchive', {
            module: 'archive-service',
            action: 'get_transactions_exception',
            error: err instanceof Error ? err.message : String(err),
        });
        return null;
    }
}

// =====================================================
// Pro Tier Logic
// =====================================================

/**
 * Check if archive features are enabled for user
 * Only Pro users can use archiving functionality
 */
export async function isArchiveEnabledForUser(userId: string): Promise<boolean> {
    // Dev user is always Pro for testing
    if (userId === '00000000-0000-0000-0000-000000000123') return true;

    try {
        const { data, error } = await withTimeout(
            supabase
                .from('user_profiles')
                .select('tier')
                .eq('id', userId)
                .single(),
            1500,
            'Check Tier'
        );

        if (error || !data) {
            logEvent('User profile not found or timed out, defaulting to free', {
                module: 'archive-service',
                action: 'check_tier_missing',
                userId,
                error: error?.message
            });
            return false; // Default to free if no profile exists yet
        }

        return data.tier === 'pro';
    } catch (err) {
        logError('Exception checking archive enabled', {
            module: 'archive-service',
            action: 'check_enabled_exception',
            error: err instanceof Error ? err.message : String(err),
            userId
        }, err instanceof Error ? err : undefined);
        return false;
    }
}

/**
 * Get archive threshold for user based on tier
 * Returns 90 for Pro users, null for Free users
 */
export async function getArchiveThresholdForUser(userId: string): Promise<number | null> {
    const isEnabled = await isArchiveEnabledForUser(userId);
    return isEnabled ? 90 : null;
}

// =====================================================
// Archive History
// =====================================================

/**
 * Get monthly archive summaries for history view
 */
export async function getArchiveHistoryByMonth(
    userId: string,
    startMonth?: Date,
    endMonth?: Date
): Promise<MonthlyArchive[]> {
    try {
        const { data, error } = await supabase.rpc('get_archive_summary_by_month', {
            p_user_id: userId,
            p_start_month: startMonth ? TemporalEngine.getLocalDateString(startMonth) : null,
            p_end_month: endMonth ? TemporalEngine.getLocalDateString(endMonth) : null,
        });

        if (error) {
            logError('Failed to fetch archive history', {
                module: 'archive-service',
                action: 'fetch_history_failed',
                error: error.message,
                userId,
            });
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        // Group by month
        const monthlyMap = new Map<string, MonthlyArchive>();

        data.forEach((row: ArchiveHistoryRow) => {
            const monthKey = row.month;

            if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, {
                    month: new Date(row.month),
                    categories: [],
                    totalEntries: 0,
                    totalAmountMinor: 0,
                });
            }

            const monthData = monthlyMap.get(monthKey)!;
            monthData.categories.push({
                category: row.category,
                count: row.entry_count,
                totalMinor: parseInt(row.total_amount_minor, 10),
                maxMinor: parseInt(row.max_amount_minor, 10),
                minMinor: parseInt(row.min_amount_minor, 10),
                avgMinor: parseInt(row.avg_amount_minor, 10),
            });
            monthData.totalEntries += row.entry_count;
            monthData.totalAmountMinor += parseInt(row.total_amount_minor, 10);
        });

        return Array.from(monthlyMap.values()).sort(
            (a, b) => b.month.getTime() - a.month.getTime()
        );
    } catch (err) {
        logError('Exception fetching archive history', {
            module: 'archive-service',
            action: 'fetch_history_exception',
            error: err instanceof Error ? err.message : String(err),
        });
        return [];
    }
}

// =====================================================
// Restore Archived Entries
// =====================================================

/**
 * Restore archived entries (set is_archived = false)
 * Can restore by entry IDs or entire month
 */
export async function restoreArchivedEntries(
    userId: string,
    entryIds?: string[],
    month?: Date
): Promise<RestoreResult | null> {
    try {
        logEvent('Restoring archived entries', {
            module: 'archive-service',
            action: 'restore_entries',
            userId,
            entryCount: entryIds?.length || 'month',
            month: month?.toISOString(),
        });

        const { data, error } = await supabase.rpc('restore_archived_entries', {
            p_user_id: userId,
            p_entry_ids: entryIds || null,
            p_month: month ? TemporalEngine.getLocalDateString(month) : null,
        });

        if (error) {
            logError('Failed to restore entries', {
                module: 'archive-service',
                action: 'restore_failed',
                error: error.message,
                userId,
            });
            return null;
        }

        const result = data && data[0];
        if (!result) {
            return {
                success: false,
                restoredCount: 0,
                message: 'No result from restore operation',
            };
        }

        return {
            success: result.success,
            restoredCount: parseInt(result.restored_count, 10),
            message: result.message,
        };
    } catch (err) {
        logError('Exception restoring entries', {
            module: 'archive-service',
            action: 'restore_exception',
            error: err instanceof Error ? err.message : String(err),
        });
        return null;
    }
}

// =====================================================
// Get Archived Entries by Month
// =====================================================

/**
 * Fetch all archived entries for a specific month
 * Used for month-based CSV downloads
 */
export async function getArchivedEntriesByMonth(
    userId: string,
    month: Date
): Promise<ArchivedEntry[]> {
    try {
        const { data, error } = await supabase.rpc('get_archived_entries_by_month', {
            p_user_id: userId,
            p_month: TemporalEngine.getLocalDateString(month),
        });

        if (error) {
            logError('Failed to fetch archived entries', {
                module: 'archive-service',
                action: 'fetch_archived_failed',
                error: error.message,
                userId,
            });
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        return data.map((row: ArchivedEntryRow) => ({
            id: row.id,
            amount: parseFloat(row.amount),
            category: row.category,
            description: row.description,
            date: new Date(row.date),
            confidence: parseFloat(row.confidence),
        }));
    } catch (err) {
        logError('Exception fetching archived entries', {
            module: 'archive-service',
            action: 'fetch_archived_exception',
            error: err instanceof Error ? err.message : String(err),
        });
        return [];
    }
}
