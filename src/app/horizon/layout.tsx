"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Lock } from "lucide-react";
import Image from "next/image";
import roadBlocker from "../../../public/images/road_blocker.webp";

interface HorizonLayoutProps {
    children: ReactNode;
}

export default function HorizonLayout({ children }: HorizonLayoutProps) {
    const { user, isLoading, isPro } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-horizon-base flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-horizon-rim border-t-horizon-blue animate-spin" />
            </div>
        );
    }

    if (!isPro) {
        return (
            <div className="min-h-screen bg-horizon-base flex flex-col items-center justify-center gap-6 px-6 text-center text-horizon-ink font-serif">
                <div className="mb-4">
                    <Image
                        src={roadBlocker}
                        alt="Pro Only"
                        className="w-72 h-72 object-contain"
                        priority
                    />
                </div>
                <h1 className="text-6xl font-sans font-semibold text-orange-400">Horizon is Pro-only</h1>
                <p className="text-horizon-muted max-w-sm text-lg italic font-sans">
                    Upgrade to Monetarz Pro to unlock the full financial command centre.
                    <span className="text-orange-500 font-sans font-medium text-xl italic">(⚠️ This is still under development for free users)</span>
                </p>
                <a
                    href="/"
                    className="px-8 py-4 rounded-2xl bg-orange-500/20 text-orange-500 font-sans font medium text-xl hover:bg-horizon-navy transition-colors shadow-lg shadow-horizon-blue/20"
                >
                    Return to Journal
                </a>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-cream text-horizon-ink font-serif text-base antialiased selection:bg-brand-moss/20">
            <motion.main
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="min-h-screen"
            >
                {children}
            </motion.main>
        </div>
    );
}
