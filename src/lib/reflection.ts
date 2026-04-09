import { UserMemory } from "./memory";
import { ParsedSpend } from "./parser";
import { TemporalEngine } from "./temporal";
import { MoneyEngine } from "./money";

export type WeeklyReflection = {
    id: string;
    weekId: string; // e.g., "2023-W42"
    title: string;
    message: string;
    generatedAt: string;
    isViewed: boolean;
};

export function generateReflection(
    memories: UserMemory[],
    spends: ParsedSpend[],
    existingReflections: WeeklyReflection[],
    pivotDate: Date = new Date()
): WeeklyReflection | null {
    const weekId = TemporalEngine.getCurrentWeekId(pivotDate);

    // 1. Check if reflection already exists for this week
    const hasReflection = existingReflections.some(r => r.weekId === weekId);
    if (hasReflection) return null;

    // 2. Find strongest memory
    const strongestMemory = memories.reduce((prev, current) => {
        return (prev.confidence > current.confidence) ? prev : current;
    }, memories[0]);

    if (!strongestMemory || strongestMemory.confidence < 0.5) return null; // Need higher confidence for stability

    // 3. Generate Message based on Memory Type
    let title = "Weekly Pattern";
    let message = "";

    // Calculate total spend this week for context
    const range = TemporalEngine.getThisWeekRange(pivotDate);
    const weeklySpends = spends.filter(s => TemporalEngine.isInRange(s.date, range));
    const { exchangeProvider } = require("./exchange");
    const activeCurrency = "INR";
    const totalWeeklyMoney = MoneyEngine.sumUniversal(
        weeklySpends.map(s => s.money),
        activeCurrency as any,
        (from, to) => exchangeProvider.getRate(from, to)
    );

    switch (strongestMemory.type) {
        case "late-night":
            title = "Night Owl Spending";
            message = `Over the past few weeks, we've noticed some later-than-usual activity. Is this a new habit forming?`;
            break;
        case "category-dominance":
            title = "Focused Spending";
            message = `${strongestMemory.description.replace("heavily dominated by", "focused on")} Roughly ${MoneyEngine.format(totalWeeklyMoney)} went to this recently. Does this align with your priorities?`;
            break;
        case "budget-drift":
            title = "Pace Check";
            message = `Recently, your spending pace has been trending slightly higher than usual. What's one small adjustment you could make?`;
            break;
        default:
            return null;
    }

    return {
        id: crypto.randomUUID(),
        weekId,
        title,
        message,
        generatedAt: new Date().toISOString(),
        isViewed: false
    };
}

