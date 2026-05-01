"use client";

import { PricingSection } from "@/components/ui/landing/pricing-card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PricingPage() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-brand-cream text-brand-ink font-sans selection:bg-orange-500/30 relative overflow-hidden">
            <div className="polymath-glow" />
            
            <div className="absolute top-8 left-8 z-50">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-brand-moss/60 hover:text-brand-moss transition-all duration-300 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-sans tracking-widest uppercase font-bold">back</span>
                </button>
            </div>

            <PricingSection />
        </main>
    );
}
