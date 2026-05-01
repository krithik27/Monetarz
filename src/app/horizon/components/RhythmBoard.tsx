"use client";

import { useMemo, useState } from "react";
import { useSpends } from "@/context/SpendsContext";
import { computeBudgetVelocity } from "@/lib/horizon-prediction";
import { LaneList } from "./LaneList";
import BasicDropdown, { DropdownItem } from "./BasicDropdown";
import { motion, AnimatePresence } from "framer-motion";

import {
    Layout,
    ShoppingCart,
    Car,
    ShoppingBag,
    Activity,
    Gamepad2,
    Smartphone,
    Zap,
    MoreHorizontal,
    Plus,
    BarChart3,
    Check,
    X,
    Coins
} from "lucide-react";

export const CATEGORY_METADATA: Record<string, { label: string; icon: any; color: string }> = {
    food: { label: "Dining", icon: Layout, color: "text-orange-500" },
    groceries: { label: "Groceries", icon: ShoppingCart, color: "text-emerald-500" },
    transport: { label: "Transport", icon: Car, color: "text-blue-500" },
    shopping: { label: "Shopping", icon: ShoppingBag, color: "text-purple-500" },
    health: { label: "Health", icon: Activity, color: "text-rose-500" },
    entertainment: { label: "Entertainment", icon: Gamepad2, color: "text-indigo-500" },
    subscriptions: { label: "Bills & Subs", icon: Smartphone, color: "text-sky-500" },
    utilities: { label: "Utilities", icon: Zap, color: "text-amber-500" },
    other: { label: "Misc", icon: MoreHorizontal, color: "text-slate-500" },
};

const AVAILABLE_CATEGORIES = Object.keys(CATEGORY_METADATA);

export const RhythmBoard = () => {
    const { spends, categoryBudgets, updateCategoryBudget, removeCategoryBudget } = useSpends();

    // Stepwise Setup State
    const [selectedCat, setSelectedCat] = useState<string | null>(null);
    const [isSettingBudget, setIsSettingBudget] = useState(false);
    const [newBudget, setNewBudget] = useState("");

    const lanes = useMemo(() => {
        return Object.keys(categoryBudgets).map(cat =>
            computeBudgetVelocity(spends, cat, categoryBudgets[cat])
        );
    }, [spends, categoryBudgets]);

    const activeCategories = useMemo(() => Object.keys(categoryBudgets), [categoryBudgets]);

    const availableItems = useMemo(() => {
        return AVAILABLE_CATEGORIES
            .filter(cat => !activeCategories.includes(cat))
            .map(cat => {
                const Icon = CATEGORY_METADATA[cat].icon;
                return {
                    id: cat,
                    label: CATEGORY_METADATA[cat].label,
                    icon: <Icon className="size-5" />
                };
            });
    }, [activeCategories]);

    const handleStartAdding = (item: DropdownItem) => {
        setSelectedCat(item.id.toString());
        setIsSettingBudget(true);
        setNewBudget("0"); // Default to 0 as requested
    };

    const handleConfirmBudget = () => {
        if (!selectedCat) return;
        const amount = parseFloat(newBudget) || 0;
        updateCategoryBudget(selectedCat, amount);
        resetAddFlow();
    };

    const resetAddFlow = () => {
        setIsSettingBudget(false);
        setSelectedCat(null);
        setNewBudget("");
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl p-6 md:p-10 rounded-[3rem] border border-white/20 shadow-sm min-h-[400px] max-h-[600px] flex flex-col relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-8 md:mb-12 px-2 gap-4 flex-shrink-0">
                <div>
                    <h3 className="text-3xl md:text-4xl font-serif text-horizon-ink tracking-tight opacity-80">
                        Monthly Rhythms
                    </h3>
                    <p className="text-base text-horizon-muted font-serif italic mt-2">Visualization of your spending lanes</p>
                </div>

                <div className="relative flex items-center gap-3 w-full md:w-auto">
                    <AnimatePresence mode="wait">
                        {!isSettingBudget ? (
                            <motion.div
                                key="dropdown"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="w-full md:w-auto"
                            >
                                <BasicDropdown
                                    label="Track New Category"
                                    items={availableItems}
                                    onChange={handleStartAdding}
                                    className="w-full md:min-w-[200px]"
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="budget-input"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-2 bg-violet-50/50 p-2 rounded-2xl border border-violet-100 w-full md:w-auto"
                            >
                                <div className="flex flex-col px-2 flex-1">
                                    <span className="text-[10px] uppercase tracking-widest text-violet-400 font-sans font-bold">Monthly Budget</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-horizon-ink/40 font-serif">₹</span>
                                        <input
                                            type="number"
                                            value={newBudget}
                                            onChange={(e) => setNewBudget(e.target.value)}
                                            className="bg-transparent border-none outline-none font-serif text-horizon-ink w-full text-lg"
                                            autoFocus
                                            onKeyDown={(e) => e.key === "Enter" && handleConfirmBudget()}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={handleConfirmBudget}
                                        className="size-10 rounded-xl bg-violet-500 text-white flex items-center justify-center hover:bg-violet-600 transition-colors shadow-sm"
                                    >
                                        <Check className="size-5" />
                                    </button>
                                    <button
                                        onClick={resetAddFlow}
                                        className="size-10 rounded-xl bg-white text-horizon-ink/40 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                                    >
                                        <X className="size-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex-grow relative min-h-0">
                <div
                    className="h-full overflow-y-auto no-scrollbar pb-8 pt-2 px-1"
                    style={{
                        maskImage: 'linear-gradient(to bottom, transparent, black 20px, black calc(100% - 40px), transparent)',
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20px, black calc(100% - 40px), transparent)'
                    }}
                >
                    {lanes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-40 py-12">
                            <div className="h-16 w-16 rounded-[2rem] bg-horizon-ink/5 flex items-center justify-center mb-4">
                                <BarChart3 className="size-8 text-horizon-ink/40" />
                            </div>
                            <p className="font-serif italic text-horizon-muted text-lg">Your financial rhythm starts here</p>
                            <p className="text-xs text-horizon-ghost mt-2 tracking-wide uppercase">Select a category to begin tracking monthly lanes</p>
                        </div>
                    ) : (
                        <LaneList
                            lanes={lanes}
                            onEditLane={updateCategoryBudget}
                            onDeleteLane={removeCategoryBudget}
                            onPromptAdd={() => { }}
                            isAdding={false}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
