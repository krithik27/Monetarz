interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// 1 minute sliding window
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 50;

/**
 * Basic in-memory rate limiter.
 * @param identifier The string identifier (e.g. user ID or IP address)
 * @returns boolean `true` if limit is exceeded, `false` if allowed
 */
export function isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    // If no entry or window expired, reset
    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + WINDOW_MS
        });
        return false;
    }

    // Still in window, increment count
    entry.count += 1;
    
    // Check if exceeded
    if (entry.count > MAX_REQUESTS) {
        return true;
    }

    return false;
}

// Optional cleanup for long-running processes to prevent memory leaks in dev
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, WINDOW_MS);
