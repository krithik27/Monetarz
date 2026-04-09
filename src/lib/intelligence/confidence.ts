export type InsightConfidenceLevel = "Low" | "Moderate" | "High";

export interface InsightConfidence {
    score: number; // 0.0 to 1.0
    level: InsightConfidenceLevel;
}

/**
 * Calculates a confidence score for a data insight.
 * @param sampleSize - Frequency or volume of data points (e.g., active days in a period).
 * @param delta - Magnitude of the change or anomaly (1.0 = 100%).
 * @param volatility - Estimated noise factor (default 0.2).
 */
export function getInsightConfidence(
    sampleSize: number,
    delta: number,
    volatility: number = 0.2
): InsightConfidence {
    // Confidence increases with sample size (max out at 14 days)
    const sampleFactor = Math.min(sampleSize / 14, 1.0);
    
    // Confidence is higher for bigger deltas (easier to distinguish from noise)
    const deltaFactor = Math.min(Math.abs(delta) / 0.5, 1.0);
    
    // Final score weighted toward sample size
    const score = (sampleFactor * 0.7) + (deltaFactor * 0.3);
    
    let level: InsightConfidenceLevel = "Low";
    if (score >= 0.8) level = "High";
    else if (score >= 0.5) level = "Moderate";
    
    return { score, level };
}
