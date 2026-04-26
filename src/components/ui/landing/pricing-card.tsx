"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight, Sparkles } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useRazorpay } from "@/components/RazorpayCheckout";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/context/AuthContext";

type BillingCycle = "monthly" | "yearly";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  period: string;
  features: string[];
  buttonText: string;
  highlight: boolean;
  tag?: string;
  savings?: string;
}

const freePlan: Plan = {
  id: "free",
  name: "mindful start.",
  description: "personal awareness journal",
  price: 0,
  period: "forever",
  features: [
    "Natural Logging Engine",
    "Daily AI Narratives",
    "Basic Wealth Flow",
    "Manual Backups Only",
  ],
  buttonText: "get going...",
  highlight: false,
  tag: "free forever",
};

const proPlans: Record<BillingCycle, Plan> = {
  monthly: {
    id: "pro_monthly", // Standardizing on monthly to keep things simple
    name: "the horizon.",
    description: "the mindful rhythm",
    price: 299,
    period: "month",
    features: [
      "Advanced Narrative Insights",
      "Multi-Currency Support",
      "Basic Horizon Forecasts",
      "Custom Wealth Frameworks",
      "Priority AI Processing",
    ],
    buttonText: "enter the flow",
    highlight: true,
    tag: "most flexible",
  },
  yearly: {
    id: "pro_yearly",
    name: "the horizon.",
    description: "the universal command center",
    price: 2499,
    period: "year",
    features: [
      "Everything in Monthly",
      "Predictive Horizon Analysis",
      "Lifetime Data Retention",
      "Early Access to Features",
      "2 Months Free Included",
    ],
    buttonText: "master the flow",
    highlight: true,
    tag: "best value",
    savings: "save ~30%",
  },
};

export function PricingSection() {
  const { openCheckout, isLoading } = useRazorpay();
  const { user } = useAuth();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");

  const currentProPlan = proPlans[billingCycle];

  const handleAction = (planId: string, price: number) => {
    if (price > 0 && !user) {
      toast({
        type: "info",
        message: "Sign in required",
        description: "Please enter your journal first to choose a flow plan.",
      });
      return;
    }
    openCheckout(planId);
  };

  return (
    <section id="pricing" className="relative z-10 py-40 px-6 bg-brand-cream border-t border-brand-lichen/10">
      <div className="max-w-5xl mx-auto flex flex-col items-center">
        {/* Header */}
        <div className="mb-16 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="flex w-fit items-center gap-2 px-4 py-2 rounded-full bg-orange-500/5 border border-orange-500/10 text-orange-600 text-[10px] tracking-widest uppercase mb-6 font-bold mx-auto"
          >
            <Sparkles className="w-3 h-3" />
            investment in awareness
          </motion.div>
          <h2 className="text-5xl md:text-7xl text-brand-ink tracking-tighter lowercase font-black mb-8">
            choose your <span className="font-serif italic font-light text-orange-500">depth</span>.
          </h2>
          
          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mt-12 bg-white/50 p-1.5 rounded-full border border-brand-lichen/20 w-fit mx-auto backdrop-blur-sm shadow-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300",
                billingCycle === "monthly" ? "bg-brand-ink text-brand-cream shadow-lg" : "text-brand-sage hover:text-brand-ink"
              )}
            >
              monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                billingCycle === "yearly" ? "bg-brand-ink text-brand-cream shadow-lg" : "text-brand-sage hover:text-brand-ink"
              )}
            >
              annual
              <span className="bg-orange-500 text-[8px] text-white px-2 py-0.5 rounded-full">best value</span>
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Free Plan */}
          <PricingCard
            plan={freePlan}
            handleAction={handleAction}
            isLoading={isLoading}
          />

          {/* Pro Plan */}
          <AnimatePresence mode="wait">
            <PricingCard
              key={billingCycle}
              plan={currentProPlan}
              handleAction={handleAction}
              isLoading={isLoading}
              isPro={true}
            />
          </AnimatePresence>
        </div>

        {/* Footer Note */}
        <p className="mt-16 text-[10px] uppercase tracking-[0.3em] font-bold text-brand-sage/40 flex items-center gap-2">
          <span className="w-8 h-[1px] bg-brand-lichen/20" />
          7-day mindful guarantee &bull; secure encryption &bull; cancel anytime
          <span className="w-8 h-[1px] bg-brand-lichen/20" />
        </p>
      </div>
    </section>
  );
}

function PricingCard({
  plan,
  handleAction,
  isLoading,
  isPro = false,
}: {
  plan: Plan;
  handleAction: (id: string, price: number) => void;
  isLoading: boolean;
  isPro?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative p-12 rounded-[3.5rem] bg-white transition-all duration-500 flex flex-col h-full",
        isPro 
          ? "border-2 border-orange-500/20 shadow-2xl shadow-orange-500/5" 
          : "border border-brand-lichen/10 shadow-sm"
      )}
    >
      {plan.tag && (
        <div className={cn(
          "absolute -top-3 left-12 px-5 py-1.5 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg z-20",
          isPro ? "bg-orange-500" : "bg-brand-ink"
        )}>
          {plan.tag}
        </div>
      )}

      <div className="mb-10">
        <h3 className="text-4xl text-brand-ink font-bold lowercase tracking-tighter mb-3">
          {plan.name}
        </h3>
        <p className="text-brand-sage text-md font-light lowercase leading-relaxed">
          {plan.description}
        </p>
      </div>

      <div className="flex items-baseline gap-2 mb-12">
        <div className="text-6xl font-black text-brand-ink tracking-tighter flex items-center">
          <span className="text-2xl mr-1 font-light opacity-30 italic">₹</span>
          <NumberFlow
            value={plan.price}
            format={{ notation: 'standard' }}
          />
        </div>
        <div className="text-brand-sage text-sm lowercase font-medium opacity-60">
          / {plan.period}
        </div>
        {plan.savings && (
          <div className="ml-2 text-[10px] font-bold uppercase text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
            {plan.savings}
          </div>
        )}
      </div>

      <div className="flex-grow space-y-5 mb-14">
        {plan.features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-4 text-brand-ink text-sm font-medium lowercase group-hover:translate-x-1 transition-transform duration-300">
            <div className={cn(
              "mt-0.5 size-5 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors",
              isPro ? "border-orange-500/20 bg-orange-50" : "border-brand-lichen/20 bg-brand-cream"
            )}>
              <HugeiconsIcon
                icon={Tick02Icon}
                size={12}
                className={isPro ? "text-orange-500" : "text-brand-ink"}
              />
            </div>
            <span className="leading-tight opacity-80">{feature}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => handleAction(plan.id, plan.price)}
        disabled={isLoading && plan.price > 0}
        className={cn(
          "w-full py-6 rounded-[2rem] font-black lowercase transition-all duration-500 flex items-center justify-center gap-3 group/btn shadow-xl text-lg",
          isPro 
            ? "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20" 
            : "bg-brand-ink text-brand-cream hover:bg-brand-moss shadow-brand-ink/10",
          isLoading && plan.price > 0 && "opacity-50 cursor-not-allowed"
        )}
      >
        {isLoading && plan.price > 0 ? "opening journal..." : plan.buttonText}
        <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-2" />
      </button>

      {/* Subtle background glow for pro */}
      {isPro && (
        <div className="absolute -inset-2 bg-orange-500/5 rounded-[4rem] -z-10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      )}
    </motion.div>
  );
}
