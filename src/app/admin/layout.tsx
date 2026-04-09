"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, Database, ShieldAlert, LogOut, ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isAdmin, signOut } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            router.push("/");
        }
    }, [isAdmin, isLoading, router]);

    if (isLoading || !isAdmin) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#3B82F6] border-t-transparent" />
                    <p className="font-sans italic text-horizon-muted text-lg animate-pulse">
                        Authenticating Command Center...
                    </p>
                </div>
            </div>
        );
    }

    const navItems = [
        { label: "Overview", href: "/admin", icon: LayoutDashboard },
        { label: "Persistence", href: "/admin/persistence", icon: Database },
        { label: "Diagnostics", href: "/admin/diagnostics", icon: ShieldAlert },
    ];

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-[#E2E8F0] flex flex-col fixed inset-y-0 shadow-sm z-30">
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#3B82F6] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-sans text-horizon-ink tracking-tight">Monetarz</h1>
                            <p className="text-xs font-sans italic text-horizon-muted">Operations Console</p>
                        </div>
                        <Link href="/">
                            <button className="p-2.5 rounded-xl hover:bg-[#F1F5F9] text-horizon-muted hover:text-[#3B82F6] transition-all border border-transparent hover:border-[#E2E8F0] shadow-sm hover:shadow-md">
                                <Home className="h-5 w-5" />
                            </button>
                        </Link>
                    </div>
                </div>

                <nav className="flex-1 px-4 mt-8 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
                                "hover:bg-[#F1F5F9] text-horizon-muted hover:text-[#3B82F6]"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <item.icon className="h-5 w-5" />
                                <span className="font-sans text-lg tracking-tight">{item.label}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-[#F1F5F9]">
                    <div className="bg-[#F8FAFC] rounded-2xl p-4 mb-4">
                        <p className="text-xs font-sans italic text-horizon-muted mb-1">Authenticated Admin</p>
                        <p className="text-sm font-sans text-horizon-ink truncate">{user?.user_metadata?.email || "Dev User"}</p>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 p-4 rounded-2xl text-[#EF4444] hover:bg-red-50 transition-all font-sans text-lg"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-80 p-12">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
