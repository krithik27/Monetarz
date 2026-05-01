/**
 * CSV Export Utility — Monetarz
 * Generates a comprehensive CSV of the previous month's data including:
 * spends, income sources, savings goals, recurrent spends, and category budgets.
 */

import { ParsedSpend } from "@/lib/parser";
import { IncomeSource, SavingsGoal } from "@/context/SpendsContext";
import { RecurrentSpend } from "@/lib/horizon-prediction";
import { formatAmount } from "@/lib/money";

function escapeCsv(value: string | number | undefined | null): string {
    const str = String(value ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function row(...cells: (string | number | undefined | null)[]): string {
    return cells.map(escapeCsv).join(",");
}

export function generateMonthlyCSV(params: {
    month: string; // "YYYY-MM"
    spends: ParsedSpend[];
    incomeSources: IncomeSource[];
    goals: SavingsGoal[];
    recurrentSpends: RecurrentSpend[];
    categoryBudgets: Record<string, number>;
    currency: string;
}): string {
    const { month, spends, incomeSources, goals, recurrentSpends, categoryBudgets, currency } = params;
    const [year, monthNum] = month.split("-").map(Number);
    const monthName = new Date(year, monthNum - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });

    const sections: string[] = [];

    // ── Header ──────────────────────────────────────────────────────────────
    sections.push(`MONETARZ — MONTHLY DATA EXPORT`);
    sections.push(`Month: ${monthName}`);
    sections.push(`Exported: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}`);
    sections.push(`Currency: ${currency}`);
    sections.push("");

    // ── Section 1: Journal Entries ──────────────────────────────────────────
    const monthSpends = spends.filter(s => {
        const d = new Date(s.date);
        return d.getFullYear() === year && d.getMonth() + 1 === monthNum;
    });

    sections.push("=== JOURNAL ENTRIES ===");
    sections.push(row("Date", "Description", "Category", "Amount", "Currency", "Confidence", "Type"));
    monthSpends.forEach(s => {
        sections.push(row(
            new Date(s.date).toLocaleDateString("en-IN"),
            s.description,
            s.category,
            s.amount,
            s.currency || currency,
            Math.round((s.confidence || 1) * 100) + "%",
            s.category === "income" || s.category === "salary" ? "Inflow" : "Outflow"
        ));
    });
    sections.push(`Total entries: ${monthSpends.length}`);
    const totalOutflow = monthSpends
        .filter(s => s.category !== "income" && s.category !== "salary")
        .reduce((sum, s) => sum + s.amount, 0);
    const totalInflow = monthSpends
        .filter(s => s.category === "income" || s.category === "salary")
        .reduce((sum, s) => sum + s.amount, 0);
    sections.push(row("Total Outflow", totalOutflow, currency));
    sections.push(row("Total Inflow", totalInflow, currency));
    sections.push("");

    // ── Section 2: Income Sources (this month) ──────────────────────────────
    sections.push("=== INCOME WALLET (REGISTERED SOURCES) ===");
    sections.push(row("Name", "Monthly Amount", "Expected Day of Month", "Billing Month"));
    const monthSources = incomeSources.filter(s => !s.billingMonth || s.billingMonth === month);
    monthSources.forEach(s => {
        sections.push(row(s.name, s.amount, s.dayOfMonth ?? 1, s.billingMonth ?? month));
    });
    sections.push(row("Total Projected Income", monthSources.reduce((sum, s) => sum + s.amount, 0), currency));
    sections.push("");

    // ── Section 3: Savings Goals ────────────────────────────────────────────
    sections.push("=== SAVINGS GOALS ===");
    sections.push(row("Goal", "Target Amount", "Saved Amount", "Progress %", "Deadline", "Status"));
    goals.forEach(g => {
        const pct = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0;
        sections.push(row(
            g.name,
            g.targetAmount,
            g.savedAmount,
            pct + "%",
            g.deadline ? new Date(g.deadline).toLocaleDateString("en-IN") : "None",
            pct >= 100 ? "Achieved ✓" : "In Progress"
        ));
    });
    sections.push("");

    // ── Section 4: Recurrent Commitments ───────────────────────────────────
    sections.push("=== RECURRENT COMMITMENTS ===");
    sections.push(row("Name", "Category", "Monthly Amount"));
    recurrentSpends.forEach(r => {
        sections.push(row(r.name, r.category, r.amount));
    });
    sections.push(row("Total Fixed Commitments", recurrentSpends.reduce((sum, r) => sum + r.amount, 0), currency));
    sections.push("");

    // ── Section 5: Category Budgets ─────────────────────────────────────────
    sections.push("=== CATEGORY BUDGETS ===");
    sections.push(row("Category", "Monthly Budget"));
    Object.entries(categoryBudgets).forEach(([cat, amt]) => {
        sections.push(row(cat.charAt(0).toUpperCase() + cat.slice(1), amt));
    });
    sections.push("");

    return sections.join("\n");
}

export function downloadCSV(content: string, filename: string) {
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" }); // BOM for Excel compatibility
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
