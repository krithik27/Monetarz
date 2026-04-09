"use client";

import React, { useState } from "react";
import { useSpends } from "@/context/SpendsContext";
import { motion, AnimatePresence } from "framer-motion";
import { formatAmount } from "@/lib/money";
import { useCurrency } from "@/context/CurrencyContext";
import {
    Target,
    Plus,
    Trash2,
    Sparkles,
    Trophy,
    Flame,
    CalendarDays,
    Home,
    Plane,
    Laptop,
    Car,
    Heart,
    GraduationCap,
    Umbrella,
    Coins,
    Gift,
    Briefcase,
    Check,
    X,
    ChevronRight,
    Settings2
} from "lucide-react";

// Map of icon names to Lucide components
const GOAL_ICONS: Record<string, any> = {
    Target,
    Home,
    Plane,
    Laptop,
    Car,
    Heart,
    GraduationCap,
    Umbrella,
    Coins,
    Gift,
    Briefcase
};

const ICON_KEYS = Object.keys(GOAL_ICONS);
const MILESTONE_THRESHOLDS = [25, 50, 75, 100];

function getDaysLeft(deadline?: string): number | null {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const GoalTracker = () => {
    const { goals, addGoal, updateGoal, removeGoal } = useSpends();
    const { activeCurrency } = useCurrency();
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", icon: "Target", targetAmount: "", savedAmount: "", deadline: "" });
    const [depositingId, setDepositingId] = useState<string | null>(null);
    const [depositAmount, setDepositAmount] = useState("");

    const handleAdd = () => {
        const target = parseFloat(form.targetAmount);
        if (!form.name || isNaN(target)) return;

        if (editingGoalId && editingGoalId !== "NEW") {
            updateGoal(editingGoalId, {
                name: form.name.trim(),
                emoji: form.icon,
                targetAmount: target,
                deadline: form.deadline || undefined,
            });
        } else {
            addGoal({
                name: form.name.trim(),
                emoji: form.icon,
                targetAmount: target,
                deadline: form.deadline || undefined,
            });
        }
        setForm({ name: "", icon: "Target", targetAmount: "", savedAmount: "", deadline: "" });
        setEditingGoalId(null);
    };

    const startEditing = (goal: any) => {
        setForm({
            name: goal.name,
            icon: goal.emoji || "Target",
            targetAmount: goal.targetAmount.toString(),
            savedAmount: goal.savedAmount.toString(),
            deadline: goal.deadline || ""
        });
        setEditingGoalId(goal.id);
    };

    const handleDeposit = (goalId: string) => {
        const amount = parseFloat(depositAmount);
        if (isNaN(amount) || amount <= 0) return;
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;
        updateGoal(goalId, { savedAmount: goal.savedAmount + amount });
        setDepositAmount("");
        setDepositingId(null);
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl p-6 md:p-10 rounded-[3rem] border border-white/20 shadow-sm relative overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 px-2">
                <div>
                    <h3 className="text-4xl font-serif text-horizon-ink tracking-tight opacity-80">
                        Plan your savings
                    </h3>
                    <p className="text-base text-horizon-muted font-serif italic mt-2">
                        {goals.length} aspiration{goals.length !== 1 ? "s" : ""} on the horizon
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        setEditingGoalId(prev => (prev ? null : "NEW"));
                        setForm({ name: "", icon: "Target", targetAmount: "", savedAmount: "", deadline: "" });
                    }}
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${editingGoalId ? "bg-red-50 text-red-500 rotate-45" : "bg-violet-50 text-violet-500 hover:bg-violet-100"
                        }`}
                >
                    <Plus className="h-6 w-6" />
                </motion.button>
            </div>

            {/* Add/Edit Form */}
            <AnimatePresence>
                {editingGoalId && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="mb-8 z-20"
                    >
                        <div className="p-8 rounded-[2.5rem] bg-violet-50/50 border border-violet-100 shadow-inner space-y-6">
                            {/* Icon selector */}
                            <div>
                                <label className="text-[10px] uppercase tracking-[0.2em] text-violet-400 font-bold mb-3 block">Choose Visual</label>
                                <div className="flex gap-2 flex-wrap">
                                    {ICON_KEYS.map(key => {
                                        const IconComp = GOAL_ICONS[key];
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setForm(p => ({ ...p, icon: key }))}
                                                className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all ${form.icon === key
                                                    ? "bg-violet-500 text-white shadow-lg scale-110"
                                                    : "bg-white text-horizon-ink/40 hover:bg-white hover:text-violet-500"
                                                    }`}
                                            >
                                                <IconComp className="h-5 w-5" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <input
                                    placeholder="What are we aiming for?"
                                    value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    className="w-full bg-transparent border-b-2 border-violet-100 py-3 outline-none font-serif text-2xl text-horizon-ink placeholder:text-horizon-ink/10 transition-colors focus:border-violet-300"
                                    autoFocus
                                />

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-[0.2em] text-violet-400 font-bold block">Target</label>
                                        <div className="flex items-center gap-2 border-b border-violet-100 py-2">
                                            <span className="text-horizon-ink/30 font-serif">₹</span>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={form.targetAmount}
                                                onChange={e => setForm(p => ({ ...p, targetAmount: e.target.value }))}
                                                className="w-full bg-transparent outline-none font-serif text-lg text-horizon-ink"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-[0.2em] text-violet-400 font-bold block">Optional Deadline</label>
                                        <div className="flex items-center gap-2 border-b border-violet-100 py-2">
                                            <CalendarDays className="h-4 w-4 text-horizon-ink/30" />
                                            <input
                                                type="date"
                                                value={form.deadline}
                                                onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                                                className="w-full bg-transparent outline-none font-serif text-sm text-horizon-ink"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <button onClick={() => setEditingGoalId(null)} className="px-6 py-2.5 text-sm font-serif text-horizon-ink/40 hover:text-red-500 transition-colors font-medium tracking-wide">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAdd}
                                    className="px-8 py-3 bg-violet-500 text-white rounded-2xl text-sm font-serif font-bold shadow-lg shadow-violet-200 hover:bg-violet-600 hover:translate-y-[-2px] active:translate-y-[0px] transition-all"
                                >
                                    {editingGoalId === "NEW" ? "Set Goal" : "Update Goal"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Goals List */}
            <div
                className="space-y-6 flex-grow overflow-y-auto no-scrollbar pb-12 pt-2 px-1"
                style={{
                    maskImage: 'linear-gradient(to bottom, transparent, black 20px, black calc(100% - 40px), transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20px, black calc(100% - 40px), transparent)'
                }}
            >
                <AnimatePresence mode="popLayout">
                    {goals.map((goal, i) => {
                        const target = Number(goal.targetAmount) || 0;
                        const saved = Number(goal.savedAmount) || 0;
                        const percent = target > 0
                            ? Math.min(100, (saved / target) * 100)
                            : 0;
                        const isComplete = percent >= 100;
                        const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
                        const daysLeft = getDaysLeft(goal.deadline);
                        const GoalIcon = GOAL_ICONS[goal.emoji || "Target"] || Target;

                        return (
                            <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                                className={`group relative p-6 rounded-[2rem] border transition-all duration-500 ${isComplete
                                    ? "bg-emerald-50/50 border-emerald-100"
                                    : "bg-white/40 backdrop-blur-md hover:bg-white border-white/60 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/5 hover:translate-y-[-4px]"
                                    }`}
                            >
                                <div className="flex items-start gap-5">
                                    {/* Icon Box */}
                                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-500 group-hover:scale-110 ${isComplete ? "bg-emerald-500 text-white shadow-emerald-200 shadow-lg" : "bg-violet-50 text-violet-500"
                                        }`}>
                                        {isComplete ? <Trophy className="h-7 w-7" /> : <GoalIcon className="h-7 w-7" />}
                                    </div>

                                    <div className="flex-1 min-w-0 pt-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="min-w-0">
                                                <h4 className="font-serif text-xl text-horizon-ink tracking-tight truncate leading-none mb-2">{goal.name}</h4>
                                                {daysLeft !== null && !isComplete && (
                                                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-sans font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${daysLeft <= 7 ? "bg-red-50 text-red-500" : daysLeft <= 30 ? "bg-amber-50 text-amber-600" : "bg-violet-50 text-violet-400"
                                                        }`}>
                                                        <CalendarDays className="h-3 w-3" />
                                                        {daysLeft > 0 ? `${daysLeft}d until horizon` : "Overdue"}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEditing(goal)}
                                                    className="p-2 hover:bg-yellow-50 rounded-xl text-horizon-muted hover:text-yellow-500 transition-all"
                                                >
                                                    <Settings2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => removeGoal(goal.id)}
                                                    className="p-2 hover:bg-red-50 rounded-xl text-horizon-muted hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between mb-4">
                                            <p className="text-sm font-serif">
                                                <span className={`text-lg font-medium ${isComplete ? "text-emerald-600 text-2xl" : "text-horizon-ink"}`}>
                                                    {formatAmount(goal.savedAmount, activeCurrency)}
                                                </span>
                                                <span className="text-horizon-ink/20 mx-2 italic font-light">aiming for</span>
                                                <span className="text-horizon-ink/40">{formatAmount(goal.targetAmount, activeCurrency)}</span>
                                            </p>
                                            {!isComplete && (
                                                <p className="text-[10px] uppercase font-sans font-bold tracking-widest text-horizon-ink/30 italic">
                                                    {formatAmount(remaining, activeCurrency)} left
                                                </p>
                                            )}
                                        </div>

                                        {/* Progress Section */}
                                        <div className="space-y-3">
                                            <div className="h-1.5 bg-horizon-ink/[0.03] rounded-full overflow-hidden">
                                                <motion.div
                                                    className={`h-full rounded-full ${isComplete
                                                        ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                                        : "bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                                        }`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percent}%` }}
                                                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
                                                />
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    {percent >= 75 && !isComplete && (
                                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                                                            <Flame className="h-4 w-4 text-orange-400" />
                                                        </motion.div>
                                                    )}
                                                    <span className="text-[10px] font-sans font-black text-horizon-ink/20 tracking-tighter">{Math.round(percent)}%</span>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {!isComplete && (
                                                        depositingId === goal.id ? (
                                                            <motion.div
                                                                initial={{ opacity: 0, x: 20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                className="flex items-center gap-1.5 bg-violet-50 p-1 rounded-xl border border-violet-100"
                                                            >
                                                                <input
                                                                    type="number"
                                                                    placeholder="Amount"
                                                                    value={depositAmount}
                                                                    onChange={e => setDepositAmount(e.target.value)}
                                                                    onKeyDown={e => e.key === "Enter" && handleDeposit(goal.id)}
                                                                    className="w-20 bg-transparent border-none px-2 py-1 text-sm font-serif outline-none placeholder:text-horizon-ink/20"
                                                                    autoFocus
                                                                />
                                                                <button onClick={() => handleDeposit(goal.id)} className="p-1.5 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors">
                                                                    <Check className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button onClick={() => { setDepositingId(null); setDepositAmount(""); }} className="p-1.5 text-horizon-ink/30 hover:text-red-500">
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            </motion.div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setDepositingId(goal.id)}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-violet-50 text-violet-500 rounded-xl text-[10px] font-sans font-bold uppercase tracking-widest hover:bg-violet-500 hover:text-white transition-all duration-300"
                                                            >
                                                                Deposit Funds <ChevronRight className="h-3 w-3" />
                                                            </button>
                                                        )
                                                    )}
                                                    {isComplete && (
                                                        <motion.span
                                                            initial={{ opacity: 0, y: 5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="text-[10px] text-emerald-600 font-sans font-black uppercase tracking-[0.2em] flex items-center gap-2"
                                                        >
                                                            <Sparkles className="h-4 w-4" /> Manifested
                                                        </motion.span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {goals.length === 0 && !editingGoalId && (
                    <div className="flex-grow flex flex-col items-center justify-center py-20 text-center opacity-30">
                        <div className="h-20 w-20 rounded-[2.5rem] bg-horizon-ink/5 flex items-center justify-center mb-6">
                            <Target className="h-10 w-10 text-horizon-ink" />
                        </div>
                        <p className="font-serif italic text-2xl text-horizon-muted mb-2">The horizon is waitng</p>
                        <p className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold">Define your first financial landmark</p>
                    </div>
                )}
            </div>
        </div>
    );
};
