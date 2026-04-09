import { ParsedSpend } from "./parser";
import { TemporalEngine } from "./temporal";
import { MoneyEngine } from "./money";
import { getInsightConfidence, InsightConfidenceLevel } from "./intelligence/confidence";
import { isInsightEligible } from "./intelligence/eligibility";

export const ANOMALY_THRESHOLD = 0.25;

export type AnomalyTier = "High" | "Moderate" | "Normal";

export interface DailyAnomaly {
    date: Date;
    totalSpend: number;
    rollingAverage: number;
    delta: number;
    tier: AnomalyTier;
    isAnomaly: boolean;
    confidenceScore: number;
    confidenceLevel: InsightConfidenceLevel;
    isEligible: boolean;
}

export interface CategoryDeviation {
    category: string;
    currentTotal: number;
    baselineTotal: number;
    delta: number;
    trend: "Rising" | "Falling" | "Steady";
    tier: "Strong" | "Moderate" | "Stable";
    confidenceScore: number;
    confidenceLevel: InsightConfidenceLevel;
    isEligible: boolean;
}

/**
 * Calculates the anomaly score for a specific date based on a 14-day rolling average.
 */
export function calculateRollingAnomaly(
    allSpends: ParsedSpend[],
    targetDate: Date,
    activeCurrency: string = "INR",
    threshold: number = ANOMALY_THRESHOLD
): DailyAnomaly {
    const { exchangeProvider } = require("./exchange");
    const targetDayRange = TemporalEngine.getTodayRange(targetDate);

    // 1. Calculate Target Day Total
    const targetSpends = allSpends.filter(s => TemporalEngine.isInRange(s.date, targetDayRange));
    const targetTotalMoney = MoneyEngine.sumUniversal(
        targetSpends.map(s => s.money),
        activeCurrency as any,
        (from, to) => exchangeProvider.getRate(from, to)
    );
    const targetTotal = MoneyEngine.getMajor(targetTotalMoney);

    // 2. Calculate Rolling 14-Day Average (excluding target date)
    // Lookback window: [targetDate - 14 days, targetDate - 1 day]
    const lookbackStart = new Date(targetDate);
    lookbackStart.setDate(lookbackStart.getDate() - 14);
    const lookbackEnd = new Date(targetDate);
    lookbackEnd.setDate(lookbackEnd.getDate() - 1);

    const lookbackRange = { start: lookbackStart, end: lookbackEnd };

    const historySpends = allSpends.filter(s => TemporalEngine.isInRange(s.date, lookbackRange));

    // Group by day to get daily totals (normalized to active currency)
    const dailyTotals: Record<string, number> = {};
    historySpends.forEach(s => {
        const d = s.date.toDateString();
        const converted = exchangeProvider.convert(s.money, activeCurrency as any);
        dailyTotals[d] = (dailyTotals[d] || 0) + MoneyEngine.getMajor(converted);
    });

    const historyTotal = Object.values(dailyTotals).reduce((a, b) => a + b, 0);

    // If less than 3 days of history, average is unreliable -> 0
    // Otherwise average over 14 days (or active days? User said "rolling 14 day average")
    // Usually rolling average implies sum / 14 if we assume 0 for missing days, OR sum / activeDays.
    // Let's use 14 to represent "daily capacity" over the period.
    const rollingAverage = historyTotal / 14;

    // 3. Calculate Delta
    // Guard: If average is 0, delta is 0 unless total > 0 (infinite?) -> cap at 1.0
    let delta = 0;
    if (rollingAverage > 0) {
        delta = (targetTotal - rollingAverage) / rollingAverage;
    } else if (targetTotal > 0) {
        delta = 1.0; // 100% increase from 0
    }

    const absDelta = Math.abs(delta);

    // 4. Determine Tier
    let tier: AnomalyTier = "Normal";
    if (absDelta >= threshold) {
        tier = "High";
    } else if (absDelta >= 0.10) {
        tier = "Moderate";
    }

    // 5. Confidence & Eligibility Check
    // sampleSize is how many days actually had spending in the history? Let's use 14 as baseline sample.
    const activeDays = Object.keys(dailyTotals).length;
    const confidence = getInsightConfidence(activeDays, 1.0 + delta, 0.2); // Volatility static for now
    const isEligible = isInsightEligible(confidence.score, 1.0 + delta, null); // Daily total implies no specific category

    return {
        date: targetDate,
        totalSpend: targetTotal,
        rollingAverage,
        delta,
        tier,
        isAnomaly: tier === "High" && isEligible, // Suppress noise!
        confidenceScore: confidence.score,
        confidenceLevel: confidence.level,
        isEligible
    };
}

/**
 * Calculates category deviation for the diagnostic cards.
 * Compares Current Week vs Previous 4-Week Average.
 */
export function calculateCategoryDeviation(
    allSpends: ParsedSpend[],
    category: string,
    activeCurrency: string = "INR"
): CategoryDeviation {
    const { exchangeProvider } = require("./exchange");
    const today = new Date();
    const thisWeekRange = TemporalEngine.getThisWeekRange(today);
    const past4WeeksRange = TemporalEngine.getPast4WeeksRange(today);

    // Current Week Total
    const currentSpends = allSpends.filter(s =>
        s.category === category && TemporalEngine.isInRange(s.date, thisWeekRange)
    );
    const currentTotalMoney = MoneyEngine.sumUniversal(
        currentSpends.map(s => s.money),
        activeCurrency as any,
        (from, to) => exchangeProvider.getRate(from, to)
    );
    const currentTotal = MoneyEngine.getMajor(currentTotalMoney);

    // Baseline (Avg of past 4 weeks)
    const baselineSpends = allSpends.filter(s =>
        s.category === category && TemporalEngine.isInRange(s.date, past4WeeksRange)
    );
    const baselineTotalMoney = MoneyEngine.sumUniversal(
        baselineSpends.map(s => s.money),
        activeCurrency as any,
        (from, to) => exchangeProvider.getRate(from, to)
    );
    const baselineSum = MoneyEngine.getMajor(baselineTotalMoney);
    const baselineAvg = baselineSum / 4;

    // Delta
    let delta = 0;
    if (baselineAvg > 0) {
        delta = (currentTotal - baselineAvg) / baselineAvg;
    } else if (currentTotal > 0) {
        delta = 1.0;
    }

    const absDelta = Math.abs(delta);

    // Trend & Tier
    let trend: "Rising" | "Falling" | "Steady" = "Steady";
    if (delta > 0.10) trend = "Rising";
    if (delta < -0.10) trend = "Falling";

    let tier: "Strong" | "Moderate" | "Stable" = "Stable";
    if (absDelta >= 0.20) tier = "Strong";
    else if (absDelta >= 0.10) tier = "Moderate";

    // Confidence & Eligibility
    // Count distinct weeks with spending for this category in baseline
    const distinctBaselineDays = new Set(baselineSpends.map(s => s.date.toDateString())).size;
    // We treat distinct days as the sample size for this calculation
    const confidence = getInsightConfidence(distinctBaselineDays, 1.0 + delta, 0.2);
    const isEligible = isInsightEligible(confidence.score, 1.0 + delta, category);

    return {
        category,
        currentTotal,
        baselineTotal: baselineAvg,
        delta,
        trend,
        tier,
        confidenceScore: confidence.score,
        confidenceLevel: confidence.level,
        isEligible
    };
}
