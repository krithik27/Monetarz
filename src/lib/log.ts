/**
 * OBSERVABILITY LAYER: Lightweight Structured Logger
 * 
 * Provides structured logging for debugging, audit trails, and error triage.
 * Designed to be replaced with a remote service (Sentry, LogRocket) later.
 * 
 * Principles:
 * - Every silence is explainable
 * - Every error is structured
 * - Zero external dependencies
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type LogContext = {
    module: string;          // e.g., 'insights', 'parser', 'money'
    action: string;          // e.g., 'suppress_insight', 'parse_fail'
    [key: string]: unknown;  // Arbitrary structured data
};

export type LogEntry = {
    timestamp: string;
    level: LogLevel;
    module: string;
    action: string;
    message: string;
    data?: Record<string, unknown>;
};

// Memory buffer for the Admin Console Feed
const MAX_LOGS = 100;
const logBuffer: LogEntry[] = [];

function createEntry(level: LogLevel, message: string, context: LogContext): LogEntry {
    const { module, action, ...rest } = context;
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        module,
        action,
        message,
        ...(Object.keys(rest).length > 0 ? { data: rest } : {}),
    };

    // Push to buffer
    logBuffer.push(entry);
    if (logBuffer.length > MAX_LOGS) {
        logBuffer.shift();
    }

    return entry;
}

/**
 * RETRIEVAL FOR ADMIN UI
 */
export function getRecentLogs(limit = 50): LogEntry[] {
    return [...logBuffer].reverse().slice(0, limit);
}

const PREFIX = '[monetarz]';

/**
 * Log an error with structured context.
 */
export function logError(message: string, context: LogContext, error?: any): void {
    const safeMessage = message || error?.message || 'Unknown Error';
    const entry = createEntry('error', safeMessage, context);

    // Deep inspect error object if stringification fails or hides properties
    const extractErr = (e: any) => {
        if (!e) return 'No error object';
        if (typeof e === 'string') return e;
        if (e instanceof Error) return `${e.name}: ${e.message}`;
        if (e.message || e.error_description) return e.message || e.error_description;
        try {
            const str = JSON.stringify(e);
            return str === '{}' ? String(e) : str;
        } catch {
            return String(e);
        }
    };

    const contextError = entry.data?.error;
    const errorMessage = error ? extractErr(error) : extractErr(contextError);
    const errorStack = error?.stack || (contextError as any)?.stack;

    // Log for server console / developer triage
    console.error(
        `${PREFIX} ❌ ${entry.module}.${entry.action}: ${safeMessage}`,
        {
            ...entry.data,
            error_details: errorMessage !== '[object Object]' ? errorMessage : 'Un-printable Object',
            stack: errorStack
        }
    );
}

/**
 * Log an event with structured context.
 * Use for: insight suppression, confidence decisions, state transitions.
 */
export function logEvent(message: string, context: LogContext): void {
    const entry = createEntry('info', message, context);
    console.info(
        `${PREFIX} 📋 ${entry.module}.${entry.action}: ${message}`,
        entry.data ?? ''
    );
}

/**
 * Log a warning with structured context.
 * Use for: approaching performance limits, deprecated usage, low confidence.
 */
export function logWarn(message: string, context: LogContext): void {
    const entry = createEntry('warn', message, context);
    console.warn(
        `${PREFIX} ⚠️ ${entry.module}.${entry.action}: ${message}`,
        entry.data ?? ''
    );
}

/**
 * Log debug information (suppressed in production).
 */
function logDebug(message: string, context: LogContext): void {
    if (process.env.NODE_ENV === 'production') return;
    const entry = createEntry('debug', message, context);
    console.debug(
        `${PREFIX} 🔍 ${entry.module}.${entry.action}: ${message}`,
        entry.data ?? ''
    );
}

// ============================================================================
// INSIGHT AUDIT TRAIL
// ============================================================================

export type InsightAuditEntry = {
    insightType: 'today_vs_usual' | 'recent_changes';
    action: 'generated' | 'suppressed';
    reason: string;
    confidence: number;
    sampleSize?: number;
    consistencyScore?: number;
    timestamp: string;
};

const insightAuditLog: InsightAuditEntry[] = [];

/**
 * Record an insight lifecycle event.
 * Non-UI: for developer triage only.
 */
function auditInsight(entry: Omit<InsightAuditEntry, 'timestamp'>): void {
    const fullEntry: InsightAuditEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
    };
    insightAuditLog.push(fullEntry);

    // Also log it structurally
    const logFn = entry.action === 'suppressed' ? logWarn : logEvent;
    logFn(`Insight ${entry.action}: ${entry.reason}`, {
        module: 'insights',
        action: `insight_${entry.action}`,
        insightType: entry.insightType,
        confidence: entry.confidence,
        sampleSize: entry.sampleSize,
        consistencyScore: entry.consistencyScore,
    });
}

/**
 * Get the full audit trail (for debugging).
 */
function getInsightAuditLog(): readonly InsightAuditEntry[] {
    return insightAuditLog;
}
