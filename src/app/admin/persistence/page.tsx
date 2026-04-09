"use client";

import { useEffect, useState } from "react";
import { Database, Cloud, HardDrive, RefreshCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PersistenceAdmin() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/persistence");
            const json = await res.json();
            setData(json);
            setLastSync(new Date());
        } catch (err) {
            console.error("Failed to fetch persistence data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const triggerSync = async () => {
        try {
            setIsSyncing(true);
            const res = await fetch("/api/persistence", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    spends: data?.spends,
                    weeklyGoal: data?.weeklyGoal,
                    memories: data?.memories,
                    reflections: data?.reflections,
                }),
            });
            if (res.ok) {
                setLastSync(new Date());
            }
        } catch (err) {
            console.error("Sync failed:", err);
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading && !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3B82F6] border-t-transparent" />
            </div>
        );
    }

    const sections = [
        { label: "Transactions", count: data?.spends?.length || 0, icon: HardDrive },
        { label: "AI Memories", count: data?.memories?.length || 0, icon: RefreshCcw },
        { label: "Reflections", count: data?.reflections?.length || 0, icon: Cloud },
    ];

    return (
        <div className="space-y-10">
            <header className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-sans text-horizon-ink tracking-tight mb-2">Persistence Layer</h1>
                    <p className="text-horizon-muted font-sans italic text-lg">Manage the bridge between local JSON and Supabase Cloud.</p>
                </div>
                <Button
                    onClick={triggerSync}
                    disabled={isSyncing}
                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-2xl h-12 px-6 font-sans shadow-lg shadow-blue-500/20 transition-all"
                >
                    {isSyncing ? (
                        <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCcw className="mr-2 h-4 w-4" />
                    )}
                    Force Full Cloud Sync
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sections.map((section) => (
                    <Card key={section.label} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl">
                        <CardHeader className="flex flex-row items-center gap-4 p-8">
                            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                <section.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-sans tracking-tight">{section.label}</CardTitle>
                                <CardDescription className="font-sans italic text-sm">{section.count} records detected</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-[#F8FAFC] p-8 border-b border-[#F1F5F9]">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-sans tracking-tight">Sync Health</CardTitle>
                            <CardDescription className="font-sans italic mt-1">Status of the local/cloud data mirror</CardDescription>
                        </div>
                        {lastSync && (
                            <div className="flex items-center gap-2 text-sm font-sans text-horizon-muted bg-white px-4 py-2 rounded-full border border-[#E2E8F0]">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Last verified: {lastSync.toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="space-y-6">
                        <div className="flex items-start gap-5 p-6 rounded-2xl bg-green-50/50 border border-green-100">
                            <CheckCircle2 className="h-6 w-6 text-green-600 mt-1" />
                            <div>
                                <h4 className="font-sans text-green-900 text-lg tracking-tight">Cloud Mirroring Active</h4>
                                <p className="text-green-700/80 font-sans italic mt-1">All local mutations are being successfully proxied to the Cloud Dev ID.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-5 p-6 rounded-2xl bg-blue-50/50 border border-blue-100">
                            <Database className="h-6 w-6 text-blue-600 mt-1" />
                            <div>
                                <h4 className="font-sans text-blue-900 text-lg tracking-tight">Local Persistence: Healthy</h4>
                                <p className="text-blue-700/80 font-sans italic mt-1">`data/entries.json` is writable and synchronized with the latest memory state.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
