import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    cream: "#FDFCF8",
                    ink: "#1A1C1A",
                    moss: "#4A5D4E",
                    sage: "#8FA18F",
                    lichen: "#C2CDBE",
                    mist: "#E8EBE4",
                    coral: "#ff746c", // High Alert / Anomaly Base
                    rust: "#D85F58",  // Text / Darker Variant
                },
                horizon: {
                    // Background & surfaces (light-mode aligned)
                    base: "#F5F7FA",        // Near-white cool base
                    card: "#FFFFFF",        // Pure white card surface
                    rim: "#E2E8F0",         // Subtle card rim (slate-200)
                    // Text
                    ink: "#1E293B",         // Slate-800 – primary text
                    muted: "#64748B",       // Slate-500 – secondary text
                    ghost: "#94A3B8",       // Slate-400 – disabled / hint
                    // Horizon blues – accent / pro identity
                    blue: "#3B82F6",        // Blue-500 – primary accent
                    navy: "#1D4ED8",        // Blue-700 – active states
                    sky: "#BAE6FD",         // Sky-200 – subtle highlight fills
                    // Semantic status
                    gain: "#14db5dff",        // Green-700 – inflow
                    spend: "#DC2626",       // Red-600 – outflow
                    safe: "#15803D",        // Green-700 – budget on track
                    caution: "#FFC708",     // 
                    breach: "#DC2626",      // Red-600 – exceeded
                },
            },
            fontFamily: {
                serif: ["var(--font-serif)", "serif"],
                sans: ["var(--font-sans)", "sans-serif"], // Cabinet Grotesk as primary sans
                accent: ["var(--font-accent)", "cursive"], // Indie Flower – handwritten feel
            },
            animation: {
                breathing: "breathing 6s ease-in-out infinite",
                rippling: "rippling var(--duration) linear forwards",
                "gradient-x": "gradient-x 15s ease infinite",
            },
            keyframes: {
                breathing: {
                    "0%, 100%": { transform: "scale(1)" },
                    "50%": { transform: "scale(1.01)" },
                },
                rippling: {
                    "0%": { transform: "scale(0)", opacity: "0.35" },
                    "100%": { transform: "scale(4)", opacity: "0" },
                },
                "gradient-x": {
                    "0%, 100%": {
                        "background-size": "200% 200%",
                        "background-position": "left center",
                    },
                    "50%": {
                        "background-size": "200% 200%",
                        "background-position": "right center",
                    },
                },
            },
        },
    },
    plugins: [
        require("@tailwindcss/typography"),
    ],
};
export default config;
