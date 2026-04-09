import { ParsedSpend, isInflow } from "./parser";
import { TemporalEngine } from "./temporal";
import { Money, MoneyEngine } from "./money";

export type DailySummary = {
    date: string;
    user_id?: string;
    total_amount: number; // Legacy
    money: Money;
    entry_count: number;
    category_breakdown: Record<string, number>; // Legacy
    category_money: Record<string, Money>;
};

export type WeeklyMetrics = {
    weeklyTotal: number; // Legacy
    weeklyMoney: Money;
    previousWeeklyTotal: number; // Legacy
    previousWeeklyMoney: Money;
    wowMomentum: number | "New";
    categoryFocus: { category: string; amount: number; money: Money }[];
    activityAverage: number;
    activityAverageMoney: Money;
    totalAmount: number; // Legacy
    totalMoney: Money;
    completeness: "full" | "partial";
};

/**
 * Helper to convert raw ParsedSpend array into DailySummary format for consistent processing.
 */
export function convertSpendsToSummaries(
    spends: ParsedSpend[],
    activeCurrency: string = "INR"
): DailySummary[] {
    const { exchangeProvider } = require("./exchange");
    const map: Record<string, DailySummary> = {};

    spends.forEach(s => {
        // Only include outflows (spending) in summarized metrics and volumes.
        // Inflows are part of Pro user criteria and relative only to Horizon/Cashflow.
        if (isInflow(s)) return;

        const dateStr = TemporalEngine.getLocalDateString(s.date);
        if (!map[dateStr]) {
            map[dateStr] = {
                date: dateStr,
                total_amount: 0,
                money: MoneyEngine.fromMinor(0, activeCurrency as any),
                entry_count: 0,
                category_breakdown: {},
                category_money: {}
            };
        }

        const convertedMoney = exchangeProvider.convert(s.money, activeCurrency as any);
        map[dateStr].money = {
            amountMinor: map[dateStr].money.amountMinor + convertedMoney.amountMinor,
            currency: activeCurrency as any
        };
        map[dateStr].total_amount = MoneyEngine.getMajor(map[dateStr].money);
        map[dateStr].entry_count += 1;

        const catMoney = map[dateStr].category_money[s.category] || MoneyEngine.fromMinor(0, activeCurrency as any);
        map[dateStr].category_money[s.category] = {
            amountMinor: catMoney.amountMinor + convertedMoney.amountMinor,
            currency: activeCurrency as any
        };
        map[dateStr].category_breakdown[s.category] = MoneyEngine.getMajor(map[dateStr].category_money[s.category]);
    });

    return Object.values(map);
}

/**
 * Computes MVP metrics from daily summary records.
 */
export function computeWeeklyMetrics(
    summaries: DailySummary[],
    options: { pivotDate?: Date; fetchLimit?: number; isFullSet?: boolean; activeCurrency?: string } = {}
): WeeklyMetrics {
    const { pivotDate = new Date(), fetchLimit, isFullSet = true, activeCurrency = "INR" } = options;
    const { exchangeProvider } = require("./exchange");
    const currentWeekRange = TemporalEngine.getThisWeekRange(pivotDate);
    const previousWeekRange = TemporalEngine.getLastWeekRange(pivotDate);

    // 1. Filter Summaries
    const currentWeekSummaries = summaries.filter(s => {
        const d = new Date(s.date);
        return TemporalEngine.isInRange(d, currentWeekRange);
    });

    const previousWeekSummaries = summaries.filter(s => {
        const d = new Date(s.date);
        return TemporalEngine.isInRange(d, previousWeekRange);
    });

    // 2. Weekly Totals
    const weeklyMoney = MoneyEngine.sumUniversal(
        currentWeekSummaries.map(s => s.money),
        activeCurrency as any,
        (from, to) => exchangeProvider.getRate(from, to)
    );
    const previousWeeklyMoney = MoneyEngine.sumUniversal(
        previousWeekSummaries.map(s => s.money),
        activeCurrency as any,
        (from, to) => exchangeProvider.getRate(from, to)
    );

    // 3. WoW Momentum
    const weeklyTotalMinor = weeklyMoney.amountMinor;
    const previousWeeklyTotalMinor = previousWeeklyMoney.amountMinor;

    const wowMomentum: number | "New" = previousWeeklyTotalMinor === 0
        ? (weeklyTotalMinor > 0 ? "New" : 0)
        : Math.round(((weeklyTotalMinor - previousWeeklyTotalMinor) / previousWeeklyTotalMinor) * 100);

    // 4. Category Focus (Top 3)
    const categoryAgg: Record<string, Money> = {};
    currentWeekSummaries.forEach(s => {
        Object.entries(s.category_money || {}).forEach(([cat, money]) => {
            const current = categoryAgg[cat] || MoneyEngine.fromMinor(0, activeCurrency as any);
            const converted = exchangeProvider.convert(money, activeCurrency as any);
            categoryAgg[cat] = {
                amountMinor: current.amountMinor + converted.amountMinor,
                currency: activeCurrency as any
            };
        });
    });

    const categoryFocus = Object.entries(categoryAgg)
        .map(([category, money]) => ({ category, amount: MoneyEngine.getMajor(money), money }))
        .sort((a, b) => b.money.amountMinor - a.money.amountMinor)
        .slice(0, 3);

    // 5. Activity Average
    const activeDays = currentWeekSummaries.filter(s => s.entry_count > 0);
    const activityAverageMoney = activeDays.length > 0
        ? MoneyEngine.fromMinor(
            Math.round(weeklyMoney.amountMinor / activeDays.length),
            activeCurrency as any
        )
        : MoneyEngine.fromMinor(0, activeCurrency as any);

    // 6. Total Amount
    const totalMoney = MoneyEngine.sumUniversal(
        summaries.map(s => s.money),
        activeCurrency as any,
        (from, to) => exchangeProvider.getRate(from, to)
    );

    // 7. Completeness Awareness
    let completeness: "full" | "partial" = "full";
    if (!isFullSet && fetchLimit) {
        // If the number of summaries matches the potential limit of objectsfetched from DB
        // we might have more data. This is a heuristic.
        if (summaries.length >= fetchLimit) completeness = "partial";
    }

    return {
        weeklyTotal: MoneyEngine.getMajor(weeklyMoney),
        weeklyMoney,
        previousWeeklyTotal: MoneyEngine.getMajor(previousWeeklyMoney),
        previousWeeklyMoney,
        wowMomentum,
        categoryFocus,
        activityAverage: MoneyEngine.getMajor(activityAverageMoney),
        activityAverageMoney,
        totalAmount: MoneyEngine.getMajor(totalMoney),
        totalMoney,
        completeness
    };
}

