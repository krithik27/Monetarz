"use client";

import React, { useState, useEffect } from "react";
import { Zap, BarChart3, Database, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";

interface Quota {
    id: string;
    name: string;
    used: number;
    total: number;
    unit: string;
    color: string;
    icon: any;
}

export function UsageLogsMeter() {
    const [quotas, setQuotas] = useState<Quota[]>([
        { id: "logs", name: "Monthly Log Rows", used: 12450, total: 50000, unit: "rows", color: "bg-blue-500", icon: BarChart3 },
        { id: "storage", name: "DB Storage", used: 420, total: 512, unit: "MB", color: "bg-purple-500", icon: Database },
        { id: "assets", name: "Media Assets", used: 15, total: 100, unit: "files", color: "bg-emerald-500", icon: HardDrive },
    ]);

    return (
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[#F1F5F9] h-full flex flex-col justify-between">
            <div className="space-y-8">
                {quotas.map((quota) => {
                    const percent = (quota.used / quota.total) * 100;
                    return (
                        <div key={quota.id} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-xl", quota.color.replace('bg-', 'bg-').replace('500', '50'))}>
                                        <quota.icon className={cn("h-4 w-4", quota.color.replace('bg-', 'text-'))} />
                                    </div>
                                    <span className="text-sm font-sans text-horizon-ink tracking-tight">{quota.name}</span>
                                </div>
                                <span className="text-[10px] font-sans italic text-horizon-muted uppercase">
                                    {Math.round(percent)}% Used
                                </span>
                            </div>

                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-1000 ease-out", quota.color)}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>

                            <div className="flex justify-between text-[11px] font-mono text-horizon-muted/60">
                                <span>{quota.used.toLocaleString()} {quota.unit}</span>
                                <span>{quota.total.toLocaleString()} {quota.unit} limit</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 opacity-50">
                    <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-sans italic">Real-time usage tracking active</span>
                </div>
                <button className="text-[10px] font-sans italic text-blue-500 hover:text-blue-600 transition-colors underline underline-offset-4">
                    Upgrade Quota
                </button>
            </div>
        </div>
    );
}
