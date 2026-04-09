import { FeedbackView } from "@/components/feedback-view";
import { Navbar } from "@/components/navbar";

export default function FeedbackPage() {
    return (
        <main className="min-h-screen bg-brand-cream text-brand-ink font-sans selection:bg-orange-500/30 relative overflow-hidden">
            <div className="polymath-glow" />

            <Navbar />

            <div className="relative z-10 flex flex-col items-center justify-start min-h-screen w-full pt-32 pb-20 px-4 md:px-8">
                <div className="w-full max-w-7xl">
                    <FeedbackView />
                </div>
            </div>
        </main>
    );
}
