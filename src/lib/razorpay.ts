import Razorpay from 'razorpay';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
        // Fallback for build time
        console.warn("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing. This is OK during build time if using dynamic routes, but will fail at runtime.");
    }
}

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_stub',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_stub',
});
