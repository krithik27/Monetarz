/**
 * Monetary Engine: Pure, integer-based money math with multi-currency support.
 * Avoids floating point errors by operating on minor units (e.g., paise/cents).
 */

export type CurrencyCode = "INR" | "USD" | "PHP" | "EUR";

export interface Money {
    amountMinor: number; // Integer: The truth (e.g. 5000 for 50.00)
    currency: CurrencyCode;
}

// ============================================================================
// PURE FUNCTIONS (Currency-Safe)
// ============================================================================

/**
 * Add two Money objects. Throws if currencies don't match.
 */
export function add(a: Money, b: Money): Money {
    if (a.currency !== b.currency) {
        throw new Error(`Currency mismatch: Cannot add ${a.currency} to ${b.currency}`);
    }
    return {
        amountMinor: a.amountMinor + b.amountMinor,
        currency: a.currency,
    };
}

/**
 * Subtract two Money objects. Throws if currencies don't match.
 */
export function subtract(a: Money, b: Money): Money {
    if (a.currency !== b.currency) {
        throw new Error(`Currency mismatch: Cannot subtract ${b.currency} from ${a.currency}`);
    }
    return {
        amountMinor: a.amountMinor - b.amountMinor,
        currency: a.currency,
    };
}

/**
 * Multiply Money by a scalar factor.
 */
export function multiply(m: Money, factor: number): Money {
    return {
        amountMinor: Math.round(m.amountMinor * factor),
        currency: m.currency,
    };
}

/**
 * Sum multiple Money objects. All must have the same currency.
 */
export function sum(monies: Money[]): Money {
    if (monies.length === 0) {
        return { amountMinor: 0, currency: "INR" }; // Default to INR for empty arrays
    }

    const currency = monies[0].currency;
    const total = monies.reduce((acc, m) => {
        if (m.currency !== currency) {
            throw new Error(`Currency mismatch in sum: Expected ${currency}, got ${m.currency}`);
        }
        return acc + m.amountMinor;
    }, 0);

    return { amountMinor: total, currency };
}

/**
 * Get the major unit amount (float).
 */
export function getMajor(m: Money): number {
    return m.amountMinor / 100;
}

/**
 * Format Money for display using Intl.NumberFormat.
 */
export function format(m: Money, locale?: string): string {
    const amountMajor = m.amountMinor / 100;

    // Auto-detect locale based on currency if not provided
    const detectedLocale = locale || getLocaleForCurrency(m.currency);

    return new Intl.NumberFormat(detectedLocale, {
        style: 'currency',
        currency: m.currency,
        minimumFractionDigits: 2,
    }).format(amountMajor);
}

/**
 * Helper to detect appropriate locale for a currency.
 */
function getLocaleForCurrency(currency: CurrencyCode): string {
    switch (currency) {
        case "INR": return "en-IN";
        case "USD": return "en-US";
        case "PHP": return "en-PH";
        default: return "en-IN";
    }
}

// ============================================================================
// Currency Formatting Utilities
// ============================================================================

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
    INR: "₹",
    USD: "$",
    PHP: "₱",
    EUR: "€",
};

/**
 * Get the symbol for a currency code.
 */
export function getCurrencySymbol(currency: CurrencyCode = "INR"): string {
    return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Format an amount with its currency symbol.
 * @param amount - The amount in major units (e.g., 100.50)
 * @param currency - The currency code
 * @param locale - Optional locale for formatting (auto-detected if not provided)
 */
export function formatCurrency(amount: number, currency: CurrencyCode, locale?: string): string {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toLocaleString(locale)}`;
}

/**
 * Format an amount with currency symbol (simple version for inline use)
 */
export function formatAmount(amount: number, currency: CurrencyCode = "INR"): string {
    return `${getCurrencySymbol(currency)}${amount.toLocaleString()}`;
}

// ============================================================================
// BACKWARD COMPATIBILITY LAYER (Legacy INR-only helpers)
// ============================================================================

/**
 * @deprecated Use Money objects directly. This helper assumes INR.
 */
export function fromINR(rupees: number): Money {
    return {
        amountMinor: Math.round(rupees * 100),
        currency: "INR",
    };
}

/**
 * @deprecated Use Money objects directly. This helper assumes INR.
 */
export function toINR(m: Money): number {
    if (m.currency !== "INR") {
        console.warn(`toINR called on ${m.currency} money. This may cause incorrect values.`);
    }
    return m.amountMinor / 100;
}

// ============================================================================
// LEGACY CLASS (Refactored to use new pure functions)
// ============================================================================

export class MoneyEngine {
    private static readonly SCALE = 100;
    private static readonly CURRENCY: CurrencyCode = "INR"; // Default for backward compatibility

    /**
     * Converts a major unit (float) to a Money object (integer truth).
     * Defaults to INR for backward compatibility.
     */
    static fromMajor(amount: number, currency: CurrencyCode = this.CURRENCY): Money {
        return {
            amountMinor: Math.round(amount * this.SCALE),
            currency,
        };
    }

    /**
     * Converts a minor unit (integer) to a Money object.
     * Defaults to INR for backward compatibility.
     */
    static fromMinor(amountMinor: number, currency: CurrencyCode = this.CURRENCY): Money {
        return {
            amountMinor: Math.round(amountMinor),
            currency,
        };
    }

    /**
     * Safe addition of Money objects.
     */
    static add(m1: Money, m2: Money): Money {
        return add(m1, m2);
    }

    /**
     * Universal summation of multiple Money objects.
     * Converts all items to the target currency before summing.
     * @param monies - Array of money objects (can be mixed currencies)
     * @param target - The target currency for the final sum
     * @param getRate - A function to get the rate between two currencies
     */
    static sumUniversal(
        monies: Money[],
        target: CurrencyCode,
        getRate: (from: CurrencyCode, to: CurrencyCode) => number
    ): Money {
        if (monies.length === 0) return { amountMinor: 0, currency: target };

        const totalMinor = monies.reduce((acc, m) => {
            const rate = getRate(m.currency, target);
            return acc + Math.round(m.amountMinor * rate);
        }, 0);

        return { amountMinor: totalMinor, currency: target };
    }

    /**
     * Get the major unit amount (float).
     */
    static getMajor(m: Money): number {
        return getMajor(m);
    }

    /**
     * Formats for display with currency-aware symbols.
     */
    static format(m: Money, locale?: string): string {
        return format(m, locale);
    }
}
