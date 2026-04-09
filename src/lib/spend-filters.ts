import { ParsedSpend } from "./parser";
import { isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

export interface SpendFilters {
    categories?: string[];
    dateRange?: { from?: Date; to?: Date };
    amountRange?: { min?: number; max?: number };
    searchQuery?: string;
}

/**
 * Single function to apply all filters to the spends dataset.
 * Ensures consistent filtering across Grid and Analytics views.
 */
export function applySpendFilters(spends: ParsedSpend[], filters: SpendFilters): ParsedSpend[] {
    return spends.filter(spend => {
        // 1. Category Filter (Multi-select)
        if (filters.categories && filters.categories.length > 0) {
            if (!filters.categories.includes(spend.category)) return false;
        }

        // 2. Date Range Filter
        if (filters.dateRange) {
            const spendDate = startOfDay(spend.date);
            if (filters.dateRange.from && isBefore(spendDate, startOfDay(filters.dateRange.from))) return false;
            if (filters.dateRange.to && isAfter(spendDate, endOfDay(filters.dateRange.to))) return false;
        }

        // 3. Amount Filter
        if (filters.amountRange) {
            if (filters.amountRange.min !== undefined && spend.amount < filters.amountRange.min) return false;
            if (filters.amountRange.max !== undefined && spend.amount > filters.amountRange.max) return false;
        }

        // 4. Text Search (Description)
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            if (!spend.description.toLowerCase().includes(query) && !spend.category.toLowerCase().includes(query)) return false;
        }

        return true;
    });
}
