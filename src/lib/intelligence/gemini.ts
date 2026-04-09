import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase/client';

// Initialize the Gemini client
// Note: In Next.js App Router, this will need to be called on the server to access the env var,
// or we make a server action / API route for it.
export const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

/**
 * Checks the AI rate limit for the current user.
 * 
 * @param userId - The user's UUID
 * @returns boolean - True if allowed, false if limit exceeded
 */
export async function checkAiRateLimit(userId: string): Promise<boolean> {
    try {
        // Call the RPC we created in the migration
        const { data, error } = await supabase.rpc('increment_ai_usage', {
            p_user_id: userId,
            p_max_calls: 5 // Strict 5 calls per day limit
        });

        if (error) {
            console.error("AI Rate Limit check failing closed due to DB error:", error);
            // Default to limited on DB error (fail-closed)
            return false; 
        }

        return data as boolean;
    } catch (error) {
        console.error("Error checking AI rate limit:", error);
        return false; // Fail closed
    }
}
