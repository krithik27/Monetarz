"use client";

import { SpendsProvider } from "@/context/SpendsContext";
import { AnalyticsProvider } from "@/context/AnalyticsContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ToastProvider } from "@/components/ui/toast";
import { useIdleGuard } from "@/hooks/useIdleGuard";
import { InactivityModal } from "@/features/auth/components/InactivityModal";
import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Particles from "@/components/ui/particles";

function AppGate({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading) return;

        // Clean pathname to remove trailing slashes for robust matching
        const cleanPathname = pathname.replace(/\/$/, "") || "/";
        const publicRoutes = ["/sign-in", "/", "/privacy", "/terms", "/refund", "/pricing"];

        if (!user && !publicRoutes.includes(cleanPathname)) {
            router.push(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
            return;
        }
    }, [user, isLoading, pathname, router]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-brand-cream text-brand-sage gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-brand-lichen border-t-brand-moss animate-spin" />
                <p className="text-xs font-serif tracking-[0.3em] uppercase opacity-60">Loading...</p>
            </div>
        );
    }

    // Allow access to sign-in and root landing even if not logged in
    const cleanPathname = pathname.replace(/\/$/, "") || "/";
    const isPublicRoute = ["/sign-in", "/", "/privacy", "/terms", "/refund", "/pricing"].includes(cleanPathname);
    
    if (!user && !isPublicRoute) {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
}

function IdleGuardWrapper({ children }: { children: ReactNode }) {
    const { isWarningOpen, isIdle, countdown, handleStaySignedIn } = useIdleGuard();

    return (
        <>
            <Particles
                className="fixed inset-0 z-[-1] pointer-events-none"
                quantity={75}
                ease={50}
                color="#4A5D4E"
                size={1.2}
                staticity={25}
                refresh
                paused={isIdle}
            />
            {children}
            <InactivityModal
                isOpen={isWarningOpen}
                countdown={countdown}
                onStaySignedIn={handleStaySignedIn}
            />
        </>
    );
}


export function Providers({ children }: { children: ReactNode }) {
    return (
        <ToastProvider>
            <AuthProvider>
                <CurrencyProvider>
                    <AppGate>
                        <IdleGuardWrapper>
                            <AnalyticsProvider>
                                <SpendsProvider>
                                    {children}
                                </SpendsProvider>
                            </AnalyticsProvider>
                        </IdleGuardWrapper>
                    </AppGate>
                </CurrencyProvider>
            </AuthProvider>
        </ToastProvider>
    );
}
