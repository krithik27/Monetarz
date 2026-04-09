import { NextResponse } from 'next/server';
import { getRecentLogs } from '@/lib/log';
import { getServiceSupabase } from '@/lib/supabase/service';
import os from 'os';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * ADMIN API: System Metrics & Diagnostics
 * 
 * Provides:
 * 1. Recent structured logs
 * 2. Hardware metrics (Server-side)
 * 3. Connection status (Supabase)
 */
/**
 * TIMEOUT UTILITY
 */
async function withTimeout<T>(promise: Promise<T> | PromiseLike<T>, timeoutMs: number, operationName: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
            reject(new Error(`TIMEOUT: ${operationName} exceeded ${timeoutMs}ms`));
        }, timeoutMs);
    });
    return Promise.race([promise, timeout]);
}

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll() {}, 
                },
            }
        );
        
        const { data: { user } } = await supabaseAuth.auth.getUser();
        const adminEmail = process.env.ADMIN_EMAIL;
        
        if (!user || !adminEmail || user.email !== adminEmail) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const logs = getRecentLogs(50);

        // System Metrics
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();
        const loadAvg = os.loadavg();

        // Supabase Status check
        const supabase = getServiceSupabase();
        let supabaseStatus = 'disconnected';

        if (supabase) {
            try {
                // Wrap in 1.5s timeout to prevent admin dashboard hang
                const { error } = await withTimeout<any>(
                    supabase.from('entries').select('count', { count: 'exact', head: true }).limit(1),
                    1500,
                    'Admin Supabase Status Check'
                );
                supabaseStatus = error ? 'error' : 'connected';
            } catch (e) {
                supabaseStatus = 'error';
            }
        }

        return NextResponse.json({
            logs,
            metrics: {
                memory: {
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                    rss: Math.round(memoryUsage.rss / 1024 / 1024),
                },
                uptime: Math.round(uptime),
                load: loadAvg,
                cpuCount: os.cpus().length,
            },
            status: {
                supabase: supabaseStatus,
                server: 'healthy',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Admin System API failed:', error);
        }
        return NextResponse.json({ error: 'Failed to retrieve system metrics' }, { status: 500 });
    }
}
