import { TemporalEngine } from './temporal';
/**
 * CSV EXPORT UTILITY
 * 
 * Client-side CSV generation and download for transaction data.
 * Native JavaScript implementation (no external dependencies).
 * Privacy-first: All processing happens in the browser.
 * 
 * Features:
 * - RFC 4180 compliant CSV generation
 * - Special character escaping
 * - Currency formatting
 * - Browser-native download
 */

// =====================================================
// Type Definitions
// =====================================================

export type TransactionCSVRow = {
    id: string;
    date: string;
    amount: number;
    currency: string;
    category: string;
    source: string;
};

export interface CSVTransactionInput {
    date: string | Date;
    amount: number | string;
    currency_code?: string;
    category?: string;
    source?: string;
    id: string;
}

// =====================================================
// CSV Generation
// =====================================================

/**
 * Escape special characters for CSV format (RFC 4180)
 * - Quotes are escaped by doubling them
 * - Fields containing quotes, commas, or newlines are wrapped in quotes
 */
function escapeCSVField(field: string): string {
    if (field == null) return '""';

    const strField = String(field);

    // Check if field needs escaping
    const needsEscaping = /[",\n\r]/.test(strField);

    if (!needsEscaping) {
        return strField;
    }

    // Escape quotes by doubling them
    const escaped = strField.replace(/"/g, '""');

    // Wrap in quotes
    return `"${escaped}"`;
}

/**
 * Format transaction data as CSV string
 * Converts Supabase entries to human-readable CSV format
 */
function generateTransactionCSV(transactions: CSVTransactionInput[]): string {
    if (!transactions || transactions.length === 0) {
        return 'No transactions to export';
    }

    // CSV Header
    const headers = ['Date', 'Amount', 'Currency', 'Category', 'Source', 'Transaction ID'];
    const headerRow = headers.map(escapeCSVField).join(',');

    // CSV Rows
    const dataRows = transactions.map((tx) => {
        // Format date as YYYY-MM-DD HH:MM:SS
        const date = new Date(tx.date);
        const formattedDate = TemporalEngine.getLocalDateString(date);

        // Use amount directly (assuming major units from entries table)
        const amount = Number(tx.amount || 0).toFixed(2);

        const row: string[] = [
            escapeCSVField(formattedDate),
            escapeCSVField(amount),
            escapeCSVField(tx.currency_code || 'INR'),
            escapeCSVField(tx.category || 'uncategorized'),
            escapeCSVField(tx.source || 'manual'),
            escapeCSVField(tx.id),
        ];

        return row.join(',');
    });

    // Combine header and data
    const csvContent = [headerRow, ...dataRows].join('\n');

    return csvContent;
}

// =====================================================
// Browser Download
// =====================================================

/**
 * Trigger CSV download in the browser
 * Uses Blob API for client-side file generation
 */
function downloadCSV(csvContent: string, filename: string): void {
    try {
        // Create Blob with UTF-8 BOM for Excel compatibility
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], {
            type: 'text/csv;charset=utf-8;'
        });

        // Create download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Failed to download CSV:', error);
        throw new Error('CSV download failed');
    }
}

/**
 * Generate and download transaction CSV in one step
 * Convenience function that combines generation and download
 */
export function exportTransactionsCSV(
    transactions: CSVTransactionInput[],
    filename?: string
): void {
    const csv = generateTransactionCSV(transactions);

    // Generate filename with timestamp if not provided
    const defaultFilename = `monetarz-archive-${TemporalEngine.getLocalDateString(new Date())}.csv`;

    downloadCSV(csv, filename || defaultFilename);
}

// =====================================================
// Large Dataset Guard
// =====================================================

/**
 * Check if dataset is large enough to warrant warning
 * Returns true if count exceeds threshold (5000)
 */
function checkLargeDatasetWarning(count: number): boolean {
    return count > 5000;
}

/**
 * Get warning message for large datasets
 */
export function getLargeDatasetWarningMessage(count: number): string {
    return `You are about to export ${count.toLocaleString()} transactions. This may take a moment and could temporarily slow your browser. Continue?`;
}
