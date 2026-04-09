"use client";

import { useState } from 'react';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext';

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: any) => void;
    prefill: {
        email: string;
    };
    theme: {
        color: string;
    };
}

export function useRazorpay() {
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();

    const openCheckout = async (planId: string) => {
        if (!user) {
            window.location.href = '/sign-in';
            return;
        }

        setIsLoading(true);
        try {
            // 1. Create Order on our backend
            const response = await fetch('/api/razorpay/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });

            const order = await response.json();

            if (order.error) {
                alert(order.error);
                return;
            }

            // 2. Initialize Razorpay Modal
            const options: RazorpayOptions = {
                key: order.key,
                amount: order.amount,
                currency: order.currency,
                name: order.name,
                description: order.description,
                order_id: order.id,
                handler: function (response: any) {
                    // This is just for local UI feedback
                    // THE REAL UPGRADE HAPPENS IN THE WEBHOOK
                    alert("Payment received! Your account will be upgraded in a few seconds. Please refresh the page.");
                    window.location.reload();
                },
                prefill: {
                    email: order.prefill.email,
                },
                theme: {
                    color: "#2D4A22", // brand-moss
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error('Razorpay process failed:', error);
            alert("Could not initialize payment. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    return { openCheckout, isLoading };
}

export default function RazorpayScript() {
    return (
        <Script
            id="razorpay-checkout-js"
            src="https://checkout.razorpay.com/v1/checkout.js"
        />
    );
}
