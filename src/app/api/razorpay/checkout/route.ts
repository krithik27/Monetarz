export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { razorpay } from '@/lib/razorpay';

/**
 * PLAN CONFIGURATION
 * Maps plan IDs to amount in paise (₹1 = 100 paise)
 */
const PLANS = {
    pro_monthly: { amount: 29900, name: "Monetarz Pro Monthly", period: "month" },
    pro_quarterly: { amount: 79900, name: "Monetarz Pro Quarterly", period: "3 months" },
    pro_yearly: { amount: 249900, name: "Monetarz Pro Yearly", period: "year" },
};

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll().map((cookie) => ({
                        name: cookie.name,
                        value: cookie.value,
                    }));
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const planId = body.planId as keyof typeof PLANS;

    const plan = PLANS[planId];
    if (!plan) {
        return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    try {
        const order = await razorpay.orders.create({
            amount: plan.amount,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: user.id,
                planId: planId,
                email: user.email ?? ""
            }
        });

        return NextResponse.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            name: plan.name,
            description: `Unlock ${plan.period} of Horizon Pro & AI Advice`,
            prefill: {
                email: user.email,
            }
        });
    } catch (error) {
        console.error('Razorpay order creation failed:', error);
        return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 });
    }
}
