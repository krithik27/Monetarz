"use client";

import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import Link from "next/link";
import { Sparkles, Activity, Shield } from "lucide-react";
import { SocialProofAvatars } from "./social-proof-avatars";
import { FeatureSection } from "./feature-section";
import { PricingSection } from "./pricing-card";
import { ScreenshotStack } from "./screenshot-stack";
import { useAuth } from "@/context/AuthContext";

function FeatureCard({ item, i }: { item: any, i: number }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: i * 0.1 }}
            viewport={{ once: true }}
            className="group relative p-10 rounded-[3rem] bg-white border border-brand-lichen/20 hover:border-orange-500/30 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-brand-moss/5"
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            400px circle at ${mouseX}px ${mouseY}px,
                            rgba(249, 115, 22, 0.05),
                            transparent 80%
                        )
                    `,
                }}
            />
            <div className={`relative z-10 w-16 h-16 rounded-2xl bg-brand-cream flex items-center justify-center text-orange-500 mb-8 group-hover:scale-110 transition-transform duration-500`}>
                {item.icon}
            </div>
            <h3 className="relative z-10 text-3xl text-brand-ink mb-6 font-bold lowercase tracking-tight">{item.title}</h3>
            <p className="relative z-10 text-lg text-brand-sage font-light leading-relaxed lowercase">
                {item.desc}
            </p>
        </motion.div>
    );
}

export function LandingContent() {
    const { user, signOut } = useAuth();

    return (
        <main className="min-h-screen bg-brand-cream text-brand-ink font-sans selection:bg-orange-500/30 overflow-hidden relative">
            <div className="polymath-glow" />

            {/* Navbar */}
            <nav className="relative z-20 flex justify-between items-center py-8 px-8 md:px-16 w-full max-w-7xl mx-auto">
                <div className="text-3xl font-bold tracking-tight text-brand-ink lowercase">
                    monetarz<span className="text-orange-500">.</span>
                </div>
                <div className="flex items-center gap-10">
                    <Link href="#philosophy" className="text-sm font-medium lowercase opacity-40 hover:opacity-100 transition-opacity hidden md:block">philosophy</Link>
                    <Link href="#pricing" className="text-sm font-medium lowercase opacity-40 hover:opacity-100 transition-opacity hidden md:block">pricing</Link>
                    {user ? (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={async () => { await signOut(); window.location.href = "/"; }}
                                className="text-sm font-medium lowercase opacity-40 hover:opacity-100 transition-opacity"
                            >
                                sign out
                            </button>
                            <Link
                                href="/account"
                                className="px-8 py-3 rounded-full bg-brand-ink text-brand-cream hover:bg-brand-moss transition-all text-sm font-medium lowercase shadow-lg shadow-brand-ink/10"
                            >
                                dashboard
                            </Link>
                        </div>
                    ) : (
                        <Link
                            href="/sign-in"
                            className="px-8 py-3 rounded-full bg-brand-ink text-brand-cream hover:bg-brand-moss transition-all text-sm font-medium lowercase shadow-lg shadow-brand-ink/10"
                        >
                            enter journal
                        </Link>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 flex flex-col items-center justify-center pt-32 pb-48 px-6 text-center max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="relative"
                >
                    {/* Handwritten Annotation 1 */}
                    <div className="absolute -top-12 -left-12 md:-left-24 font-accent text-orange-500 text-xl md:text-2xl hidden lg:block -rotate-12 transition-transform hover:rotate-0 duration-500">
                        curing brain rot...
                        <svg className="w-16 h-12 mt-2" viewBox="0 0 100 50">
                            <path d="M10,10 Q50,40 90,10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M85,5 L95,15 L85,25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/5 border border-orange-500/10 text-orange-600 text-[10px] tracking-widest uppercase mb-12 backdrop-blur-sm font-bold">
                        <Sparkles className="w-3 h-3" />
                        a new standard of awareness
                    </div>

                    <h1 className="text-6xl md:text-9xl text-brand-ink leading-[0.9] tracking-tighter mb-10 font-black lowercase max-w-4xl mx-auto">
                        money that <br />
                        <span className="font-serif italic font-light text-orange-500 relative inline-block">
                            breathes.
                            <svg className="absolute -bottom-2 left-0 w-full h-3 text-orange-200/50" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0,5 Q50,10 100,5" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                            </svg>
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-brand-sage max-w-2xl mx-auto mb-16 font-light leading-relaxed lowercase">
                        leave the rigid <span className="line-through opacity-40">spreadsheets</span> behind. <br />
                        experience a <span className="highlighter text-brand-ink font-medium">mindful flow</span> of capital through <br />
                        elegant narratives and reflection.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <div className="flex items-center p-1.5 rounded-2xl bg-white border border-brand-lichen/30 shadow-xl shadow-brand-moss/5 w-full md:w-auto transition-transform hover:scale-[1.02] duration-300">
                            <input
                                type="email"
                                placeholder="enter your email..."
                                className="bg-transparent px-6 py-3 w-full md:w-64 focus:outline-none text-brand-ink lowercase font-light"
                            />
                            <button className="px-8 py-3 rounded-xl bg-orange-500 text-brand-cream hover:bg-orange-600 transition-all font-bold lowercase whitespace-nowrap">
                                join waitlist
                            </button>
                        </div>
                    </div>

                    {/* Handwritten Annotation 2 */}
                    <div className="absolute -bottom-12 right-0 md:-right-16 font-accent text-brand-moss text-lg md:text-xl hidden lg:block rotate-6 transition-transform hover:rotate-0 duration-500">
                        <svg className="w-16 h-12 mb-2 rotate-180" viewBox="0 0 100 50">
                            <path d="M10,10 Q50,40 90,10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M85,5 L95,15 L85,25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        by mindful people.
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="mt-24"
                    >
                        <SocialProofAvatars
                            avatars={[
                                { src: "https://api.dicebear.com/9.x/adventurer/svg?seed=Felix", alt: "User 1" },
                                { src: "https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka", alt: "User 2" },
                                { src: "https://api.dicebear.com/9.x/adventurer/svg?seed=Jude", alt: "User 3" },
                                { src: "https://api.dicebear.com/9.x/adventurer/svg?seed=Oliver", alt: "User 4" },
                            ]}
                            extraCount={1}
                        >
                            <p className="text-[10px] tracking-widest uppercase opacity-30 mt-4 font-bold">trusted by n+ mindful investors</p>
                        </SocialProofAvatars>
                    </motion.div>
                </motion.div>
            </section>

            {/* Screenshot Stack Section */}
            
            {/* Feature Section */}
            <FeatureSection />

            {/* Pricing Section */}
            <PricingSection />

            {/* Footer */}
            <footer className="relative z-10 py-24 text-center bg-brand-cream border-t border-brand-lichen/10">
                <div className="text-3xl font-bold tracking-tight text-brand-ink lowercase mb-8">
                    monetarz<span className="text-orange-500">.</span>
                </div>
                <div className="flex justify-center gap-8 mb-10">
                    <Link href="/privacy" className="text-[10px] uppercase tracking-widest text-brand-sage hover:text-brand-ink transition-colors font-bold">privacy policy</Link>
                    <Link href="/terms" className="text-[10px] uppercase tracking-widest text-brand-sage hover:text-brand-ink transition-colors font-bold">terms</Link>
                    <Link href="/refund" className="text-[10px] uppercase tracking-widest text-brand-sage hover:text-brand-ink transition-colors font-bold">refund policy</Link>
                </div>
                <p className="text-brand-sage text-sm tracking-[.3em] uppercase mb-10 font-bold opacity-40">awareness &bull; capital &bull; flow</p>
                <p className="text-brand-sage/40 text-[10px] tracking-widest font-bold uppercase">&copy; {new Date().getFullYear()} monetarz. designed for the mindful.</p>
            </footer>
        </main>
    );
}
