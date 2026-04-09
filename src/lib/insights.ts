import { ParsedSpend, SpendCategory, isInflow } from "./parser";
import { TemporalEngine } from "./temporal";
import { MoneyEngine } from "./money";
import { logWarn } from "./log";

/**
 * INSIGHT ENGINE
 * 
 * This module computes weekly-rolling insights from spend data.
 * These insights power the two card-flip components on the home page.
 * 
 * Design Philosophy:
 * - Calm, observational tone (never judgmental)
 * - Graceful zero-states (no blank cards)
 * - Rolling 4-week baseline for historical context
 * - Relative Confidence instead of hard suppression
 */

export type TodayVsUsualInsight = {
    hasData: boolean;
    insight: RollingBaselineInsight | null;
    zeroStateMessage?: string;
};

export type RollingBaselineInsight = {
    message: string;
    category: SpendCategory | string;
    delta: number;
    confidence_level: "strong" | "moderate" | "stable";
    badge_color: string; // Map to: Accent (Strong), Neutral (Moderate), Soft Gray (Stable)
};

export type RecentChangesInsight = {
    hasData: boolean;
    insights: RollingBaselineInsight[];
    zeroStateMessage?: string;
};

// --- CACHE FOR DAILY ---
const dailyInsightsCache = new WeakMap<ParsedSpend[], TodayVsUsualInsight>();

/**
 * computeTodayVsUsual: High-resolution awareness of today's deviation.
 * Replaces hard suppression with relative confidence.
 */
export async function computeTodayVsUsual(allSpends: ParsedSpend[]): Promise<TodayVsUsualInsight> {
    if (dailyInsightsCache.has(allSpends)) {
        return dailyInsightsCache.get(allSpends)!;
    }

    // PERFORMANCE GUARDRAIL
    const MAX_CLIENT_TRANSACTIONS = 5000;
    let processedSpends = allSpends;
    if (allSpends.length > MAX_CLIENT_TRANSACTIONS) {
        logWarn(`Transaction history exceeds client-side cap (${allSpends.length}/${MAX_CLIENT_TRANSACTIONS})`, {
            module: 'insights',
            action: 'performance_cap',
            count: allSpends.length,
            cap: MAX_CLIENT_TRANSACTIONS,
        });
        processedSpends = allSpends.slice(-MAX_CLIENT_TRANSACTIONS);
    }

    const today = new Date();
    const todayRange = TemporalEngine.getTodayRange(today);
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

    // 1. Isolate Today's Outflows
    const todaySpends = processedSpends.filter(s => TemporalEngine.isInRange(s.date, todayRange) && !isInflow(s));
    const { exchangeProvider } = require("./exchange");
    const activeCurrency = "INR"; // Default or context-passed
    const todayTotalMoney = MoneyEngine.sumUniversal(
        todaySpends.map(s => s.money),
        activeCurrency as any,
        (from, to) => exchangeProvider.getRate(from, to)
    );
    const todayTotal = MoneyEngine.getMajor(todayTotalMoney);

    // 2. Identify "Usual" (Last 4 weeks of this specific day of week, outflows only)
    const history = processedSpends.filter(s => !TemporalEngine.isInRange(s.date, todayRange) && !isInflow(s));
    const sameDayHistory = history.filter(s => s.date.toLocaleDateString('en-US', { weekday: 'long' }) === dayOfWeek);

    const dailyTotals: Record<string, number> = {};
    sameDayHistory.forEach(s => {
        const d = s.date.toDateString();
        const converted = exchangeProvider.convert(s.money, activeCurrency as any);
        dailyTotals[d] = (dailyTotals[d] || 0) + MoneyEngine.getMajor(converted);
    });

    const uniqueDays = Object.keys(dailyTotals).length;
    const usualTotal = uniqueDays > 0
        ? Object.values(dailyTotals).reduce((a, b) => a + b, 0) / uniqueDays
        : 0;

    // Zero-Guard
    if (usualTotal === 0 && todayTotal === 0) {
        const result: TodayVsUsualInsight = {
            hasData: false,
            insight: null,
            zeroStateMessage: uniqueDays < 2 ? "Observing your patterns..." : "Insufficient Baseline"
        };
        dailyInsightsCache.set(allSpends, result);
        return result;
    }

    // 3. Compute Delta
    const delta = usualTotal === 0 ? 1.0 : (todayTotal - usualTotal) / usualTotal;
    const absDelta = Math.abs(delta);

    // 4. Confidence Classification
    let confidence_level: "strong" | "moderate" | "stable";
    let badge_color: string;

    if (absDelta >= 0.20) {
        confidence_level = "strong";
        badge_color = "#4A5D4E"; // Brand Moss
    } else if (absDelta >= 0.10) {
        confidence_level = "moderate";
        badge_color = "#8FA18F"; // Brand Sage
    } else {
        confidence_level = "stable";
        badge_color = "#C2CDBE"; // Brand Lichen
    }

    // 5. Narrative Emission
    let message = "";
    const direction = delta > 0 ? "increased" : "decreased";
    const pct = Math.round(absDelta * 100);

    if (confidence_level === "strong") {
        message = `Today's spending ${direction} ${pct}% vs your typical ${dayOfWeek}.`;
    } else if (confidence_level === "moderate") {
        const level = delta > 0 ? "above" : "below";
        message = `Spending today slightly ${level} your normal ${dayOfWeek} pattern.`;
    } else {
        message = `Spending pattern remains stable this ${dayOfWeek}.`;
    }

    const insight: RollingBaselineInsight = {
        message,
        category: "Overall",
        delta,
        confidence_level,
        badge_color
    };

    const result: TodayVsUsualInsight = {
        hasData: true,
        insight
    };

    dailyInsightsCache.set(allSpends, result);
    return result;
}

// --- MEMOIZATION CACHE ---
const insightsCache = new WeakMap<ParsedSpend[], RecentChangesInsight>();

/**
 * computeRecentChanges: Trend momentum and behavioral shifts using a 4-week rolling baseline.
 * Replaces "Hard Suppression" with "Relative Confidence".
 */
export function computeRecentChanges(allSpends: ParsedSpend[]): RecentChangesInsight {
    // 0. Cache Check
    if (insightsCache.has(allSpends)) {
        return insightsCache.get(allSpends)!;
    }

    // PERFORMANCE GUARDRAIL
    const MAX_CLIENT_TRANSACTIONS = 5000;
    let processedSpends = allSpends;
    if (allSpends.length > MAX_CLIENT_TRANSACTIONS) {
        logWarn(`Transaction history exceeds client-side cap for recent changes (${allSpends.length})`, {
            module: 'insights',
            action: 'performance_cap',
            count: allSpends.length,
        });
        processedSpends = allSpends.slice(-MAX_CLIENT_TRANSACTIONS);
    }

    const today = new Date();
    const thisWeekRange = TemporalEngine.getThisWeekRange(today);
    const past4WeeksRange = TemporalEngine.getPast4WeeksRange(today);
    const { exchangeProvider } = require("./exchange");
    const activeCurrency = "INR";

    // 1. Isolate Current Week and Baseline (Past 4 Weeks) - Outflows only
    const currentWeekSpends = processedSpends.filter(s => TemporalEngine.isInRange(s.date, thisWeekRange) && !isInflow(s));
    const baselineSpends = processedSpends.filter(s => TemporalEngine.isInRange(s.date, past4WeeksRange) && !isInflow(s));

    // 2. Identify Categories
    const categories = Array.from(new Set([
        ...currentWeekSpends.map(s => s.category),
        ...baselineSpends.map(s => s.category)
    ]));

    if (baselineSpends.length === 0) {
        const result: RecentChangesInsight = {
            hasData: false,
            insights: [],
            zeroStateMessage: "Insufficient Baseline"
        };
        insightsCache.set(allSpends, result);
        return result;
    }

    // 3. Compute Comparative Math
    const currentTotals: Record<string, number> = {};
    const baselineTotals: Record<string, number> = {};

    currentWeekSpends.forEach(s => {
        const converted = exchangeProvider.convert(s.money, activeCurrency as any);
        currentTotals[s.category] = (currentTotals[s.category] || 0) + MoneyEngine.getMajor(converted);
    });
    baselineSpends.forEach(s => {
        const converted = exchangeProvider.convert(s.money, activeCurrency as any);
        baselineTotals[s.category] = (baselineTotals[s.category] || 0) + MoneyEngine.getMajor(converted);
    });

    const rawInsights = categories.map((cat): RollingBaselineInsight | null => {
        const current = currentTotals[cat] || 0;
        const baselineTotal = baselineTotals[cat] || 0;
        const baselineAvg = baselineTotal / 4; // Average of previous 4 weeks

        // Zero-Guard
        if (baselineAvg === 0) {
            return null;
        }

        const delta = (current - baselineAvg) / baselineAvg;
        // 4. Confidence Classification
        let confidence_level: "strong" | "moderate" | "stable";
        let badge_color: string;

        if (delta >= 0.20) {
            confidence_level = "strong";
            badge_color = "#991B1B"; // Red-800 for high burn
        } else if (delta >= 0.10) {
            confidence_level = "moderate";
            badge_color = "#92400E"; // Amber-800 for moderate burn
        } else if (delta <= -0.10) {
            confidence_level = "moderate";
            badge_color = "#166534"; // Green-800 for savings
        } else {
            confidence_level = "stable";
            badge_color = "#C2CDBE"; // Brand Lichen for stable
        }

        // 5. Narrative Emission (Linguistic Calm)
        let message = "";
        const displayCat = cat.charAt(0).toUpperCase() + cat.slice(1);

        // Conversational expressions
        const toLaymanExpression = (cat: string, delta: number, confidence: string) => {
            const isUp = delta > 0;

            if (confidence === "strong") {
                return isUp
                    ? `Big jump in ${cat} spending lately.`
                    : `You spent much less on ${cat} recently.`;
            } else if (confidence === "moderate") {
                return isUp
                    ? `${cat} spending is up slightly.`
                    : `You've cut back on ${cat} a bit.`;
            }
            return `${cat} expenses are about the same as usual.`;
        };

        message = toLaymanExpression(displayCat, delta, confidence_level);

        return {
            message,
            category: cat,
            delta,
            confidence_level,
            badge_color
        };
    }).filter((i): i is RollingBaselineInsight => i !== null);

    // 6. Guarantee Output: Never return an empty insight array
    let finalInsights = rawInsights;
    if (finalInsights.length === 0 || !finalInsights.some(i => i.confidence_level !== "stable")) {
        // If no strong/moderate insights, or no insights at all, find the top category and mark as stable
        const topCat = categories.sort((a, b) => (currentTotals[b] || 0) - (currentTotals[a] || 0))[0];
        const displayTopCat = topCat ? topCat.charAt(0).toUpperCase() + topCat.slice(1) : "General";

        if (topCat) {
            const current = currentTotals[topCat] || 0;
            const baselineTotal = baselineTotals[topCat] || 0;
            const baselineAvg = baselineTotal / 4;
            const delta = baselineAvg > 0 ? (current - baselineAvg) / baselineAvg : 0;

            finalInsights = [{
                message: `Your ${displayTopCat.toLowerCase()} rhythm is very consistent right now.`,
                category: topCat,
                delta,
                confidence_level: "stable",
                badge_color: "#C2CDBE"
            }];
        } else {
            finalInsights = [{
                message: "Your spending rhythm is very consistent right now.",
                category: "General",
                delta: 0,
                confidence_level: "stable",
                badge_color: "#C2CDBE"
            }];
        }
    }

    // Sort: Strong -> Moderate -> Stable
    const order = { strong: 0, moderate: 1, stable: 2 };
    finalInsights.sort((a, b) => order[a.confidence_level] - order[b.confidence_level]);

    const result: RecentChangesInsight = {
        hasData: finalInsights.length > 0,
        insights: finalInsights.slice(0, 3) // Cap at 3 for UI
    };

    insightsCache.set(allSpends, result);
    return result;
}
