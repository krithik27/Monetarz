import { DailySummary } from "@/context/AnalyticsContext";

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface ConfidenceResult {
    level: ConfidenceLevel;
    label: string;
    coverage: number;
}

export const AnalyticsConfidence = {
    /**
     * Calculates confidence based on data coverage over the expected range.
     * 
     * @param summaries The daily summaries available in the window
     * @param bound The selected time bound
     * @returns Confidence level and user-facing label
     */
    calculate: (summaries: DailySummary[], bound: string): ConfidenceResult => {
        // 1. Determine expected days in range
        let expectedDays = 7;
        const now = new Date();

        if (bound === 'month') {
            expectedDays = now.getDate(); // Days so far this month
        } else if (bound === 'last-month') {
            // Get days in previous month
            const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            expectedDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        }

        // 2. Count distinct days with actual data (entries > 0)
        const daysWithData = summaries.filter(s => s.entry_count > 0).length;

        // 3. Calculate coverage ratio
        // Clamp expectedDays to at least 1 to avoid div/0
        const coverage = Math.min(daysWithData / Math.max(1, expectedDays), 1.0);

        // 4. Determine Level
        let level: ConfidenceLevel = 'Low';
        if (coverage >= 0.8) level = 'High';
        else if (coverage >= 0.5) level = 'Medium';

        // 5. Calm Label
        const label = `Data confidence: ${level}`;

        return { level, label, coverage };
    }
};
