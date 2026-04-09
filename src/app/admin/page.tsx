"use client";

import { useEffect, useState } from "react";

import { useSpends } from "@/context/SpendsContext";
import { Users, ReceiptText, Activity, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveLogsFeed } from "../../components/live-logs-feed";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
    const { spends } = useSpends();
    const [systemData, setSystemData] = useState<any>(null);

    useEffect(() => {
        const fetchSystem = async () => {
            try {
                const res = await fetch("/api/admin/system");
                const data = await res.json();
                setSystemData(data);
            } catch (e) {
                console.error("Failed to fetch system data", e);
            }
        };
        fetchSystem();
        const interval = setInterval(fetchSystem, 15000);
        return () => clearInterval(interval);
    }, []);

    const stats = [
        {
            label: "Managed Users",
            value: systemData?.status?.supabase === 'connected' ? "1" : "...",
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            label: "Total Transactions",
            value: spends.length.toString(),
            icon: ReceiptText,
            color: "text-green-600",
            bg: "bg-green-50"
        },
        {
            label: "System Uptime",
            value: systemData?.metrics?.uptime ? `${Math.floor(systemData.metrics.uptime / 60)}m` : "...",
            icon: Activity,
            color: "text-purple-600",
            bg: "bg-purple-50"
        },
        {
            label: "Persistence Mirror",
            value: systemData?.status?.supabase === 'connected' ? "Active" : "Offline",
            icon: Server,
            color: systemData?.status?.supabase === 'connected' ? "text-orange-600" : "text-red-600",
            bg: systemData?.status?.supabase === 'connected' ? "bg-orange-50" : "bg-red-50"
        },
    ];

    return (
        <div className="space-y-10">
            <header>
                <h1 className="text-4xl font-sans text-horizon-ink tracking-tight mb-2">Overview</h1>
                <p className="text-horizon-muted font-sans italic text-lg">Real-time system health and management metrics.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.label} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-8">
                            <CardTitle className="text-sm font-sans italic text-horizon-muted">{stat.label}</CardTitle>
                            <div className={`${stat.bg} ${stat.color} p-2 rounded-xl`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            <div className="text-3xl font-sans text-horizon-ink tracking-tight">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* System Pulse Live Feed */}
                <div className="lg:col-span-2 h-[500px]">
                    <LiveLogsFeed />
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[#F1F5F9] h-full">
                        <h2 className="text-2xl font-sans text-horizon-ink tracking-tight mb-6">System Health</h2>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-6 rounded-2xl bg-[#F8FAFC]">
                                <div className="flex items-center gap-4">
                                    <div className={cn("h-3 w-3 rounded-full", systemData?.status?.supabase === 'connected' ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                                    <span className="font-sans text-horizon-ink text-sm">Supabase Sync</span>
                                </div>
                                <span className="text-horizon-muted font-sans italic text-[10px] uppercase">{systemData?.status?.supabase || 'Checking...'}</span>
                            </div>
                            <div className="flex items-center justify-between p-6 rounded-2xl bg-[#F8FAFC]">
                                <div className="flex items-center gap-4">
                                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                                    <span className="font-sans text-horizon-ink text-sm">Heap Balance</span>
                                </div>
                                <span className="text-horizon-muted font-sans italic text-[10px] uppercase">{systemData?.metrics?.memory?.heapUsed || 0} MB</span>
                            </div>
                            <div className="flex items-center justify-between p-6 rounded-2xl bg-[#F8FAFC]">
                                <div className="flex items-center gap-4">
                                    <div className="h-3 w-3 rounded-full bg-orange-500" />
                                    <span className="font-sans text-horizon-ink text-sm">Horizon Mirror</span>
                                </div>
                                <span className="text-horizon-muted font-sans italic text-[10px] uppercase">Active</span>
                            </div>
                            <div className="flex items-center justify-between p-6 rounded-2xl bg-[#F8FAFC]">
                                <div className="flex items-center gap-4">
                                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                    <span className="font-sans text-horizon-ink text-sm">Rhythm Sync</span>
                                </div>
                                <span className="text-horizon-muted font-sans italic text-[10px] uppercase">Synced</span>
                            </div>
                            <div className="flex items-center justify-between p-6 rounded-2xl bg-[#F8FAFC]">
                                <div className="flex items-center gap-4">
                                    <div className="h-3 w-3 rounded-full bg-purple-500" />
                                    <span className="font-sans text-horizon-ink text-sm">Security Layer</span>
                                </div>
                                <span className="text-horizon-muted font-sans italic text-[10px] uppercase">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
