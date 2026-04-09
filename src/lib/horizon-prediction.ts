/**
 * HorizonPrediction: State-of-the-art predictive financial engine.
 *
 * - Velocity Check: Predicts if a budget will be breached by month-end
 *   based on current spending pace.
 * - 12-Week Projection: Uses historical "rhythm" from daily summaries
 *   to forecast future weekly balances.
 */

import { ParsedSpend, isInflow } from "./parser";
import { TemporalEngine } from "./temporal";
import { MoneyEngine } from "./money";

// ─── Shared Types ────────────────────────────────────────────────────────────

export interface RecurrentSpend {
    id: string;
    name: string;
    amount: number; // major unit
    category: string;
    frequency: 'monthly' | 'weekly' | 'yearly';
    is_active: boolean;
    startDate: string; // ISO date string
    months?: number; // Optional for prediction logic
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BudgetVelocityCheck {
    category: string;
    budget: number;
    spentToDate: number;
    spentPercent: number;
    projectedTotal: number;
    projectedPercent: number;
    /** "safe" | "caution" | "breach" */
    status: "safe" | "caution" | "breach";
    daysElapsed: number;
    daysInMonth: number;
    daysRemaining: number;
    willBreach: boolean;
}

export interface WeekProjection {
    weekLabel: string;       // e.g. "W1", "W2" …
    weekStart: Date;
    projectedSpend: number;
    projectedBalance: number | null; // null if no income set
}

export interface HorizonForecast {
    weeks: WeekProjection[];
    avgWeeklySpend: number;
    confidenceLevel: "high" | "medium" | "low";
    baselineDays: number;
}

// ─── Semantic Status Helper ───────────────────────────────────────────────────

export function getBudgetStatus(
    spentPercent: number
): "safe" | "caution" | "breach" {
    if (spentPercent >= 90) return "breach";
    if (spentPercent >= 70) return "caution";
    return "safe";
}

// ─── Velocity Check ──────────────────────────────────────────────────────────

/**
 * For a given category + monthly budget, compute whether the user is on pace
 * to exceed the limit before month-end.
 *
 * @param spends       All historical spend entries.
 * @param category     The spend category to evaluate.
 * @param budget       Monthly budget cap for this category.
 */
export function computeBudgetVelocity(
    spends: ParsedSpend[],
    category: string,
    budget: number
): BudgetVelocityCheck {
    const today = new Date();
    const monthRange = TemporalEngine.getThisMonthRange(today);

    // Days in this month
    const daysInMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
    ).getDate();

    const daysElapsed = today.getDate();
    const daysRemaining = daysInMonth - daysElapsed;

    // Actual spend so far this month for this category
    const monthSpends = spends.filter(
        (s) =>
            s.category === category &&
            TemporalEngine.isInRange(s.date, monthRange)
    );
    const { exchangeProvider } = require("./exchange");
    const activeCurrency = "INR";
    const spentMoney = MoneyEngine.sumUniversal(
        monthSpends.map((s) => s.money),
        activeCurrency as any,
        (from, to) => exchangeProvider.getRate(from, to)
    );
    const spentToDate = MoneyEngine.getMajor(spentMoney);

    // Current daily rate
    const dailyRate = daysElapsed > 0 ? spentToDate / daysElapsed : 0;

    // Projected month-end total using current burn rate
    const projectedTotal = spentToDate + dailyRate * daysRemaining;

    const spentPercent = budget > 0 ? (spentToDate / budget) * 100 : 0;
    const projectedPercent = budget > 0 ? (projectedTotal / budget) * 100 : 0;
    const status = getBudgetStatus(spentPercent);

    return {
        category,
        budget,
        spentToDate,
        spentPercent,
        projectedTotal,
        projectedPercent,
        status,
        daysElapsed,
        daysInMonth,
        daysRemaining,
        willBreach: projectedTotal > budget,
    };
}

// ─── 12-Week Projection ───────────────────────────────────────────────────────

/**
 * Projects spending over the next 12 weeks using a rolling 8-week
 * baseline from historical data. Confidence degrades the less history exists.
 *
 * @param spends       All historical spend entries.
 * @param recurrentSpends Optional planned recurrent spends.
 * @param monthlyIncome Optional income figure for balance projection.
 */
export function computeHorizonForecast(
    spends: ParsedSpend[],
    recurrentSpends: RecurrentSpend[] = [],
    monthlyIncome?: number
): HorizonForecast {
    const today = new Date();

    // Build 8-week baseline of weekly totals
    const baselineWeeks = 8;
    const weeklyTotals: number[] = [];

    for (let i = 1; i <= baselineWeeks; i++) {
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() - (i - 1) * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 7);

        const weekSpends = spends.filter((s) =>
            !isInflow(s) && TemporalEngine.isInRange(s.date, { start: weekStart, end: weekEnd })
        );
        const { exchangeProvider } = require("./exchange");
        const activeCurrency = "INR";
        const weekMoney = MoneyEngine.sumUniversal(
            weekSpends.map((s) => s.money),
            activeCurrency as any,
            (from, to) => exchangeProvider.getRate(from, to)
        );
        const weekTotal = MoneyEngine.getMajor(weekMoney);
        weeklyTotals.push(weekTotal);
    }

    const nonZeroWeeks = weeklyTotals.filter((t) => t > 0).length;
    const avgWeeklySpend =
        weeklyTotals.reduce((a, b) => a + b, 0) / Math.max(nonZeroWeeks, 1);

    // Confidence levels
    let confidenceLevel: "high" | "medium" | "low" = "low";
    if (nonZeroWeeks >= 6) confidenceLevel = "high";
    else if (nonZeroWeeks >= 3) confidenceLevel = "medium";

    // Weekly income (to compute balance)
    const weeklyIncome = monthlyIncome ? (monthlyIncome * 12) / 52 : undefined;

    // Project 12 future weeks
    const weeks: WeekProjection[] = [];
    let runningBalance = 0;

    for (let i = 0; i < 12; i++) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() + i * 7);

        // Recurrent Spends Logic: 
        // We add recurrent spends if they fall within the 12-week window.
        // For simplicity, we assume recurring items happen once a month.
        // We add them to the week where their "monthly anniversary" falls.
        let recurrentAmountThisWeek = 0;
        recurrentSpends.forEach(rs => {
            const start = new Date(rs.startDate);
            const monthsCovered = rs.months ?? 1;

            // For each month covered, check if it falls in this week
            for (let m = 0; m < monthsCovered; m++) {
                const recurrenceDate = new Date(start);
                recurrenceDate.setMonth(start.getMonth() + m);

                // If the recurrence date is within this week
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 7);

                if (recurrenceDate >= weekStart && recurrenceDate < weekEnd) {
                    recurrentAmountThisWeek += rs.amount;
                }
            }
        });

        const projectedSpend = avgWeeklySpend + recurrentAmountThisWeek;

        let projectedBalance: number | null = null;
        if (weeklyIncome !== undefined) {
            runningBalance += weeklyIncome - projectedSpend;
            projectedBalance = runningBalance;
        }

        weeks.push({
            weekLabel: `W${i + 1}`,
            weekStart,
            projectedSpend,
            projectedBalance,
        });
    }

    return {
        weeks,
        avgWeeklySpend,
        confidenceLevel,
        baselineDays: nonZeroWeeks * 7,
    };
}
