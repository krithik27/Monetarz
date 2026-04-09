"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { BudgetVelocityCheck } from "@/lib/horizon-prediction";
import {
    Trash2,
    Check,
    X,
    TrendingUp,
    TrendingDown,
    Activity,
    Settings2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_METADATA } from "./RhythmBoard";

// CATEGORY_ICONS removed in favor of CATEGORY_METADATA

export const LaneCard = ({
    velocity,
    onEdit,
    onDelete
}: {
    velocity: BudgetVelocityCheck;
    onEdit: (limit: number) => void;
    onDelete: () => void;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(velocity.budget.toString());

    const paceText = velocity.willBreach
        ? `${Math.round(velocity.projectedPercent - 100)}% over pace`
        : `${Math.round(100 - velocity.projectedPercent)}% under pace`;

    const handleSave = () => {
        onEdit(parseInt(editValue) || 0);
        setIsEditing(false);
    };

    const metadata = CATEGORY_METADATA[velocity.category] || CATEGORY_METADATA.other;
    const Icon = metadata.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ translateY: -4 }}
            className="group bg-white/40 backdrop-blur-md hover:bg-white p-6 rounded-[2rem] border border-white/60 hover:border-horizon-blue/40 transition-all duration-500 hover:shadow-lg"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center ${metadata.color}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="text-xl font-serif text-horizon-ink tracking-tight capitalize">{velocity.category}</h4>
                        <p className="text-[10px] uppercase tracking-widest text-horizon-muted font-sans font-bold mt-0.5">
                            {metadata.label}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-horizon-blue/10 rounded-xl text-horizon-muted hover:text-horizon-blue transition-all">
                        <Settings2 className="size-4" />
                    </button>
                    <button onClick={onDelete} className="p-2 hover:bg-rose-50 rounded-xl text-horizon-muted hover:text-rose-500 transition-all">
                        <Trash2 className="size-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <div className="h-2 w-full bg-horizon-base/50 rounded-full overflow-hidden">
                    <motion.div
                        className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            velocity.willBreach ? "bg-horizon-spend" : "bg-horizon-safe"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, velocity.spentPercent)}%` }}
                    />
                </div>

                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-serif italic text-horizon-muted">₹</span>
                                <input
                                    autoFocus
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                    className="w-20 bg-transparent border-b border-horizon-blue text-lg font-sans font-bold outline-none"
                                />
                                <button onClick={handleSave} className="text-emerald-500 hover:text-emerald-600">
                                    <Check className="size-4" />
                                </button>
                                <button onClick={() => setIsEditing(false)} className="text-horizon-muted hover:text-red-400">
                                    <X className="size-4" />
                                </button>
                            </div>
                        ) : (
                             <p className="text-sm font-sans font-medium text-horizon-ink/60">
                                <span className="font-bold">₹{Math.round(velocity.spentToDate).toLocaleString()}</span> <span className="opacity-40 text-[10px] uppercase tracking-wider">of</span> <span className="text-horizon-ink font-bold">₹{velocity.budget.toLocaleString()}</span>
                            </p>
                        )}
                        <p className={cn(
                            "text-xs font-medium tracking-wide flex items-center gap-1.5",
                            velocity.willBreach ? "text-horizon-spend" : "text-horizon-safe"
                        )}>
                            {velocity.willBreach ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                            <span className="font-sans font-bold uppercase tracking-wider">{paceText}</span>
                        </p>
                    </div>
                    <span className={cn(
                        "text-3xl font-sans font-bold leading-none",
                        velocity.willBreach ? "text-horizon-spend" : "text-horizon-safe"
                    )}>
                        {Math.round(velocity.spentPercent)}%
                    </span>
                </div>
            </div>
        </motion.div>
    );
};
