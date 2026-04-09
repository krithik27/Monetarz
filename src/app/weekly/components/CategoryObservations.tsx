import React from "react";
import { SpendCategory } from "@/lib/parser";
import { Money, MoneyEngine } from "@/lib/money";
import { cn } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/constants";
import { formatAmount } from "@/lib/money";
import { useCurrency } from "@/context/CurrencyContext";
import Image from 'next/image';

type CategoryObservationsProps = {
    breakdown: Record<SpendCategory, Money>;
};

export const CategoryObservations = ({ breakdown }: CategoryObservationsProps) => {
    const { activeCurrency } = useCurrency();
    // Sort categories by spend (high to low)
    const sortedCategories = Object.entries(breakdown)
        .sort(([, moneyA], [, moneyB]) => MoneyEngine.getMajor(moneyB) - MoneyEngine.getMajor(moneyA))
        .filter(([, money]) => MoneyEngine.getMajor(money) > 0); // Only show categories with spend

    if (sortedCategories.length === 0) {
        return (
            <div className="text-center text-brand-lichen italic font-serif py-10">
                <div className="relative w-50 h-50 md:w-60 md:h-60 mx-auto mb-6">
                    <Image
                        src="/images/no_data.webp"
                        alt="Waving tubeman mascot"
                        fill
                        className="object-contain drop-shadow-lg"
                        priority
                    />
                </div>
                No observations yet.
            </div>
        );
    }

    return (
        <div className="w-full space-y-2">
            <h3 className="text-brand-sage text-lg uppercase tracking-widest font-sans mb-4 ml-1">
                Observations
            </h3>
            {sortedCategories.map(([category, money]) => (
                <div
                    key={category}
                    className={cn(
                        "flex items-center justify-between p-4 rounded-xl",
                        "bg-brand-mist/20 hover:bg-brand-mist/40 transition-colors duration-300"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{ backgroundColor: CATEGORY_COLORS[category as SpendCategory] || CATEGORY_COLORS.misc }}
                        />
                        <span className="font-serif text-brand-ink text-lg capitalize">
                            {category}
                        </span>
                    </div>
                    <span className="font-sans text-brand-sage">
                        {formatAmount(MoneyEngine.getMajor(money), activeCurrency)}
                    </span>
                </div>
            ))}
        </div>
    );
};
