"use server";

import { getGeminiClient } from "@/lib/intelligence/gemini";
import { getServiceSupabase } from "@/lib/supabase/service";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { LLMParser } from "@/lib/intelligence/llm-parser";
import { ParseResult } from "@/lib/types";
import { getUserProfile } from "@/lib/user/getUserProfile";
async function resolveUserId(): Promise<string | null> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch { }
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}

// Bypassing RLS on the server via Service Role to manually modify rate limits
// Since the RPC `increment_ai_usage` checks `auth.uid()`, we will just manually
// update the table using the service key for these server actions.
async function checkServerRateLimit(userId: string): Promise<boolean> {
    const supabase = getServiceSupabase();
    if (!supabase) return false; // Fail closed if no service key (Security Hardening)

    const today = new Date().toISOString().split('T')[0];

    // 1. Get current
    const { data: existing } = await supabase
        .from('ai_usage_logs')
        .select('calls_count')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

    const count = existing?.calls_count || 0;

    // Increased to 25 to account for multiple API calls per page load (Insights + Polls)
    if (count >= 25) {
        return false; // Rate limited
    }

    // 2. Increment
    if (existing) {
        await supabase
            .from('ai_usage_logs')
            .update({ calls_count: count + 1, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('date', today);
    } else {
        await supabase
            .from('ai_usage_logs')
            .insert({ user_id: userId, date: today, calls_count: 1 });
    }

    return true;
}

interface AdvisorMetrics {
    netFlowHealth: boolean;
    dominance: { category: string; total: number }[];
    metrics: {
        avgDailySpend: number;
        topCategory: string;
        entryCount: number;
        totalFilteredAmount: number;
    };
}

export async function generateAdvisorInsights(userId: string, metrics: AdvisorMetrics) {
    if (!userId) return null;

    const actualUserId = await resolveUserId();
    if (!actualUserId || actualUserId !== userId) {
        console.warn("Security Alert: User attempted to run generateAdvisorInsights for another user ID.");
        return null;
    }

    // Basic structural validation
    if (!metrics || typeof metrics !== 'object') {
        console.warn("Invalid metrics payload.");
        return null;
    }

    const supabase = getServiceSupabase();
    if (supabase) {
        const { data: user } = await supabase.auth.admin.getUserById(userId);
        const userProfile = await getUserProfile(supabase, userId);
        
        // Admin Bypass
        const adminEmail = process.env.ADMIN_EMAIL;
        const isAdmin = adminEmail && user?.user?.email === adminEmail;
        
        if (!isAdmin) {
             if (user?.user?.user_metadata?.intelligence_disabled) return null;
             if (!userProfile?.is_pro) {
                 console.warn(`Pro tier enforcement: User ${userId} is not Pro. Insight generation blocked.`);
                 return null;
             }
        }
    }

    const allowed = await checkServerRateLimit(userId);
    if (!allowed) {
        console.warn("AI Rate limit hit for Advisor Insights.");
        return null;
    }

    try {
        const ai = getGeminiClient();
        const supabase = getServiceSupabase();
        if (!supabase) return null;
        
        const systemPrompt = `You are Monetarz Advisor, a calm, mindful, and mild financial guide.
Your goal is to look at the user's weekly metrics to return exactly 4 short, insightful sentences.
Do NOT be overly enthusiastic, panicky, or judgmental. Focus on awareness and nurturing their spending habits.
IMPORTANT: Whenever mentioning money or currency, always use the '₹' (Rupee) symbol. Do not use '$' or any other currency symbol.
Output strictly as a JSON array of 4 strings. Example: ["Your momentum is grounded this week.", "Notice how Food took up 40% of the flow.", "A quiet Tuesday balanced your weekend.", "You are tracking well within your baseline."]`;

        const userPrompt = `Here are the weekly metrics:
${JSON.stringify(metrics, null, 2)}

Generate the 4 insights. Add a personal, nurturing touch if relevant.`;

        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                temperature: 0.4
            }
        });

        if (!response.text) return null;

        let cleaned = response.text.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
        else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```/g, '').trim();

        return JSON.parse(cleaned) as string[];

    } catch (e) {
        if (process.env.NODE_ENV === 'development') {
            console.error("AI Insight generation failed", e);
        }
        return null; // Silent degradation
    }
}

interface PollSpend {
    category: string;
    description: string;
    amount: number;
}

export async function generatePollQuestion(userId: string, highestDiscretionarySpend: PollSpend) {
    if (!userId || !highestDiscretionarySpend) return null;

    const actualUserId = await resolveUserId();
    if (!actualUserId || actualUserId !== userId) {
        console.warn("Security Alert: User attempted to run generatePollQuestion for another user ID.");
        return null;
    }

    const SpendSchema = z.object({
        category: z.string(),
        description: z.string(),
        amount: z.union([z.number(), z.string()]).transform(a => Number(a)),
    }).passthrough();

    const validation = SpendSchema.safeParse(highestDiscretionarySpend);
    if (!validation.success) {
        console.warn("Invalid spend payload for poll generation.");
        return null;
    }

    const validSpend = validation.data;

    const supabase = getServiceSupabase();
    if (supabase) {
        const { data: user } = await supabase.auth.admin.getUserById(userId);
       const userProfile = await getUserProfile(supabase, userId);
        
        // Admin Bypass
        const adminEmail = process.env.ADMIN_EMAIL;
        const isAdmin = adminEmail && user?.user?.email === adminEmail;
        
        if (!isAdmin) {
             if (user?.user?.user_metadata?.intelligence_disabled) return null;
             if (!userProfile?.is_pro) {
                 console.warn(`Pro tier enforcement: User ${userId} is not Pro. Poll generation blocked.`);
                 return null;
             }
        }
    }

    const allowed = await checkServerRateLimit(userId);
    if (!allowed) return null;

    try {
        const ai = getGeminiClient();
        const systemPrompt = `You are Monetarz Advisor. The user just made a significant discretionary purchase.
Write a single, mindful, introspective poll question (max 15 words) that asks them to reflect on the purchase.
It should be a yes/no question. Example: "You spent ₹50 on Uber. Was this a necessary convenience?"
IMPORTANT: Whenever mentioning money or currency, always use the '₹' (Rupee) symbol. Do not use '$' or any other currency symbol.
Output strictly as a JSON object: { "prompt": "the question string" }`;

        const userPrompt = `Purchase: ${validSpend.category} - ${validSpend.description} for ${validSpend.amount}. Generate the prompt.`;

        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                temperature: 0.6
            }
        });

        if (!response.text) return null;

        let cleaned = response.text.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
        else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```/g, '').trim();

        return JSON.parse(cleaned).prompt as string;

    } catch (e) {
        if (process.env.NODE_ENV === 'development') {
            console.error("AI Poll generation failed", e);
        }
        return null;
    }
}

export async function aiParseSpendAction(
    userId: string | undefined,
    isPro: boolean,
    input: string,
    regexResult: ParseResult
): Promise<ParseResult | null> {
    if (!userId || !isPro) return null;

    try {
        const actualUserId = await resolveUserId();
        if (!actualUserId || actualUserId !== userId) {
            console.warn("Security Alert: User attempted to run aiParseSpendAction for another user ID.");
            return null;
        }

        const supabase = getServiceSupabase();
        if (supabase) {
            const { data: user } = await supabase.auth.admin.getUserById(userId);
            const userProfile = await getUserProfile(supabase, userId);
            const adminEmail = process.env.ADMIN_EMAIL;
            const isAdmin = adminEmail && user?.user?.email === adminEmail;
            
            if (!isAdmin) {
                 if (user?.user?.user_metadata?.intelligence_disabled) return null;
                 if (!userProfile?.is_pro) {
                     console.warn(`Pro tier enforcement: User ${userId} is not Pro. AI parsing blocked.`);
                     return null;
                 }
            }
        }

        return await LLMParser.parse(input, regexResult, userId);
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("LLM Parse failed gracefully:", error);
        }
        return null;
    }
}
