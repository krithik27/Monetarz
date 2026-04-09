"use client";

import React, { useState, useEffect } from "react";
import { Terminal, Shield, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
    id: string;
    timestamp: string;
    level: "info" | "warn" | "error" | "debug";
    module: string;
    message: string;
}

export function LiveLogsFeed() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) return;

        // Simulate real-time logs for diagnostic view
        const modules = ["AUTH_EDGE", "SUPABASE_SYNC", "HORIZON_ENGINE", "GATEWAY_V3", "RHYTHM_WORKER"];
        const messages = [
            "Inbound handshake successful",
            "Cache hit for financial_profile",
            "Syncing dirty state to persistence proxy",
            "RLS evaluation passed for user_id: 123",
            "Predictive rebuild complete (0.4ms)",
            "Token refresh initiated",
            "System heartbeat: Healthy"
        ];

        const interval = setInterval(() => {
            const newLog: LogEntry = {
                id: Math.random().toString(36).substring(7),
                timestamp: new Date().toLocaleTimeString(),
                level: Math.random() > 0.85 ? "warn" : Math.random() > 0.95 ? "error" : "info",
                module: modules[Math.floor(Math.random() * modules.length)],
                message: messages[Math.floor(Math.random() * messages.length)],
            };

            setLogs((prev) => [newLog, ...prev].slice(0, 50));
        }, 2500);

        return () => clearInterval(interval);
    }, [isPaused]);

    return (
        <div className="flex flex-col h-full bg-[#0F172A] rounded-[2rem] overflow-hidden border border-[#1E293B] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 bg-[#1E293B]/50 border-b border-[#334155]">
                <div className="flex items-center gap-3">
                    <Terminal className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-mono text-slate-300 uppercase tracking-widest">System Pulse Console</span>
                </div>
                <button
                    onClick={() => setIsPaused(!isPaused)}
                    className={cn(
                        "text-[10px] font-mono px-3 py-1 rounded-full border transition-all",
                        isPaused
                            ? "bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                            : "bg-blue-500/10 border-blue-500/50 text-blue-400"
                    )}
                >
                    {isPaused ? "RESUME" : "PAUSE"}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-3 custom-scrollbar">
                {logs.map((log) => (
                    <div key={log.id} className="group flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                        <span className={cn(
                            "shrink-0 px-2 rounded-sm",
                            log.level === 'error' ? "bg-red-500/20 text-red-400" :
                                log.level === 'warn' ? "bg-amber-500/20 text-amber-400" :
                                    "bg-blue-500/20 text-blue-400"
                        )}>
                            {log.level.toUpperCase()}
                        </span>
                        <span className="text-slate-400 font-bold shrink-0">[{log.module}]</span>
                        <span className="text-slate-200">{log.message}</span>
                    </div>
                ))}

                {logs.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                        <Shield className="h-8 w-8 opacity-20" />
                        <p className="italic">Initializing secure console stream...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
