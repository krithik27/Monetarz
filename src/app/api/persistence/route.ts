import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServiceSupabase } from '@/lib/supabase/service';
import { z } from 'zod';
import { isRateLimited } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

// Persistence API Configuration

/**
 * Resolve the authenticated user's ID.
 *
 * Strategy:
 * 1. In production: always use supabase.auth.getUser() — the real authenticated user.
 * 2. In local dev: if the DEV_USER_ID (dev mode session) is the caller, allow service-key
 *    access for that mock user ID so the developer can see their cloud-synced data.
 */
async function resolveUserId(): Promise<string | null> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user.id;

    return null;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, name: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`TIMEOUT: ${name} exceeded ${ms}ms`)), ms)
    );
    return Promise.race([promise, timeout]);
}

export async function GET() {
    try {
        const userId = await resolveUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (isRateLimited(userId)) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const supabase = getServiceSupabase();
        if (!supabase) {
            return NextResponse.json({ error: 'Service key not configured' }, { status: 500 });
        }

        const [entriesRes, goalsRes, profileRes, recurrentRes, budgetsRes, savingsGoalsRes] = await withTimeout(
            Promise.all([
                supabase.from('entries').select('*').eq('user_id', userId).eq('is_archived', false).order('date', { ascending: false }),
                supabase.from('weekly_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
                supabase.from('financial_profiles').select('*').eq('user_id', userId).single(),
                supabase.from('recurrent_spends').select('*').eq('user_id', userId),
                supabase.from('category_budgets').select('*').eq('user_id', userId),
                supabase.from('savings_goals').select('*').eq('user_id', userId),
            ]),
            5000,
            'Persistence GET'
        );

        if (entriesRes.error) {
            console.error('Entries fetch error:', entriesRes.error);
            return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
        }

        const weeklyGoal = (goalsRes.data && goalsRes.data.length > 0)
            ? Number(goalsRes.data[0].amount) : 0;
        const monthlyIntention = profileRes.data?.monthly_intention || 0;
        
        // Transparently extract income sources from recurrent_spends (category: 'income')
        const allRecurrent = recurrentRes.data || [];
        const incomeSources = allRecurrent
            .filter((r: any) => r.category === 'income' || r.category === 'salary')
            .map((r: any) => ({
                id: r.id,
                name: r.name,
                amount: Number(r.amount),
                dayOfMonth: parseInt((r.frequency || "1").replace("day-", "")) || 1
            }));
        const monthlyIncome = profileRes.data?.monthly_income || incomeSources.reduce((sum, s) => sum + s.amount, 0);

        const recurrentSpends = allRecurrent.filter((r: any) => r.category !== 'income' && r.category !== 'salary');

        const savingsGoals = (savingsGoalsRes.data || []).map((g: any) => ({
            id: g.id,
            name: g.name,
            emoji: g.emoji,
            targetAmount: Number(g.target_amount),
            savedAmount: Number(g.current_amount),
            deadline: g.target_date,
            createdAt: g.created_at,
        }));

        const cloudBudgets: Record<string, number> = {};
        budgetsRes.data?.forEach((b: any) => (cloudBudgets[b.category] = b.amount));

        const mappedSpends = (entriesRes.data || []).map((s: any) => ({
            ...s,
            currency: s.currency_code,
            amountMinor: s.amountMinor || Math.round(s.amount * 100),
            money: {
                amountMinor: s.amountMinor || Math.round(s.amount * 100),
                currency: s.currency_code
            }
        }));

        return NextResponse.json({
            spends: mappedSpends,
            weeklyGoal,
            monthlyIntention,
            monthlyIncome,
            incomeSources,
            recurrentSpends,
            categoryBudgets: cloudBudgets,
            goals: savingsGoals,
            memories: [],
            reflections: [],
            feedback: [],
        });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Persistence GET failed:', error);
        }
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await resolveUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (isRateLimited(userId)) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const supabase = getServiceSupabase();
        if (!supabase) {
            return NextResponse.json({ error: 'Service key not configured' }, { status: 500 });
        }

        const rawBody = await request.json();

        // ZOD SCHEMA VALIDATION
        const SpendSchema = z.object({
            id: z.string(),
            amount: z.union([z.number(), z.string()]).transform(a => Number(a)),
            currency_code: z.string().optional(),
            currency: z.string().optional().default('INR'),
            confidence: z.number().optional().default(1),
            category: z.string().optional().default('misc'),
            description: z.string().optional().default(''),
            date: z.string(),
            source: z.string().optional().default('manual'),
            is_archived: z.boolean().optional().default(false),
            metadata: z.any().optional(),
        });
        
        const RecurrentSchema = z.object({
            id: z.string(),
            name: z.string(),
            amount: z.union([z.number(), z.string()]).transform(a => Number(a)),
            category: z.string(),
            frequency: z.string().optional().default('monthly'),
            is_active: z.boolean().optional().default(true),
        });
        
        const GoalSchema = z.object({
            id: z.string(),
            name: z.string(),
            emoji: z.string().nullable().optional(),
            targetAmount: z.union([z.number(), z.string()]).transform(a => Number(a)),
            savedAmount: z.union([z.number(), z.string()]).transform(a => Number(a)).optional().default(0),
            deadline: z.string().nullable().optional(),
            createdAt: z.string().optional(),
        });
        
        const PersistenceBodySchema = z.object({
            spends: z.array(SpendSchema).optional(),
            weeklyGoal: z.union([z.number(), z.null()]).optional(),
            monthlyIntention: z.number().optional(),
            monthlyIncome: z.number().optional(),
            incomeSources: z.array(z.object({
                id: z.string().optional(),
                name: z.string().optional(),
                amount: z.union([z.number(), z.string()]).transform(a => Number(a)).optional(),
                dayOfMonth: z.number().optional()
            })).optional(),
            recurrentSpends: z.array(RecurrentSchema).optional(),
            categoryBudgets: z.record(z.string(), z.union([z.number(), z.string()]).transform(a => Number(a))).optional(),
            goals: z.array(GoalSchema).optional(),
        });

        const validation = PersistenceBodySchema.safeParse(rawBody);
        if (!validation.success) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('API Validation Failed:', validation.error.format());
            }
            return NextResponse.json({ error: 'Invalid payload schema', details: validation.error.format() }, { status: 400 });
        }

        const body = validation.data;
        const { spends, weeklyGoal } = body;
        const syncOperations: PromiseLike<any>[] = [];

        if (spends !== undefined) {
            const sanitizedSpends = spends.map(s => ({
                id: s.id,
                user_id: userId,
                amount: s.amount,
                currency_code: s.currency_code || s.currency || 'INR',
                confidence: s.confidence || 1,
                category: s.category,
                description: s.description,
                date: s.date,
                source: s.source,
                is_archived: s.is_archived,
                metadata: s.metadata || {},
            }));

            // Upsert all entries for this user (cloud is the source of truth)
            syncOperations.push(
                supabase.from('entries')
                    .upsert(sanitizedSpends, { onConflict: 'id' })
            );
        }

        if (weeklyGoal !== undefined) {
            if (weeklyGoal === null) {
                syncOperations.push(
                    supabase.from('weekly_goals').delete().eq('user_id', userId)
                );
            } else {
                syncOperations.push(
                    supabase.from('weekly_goals')
                        .upsert({ user_id: userId, amount: weeklyGoal }, { onConflict: 'user_id' })
                );
            }
        }

        if (body.monthlyIntention !== undefined || body.monthlyIncome !== undefined) {
            const profileUpdate: any = { user_id: userId };
            if (body.monthlyIntention !== undefined) profileUpdate.monthly_intention = body.monthlyIntention;
            if (body.monthlyIncome !== undefined) profileUpdate.monthly_income = body.monthlyIncome;
            syncOperations.push(
                supabase.from('financial_profiles').upsert(profileUpdate, { onConflict: 'user_id' })
            );
        }

        // We combine recurrentSpends and incomeSources into the recurrent_spends table
        if (body.recurrentSpends !== undefined || body.incomeSources !== undefined) {
            const combinedRecurrent: any[] = [];
            
            if (body.recurrentSpends) {
                combinedRecurrent.push(...body.recurrentSpends.map(s => ({
                    id: s.id,
                    user_id: userId,
                    name: s.name,
                    amount: s.amount,
                    category: s.category,
                    frequency: s.frequency,
                    is_active: s.is_active,
                })));
            }

            if (body.incomeSources) {
                combinedRecurrent.push(...body.incomeSources.map(s => ({
                    id: s.id || crypto.randomUUID(),
                    user_id: userId,
                    name: s.name || 'Income',
                    amount: s.amount || 0,
                    category: 'income',
                    frequency: `day-${s.dayOfMonth || 1}`,
                    is_active: true,
                })));
            }

            // Only perform if there is at least one of these arrays defined in the payload.
            // But wait, if they only send recurrentSpends, it might wipe incomeSources if we do a blind wipe.
            // Actually, the app normally sends everything in proxy mode. To be safe, we just update the specific ones or wipe.
            // Since proxy mode sends both, we wipe the whole table for the user and re-insert.
            // If they only send one, we only delete that specific category type to avoid wiping the other.
            
            if (body.recurrentSpends !== undefined && body.incomeSources === undefined) {
                 syncOperations.push((async () => {
                     const { error: e1 } = await supabase.from('recurrent_spends').delete().eq('user_id', userId).neq('category', 'income').neq('category', 'salary');
                     if (e1) { console.error("DEL_ERR:", e1); throw e1; }
                     if (combinedRecurrent.length > 0) {
                         const { error: e2 } = await supabase.from('recurrent_spends').insert(combinedRecurrent);
                         if (e2) { console.error("INS_ERR:", e2); throw e2; }
                     }
                 })());
            } else if (body.incomeSources !== undefined && body.recurrentSpends === undefined) {
                 syncOperations.push((async () => {
                     const { error: e1 } = await supabase.from('recurrent_spends').delete().eq('user_id', userId).in('category', ['income', 'salary']);
                     if (e1) { console.error("DEL_ERR_INC:", e1); throw e1; }
                     if (combinedRecurrent.length > 0) {
                         const { error: e2 } = await supabase.from('recurrent_spends').insert(combinedRecurrent);
                         if (e2) { console.error("INS_ERR_INC:", e2); throw e2; }
                     }
                 })());
            } else {
                 syncOperations.push((async () => {
                     const { error: e1 } = await supabase.from('recurrent_spends').delete().eq('user_id', userId);
                     if (e1) { console.error("DEL_ERR_ALL:", e1); throw e1; }
                     if (combinedRecurrent.length > 0) {
                         const { error: e2 } = await supabase.from('recurrent_spends').insert(combinedRecurrent);
                         if (e2) { console.error("INS_ERR_ALL:", e2); throw e2; }
                     }
                 })());
            }
        }

        if (body.categoryBudgets !== undefined) {
            const sanitized = Object.entries(body.categoryBudgets).map(([cat, amt]) => ({
                user_id: userId,
                category: cat,
                amount: Number(amt),
            }));
            syncOperations.push(
                supabase.from('category_budgets')
                    .delete().eq('user_id', userId)
                    .then(() => supabase.from('category_budgets').insert(sanitized))
            );
        }

        if (body.goals !== undefined) {
            const sanitized = body.goals.map(g => ({
                id: g.id,
                user_id: userId,
                name: g.name,
                emoji: g.emoji,
                target_amount: g.targetAmount,
                current_amount: g.savedAmount,
                target_date: g.deadline,
                created_at: g.createdAt || new Date().toISOString(),
            }));
            syncOperations.push(
                supabase.from('savings_goals')
                    .delete().eq('user_id', userId)
                    .then(() => supabase.from('savings_goals').insert(sanitized))
            );
        }

        const results = await withTimeout(
            Promise.allSettled(syncOperations),
            5000,
            'Persistence POST'
        );

        results.forEach(r => {
            if (r.status === 'rejected' && process.env.NODE_ENV === 'development') {
                console.error('Sync operation failed:', r.reason);
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Persistence POST failed:', error);
        }
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
