import { ParsedSpend, SpendCategory, isInflow } from "./parser";
import { TemporalEngine } from "./temporal";
import { Money, MoneyEngine } from "./money";
import { NarrativeProvider, TemporalNarrative } from "./narrative";

export type CompletenessState = "full" | "partial";

export type DailyStats = {
    total: number; // Legacy
    money: Money;
    spends: ParsedSpend[];
    completeness: CompletenessState;
    sourceLimit?: number;
};

export type WeeklyStats = {
    total: number; // Legacy
    money: Money;
    spends: ParsedSpend[];
    breakdown: Record<SpendCategory, Money>;
    progress: number; // 0-100
    goal: number;
    completeness: CompletenessState;
    predictedTotal?: number; // Minor units
    comparisonPhrase?: string;
};

export interface AggregationOptions {
    isFullSet: boolean;
    fetchLimit?: number;
    today?: Date;
    activeCurrency?: string; // CurrencyCode (using string to avoid module cycle)
}

export function deriveDailyStats(
    allSpends: ParsedSpend[],
    options: AggregationOptions = { isFullSet: true }
): DailyStats {
    const { isFullSet, fetchLimit, today = new Date(), activeCurrency = "INR" } = options;
    const range = TemporalEngine.getTodayRange(today);

    const todaySpends = allSpends
        .filter((s) => TemporalEngine.isInRange(s.date, range))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    // Awareness HUD only shows spending (outflows)
    const outflows = todaySpends.filter(s => !isInflow(s));

    // CURRENCY AWARE SUM: Convert all outflows to active currency before summing
    const { exchangeProvider } = require("./exchange");
    const money = MoneyEngine.sumUniversal(
        outflows.map(s => s.money),
        activeCurrency as any,
        (from, to) => exchangeProvider.getRate(from, to)
    );

    const completeness = (!isFullSet && fetchLimit && todaySpends.length >= fetchLimit) ? "partial" : "full";

    return {
        total: MoneyEngine.getMajor(money),
        money,
        spends: outflows,
        completeness,
        sourceLimit: fetchLimit,
    };
}

export function deriveWeeklyStats(
    allSpends: ParsedSpend[],
    goal: number,
    options: AggregationOptions = { isFullSet: true }
): WeeklyStats {
    const { isFullSet, fetchLimit, today = new Date(), activeCurrency = "INR" } = options;
    const range = TemporalEngine.getThisWeekRange(today);

    const weekSpends = allSpends
        .filter((s) => TemporalEngine.isInRange(s.date, range))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    // Weekly metrics ignore inflows for spending pace
    const outflows = weekSpends.filter(s => !isInflow(s));

    // CURRENCY AWARE SUM
    const { exchangeProvider } = require("./exchange");
    const money = MoneyEngine.sumUniversal(
        outflows.map(s => s.money),
        activeCurrency as any,
        (from, to) => exchangeProvider.getRate(from, to)
    );

    const breakdown: Record<string, Money> = {};
    outflows.forEach((s) => {
        const current = breakdown[s.category] || MoneyEngine.fromMinor(0, activeCurrency as any);
        const convertedSpend = exchangeProvider.convert(s.money, activeCurrency as any);
        breakdown[s.category] = {
            amountMinor: current.amountMinor + convertedSpend.amountMinor,
            currency: activeCurrency as any
        };
    });

    const goalMoney = MoneyEngine.fromMajor(goal, activeCurrency as any);
    const progress = goalMoney.amountMinor > 0
        ? Math.max(0, (money.amountMinor / goalMoney.amountMinor) * 100)
        : (money.amountMinor > 0 ? 100 : 0);

    const completeness = (!isFullSet && fetchLimit && weekSpends.length >= fetchLimit) ? "partial" : "full";

    // --- PRO: PREDICTIVE RHYTHM ---
    let predictedTotal: number | undefined;
    let comparisonPhrase: string | undefined;

    const isCurrentWeek = TemporalEngine.isInRange(new Date(), range);
    if (isCurrentWeek && weekSpends.length >= 1) {
        const start = range.start;
        const now = today;
        const daysPassed = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        const remainingDays = Math.max(0, 7 - daysPassed);

        const averageDailyMinor = money.amountMinor / daysPassed;
        let rawPrediction = (averageDailyMinor * remainingDays) + money.amountMinor;

        // STABILITY: Early week (Days 1-2) predictions are wild. 
        // Dampen them by blending with the Weekly Goal (50/50 blend).
        if (daysPassed < 3) {
            const goalMinor = MoneyEngine.fromMajor(goal).amountMinor;
            // If goal is 0, just use raw
            if (goalMinor > 0) {
                rawPrediction = (rawPrediction * 0.5) + (goalMinor * 0.5);
            }
        }

        predictedTotal = Math.round(rawPrediction);

        // Multi-Week Comparison (Simple version using allSpends)
        const prevWeekRange = {
            start: new Date(range.start),
            end: new Date(range.start)
        };
        prevWeekRange.start.setDate(prevWeekRange.start.getDate() - 7);
        // prevWeekRange.end is effectively range.start

        const prevWeekSpends = allSpends.filter(s => s.date >= prevWeekRange.start && s.date < range.start && !isInflow(s));
        if (prevWeekSpends.length > 0) {
            const { exchangeProvider } = require("./exchange");
            const prevTotalMinor = MoneyEngine.sumUniversal(
                prevWeekSpends.map(s => s.money),
                activeCurrency as any,
                (from, to) => exchangeProvider.getRate(from, to)
            ).amountMinor;
            if (prevTotalMinor > 100) {
                // Compare pace: (today's pace * 7) vs last week's total
                const currentPaceTotal = averageDailyMinor * 7;
                const diff = currentPaceTotal - prevTotalMinor;
                const percent = Math.abs(Math.round((diff / prevTotalMinor) * 100));

                if (percent > 5 && daysPassed > 2) {
                    const status = diff > 0 ? "heavier" : "tighter";
                    comparisonPhrase = `This week is ~${percent}% ${status} than last week`;
                }
            }
        }
    }

    return {
        total: MoneyEngine.getMajor(money),
        money,
        spends: outflows,
        breakdown: breakdown as Record<SpendCategory, Money>,
        progress,
        goal,
        completeness,
        predictedTotal,
        comparisonPhrase
    };
}

export type NarrativeGroup = {
    label: TemporalNarrative;
    spends: ParsedSpend[];
};

export function deriveNarrativeHistory(allSpends: ParsedSpend[], today: Date = new Date()): NarrativeGroup[] {
    const groups: Record<string, ParsedSpend[]> = {};

    allSpends.forEach((spend) => {
        const label = NarrativeProvider.getTemporalLabel(spend.date, today);
        if (!groups[label]) groups[label] = [];
        groups[label].push(spend);
    });

    // Sort by chronological order of narrative
    const order: TemporalNarrative[] = [
        "Just now",
        "Earlier today",
        "Yesterday",
        "Earlier this week",
        "Last week",
        "Long ago"
    ];

    return order
        .filter(label => groups[label] && groups[label].length > 0)
        .map(label => ({
            label,
            spends: groups[label]
        }));
}

