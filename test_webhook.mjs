import crypto from 'crypto';

const WEBHOOK_SECRET = 'test_webhook_secret_123';
const WEBHOOK_URL = 'http://localhost:3000/api/razorpay/webhook';

// Dummy data for testing
const payload = {
    entity: 'event',
    account_id: 'acc_test_123',
    event: 'payment.captured',
    contains: ['payment'],
    payload: {
        payment: {
            entity: {
                id: `pay_${Date.now()}`,
                entity: 'payment',
                amount: 29900,
                currency: 'INR',
                status: 'captured',
                order_id: `order_${Date.now()}`,
                invoice_id: null,
                international: false,
                method: 'card',
                amount_refunded: 0,
                refund_status: null,
                captured: true,
                description: 'Unlock month of Horizon Pro & AI Advice',
                card_id: 'card_test_123',
                bank: null,
                wallet: null,
                vpa: null,
                email: 'test@example.com',
                contact: '+919876543210',
                notes: {
                    userId: '61cba441-a75d-4500-9952-289669c052f7', // Your specific user ID
                    planId: 'pro_monthly',
                    email: 'test@example.com'
                },
                fee: 598,
                tax: 91,
                error_code: null,
                error_description: null,
                error_source: null,
                error_step: null,
                error_reason: null,
                acquirer_data: {
                    auth_code: '123456'
                },
                created_at: Math.floor(Date.now() / 1000)
            }
        }
    },
    created_at: Math.floor(Date.now() / 1000)
};

const payloadString = JSON.stringify(payload);

const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payloadString)
    .digest('hex');

console.log('Sending webhook payload...');
console.log('Signature:', signature);

try {
    const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-razorpay-signature': signature
        },
        body: payloadString
    });

    const text = await response.text();
    console.log(`Status: ${response.status}`);
    try {
        console.log('Response:', JSON.parse(text));
    } catch (e) {
        console.log('Response Text:', text.slice(0, 500));
    }
} catch (err) {
    console.error('Failed to send webhook:', err);
}
