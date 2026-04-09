import { supabase } from '@/lib/supabase/client';

/**
 * SECURE LOGOUT UTILITY
 * 
 * Performs a clean logout with proper session cleanup.
 * Used for both manual signouts and automatic inactivity timeouts.
 */

export type LogoutReason = 'manual' | 'inactivity';

export async function secureLogout(reason: LogoutReason = 'manual'): Promise<void> {
    try {
        // 1. Sign out from Supabase (handles session cleanup automatically)
        await supabase.auth.signOut();

        // 2. Store logout message for display on sign-in page
        const message = reason === 'inactivity'
            ? 'You were signed out due to inactivity.'
            : 'You have been signed out.';

        sessionStorage.setItem('logout_message', message);

        // 3. Redirect to sign-in page
        window.location.href = '/sign-in';
    } catch (error) {
        console.error('Logout failed:', error);
        // Force redirect even if signOut fails
        window.location.href = '/sign-in';
    }
}
