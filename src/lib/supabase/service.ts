
import { createClient } from '@supabase/supabase-js';

// Access the service role key securely from environment variables
// This should ONLY be used in server-side contexts (API routes, Server Actions)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getServiceSupabase() {
    if (typeof window !== 'undefined') {
        throw new Error("SECURITY ALERT: getServiceSupabase() cannot be called on the client. Service Role keys must NEVER be exposed to the browser.");
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        console.warn("Supabase Service Key missing. Cannot bypass RLS.");
        return null;
    }
    return createClient(supabaseUrl, supabaseServiceKey);
}
