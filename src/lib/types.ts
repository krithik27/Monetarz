import { CurrencyCode } from "./money";
import { ChartConfig } from "@/components/ui/chart";

export type SpendCategory =
    | "food"
    | "transport"
    | "groceries"
    | "shopping"
    | "subscriptions"
    | "health"
    | "entertainment"
    | "income"
    | "salary"
    | "misc";

export interface ParseResult {
    amountMinor: number | null;
    currency: CurrencyCode;
    category: SpendCategory | "misc";
    description: string;
    confidence: number; // 0.0 to 1.0
    source: "regex" | "llm";
    metadata?: Record<string, unknown>;
}

// ============================================================================
// Analytics & Chart Types
// ============================================================================

export interface ChartDataPoint {
    [key: string]: string | number | undefined;
}

export interface WeeklyFlowData extends ChartDataPoint {
    day: string;
    current: number;
    previous: number;
}

export interface VolatilityData extends ChartDataPoint {
    day: string;
    value: number;
}

export interface DominanceData extends ChartDataPoint {
    category: string;
    total: number;
}

export interface ConfirmationData extends ChartDataPoint {
    day: string;
    value: number;
}

export interface AnalyticsConfig extends ChartConfig {
    [key: string]: {
        label: string;
        color: string;
    };
}

