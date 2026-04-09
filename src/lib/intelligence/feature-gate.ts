import { ParseResult } from "../types";
import { aiParseSpendAction } from "@/app/actions/intelligence";

/**
 * Helper to globally bypass AI calls in development mode.
 */
export const isDevAiEnabled = () => {
    if (process.env.NODE_ENV !== 'development') return true;
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('DEV_AI_ENABLED') !== 'false';
};

export const PRO_FEATURES = {
    /**
     * Gated LLM Parser call.
     * Executes the Gemini fallback if the user provides their ID.
     */
    llmParse: async (
        userId: string | undefined,
        isPro: boolean,
        input: string,
        regexResult: ParseResult
    ): Promise<ParseResult | null> => {
        if (!userId || !isPro) return null; // Fallback to free tier regex if not Pro
        if (!isDevAiEnabled()) return null; // Bypass AI during dev if disabled

        try {
            return await aiParseSpendAction(userId, isPro, input, regexResult);
        } catch (error) {
            console.error("LLM Parse failed gracefully:", error);
            return null;
        }
    }
};
