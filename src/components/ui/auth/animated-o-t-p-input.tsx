"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedOTPInputProps {
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    maxLength?: number;
    className?: string;
}

export function AnimatedOTPInput({
    value,
    onChange,
    onComplete,
    maxLength = 6,
    className,
}: AnimatedOTPInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-complete trigger
    useEffect(() => {
        if (value.length === maxLength && onComplete) {
            onComplete(value);
        }
    }, [value, maxLength, onComplete]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value.replace(/[^0-9]/g, "").slice(0, maxLength);
        onChange(newValue);
    };

    const handleClick = () => {
        inputRef.current?.focus();
    };

    return (
        <div className={cn("relative", className)} onClick={handleClick}>
            {/* Hidden Input */}
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                className="absolute inset-0 opacity-0 cursor-default"
                autoFocus
                autoComplete="one-time-code"
            />

            {/* Visual Slots */}
            <div className="flex gap-4">
                {Array.from({ length: maxLength }).map((_, i) => {
                    const char = value[i];
                    const isFocused = i === value.length;

                    return (
                        <motion.div
                            key={i}
                            initial={false}
                            animate={{
                                borderColor: isFocused ? "#4A5D4E" : "rgba(74, 93, 78, 0.2)",
                                scale: isFocused ? 1.05 : 1,
                            }}
                            className={cn(
                                "w-12 h-16 border-2 rounded-2xl bg-white/50 backdrop-blur-sm flex items-center justify-center text-2xl font-serif text-brand-ink transition-all duration-300",
                                isFocused && "shadow-lg"
                            )}
                        >
                            {char ? (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    {char}
                                </motion.span>
                            ) : isFocused ? (
                                <motion.div
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="w-0.5 h-8 bg-brand-moss"
                                />
                            ) : null}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
