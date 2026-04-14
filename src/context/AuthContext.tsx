"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

// The admin email is set in NEXT_PUBLIC_ADMIN_EMAIL in .env.local
// and carried into the browser because it's not a secret — it just identifies the admin user.
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

type AuthContextType = {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    signInWithGoogle: () => Promise<{ error: any }>;
    signInWithOtp: (email: string) => Promise<{ error: any }>;
    verifyOtp: (email: string, token: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    isAdmin: boolean;
    isPro: boolean;
    /** Admin-only: toggle app between Pro and Free tier for testing */
    toggleProTier: () => void;
    updateUserMetadata: (data: Record<string, any>) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    // Admin-controlled Pro/Free override. Persisted in localStorage.
    // Defaults to true (the dev/admin always starts in Pro mode).
    const [proTierOverride, setProTierOverride] = useState<boolean>(true);
    // Track DB-backed Pro status securely
    const [dbIsPro, setDbIsPro] = useState<boolean>(false);

    // Auth Initialization

    useEffect(() => {
        // Restore proTierOverride from localStorage
        const storedOverride = typeof window !== 'undefined'
            ? localStorage.getItem('monetarz_pro_override')
            : null;
        if (storedOverride !== null) {
            setProTierOverride(storedOverride === 'true');
        }

        // Initial session check
        const init = async () => {

            // NOTE: getSession() is used intentionally here for browser-side session hydration only.
            // It reads from the local cache and does NOT re-validate against Supabase servers.
            // ⚠️ Do NOT use getSession() for server-side auth decisions — use getUser() instead.
            // All Server Actions and API routes in this codebase correctly use supabase.auth.getUser().
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
            
            if (session?.user?.id) {
                const { data } = await supabase.from('user_profiles').select('is_pro').eq('user_id', session.user.id).single();
                setDbIsPro(!!data?.is_pro);
            } else {
                setDbIsPro(false);
            }
        };
        init();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);

            if (session?.user?.id) {
                const { data } = await supabase.from('user_profiles').select('is_pro').eq('user_id', session.user.id).single();
                setDbIsPro(!!data?.is_pro);
            } else {
                setDbIsPro(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const redirectTo = typeof window !== 'undefined'
            ? `${window.location.origin}/`
            : undefined;

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
        return { error };
    };

    const signInWithOtp = async (email: string) => {
        const emailRedirectTo = typeof window !== 'undefined'
            ? `${window.location.origin}/`
            : undefined;

        return await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
                emailRedirectTo,
            },
        });
    };

    const verifyOtp = async (email: string, token: string) => {
        return await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email'
        });
    };

    const signOut = async () => {
        try {
            // Attempt to sign out from Supabase with a fast timeout to prevent UI hang in dev/poor network
            const signOutPromise = supabase.auth.signOut();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Sign out timed out")), 1500)
            );

            await Promise.race([signOutPromise, timeoutPromise]).catch(err => {
                console.warn("Supabase signOut warning or timeout:", err);
            });
        } catch (error) {
            console.error("Supabase signOut error:", error);
        } finally {
            // 2. FORCE clear everything locally regardless of server response
            if (typeof window !== 'undefined') {
                // Clear specific auth and dev state
                localStorage.removeItem('monetarz_pro_override');
                // We could do localStorage.clear() but let's be slightly more targeted if needed.
                // Actually, for a clean sign out, clear is best.
                localStorage.clear(); 
                
                // Clear session cookies
                const cookies = document.cookie.split(";");
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i];
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                }
            }

            // Reset local React state immediately
            setSession(null);
            setUser(null);
            setDbIsPro(false);
        }
    };

    const updateUserMetadata = async (data: Record<string, any>) => {
        const { data: userData, error } = await supabase.auth.updateUser({ data });
        if (!error && userData.user) setUser(userData.user);
        return { error };
    };

    /**
     * isAdmin: true if in local dev mode OR if the logged-in email matches ADMIN_EMAIL.
     * ADMIN_EMAIL is set in .env.local and is not a secret — it identifies the admin user.
     */
    const isAdmin = useMemo(() => {
        if (!ADMIN_EMAIL) return false;
        const email = user?.email ?? user?.user_metadata?.email;
        return email === ADMIN_EMAIL;
    }, [user]);

    /**
     * isPro: 
     * - Admin users get the proTierOverride (toggled in Settings).
     * - Regular users get Pro based on their secure `user_profiles` db entry.
     */
    const isPro = useMemo(() => {
        if (isAdmin) return proTierOverride;
        return dbIsPro;
    }, [isAdmin, proTierOverride, dbIsPro]);

    /**
     * toggleProTier: Admin-only. Switches the app between Pro and Free for testing.
     * Persisted in localStorage so it survives page refreshes.
     */
    const toggleProTier = () => {
        const newVal = !proTierOverride;
        setProTierOverride(newVal);
        localStorage.setItem('monetarz_pro_override', String(newVal));
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            isLoading,
            signInWithGoogle,
            signInWithOtp,
            verifyOtp,
            signOut,
            isAdmin,
            isPro,
            toggleProTier,
            updateUserMetadata
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
