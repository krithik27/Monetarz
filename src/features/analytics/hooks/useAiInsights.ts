import { useState, useEffect, useRef } from 'react';
import { generateAdvisorInsights, generatePollQuestion } from '@/app/actions/intelligence';
import { isDevAiEnabled } from '@/lib/intelligence/feature-gate';

interface AiInsightsParams {
    authUser: any | null;
    isPro: boolean;
    netFlowHealth: boolean;
    dominance: { category: string; total: number }[];
    metrics: { entryCount: number; totalFilteredAmount: number; avgDailySpend: number; topCategory: string; };
    pollData: { 
        topTransaction: { category: string; amount: number } | null;
        topCategory: { category: string; amount: number } | null;
    };
    timeBound: string;
}

export function useAiInsights({
    authUser,
    isPro,
    netFlowHealth,
    dominance,
    metrics,
    pollData,
    timeBound
}: AiInsightsParams) {
    const [aiInsights, setAiInsights] = useState<string[] | null>(null);
    const [aiPollPrompt, setAiPollPrompt] = useState<string | null>(null);
    const [isInsightCached, setIsInsightCached] = useState<boolean>(false);
    const [insightCacheTime, setInsightCacheTime] = useState<string | null>(null);

    // Prevent duplicate fetches in Strict Mode or rapid filter changes
    const fetchedAiRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!isPro || !authUser || metrics.entryCount === 0 || !isDevAiEnabled()) return;
        if (authUser.user_metadata?.intelligence_disabled) return;

        // Generate a deterministic cache key for the current data state
        const stateKey = `ai_cache_${timeBound}_${metrics.entryCount}_${Math.floor(metrics.totalFilteredAmount)}`;
        if (fetchedAiRef.current.has(stateKey)) return;

        fetchedAiRef.current.add(stateKey);

        const applyStoredInsight = (dataStr: string, isFallback: boolean, timestampStr?: string) => {
            setAiInsights(JSON.parse(dataStr));
            setIsInsightCached(isFallback);
            if (isFallback && timestampStr) {
                const diffMs = Date.now() - parseInt(timestampStr, 10);
                const diffMins = Math.round(diffMs / 60000);
                if (diffMins < 60) setInsightCacheTime(`${diffMins}m ago`);
                else setInsightCacheTime(`${Math.round(diffMins / 60)}h ago`);
            } else {
                setInsightCacheTime(null);
            }
        };

        // 1. Check exact state cache first
        try {
            const cachedInsights = sessionStorage.getItem(`${stateKey}_insights`);
            const cachedPoll = sessionStorage.getItem(`${stateKey}_poll`);

            if (cachedInsights) {
                applyStoredInsight(cachedInsights, false);
            }
            if (cachedPoll) setAiPollPrompt(JSON.parse(cachedPoll));

            // If both exist in exact cache, we're done
            if (cachedInsights && cachedPoll) return;
        } catch (e) { }

        let active = true;

        const fetchInsights = async () => {
            try {
                if (!sessionStorage.getItem(`${stateKey}_insights`)) {
                    const res = await generateAdvisorInsights(authUser.id, { netFlowHealth, dominance, metrics });
                    if (active && res && res.length >= 4) {
                        setAiInsights(res);
                        setIsInsightCached(false);
                        setInsightCacheTime(null);
                        sessionStorage.setItem(`${stateKey}_insights`, JSON.stringify(res));
                        // Save globally as the last known good insight
                        localStorage.setItem('monetarz_last_insight', JSON.stringify(res));
                        localStorage.setItem('monetarz_last_insight_time', Date.now().toString());
                    } else if (active && !res) {
                        // AI Generation returned null (e.g. rate limit, offline) - trigger fallback manually
                        const lastGood = localStorage.getItem('monetarz_last_insight');
                        const lastTime = localStorage.getItem('monetarz_last_insight_time');
                        if (lastGood && lastTime) applyStoredInsight(lastGood, true, lastTime);
                    }
                }
            } catch (e) { 
                console.error("AI Insight failed, attempting graceful degradation...", e);
                // Fallback to last known good insight
                if (active) {
                    const lastGood = localStorage.getItem('monetarz_last_insight');
                    const lastTime = localStorage.getItem('monetarz_last_insight_time');
                    if (lastGood && lastTime) {
                        applyStoredInsight(lastGood, true, lastTime);
                    }
                }
            }
        };

        const fetchPoll = async () => {
            try {
                if (!sessionStorage.getItem(`${stateKey}_poll`)) {
                    let res = null;
                    if (pollData.topTransaction) {
                        res = await generatePollQuestion(authUser.id, {
                            category: pollData.topTransaction.category,
                            description: `Reflection on ${pollData.topTransaction.category}`,
                            amount: pollData.topTransaction.amount
                        });
                    } else if (pollData.topCategory) {
                        res = await generatePollQuestion(authUser.id, {
                            category: pollData.topCategory.category,
                            description: 'Overall Category Spend',
                            amount: pollData.topCategory.amount
                        });
                    }
                    if (active && res) {
                        setAiPollPrompt(res);
                        sessionStorage.setItem(`${stateKey}_poll`, JSON.stringify(res));
                        localStorage.setItem('monetarz_last_poll', JSON.stringify(res));
                    } else if (active && (!pollData.topTransaction && !pollData.topCategory)) {
                        // Valid case: no discretionary spending to poll about. Do nothing.
                    } else if (active && !res) {
                        // AI failed to generate - trigger fallback
                        const lastGoodPoll = localStorage.getItem('monetarz_last_poll');
                        if (lastGoodPoll) setAiPollPrompt(JSON.parse(lastGoodPoll));
                    }
                }
            } catch (e) { 
                console.error("AI Poll failed, attempting graceful degradation...", e);
                if (active) {
                    const lastGoodPoll = localStorage.getItem('monetarz_last_poll');
                    if (lastGoodPoll) {
                        setAiPollPrompt(JSON.parse(lastGoodPoll));
                    }
                }
            }
        };

        // Don't await them, let them resolve asynchronously
        fetchInsights();
        fetchPoll();

        return () => { active = false; };
    }, [authUser, isPro, netFlowHealth, dominance, metrics.entryCount, pollData, timeBound]);

    return { aiInsights, aiPollPrompt, isInsightCached, insightCacheTime };
}
