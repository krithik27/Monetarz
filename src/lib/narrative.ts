import { TemporalEngine } from "./temporal";

/**
 * NarrativeProvider: The clinical source of semantic time phrasing.
 * Decouples domain meaning from UI presentation logic.
 */

export type TemporalNarrative =
    | "Just now"
    | "Earlier today"
    | "Yesterday"
    | "Earlier this week"
    | "Last week"
    | "Long ago";

export class NarrativeProvider {
    private static readonly RECENT_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

    /**
     * Maps a specific date to a clinical narrative label.
     */
    static getTemporalLabel(date: Date, pivot: Date = new Date()): TemporalNarrative {
        const time = date.getTime();
        const now = pivot.getTime();

        if (now - time < this.RECENT_THRESHOLD_MS) {
            return "Just now";
        }

        if (TemporalEngine.isInRange(date, TemporalEngine.getTodayRange(pivot))) {
            return "Earlier today";
        }

        if (TemporalEngine.isInRange(date, TemporalEngine.getYesterdayRange(pivot))) {
            return "Yesterday";
        }

        if (TemporalEngine.isInRange(date, TemporalEngine.getThisWeekRange(pivot))) {
            return "Earlier this week";
        }

        if (TemporalEngine.isInRange(date, TemporalEngine.getLastWeekRange(pivot))) {
            return "Last week";
        }

        return "Long ago";
    }

    /**
     * Ruleset for the "Calm Tone" narrative.
     * Can be expanded for Paid Tier insights.
     */
    static getTonalGuidance(confidence: number): string {
        if (confidence < 0.4) return "Something feels different. Review these entries?";
        if (confidence < 0.6) return "A bit of ambiguity here. Take a look.";
        return "Everything looks quiet and clear.";
    }

    /**
     * Identifies if a specific date/time falls within the "Late Night" window.
     */
    static isLateNight(date: Date): boolean {
        const hours = date.getHours();
        return hours >= 22 || hours < 4;
    }
}
