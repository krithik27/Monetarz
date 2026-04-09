import { ParseResult } from "../types";
import { getGeminiClient, checkAiRateLimit } from "./gemini";

export const LLMParser = {
    /**
     * Calls Google Gemini to enhance the parse result when Regex is unconfident.
     */
    parse: async (input: string, regexResult: ParseResult, userId: string): Promise<ParseResult | null> => {
        try {
            // 1. Strict AI Rate Limiting Check (5 per day)
            const isAllowed = await checkAiRateLimit(userId);
            if (!isAllowed) {
                console.warn("AI Rate limit exceeded for user. Falling back to regex.");
                return null;
            }

            // 2. Setup Gemini
            const ai = getGeminiClient();
            
            // 3. System Prompt for JSON enforcement
            const systemInstruction = `You are an expert financial categorizer. 
Your goal is to parse the user's raw transaction input and return a strict JSON object.
Use the fallback data provided to infer context, but correct it if it's obviously wrong (e.g. 'uber' should be 'transport', not 'misc').

Output MUST strictly match this JSON format:
{
    "category": string (e.g. "food", "transport", "shopping", "groceries", "health", "entertainment", "subscriptions", "income", "misc"),
    "description": string (Cleaned up title, e.g. "Uber Ride"),
    "confidence": number (Between 0.0 and 1.0)
}`;

            const userPrompt = `Raw Input: "${input}"
Fallback Parsed Data: ${JSON.stringify({
    category: regexResult.category,
    description: regexResult.description
})}

Correct the category and description if necessary, and output the JSON.`;

            // 4. Call Gemini (using 1.5 Flash for speed/cost)
            const response = await ai.models.generateContent({
                model: 'gemini-flash-lite-latest',
                contents: userPrompt,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    temperature: 0.1, // Low temp for deterministic output
                }
            });

            if (!response.text) return null;

            // 5. Parse and merge result
            const aiData = JSON.parse(response.text);

            return {
                ...regexResult,
                category: aiData.category || regexResult.category,
                description: aiData.description || regexResult.description,
                confidence: aiData.confidence || 0.9,
                source: "llm",
                metadata: {
                    model: "gemini-flash-lite-latest",
                }
            };
        } catch (error) {
            console.error("LLM Parsing failed:", error);
            return null; // Safe fallback
        }
    }
};
