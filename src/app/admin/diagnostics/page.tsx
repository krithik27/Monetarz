"use client";

import { UsageLogsMeter } from "../../../components/usage-logs-meter";
import { LiveLogsFeed } from "../../../components/live-logs-feed";
import { Activity, ShieldCheck, Zap } from "lucide-react";

export default function DiagnosticsPage() {
    return (
        <div className="space-y-10">
            <header className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-sans text-horizon-ink tracking-tight mb-2">System Diagnostics</h1>
                    <p className="text-horizon-muted font-sans italic text-lg">Deep-level observability and resource monitoring.</p>
                </div>
                <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-2xl border border-green-100 text-green-700 text-sm font-sans italic">
                    <ShieldCheck className="h-4 w-4" />
                    System Status: Operational
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Resource Usage Meter */}
                <div className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <Zap className="h-5 w-5 text-blue-500" />
                        <h2 className="text-xl font-sans text-horizon-ink tracking-tight">Resource Quotas</h2>
                    </div>
                    <UsageLogsMeter />
                </div>

                {/* Live Console Feed */}
                <div className="lg:col-span-2 flex flex-col h-[600px]">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <Activity className="h-5 w-5 text-purple-500" />
                        <h2 className="text-xl font-sans text-horizon-ink tracking-tight">Traffic Pulse</h2>
                    </div>
                    <div className="flex-1 min-h-0">
                        <LiveLogsFeed />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[#F1F5F9] border-l-4 border-blue-500">
                <h3 className="text-lg font-sans text-horizon-ink tracking-tight mb-2">Network Topology Note</h3>
                <p className="text-horizon-muted font-sans italic leading-relaxed">
                    Diagnostics are currently running in **Simulation Mode** (mock data) to verify layout integrity.
                    Post-deployment, these hooks will be wired to actual Vercel/Supabase metrics.
                </p>
            </div>
        </div>
    );
}
