"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function RefundPage() {
    return (
        <main className="min-h-screen bg-brand-cream text-brand-ink font-sans selection:bg-orange-500/30 overflow-hidden relative pb-32">
            <div className="polymath-glow" />

            <nav className="relative z-20 flex justify-between items-center py-8 px-8 md:px-16 w-full max-w-7xl mx-auto">
                <Link href="/" className="text-3xl font-bold tracking-tight text-brand-ink lowercase group flex items-center gap-2">
                    <ArrowLeft className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    monetarz<span className="text-orange-500">.</span>
                </Link>
            </nav>

            <section className="relative z-10 max-w-3xl mx-auto pt-24 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-moss/5 border border-brand-moss/10 text-brand-moss text-[10px] tracking-widest uppercase mb-12 backdrop-blur-sm font-bold">
                        <RefreshCw className="w-3 h-3" />
                        Our Commitment
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black lowercase tracking-tighter mb-12">
                        Refund Policy<span className="text-orange-500">.</span>
                    </h1>

                    <div className="prose prose-brand-ink text-brand-sage leading-relaxed space-y-12 text-lg">
                        <section>
                            <h2 className="text-brand-ink font-bold lowercase text-2xl mb-4">transparency first</h2>
                            <p>
                                we want you to be 100% satisfied with monetarz. if you find our platform isn&apos;t clear enough, we are committed to making it right.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-brand-ink font-bold lowercase text-2xl mb-4">refund window</h2>
                            <p>
                                we offer a 7-day, no-questions-asked refund policy for all our premium subscriptions. if you change your mind within a week of purchase, you can contact us at hello@monetarz.com for a full refund.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-brand-ink font-bold lowercase text-2xl mb-4">processing time</h2>
                            <p>
                                once a refund is approved, it will be processed and credited back to your original payment method within 5-10 business days, depending on your bank.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-brand-ink font-bold lowercase text-2xl mb-4">contact us</h2>
                            <p>
                                for any questions regarding billing or refunds, email us at k-m-p@monetarz.co and we will respond within 24 hours.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </section>
        </main>
    );
}
