import { CurrencyCode, Money, MoneyEngine, detectCurrencyFromInput } from "./money";
import { ParseResult } from "./types";

export type { SpendCategory } from "./types";
import { SpendCategory } from "./types";

export type CategoryCandidate = {
    category: SpendCategory;
    score: number;
};

// Re-export ParsedSpend for backward compatibility (maps to ParseResult extended)
export type ParsedSpend = ParseResult & {
    id: string; // ID generation happens in UI/State layer mostly, but parser assigns one
    amount: number; // Legacy
    money: Money;
    categoryCandidates: CategoryCandidate[];
    needsReview: boolean;
    reviewReasons: string[];
    date: Date;
    is_archived?: boolean;
};

export const INFLOW_CATEGORIES: string[] = [
    "income",
    "salary",
    "bonus",
    "refund",
    "dividend",
    "payout",
    "cashback",
    "received",
    "incentive"
];

export const isInflow = (spend: { category: string }): boolean => {
    if (!spend.category) return false;
    return INFLOW_CATEGORIES.includes(spend.category.toLowerCase());
};

// ... existing code ...

// Regex constants for predictability (supporting multiple symbols)
const AMOUNT_REGEX = /[₹$€₱]?\s*([\d,]+(\.\d+)?)(k)?/i;

// Weighted keywords for deterministic scoring
const KEYWORD_WEIGHTS: Record<string, { category: SpendCategory; weight: number }> = {
    // --- FOOD & DINING ---
    // Brands
    zomato: { category: "food", weight: 1.0 },
    swiggy: { category: "food", weight: 1.0 },
    starbucks: { category: "food", weight: 1.0 },
    mcdonalds: { category: "food", weight: 1.0 },
    dominos: { category: "food", weight: 1.0 },
    kfc: { category: "food", weight: 1.0 },
    subway: { category: "food", weight: 1.0 },
    eatfit: { category: "food", weight: 1.0 },
    // Generic
    dinner: { category: "food", weight: 0.8 },
    lunch: { category: "food", weight: 0.8 },
    breakfast: { category: "food", weight: 0.8 },
    restaurant: { category: "food", weight: 0.9 },
    dining: { category: "food", weight: 0.8 },
    cafe: { category: "food", weight: 0.7 },
    bakery: { category: "food", weight: 0.8 },
    eatery: { category: "food", weight: 0.8 },
    meal: { category: "food", weight: 0.8 },
    food: { category: "food", weight: 0.8 },
    drinks: { category: "food", weight: 0.7 },
    // Specific Foods
    coffee: { category: "food", weight: 0.7 },
    tea: { category: "food", weight: 0.6 },
    chai: { category: "food", weight: 0.8 },
    snack: { category: "food", weight: 0.6 },
    burger: { category: "food", weight: 0.9 },
    pizza: { category: "food", weight: 0.9 },
    biryani: { category: "food", weight: 1.0 },
    dosa: { category: "food", weight: 0.9 },
    idli: { category: "food", weight: 0.9 },
    paratha: { category: "food", weight: 0.9 },
    shawarma: { category: "food", weight: 0.9 },
    curry: { category: "food", weight: 0.8 },
    pasta: { category: "food", weight: 0.8 },
    sushi: { category: "food", weight: 0.9 },
    momo: { category: "food", weight: 0.9 },
    momos: { category: "food", weight: 0.9 },
    sandwich: { category: "food", weight: 0.8 },
    salad: { category: "food", weight: 0.8 },

    // --- TRANSPORT ---
    // Brands
    uber: { category: "transport", weight: 1.0 },
    ola: { category: "transport", weight: 1.0 },
    rapido: { category: "transport", weight: 1.0 },
    blusmart: { category: "transport", weight: 1.0 },
    namma: { category: "transport", weight: 0.9 }, // Namma Yatri
    yatri: { category: "transport", weight: 0.9 },
    irctc: { category: "transport", weight: 1.0 },
    fastag: { category: "transport", weight: 1.0 },
    // Generic
    petrol: { category: "transport", weight: 0.9 },
    fuel: { category: "transport", weight: 0.9 },
    diesel: { category: "transport", weight: 0.9 },
    cab: { category: "transport", weight: 0.8 },
    taxi: { category: "transport", weight: 0.8 },
    flight: { category: "transport", weight: 1.0 },
    train: { category: "transport", weight: 0.9 },
    bus: { category: "transport", weight: 0.8 },
    auto: { category: "transport", weight: 0.7 },
    rickshaw: { category: "transport", weight: 0.7 },
    metro: { category: "transport", weight: 0.9 },
    parking: { category: "transport", weight: 0.9 },
    toll: { category: "transport", weight: 0.9 },
    transit: { category: "transport", weight: 0.8 },

    // --- GROCERIES ---
    // Brands
    bigbasket: { category: "groceries", weight: 1.0 },
    zepto: { category: "groceries", weight: 1.0 },
    blinkit: { category: "groceries", weight: 1.0 },
    instamart: { category: "groceries", weight: 1.0 },
    bbnow: { category: "groceries", weight: 1.0 },
    naturebasket: { category: "groceries", weight: 1.0 },
    dmart: { category: "groceries", weight: 1.0 },
    // Generic/Items
    groceries: { category: "groceries", weight: 1.0 },
    grocery: { category: "groceries", weight: 1.0 },
    vegetables: { category: "groceries", weight: 0.9 },
    veggies: { category: "groceries", weight: 0.9 },
    fruits: { category: "groceries", weight: 0.9 },
    milk: { category: "groceries", weight: 0.8 },
    meat: { category: "groceries", weight: 0.8 },
    supermarket: { category: "groceries", weight: 0.9 },
    mart: { category: "groceries", weight: 0.7 },
    store: { category: "groceries", weight: 0.6 },

    // --- SHOPPING ---
    // Brands
    amazon: { category: "shopping", weight: 1.0 },
    flipkart: { category: "shopping", weight: 1.0 },
    myntra: { category: "shopping", weight: 1.0 },
    ajio: { category: "shopping", weight: 1.0 },
    decathlon: { category: "shopping", weight: 1.0 },
    meesho: { category: "shopping", weight: 1.0 },
    nykaa: { category: "shopping", weight: 1.0 },
    croma: { category: "shopping", weight: 1.0 },
    reliance: { category: "shopping", weight: 0.8 },
    ikea: { category: "shopping", weight: 1.0 },
    zara: { category: "shopping", weight: 1.0 },
    hmo: { category: "shopping", weight: 1.0 }, // H&M
    // Generic
    clothes: { category: "shopping", weight: 0.9 },
    shoes: { category: "shopping", weight: 0.9 },
    dress: { category: "shopping", weight: 0.9 },
    apparel: { category: "shopping", weight: 0.9 },
    fashion: { category: "shopping", weight: 0.9 },
    mall: { category: "shopping", weight: 0.8 },
    electronics: { category: "shopping", weight: 0.9 },
    gift: { category: "shopping", weight: 0.8 },

    // --- SUBSCRIPTIONS / UTILITIES (Merged conceptually here but mapped accurately) ---
    // Brands
    netflix: { category: "subscriptions", weight: 1.0 },
    spotify: { category: "subscriptions", weight: 1.0 },
    prime: { category: "subscriptions", weight: 1.0 },
    youtube: { category: "subscriptions", weight: 1.0 },
    hotstar: { category: "subscriptions", weight: 1.0 },
    apple: { category: "subscriptions", weight: 0.8 },
    chatgpt: { category: "subscriptions", weight: 1.0 },
    openai: { category: "subscriptions", weight: 1.0 },
    vercel: { category: "subscriptions", weight: 1.0 },
    aws: { category: "subscriptions", weight: 1.0 },
    github: { category: "subscriptions", weight: 1.0 },
    // Utilities Generic (Mapping these to 'misc' or specific categories if they existed, but we'll use misc as generic fallback for bills if no utility category, wait, let's map them to a new implicit utility or keep as misc. Let's use 'misc' if we don't have 'utilities' in the SpendCategory enum, let's check INFLOW_CATEGORIES vs SpendCategory. Actually, user requested generic words for Utilities: electricity, wifi... let's map them to subscriptions if recurring, or misc. Let's stick to existing: food, transport, shopping, groceries, health, entertainment, subscriptions, income, misc.)
    // Mapping utilities to subscriptions for now as they are recurring, or misc. Let's use subscriptions.
    electricity: { category: "subscriptions", weight: 0.8 },
    wifi: { category: "subscriptions", weight: 0.9 },
    internet: { category: "subscriptions", weight: 0.9 },
    jio: { category: "subscriptions", weight: 0.9 },
    airtel: { category: "subscriptions", weight: 0.9 },
    recharge: { category: "subscriptions", weight: 0.8 },
    bill: { category: "subscriptions", weight: 0.6 },
    sub: { category: "subscriptions", weight: 0.7 },
    membership: { category: "subscriptions", weight: 0.8 },

    // --- HOUSING / SERVICES ---
    urban: { category: "misc", weight: 0.8 }, // Urban Company
    mygate: { category: "misc", weight: 0.9 },
    rent: { category: "misc", weight: 0.9 },
    maid: { category: "misc", weight: 0.9 },
    cleaner: { category: "misc", weight: 0.9 },
    laundry: { category: "misc", weight: 0.8 },

    // --- HEALTH ---
    doctor: { category: "health", weight: 1.0 },
    doc: { category: "health", weight: 0.8 },
    clinic: { category: "health", weight: 0.9 },
    medicine: { category: "health", weight: 0.9 },
    pharmacy: { category: "health", weight: 0.9 },
    medical: { category: "health", weight: 0.9 },
    hospital: { category: "health", weight: 1.0 },
    gym: { category: "health", weight: 1.0 },
    fitness: { category: "health", weight: 0.9 },
    meds: { category: "health", weight: 0.8 },
    apollo: { category: "health", weight: 0.9 },
    pharmeasy: { category: "health", weight: 0.9 },

    // --- ENTERTAINMENT ---
    movie: { category: "entertainment", weight: 1.0 },
    party: { category: "entertainment", weight: 1.0 },
    cinema: { category: "entertainment", weight: 1.0 },
    game: { category: "entertainment", weight: 0.9 },
    turf: { category: "entertainment", weight: 0.9 },
    concert: { category: "entertainment", weight: 1.0 },
    event: { category: "entertainment", weight: 0.8 },
    club: { category: "entertainment", weight: 0.9 },
    pub: { category: "entertainment", weight: 0.9 },
    bar: { category: "entertainment", weight: 0.8 },
    bookmyshow: { category: "entertainment", weight: 1.0 },

    // --- INCOME (Inflow) ---
    salary: { category: "salary", weight: 1.0 },
    inflow: { category: "income", weight: 1.0 },
    income: { category: "income", weight: 1.0 },
    refund: { category: "income", weight: 0.9 },
    incentive: { category: "income", weight: 0.8 },
    bonus: { category: "income", weight: 1.0 },
    dividend: { category: "income", weight: 1.0 },
    cashback: { category: "income", weight: 0.9 },
    payout: { category: "income", weight: 1.0 },
    received: { category: "income", weight: 1.0 },
};

/**
 * Extracts a numeric amount from the string, handling comma separators and 'k' suffix.
 * Returns the amount and the raw match string for later cleaning.
 */
function extractAmount(input: string): { amount: number | null; raw: string } {
    const match = input.match(AMOUNT_REGEX);
    if (!match) return { amount: null, raw: "" };

    const fullMatch = match[0];
    const valueGroup = match[1].replace(/,/g, ""); // Remove commas
    const isK = match[3]?.toLowerCase() === "k";

    let amount = parseFloat(valueGroup);
    if (isK) {
        amount *= 1000;
    }

    return { amount, raw: fullMatch };
}

/**
 * Infers category based on weighted keyword scoring.
 */
function inferCategories(input: string): CategoryCandidate[] {
    const lowerInput = input.toLowerCase();
    const words = lowerInput.split(/\s+/);
    const scores: Record<string, number> = {};

    for (const word of words) {
        const match = KEYWORD_WEIGHTS[word];
        if (match) {
            scores[match.category] = (scores[match.category] || 0) + match.weight;
        }
    }

    const candidates = Object.entries(scores)
        .map(([category, score]) => ({ category: category as SpendCategory, score }))
        .sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
        candidates.push({ category: "misc", score: 0 });
    }

    return candidates;
}

/**
 * Parses date keywords 'today' or 'yesterday'.
 */
function parseDate(input: string): { date: Date; raw: string } {
    const lowerInput = input.toLowerCase();

    if (/\byesterday\b/i.test(lowerInput)) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return { date: d, raw: "yesterday" };
    }

    if (/\btoday\b/i.test(lowerInput)) {
        return { date: new Date(), raw: "today" };
    }

    return { date: new Date(), raw: "" };
}

/**
 * Cleans the input string by removing the extracted amount and date keywords.
 */
function cleanDescription(original: string, amountRaw: string, dateRaw: string): string {
    let cleaned = original;

    if (amountRaw) {
        cleaned = cleaned.replace(amountRaw, "");
    }

    if (dateRaw) {
        const regex = new RegExp(`\\b${dateRaw}\\b`, "i");
        cleaned = cleaned.replace(regex, "");
    }

    cleaned = cleaned.replace(/\s+/g, " ").trim();

    if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return cleaned;
}

/**
 * Main parser function.
 * Deterministically extracts spend details.
 */
export function parseSpend(input: string, baseCurrency: CurrencyCode = "INR"): ParsedSpend {
    let confidence = 1.0;
    const reviewReasons: string[] = [];

    // Override currency if explicitly mentioned in text
    const explicitCurrency = detectCurrencyFromInput(input);
    const currency = explicitCurrency || baseCurrency;

    // 1. Extract Amount
    const { amount: rawAmount, raw: amountRaw } = extractAmount(input);
    if (rawAmount === null) {
        throw new Error("Could not find a valid amount in the input.");
    }
    const money = MoneyEngine.fromMajor(rawAmount, currency);

    // Confidence penalties
    const allNumbers = input.match(/[\d]+([.,][\d]+)?/g);
    if (allNumbers && allNumbers.length > 1) {
        confidence -= 0.3;
        reviewReasons.push("Multiple numbers detected");
    }

    // 2. Infer Categories
    const candidates = inferCategories(input);
    const topCategory = candidates[0].category;
    if (candidates[0].score === 0) {
        confidence -= 0.3;
        reviewReasons.push("No category keywords found");
    } else if (candidates.length > 1 && (candidates[0].score - candidates[1].score < 0.2)) {
        confidence -= 0.2;
        reviewReasons.push("Ambiguous category match");
    }

    // 3. Parse Date
    const { date, raw: dateRaw } = parseDate(input);

    // 4. Clean Description (also strip currency keywords to avoid junk in desc)
    let description = cleanDescription(input, amountRaw, dateRaw);
    
    // Clean explicit currency mentions
    ["peso", "php", "₱", "dollar", "usd", "buck", "$", "euro", "eur", "€", "rupee", "inr", "rs", "₹", "pesos", "dollars", "bucks", "euros", "rupees"].forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, "i");
        description = description.replace(regex, "");
    });
    // Also remove stray symbols
    description = description.replace(/[₹$€₱]/g, "").replace(/\s+/g, " ").trim();
    if (description.length > 0) {
        description = description.charAt(0).toUpperCase() + description.slice(1);
    }

    if (input.length > 80) {
        confidence -= 0.1;
        reviewReasons.push("Input unusually long");
    }

    // Final clamps
    confidence = Math.max(0, Math.min(1, parseFloat(confidence.toFixed(2))));
    const needsReview = confidence < 0.6 || reviewReasons.length > 0;

    return {
        id: crypto.randomUUID(),
        amount: MoneyEngine.getMajor(money), // Legacy support
        amountMinor: money.amountMinor, // ParseResult support
        currency,
        money,
        category: topCategory,
        categoryCandidates: candidates,
        description: description || "Unspecified spend",
        date,
        confidence,
        reviewReasons,
        needsReview,
        source: "regex",
        metadata: {},
    };
}

