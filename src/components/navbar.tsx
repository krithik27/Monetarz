'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarTrigger,
} from '@/components/ui/menubar';
import { cn } from '@/lib/utils';
import { Home, Calendar, BarChart2, Plus, MessageSquare, Settings, LayoutGrid, User } from 'lucide-react';
import DiscreteTabs, { NavItem } from '@/components/ui/discrete-tabs';

export function Navbar() {
    const pathname = usePathname();

    const navItems = [
        { href: '/', label: 'Today', icon: Home },
        { href: '/weekly', label: 'Weekly', icon: BarChart2 },
        { href: '/calendar', label: 'Calendar', icon: Calendar },
        { href: '/analytics', label: 'Analytics', icon: BarChart2 },
        { href: '/horizon', label: 'Horizon', icon: LayoutGrid },
    ];

    const mobileNavItems: NavItem[] = [
        { id: 'today', title: 'Today', href: '/' },
        { id: 'weekly', title: 'Weekly', href: '/weekly' },
        { id: 'calendar', title: 'Calendar', href: '/calendar' },
    ];

    const mobileMoreItems: NavItem[] = [
        { id: 'analytics', title: 'Analytics', href: '/analytics', icon: BarChart2 },
        { id: 'horizon', title: 'Horizon', href: '/horizon', icon: LayoutGrid },
        { id: 'account', title: 'Account', href: '/account', icon: User },
        { id: 'settings', title: 'Settings', href: '/settings', icon: Settings },
        { id: 'feedback', title: 'Feedback', href: '/feedback', icon: MessageSquare },
    ];

    return (
        <>
            {/* Desktop/Tablet Top Navbar */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-8 left-0 right-0 z-50 hidden md:flex justify-center px-6 pointer-events-none"
            >
                <Menubar className="h-16 px-4 rounded-2xl border-brand-lichen/20 bg-brand-cream/80 backdrop-blur-xl shadow-2xl shadow-brand-moss/5 border space-x-2 pointer-events-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <MenubarMenu key={item.href}>
                                <MenubarTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className="h-12 px-5 rounded-xl text-xl font-sans font-bold font-mono gap-2 cursor-pointer flex items-center relative group"
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="navbar-active"
                                                className="absolute inset-0 bg-brand-moss shadow-lg shadow-brand-moss/20 rounded-xl"
                                                transition={{
                                                    duration: 0.6,
                                                    ease: [0.16, 1, 0.3, 1]
                                                }}
                                            />
                                        )}
                                        <Icon className={cn(
                                            "size-5 relative z-10 transition-colors duration-300",
                                            isActive ? "text-brand-cream" : "text-brand-sage group-hover:text-brand-moss"
                                        )} />
                                        <span className={cn(
                                            "relative z-10 transition-colors duration-300",
                                            isActive ? "text-brand-cream" : "text-brand-sage group-hover:text-brand-moss"
                                        )}>
                                            {item.label}
                                        </span>
                                    </Link>
                                </MenubarTrigger>
                            </MenubarMenu>
                        );
                    })}

                    <MenubarMenu>
                        <MenubarTrigger
                            className="h-12 px-4 rounded-xl text-xl font-sans font-bold font-mono text-brand-sage hover:bg-brand-lichen/10 hover:text-brand-moss gap-2 cursor-pointer transition-colors"
                        >
                            <Plus className="size-5" />
                            <span>More</span>
                        </MenubarTrigger>
                        <MenubarContent className="min-w-[220px] rounded-xl border border-brand-lichen/20 bg-brand-cream/80 backdrop-blur-xl shadow-xl p-2 mr-6 text-brand-sage">
                            <MenubarItem asChild>
                                <Link
                                    href="/account"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-lichen/20 cursor-pointer outline-none transition-colors"
                                >
                                    <User className="size-4" />
                                    <span className="font-sans">Account & Pro</span>
                                </Link>
                            </MenubarItem>
                            <MenubarItem asChild>
                                <Link
                                    href="/settings"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-lichen/20 cursor-pointer outline-none transition-colors"
                                >
                                    <Settings className="size-4" />
                                    <span className="font-sans">Settings</span>
                                </Link>
                            </MenubarItem>
                            <MenubarItem asChild>
                                <Link
                                    href="/feedback"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-lichen/20 cursor-pointer outline-none transition-colors"
                                >
                                    <MessageSquare className="size-4" />
                                    <span className="font-sans">Community Feedback</span>
                                </Link>
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                </Menubar>
            </motion.div>

            {/* Mobile Bottom Navbar */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="fixed bottom-4 left-0 right-0 z-50 md:hidden flex justify-center px-4"
            >
                <DiscreteTabs
                    items={mobileNavItems}
                    moreItems={mobileMoreItems}
                />
            </motion.div>
        </>
    );
}
