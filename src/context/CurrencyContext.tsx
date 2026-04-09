"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CurrencyCode } from "@/lib/money";
import { useAuth } from "./AuthContext";

interface CurrencyContextValue {
    activeCurrency: CurrencyCode;
    setActiveCurrency: (currency: CurrencyCode) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

const STORAGE_KEY = "monetarz_active_currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [activeCurrency, setActiveCurrencyState] = useState<CurrencyCode>("INR");
    const [isHydrated, setIsHydrated] = useState(false);

    // Initial load & Sync with Supabase Metadata
    useEffect(() => {
        let defaultCurr: CurrencyCode = "INR";
        const stored = localStorage.getItem(STORAGE_KEY);
        
        // 1. Trust Supabase metadata first if logged in
        if (user?.user_metadata?.base_currency) {
            defaultCurr = user.user_metadata.base_currency as CurrencyCode;
            localStorage.setItem(STORAGE_KEY, defaultCurr);
        } 
        // 2. Otherwise use local storage
        else if (stored) {
            defaultCurr = stored as CurrencyCode;
        }

        setActiveCurrencyState(defaultCurr);
        setIsHydrated(true);
    }, [user?.user_metadata?.base_currency]);

    // Persist to localStorage on change (metadata update handled by Settings page)
    const setActiveCurrency = (currency: CurrencyCode) => {
        setActiveCurrencyState(currency);
        localStorage.setItem(STORAGE_KEY, currency);
    };

    return (
        <CurrencyContext.Provider value={{ activeCurrency, setActiveCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error("useCurrency must be used within a CurrencyProvider");
    }
    return context;
}
