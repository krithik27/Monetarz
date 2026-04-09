"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

export default function TermsPage() {
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
                        <Scale className="w-3 h-3" />
                        Usage & Engagement
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black lowercase tracking-tighter mb-12">
                        Terms of Service<span className="text-orange-500">.</span>
                    </h1>

                    <div className="prose prose-brand-ink text-brand-sage leading-relaxed space-y-12 text-lg">
                        <section>
                            <h2 className="text-brand-ink font-bold lowercase text-2xl mb-4">the agreement</h2>
                            <p>
                                by using monetarz, you agree to these simple rules. we provide a tool for financial mindfulness and journal-based tracking. your capital remains yours, as does your risk.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-brand-ink font-bold lowercase text-2xl mb-4">user responsibility</h2>
                            <p>
                                you are responsible for maintaining the security of your account. monetarz provides awareness but is not a financial advisor. consultation with professionals is always recommended.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-brand-ink font-bold lowercase text-2xl mb-4">proprietary intelligence</h2>
                            <p>
                                our categorization logic, insights, and design language are property of monetarz. you are free to export your data, but not our code.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-brand-ink font-bold lowercase text-2xl mb-4">termination</h2>
                            <p>
                                we reserve the right to suspend accounts that violate our community standards or attempt to compromise our systems.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </section>
        </main>
    );
}
