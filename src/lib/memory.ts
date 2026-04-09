import { ParsedSpend, SpendCategory, isInflow } from "./parser";
import { MoneyEngine } from "./money";
import { NarrativeProvider } from "./narrative";
import { TemporalEngine } from "./temporal";

export type UserMemory = {
    id: string;
    type: "late-night" | "category-dominance" | "budget-drift";
    occurrences: number;
    confidence: number;
    lastSeen: string; // ISO string
    description: string;
    metadata?: Record<string, unknown>;
};

const CONFIDENCE_STEP = 0.05;
const MAX_CONFIDENCE = 1.0;

/**
 * Detects behavioral patterns in spends and updates memory state.
 * Memory confidence increases slowly with each new occurrence.
 */
export function processMemories(
    spends: ParsedSpend[],
    weeklyGoal: number,
    existingMemories: UserMemory[],
    pivotDate: Date = new Date()
): UserMemory[] {
    const updatedMemories = [...existingMemories];
    const now = pivotDate;

    // Helper to find or create a memory
    const getOrInitMemory = (id: string, type: UserMemory["type"], description: string): UserMemory => {
        const existing = updatedMemories.find((m) => m.id === id);
        if (existing) return existing;

        const newMem: UserMemory = {
            id,
            type,
            occurrences: 0,
            confidence: 0,
            lastSeen: now.toISOString(),
            description
        };
        updatedMemories.push(newMem);
        return newMem;
    };

    const updateMemory = (mem: UserMemory) => {
        mem.occurrences += 1;
        mem.confidence = Math.min(MAX_CONFIDENCE, parseFloat((mem.confidence + CONFIDENCE_STEP).toFixed(2)));
        mem.lastSeen = now.toISOString();
    };

    // 1. Late-night spending
    // Only consider outflows for late-night spending
    const latestOutflow = spends.find(s => !isInflow(s));
    if (latestOutflow && NarrativeProvider.isLateNight(latestOutflow.date)) {
        const mem = getOrInitMemory("late-night-spender", "late-night", "You tend to spend money late at night.");
        updateMemory(mem);
    }

    // 2. Category dominance (one category > 40% weekly spend)
    const thisWeekRange = TemporalEngine.getThisWeekRange(now);
    const weeklySpends = spends.filter(s => TemporalEngine.isInRange(s.date, thisWeekRange) && !isInflow(s));
    
    const { exchangeProvider } = require("./exchange");
    const activeCurrency = "INR"; // Default or passed via context
    
    const totalWeeklyMoney = MoneyEngine.sumUniversal(
        weeklySpends.map(s => s.money),
        activeCurrency as any,
        (from, to) => exchangeProvider.getRate(from, to)
    );

    if (totalWeeklyMoney.amountMinor > 0) {
        const categoryTotalsMinor: Record<string, number> = {};
        weeklySpends.forEach(s => {
            const converted = exchangeProvider.convert(s.money, activeCurrency as any);
            categoryTotalsMinor[s.category] = (categoryTotalsMinor[s.category] || 0) + converted.amountMinor;
        });

        Object.entries(categoryTotalsMinor).forEach(([cat, amountMinor]) => {
            if (amountMinor / totalWeeklyMoney.amountMinor > 0.4) {
                const memId = `dominant-category-${cat}`;
                const mem = getOrInitMemory(memId, "category-dominance", `Your spending is heavily dominated by ${cat}.`);
                updateMemory(mem);
            }
        });
    }

    // 3. Budget drift (overspend after day N of week)
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 1 to 7
    const expectedSpendLimitMinor = Math.round((dayOfWeek / 7) * MoneyEngine.fromMajor(weeklyGoal).amountMinor);

    if (totalWeeklyMoney.amountMinor > expectedSpendLimitMinor) {
        const mem = getOrInitMemory("budget-drifter", "budget-drift", "You're spending faster than your weekly pace.");
        updateMemory(mem);
    }

    return updatedMemories;
}

