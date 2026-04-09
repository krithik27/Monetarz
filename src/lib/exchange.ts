import { CurrencyCode, Money } from "./money";

/**
 * Exchange Provider: Handles currency conversions using "Balanced Static Rates".
 * As per Founder's vision: Rates are updated weekly to ensure "Financial Calm",
 * avoiding fluctuating totals due to high-frequency market volatility.
 */
export interface ExchangeProvider {
    getRate(from: CurrencyCode, to: CurrencyCode): number;
    convert(amount: Money, to: CurrencyCode): Money;
}

// ── BALANCED STATIC RATES (Weekly Pin) ──────────────────────────────────────
// Based on current global averages to ensure stability for testers.
const STABLE_RATES: Record<string, number> = {
    "USD_INR": 83.50,
    "INR_USD": 1 / 83.50,
    "PHP_INR": 1.48,
    "INR_PHP": 1 / 1.48,
    "USD_PHP": 56.40,
    "PHP_USD": 1 / 56.40,
    "EUR_INR": 90.20,
    "INR_EUR": 1 / 90.20,
};

export const exchangeProvider: ExchangeProvider = {
    /**
     * Synchronous rate lookups for immediate UI updates.
     */
    getRate(from: CurrencyCode, to: CurrencyCode): number {
        if (from === to) return 1.0;
        const key = `${from}_${to}`;
        const rate = STABLE_RATES[key];
        
        if (rate === undefined) {
            console.warn(`Exchange rate NOT found for ${key}. Falling back to 1.0.`);
            return 1.0;
        }
        return rate;
    },

    /**
     * Converts Money from one currency to another using the static rate map.
     */
    convert(money: Money, to: CurrencyCode): Money {
        if (money.currency === to) return money;
        
        const rate = this.getRate(money.currency, to);
        return {
            amountMinor: Math.round(money.amountMinor * rate),
            currency: to
        };
    }
};
