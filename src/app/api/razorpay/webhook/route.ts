import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// SECURE: Use SERVICE_ROLE_KEY to bypass RLS for updating user profiles
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('RAZORPAY_WEBHOOK_SECRET is missing from environment.');
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 1. VERIFY SIGNATURE
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

    if (expectedSignature !== signature) {
        console.warn('Invalid Razorpay signature received.');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2. PARSE PAYLOAD
    let body;
    try {
        body = JSON.parse(rawBody);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { event, payload } = body;

    // 3. HANDLE PAYMENT SUCCESS
    if (event === 'payment.captured' || event === 'subscription.activated') {
        const payment = payload.payment.entity;
        const userId = payment.notes?.userId;
        const planId = payment.notes?.planId;

        if (!userId) {
            console.error('Webhook Error: No userId found in payment notes.');
            return NextResponse.json({ error: 'No user ID' }, { status: 400 });
        }

        // 4. IDEMPOTENCY CHECK (Payment Log)
        const { data: existingPayment } = await supabaseAdmin
            .from('payments_log')
            .select('payment_id')
            .eq('payment_id', payment.id)
            .single();

        if (existingPayment) {
            return NextResponse.json({ status: 'already_processed' });
        }

        try {
            // 5. ATOMIC UPDATE: LOG PAYMENT + UPGRADE USER
            // We use a transaction-like approach by chaining or using a RPC if available, 
            // but here we'll do sequential since we have the payment_log PK as a guard.
            
            await supabaseAdmin.from('payments_log').insert({
                payment_id: payment.id,
                user_id: userId,
                order_id: payment.order_id,
                amount: payment.amount,
                currency: payment.currency,
                status: 'captured'
            });

            // 5. ATOMIC UPGRADE: Create or update profile to ensure user becomes Pro
            const { error: profileError } = await supabaseAdmin
                .from('user_profiles')
                .upsert({ 
                    user_id: userId,
                    is_pro: true,
                    plan_type: planId || 'unknown',
                    updated_at: new Date().toISOString()
                }, { 
                    onConflict: 'user_id' 
                });

            if (profileError) throw profileError;

            if (process.env.NODE_ENV !== 'production') {
                console.log(`Success: User ${userId} upgraded to Pro via Razorpay.`);
            }
            return NextResponse.json({ status: 'success' });
        } catch (error) {
            console.error('Webhook DB Error:', error);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
    }

    return NextResponse.json({ status: 'ignored' });
}
