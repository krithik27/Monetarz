"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
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
                        <ShieldCheck className="w-3 h-3" />
                        Legal & Transparency
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black lowercase tracking-tighter mb-12">
                        Privacy Policy<span className="text-orange-500">.</span>
                    </h1>

                    <div className="prose prose-brand-ink text-brand-sage leading-relaxed space-y-12 text-lg">
                        <section>
                            <h2 className="text-brand-ink font-bold lowercase text-2xl mb-4">the short version</h2>
                            <p>
                                we aren&apos;t interest in your secrets, only in helping you understand your capital. your data is encrypted, your identity is yours, and we never sell your attention.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-brand-ink font-bold lowercase text-2xl mb-4">data collection</h2>
                            <p>
                                we collect only what is necessary to run monetarz: your account email, your journal entries (which are encrypted at rest), and transactional metadata for categorization.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-brand-ink font-bold lowercase text-2xl mb-4">how we use it</h2>
                            <p>
                                your entries are processed by our intelligence layer to provide you with insights. this data never leaves the platform for advertising or third-party tracking.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-brand-ink font-bold lowercase text-2xl mb-4">your rights</h2>
                            <p>
                                you can export or delete your entire history at any time from the account settings. once deleted, it is gone forever.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </section>
        </main>
    );
}
