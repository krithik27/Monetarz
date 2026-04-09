"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useRazorpay } from "@/components/RazorpayCheckout";

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
}

const plans: Plan[] = [
  {
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
    tag: "try it now",
  },
  {
    id: "pro_monthly",
    name: "horizon monthly.",
    description: "the mindful rhythm",
    price: 299,
    period: "month",
    features: [
      "Advanced Narrative Insights",
      "Multi-Currency Support",
      "Basic Horizon Forecasts",
      "Custom Wealth Frameworks",
    ],
    buttonText: "enter the flow",
    highlight: false,
  },
  {
    id: "pro_quarterly",
    name: "quarterly flow.",
    description: "deeper financial awareness",
    price: 799,
    period: "3 months",
    features: [
      "Everything in Monthly",
      "Extended Predictive Analysis",
      "Quarterly Wealth Reports",
      "Priority AI Processing",
    ],
    buttonText: "secure the flow",
    highlight: true,
    tag: "popular choice",
  },
  {
    id: "pro_yearly",
    name: "annual horizon.",
    description: "the universal command center",
    price: 2499,
    period: "year",
    features: [
      "Everything in Quarterly",
      "Predictive Horizon Analysis",
      "Lifetime Data Retention",
      "Early Access to Features",
      "2 Months Free Included",
    ],
    buttonText: "master the flow",
    highlight: false,
  },
];

export function PricingSection() {
  const { openCheckout, isLoading } = useRazorpay();

  return (
    <section id="pricing" className="relative z-10 py-40 px-6 bg-brand-cream border-t border-brand-lichen/10">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        {/* Header */}
        <div className="mb-20">
          <div className="flex w-fit items-center gap-2 px-4 py-2 rounded-full bg-orange-500/5 border border-orange-500/10 text-orange-500 text-[10px] tracking-widest uppercase mb-6 font-bold mx-auto transition-transform hover:scale-105 duration-300">
            pricing structure
          </div>
          <h2 className="text-5xl md:text-7xl text-brand-ink text-center tracking-tighter lowercase font-black mb-12">
            choose your <span className="font-serif italic font-light text-orange-500">depth</span>
          </h2>
          <div className="text-center mt-4">
            <span className="text-[10px] uppercase tracking-widest text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-full border border-orange-100 italic">all plans include 7-day money back guarantee</span>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              viewport={{ once: true }}
              className={cn(
                "group relative p-10 rounded-[3rem] bg-white border transition-all duration-500 flex flex-col",
                plan.id === "free"
                  ? "border-pink-400/40 shadow-xl shadow-pink-400/5 ring-1 ring-pink-400/10"
                  : plan.id === "pro_monthly"
                    ? "border-blue-400/40 shadow-xl shadow-blue-400/5 ring-1 ring-blue-400/10"
                    : plan.highlight
                      ? "border-orange-500/40 shadow-xl shadow-orange-500/5 ring-1 ring-orange-500/10"
                      : plan.id === "pro_yearly"
                        ? "border-red-400/40 shadow-xl shadow-red-400/5 ring-1 ring-red-400/10"
                        : "border-brand-lichen/20 shadow-sm hover:shadow-xl hover:shadow-brand-moss/5"
              )}
            >
              {plan.tag && (
                <div className={cn(
                  "absolute -top-4 left-10 px-4 py-1.5 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg z-20",
                  plan.id === "free" ? "bg-pink-400"
                    : plan.id === "pro_monthly" ? "bg-blue-400"
                      : plan.highlight ? "bg-orange-500"
                        : plan.id === "pro_yearly" ? "bg-red-400"
                          : "bg-brand-moss"
                )}>
                  {plan.tag}
                </div>
              )}

              <div className="mb-10">
                <h3 className="text-3xl text-brand-ink font-bold lowercase tracking-tight mb-2">
                  {plan.name}
                </h3>
                <p className="text-brand-sage text-sm font-medium lowercase">
                  {plan.description}
                </p>
              </div>

              <div className="flex items-baseline gap-2 mb-10">
                <div className="text-5xl font-black text-brand-ink tracking-tighter">
                  <span className="text-xl mr-1">₹</span>
                  <NumberFlow
                    value={plan.price}
                  />
                </div>
                <div className="text-brand-sage text-xs lowercase font-medium">
                  / {plan.period}
                </div>
              </div>

              <div className="flex-grow space-y-4 mb-12">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-brand-ink text-md font-medium lowercase">
                    <div className={cn("size-5 rounded-full flex items-center justify-center border",
                      plan.id === "free" ? "border-pink-400/20 bg-pink-50"
                        : plan.id === "pro_monthly" ? "border-blue-400/20 bg-blue-50"
                          : plan.highlight ? "border-orange-500/20 bg-orange-50"
                            : plan.id === "pro_yearly" ? "border-red-400/20 bg-red-50"
                              : "border-brand-lichen/30 bg-brand-cream")}>
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        size={12}
                        className={plan.id === "free" ? "text-pink-500"
                          : plan.id === "pro_monthly" ? "text-blue-500"
                            : plan.highlight ? "text-orange-500"
                              : plan.id === "pro_yearly" ? "text-red-500"
                                : "text-brand-moss"}
                      />
                    </div>
                    {feature}
                  </div>
                ))}
              </div>

              <button
                onClick={() => plan.price > 0 && openCheckout(plan.id)}
                disabled={isLoading && plan.price > 0}
                className={cn(
                  "w-full py-5 rounded-2xl font-bold lowercase transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-xl shadow-brand-ink/10",
                  "bg-brand-ink text-brand-cream",
                  plan.id === "free" ? "hover:bg-pink-400"
                    : plan.id === "pro_monthly" ? "hover:bg-blue-400"
                      : plan.highlight ? "hover:bg-orange-500"
                        : plan.id === "pro_yearly" ? "hover:bg-red-400"
                          : "hover:bg-brand-moss",
                  isLoading && plan.price > 0 && "opacity-50 cursor-not-allowed"
                )}
              >
                {isLoading && plan.price > 0 ? "opening..." : plan.buttonText}
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
