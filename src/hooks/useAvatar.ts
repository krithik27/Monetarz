/**
 * useAvatar
 *
 * Shared hook that builds a DiceBear Adventurer SVG URL from user metadata.
 * Falls back gracefully to the user's email (or a static seed) if no avatar
 * has been chosen yet.
 *
 * API reference: https://www.dicebear.com/styles/adventurer/
 */

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

export const AVATAR_BG_PRESETS = [
    { label: "Cream",  value: "fdfcf8", tailwind: "bg-[#fdfcf8] border-brand-lichen/40" },
    { label: "Moss",   value: "4a5d4e", tailwind: "bg-[#4a5d4e] border-brand-moss/40"   },
    { label: "Sky",    value: "bae6fd", tailwind: "bg-[#bae6fd] border-sky-200"          },
    { label: "Ink",    value: "1a1c1a", tailwind: "bg-[#1a1c1a] border-brand-ink/40"    },
] as const;

export type AvatarBgPreset = (typeof AVATAR_BG_PRESETS)[number];

export interface AvatarConfig {
    seed: string;
    bg: string;   // hex without #
    flip: boolean;
}

/** Build a fully-qualified DiceBear Adventurer SVG URL */
export function buildAvatarUrl(config: AvatarConfig): string {
    const params = new URLSearchParams({
        seed: config.seed,
        backgroundColor: config.bg,
        ...(config.flip ? { flip: "true" } : {}),
    });
    return `https://api.dicebear.com/9.x/adventurer/svg?${params.toString()}`;
}

/** Returns the current user's avatar URL and raw config */
export function useAvatar() {
    const { user } = useAuth();

    const config = useMemo<AvatarConfig>(() => {
        const meta = user?.user_metadata ?? {};
        return {
            seed:  meta.avatar_seed  ?? (user?.email || "monetarz-user"),
            bg:    meta.avatar_bg    ?? AVATAR_BG_PRESETS[0].value,
            flip:  meta.avatar_flip  ?? false,
        };
    }, [user]);

    const avatarUrl = useMemo(() => buildAvatarUrl(config), [config]);

    return { avatarUrl, config };
}
