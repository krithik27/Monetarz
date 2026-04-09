/**
 * Determines whether a data insight is statistically significant and useful to the user.
 * @param confidenceScore - 0.0 to 1.0 (requires 0.4+).
 * @param delta - Magnitude of the anomaly (e.g., 1.25 for 25% increase).
 * @param category - Optional category name for context.
 */
export function isInsightEligible(
    confidenceScore: number,
    delta: number,
    category: string | null = null
): boolean {
    // 1. Minimum Confidence Threshold
    if (confidenceScore < 0.35) return false;
    
    // 2. Minimum Magnitude (at least 15% change to be worth an insight)
    const absDelta = Math.abs(delta - 1.0);
    if (absDelta < 0.15) return false;
    
    // 3. Category Guard: If 'Income', only report significant drops or huge jumps
    if (category === "Income" || category === "Salary") {
        if (delta > 0.8 && delta < 1.2) return false;
    }
    
    return true;
}
