/**
 * TemporalEngine: The single source of truth for date range calculations.
 * Eliminates "fuzzy time" by providing explicit, deterministic calendar and rolling boundaries.
 */

export interface DateRange {
    start: Date;
    end: Date;
}

export class TemporalEngine {
    /**
     * Today: Strict local midnight-to-midnight.
     */
    static getTodayRange(pivot: Date = new Date()): DateRange {
        const start = new Date(pivot);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        return { start, end };
    }

    /**
     * Yesterday: Strict local midnight-to-midnight.
     */
    static getYesterdayRange(pivot: Date = new Date()): DateRange {
        const today = this.getTodayRange(pivot);
        const start = new Date(today.start);
        start.setDate(start.getDate() - 1);

        const end = new Date(today.start);

        return { start, end };
    }

    /**
     * This Calendar Week: Strictly Monday 00:00:00 to Sunday 23:59:59.
     */
    static getThisWeekRange(pivot: Date = new Date()): DateRange {
        const date = new Date(pivot);
        const day = date.getDay();
        // Adjust for Sunday (0) to be the 7th day, Monday (1) to be the 1st
        const diff = date.getDate() - (day === 0 ? 6 : day - 1);

        const start = new Date(date.setDate(diff));
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        return { start, end };
    }

    /**
     * Last Calendar Week: Strictly previous Monday to Sunday.
     */
    static getLastWeekRange(pivot: Date = new Date()): DateRange {
        const thisWeek = this.getThisWeekRange(pivot);
        const start = new Date(thisWeek.start);
        start.setDate(start.getDate() - 7);

        const end = new Date(thisWeek.start);

        return { start, end };
    }

    /**
     * This Month: Strictly 1st to 28th-31st.
     */
    static getThisMonthRange(pivot: Date = new Date()): DateRange {
        const start = new Date(pivot.getFullYear(), pivot.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(pivot.getFullYear(), pivot.getMonth() + 1, 1, 0, 0, 0, 0);

        return { start, end };
    }

    /**
     * Last Month: Strictly previous month 1st to end.
     */
    static getLastMonthRange(pivot: Date = new Date()): DateRange {
        const start = new Date(pivot.getFullYear(), pivot.getMonth() - 1, 1, 0, 0, 0, 0);
        const end = new Date(pivot.getFullYear(), pivot.getMonth(), 1, 0, 0, 0, 0);

        return { start, end };
    }

    /**
     * Rolling 7 Days: Exactly 168-hour window from the current timestamp.
     */
    static getRolling7DaysRange(pivot: Date = new Date()): DateRange {
        const end = new Date(pivot);
        const start = new Date(pivot);
        start.setDate(start.getDate() - 7);

        return { start, end };
    }

    /**
     * Past 4 Weeks: Returns a single range covering the 4 weeks prior to the current week.
     * Guaranteed to exclude the current week.
     */
    static getPast4WeeksRange(pivot: Date = new Date()): DateRange {
        const thisWeek = this.getThisWeekRange(pivot);
        const end = new Date(thisWeek.start);
        const start = new Date(thisWeek.start);
        start.setDate(start.getDate() - 28); // 4 weeks * 7 days

        return { start, end };
    }

    /**
     * Get Individual Past 4 Weeks: Useful for more granular baseline math if needed.
     */
    static getIndividualPast4Weeks(pivot: Date = new Date()): DateRange[] {
        const thisWeek = this.getThisWeekRange(pivot);
        const ranges: DateRange[] = [];

        for (let i = 1; i <= 4; i++) {
            const start = new Date(thisWeek.start);
            start.setDate(start.getDate() - (i * 7));
            const end = new Date(start);
            end.setDate(end.getDate() + 7);
            ranges.push({ start, end });
        }

        return ranges;
    }

    /**
     * Utility to check if a date falls within a range.
     * Range is usually inclusive of start, exclusive of end.
     */
    static isInRange(date: Date, range: DateRange): boolean {
        return date >= range.start && date < range.end;
    }

    /**
     * Utility to check if two dates fall on the same calendar day.
     */
    static isSameDay(d1: Date, d2: Date): boolean {
        return this.isInRange(d1, this.getTodayRange(d2));
    }

    /**
     * Generates a deterministic week identifier (e.g., "2024-W05").
     */
    static getCurrentWeekId(pivot: Date = new Date()): string {
        const range = this.getThisWeekRange(pivot);
        const startOfYear = new Date(range.start.getFullYear(), 0, 1);
        const diff = range.start.getTime() - startOfYear.getTime();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const weekNumber = Math.floor(diff / oneWeek) + 1;
        return `${range.start.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
    }

    /**
     * Safe Local Date String: YYYY-MM-DD but respecting the user's local clock.
     * Prevents UTC "Day Jump" where users in APAC see yesterday's data in the morning.
     */
    static getLocalDateString(date: Date = new Date()): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
