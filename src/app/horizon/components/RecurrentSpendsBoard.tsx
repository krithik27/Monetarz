"use client";

import { useMemo, useState } from "react";
import { useSpends } from "@/context/SpendsContext";
import { motion, AnimatePresence } from "framer-motion";
import { formatAmount } from "@/lib/money";
import { useCurrency } from "@/context/CurrencyContext";
import BasicDropdown, { DropdownItem } from "./BasicDropdown";
import { 
    Plus, 
    Trash2, 
    Calendar, 
    Repeat, 
    Home, 
    CreditCard, 
    ShieldCheck, 
    Zap, 
    Smartphone, 
    ShoppingCart, 
    Fuel, 
    Globe, 
    MoreHorizontal,
    Check,
    X,
    ArrowRight
} from "lucide-react";

const RECURRENT_CATEGORIES: Record<string, { label: string; icon: any }> = {
    Rent: { label: "Rent", icon: Home },
    EMI: { label: "EMI", icon: CreditCard },
    Insurance: { label: "Insurance", icon: ShieldCheck },
    Utilities: { label: "Utilities", icon: Zap },
    Subscriptions: { label: "Subscriptions", icon: Repeat },
    Groceries: { label: "Groceries", icon: ShoppingCart },
    Fuel: { label: "Fuel", icon: Fuel },
    Internet: { label: "Internet", icon: Globe },
    Phone: { label: "Phone", icon: Smartphone },
    Other: { label: "Other", icon: MoreHorizontal }
};

const CATEGORY_ITEMS: DropdownItem[] = Object.entries(RECURRENT_CATEGORIES).map(([id, { label, icon: Icon }]) => ({
    id,
    label,
    icon: <Icon className="size-4" />
}));

export const RecurrentSpendsBoard = () => {
    const { recurrentSpends, addRecurrentSpend, removeRecurrentSpend } = useSpends();
    const { activeCurrency } = useCurrency();
    
    // Stepwise adding state
    const [addStep, setAddStep] = useState<"idle" | "basic" | "details">("idle");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [months, setMonths] = useState("12");
    const [category, setCategory] = useState("Other");

    const monthlyTotal = useMemo(
        () => recurrentSpends.reduce((sum, s) => sum + s.amount, 0),
        [recurrentSpends]
    );

    const handleAdd = () => {
        if (!description || !amount) return;
        addRecurrentSpend({
            name: description.trim(),
            amount: parseFloat(amount),
            months: parseInt(months),
            startDate: new Date().toISOString(),
            category,
            frequency: 'monthly',
            is_active: true
        });
        resetAddFlow();
    };

    const resetAddFlow = () => {
        setAddStep("idle");
        setDescription("");
        setAmount("");
        setMonths("12");
        setCategory("Other");
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[3rem] border border-white/20 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-start mb-8 px-2 flex-shrink-0">
                <div>
                    <h3 className="text-4xl font-serif text-horizon-ink tracking-tight opacity-80">
                        Commitments
                    </h3>
                    {recurrentSpends.length > 0 && (
                        <p className="text-base text-horizon-muted font-sans font-medium italic mt-2">
                             <span className="font-bold text-violet-500">{formatAmount(monthlyTotal, activeCurrency)}</span> predicted monthly outflow
                        </p>
                    )}
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addStep === "idle" ? setAddStep("basic") : resetAddFlow()}
                    className={`size-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                        addStep !== "idle" ? "bg-red-50 text-red-500 rotate-45" : "bg-violet-50 text-violet-500 hover:bg-violet-100"
                    }`}
                >
                    <Plus className="size-6" />
                </motion.button>
            </div>

            {/* Stepwise Add Flow */}
            <AnimatePresence>
                {addStep !== "idle" && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        className="mb-8 z-20"
                    >
                        <div className="p-8 rounded-[2.5rem] bg-violet-50/50 border border-violet-100 shadow-inner space-y-6">
                            {addStep === "basic" ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        <label className="text-[10px] uppercase tracking-[0.2em] text-violet-400 font-bold block">Establish Name</label>
                                        <input
                                            placeholder="What is this recurrent cost?"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full bg-transparent border-b-2 border-violet-100 py-3 outline-none font-sans font-bold text-2xl text-horizon-ink placeholder:text-horizon-ink/10 transition-colors focus:border-violet-300"
                                            autoFocus
                                            onKeyDown={(e) => e.key === "Enter" && description && setAddStep("details")}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] uppercase tracking-[0.2em] text-violet-400 font-bold block">Categorize</label>
                                        <BasicDropdown
                                            label="Select Category"
                                            items={CATEGORY_ITEMS}
                                            value={category}
                                            onChange={(item) => setCategory(item.id.toString())}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button 
                                            disabled={!description}
                                            onClick={() => setAddStep("details")}
                                            className="flex items-center gap-2 px-8 py-3 bg-violet-500 text-white rounded-2xl text-sm font-sans font-bold shadow-lg shadow-violet-200 hover:bg-violet-600 disabled:opacity-30 transition-all"
                                        >
                                            Next Step <ArrowRight className="size-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-[0.2em] text-violet-400 font-bold block">Monthly Amount</label>
                                            <div className="flex items-center gap-2 border-b-2 border-violet-100 py-2">
                                                <span className="text-horizon-ink/30 font-serif text-xl">₹</span>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    className="w-full bg-transparent outline-none font-sans font-bold text-2xl text-horizon-ink"
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-[0.2em] text-violet-400 font-bold block">Duration (Months)</label>
                                            <div className="flex items-center gap-2 border-b-2 border-violet-100 py-2">
                                                <Repeat className="size-5 text-horizon-ink/30" />
                                                <input
                                                    type="number"
                                                    value={months}
                                                    onChange={(e) => setMonths(e.target.value)}
                                                    className="w-full bg-transparent outline-none font-sans font-bold text-2xl text-horizon-ink"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-4">
                                        <button 
                                            onClick={() => setAddStep("basic")}
                                            className="text-sm font-sans font-bold text-horizon-ink/40 hover:text-horizon-ink transition-colors flex items-center gap-1"
                                        >
                                            Back
                                        </button>
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={handleAdd}
                                                className="px-8 py-3 bg-emerald-500 text-white rounded-2xl text-sm font-sans font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all"
                                            >
                                                Establish Commitment
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List */}
            <div
                className="flex-grow overflow-y-auto no-scrollbar pb-8 pt-2 px-1 space-y-4"
                style={{
                    maskImage: 'linear-gradient(to bottom, transparent, black 20px, black calc(100% - 40px), transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20px, black calc(100% - 40px), transparent)'
                }}
            >
                <AnimatePresence mode="popLayout">
                    {recurrentSpends.map((spend) => {
                        const { label, icon: Icon } = RECURRENT_CATEGORIES[spend.category] || RECURRENT_CATEGORIES.Other;
                        return (
                            <motion.div
                                key={spend.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group relative p-6 rounded-[2rem] bg-white/40 border border-horizon-rim/10 hover:border-violet-200 hover:bg-white/80 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="size-14 bg-violet-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-violet-500 transition-transform group-hover:scale-110">
                                        <Icon className="size-7" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0">
                                                <h4 className="font-serif text-xl text-horizon-ink tracking-tight truncate leading-tight mb-1">{spend.name}</h4>
                                                <p className="text-[10px] uppercase tracking-widest text-violet-400 font-sans font-bold flex items-center gap-2">
                                                    {label} <span className="text-horizon-muted/30">·</span> {spend.months} Months
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xl font-sans font-bold text-horizon-ink">
                                                    {formatAmount(spend.amount, activeCurrency)}
                                                </p>
                                                <button
                                                    onClick={() => removeRecurrentSpend(spend.id)}
                                                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="size-4 text-red-300 hover:text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {recurrentSpends.length === 0 && addStep === "idle" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-grow flex flex-col items-center justify-center py-20 text-center opacity-30"
                        >
                            <div className="size-20 bg-horizon-ink/5 rounded-[2.5rem] flex items-center justify-center mb-6">
                                <Repeat className="size-10 text-horizon-ink" />
                            </div>
                            <p className="font-serif italic text-2xl text-horizon-muted mb-2">Pin your commitments</p>
                            <p className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold">Rent, EMIs, and essential rhythms</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
