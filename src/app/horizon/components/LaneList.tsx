"use client";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { BudgetVelocityCheck } from "@/lib/horizon-prediction";
import { LaneCard } from "./LaneCard";
import { Activity } from "lucide-react";

export const LaneList = ({
    lanes,
    onEditLane,
    onDeleteLane,
    onPromptAdd,
    isAdding
}: {
    lanes: BudgetVelocityCheck[];
    onEditLane: (category: string, limit: number) => void;
    onDeleteLane: (category: string) => void;
    onPromptAdd: () => void;
    isAdding?: boolean;
}) => {
    return (
        <div className="space-y-6 px-2">
            <AnimatePresence mode="popLayout">
                {lanes.map((lane) => (
                    <LaneCard
                        key={lane.category}
                        velocity={lane}
                        onEdit={(val) => onEditLane(lane.category, val)}
                        onDelete={() => onDeleteLane(lane.category)}
                    />
                ))}
            </AnimatePresence>

            {lanes.length === 0 && !isAdding && (
                <div className="py-24 text-center space-y-10 flex flex-col items-center">
                    <div className="size-24 rounded-[2.5rem] bg-white border border-horizon-rim/10 flex items-center justify-center shadow-sm">
                        <Activity className="size-10 text-horizon-blue/20" />
                    </div>
                    <div>
                        <p className="text-3xl font-serif text-horizon-ink/40 tracking-tight leading-relaxed">
                            What would make this month <span className="italic">peaceful?</span>
                        </p>
                        <button
                            onClick={onPromptAdd}
                            className="mt-6 text-horizon-blue font-serif italic hover:underline underline-offset-[12px] decoration-horizon-blue/30 text-xl transition-all"
                        >
                            Define your first lane
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
