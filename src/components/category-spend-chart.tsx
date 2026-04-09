"use client";

import { useMemo } from "react";
import { TrendingDown } from "lucide-react";
import { Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { type ParsedSpend, isInflow } from "@/lib/parser";
import { MoneyEngine } from "@/lib/money";

interface Props {
    data: ParsedSpend[];
}

const CATEGORY_COLORS: Record<string, string> = {
    food: "#F43F5E", // brand-coral
    transport: "#3B82F6",
    groceries: "#10B981", // brand-moss
    shopping: "#A855F7",
    subscriptions: "#EC4899",
    health: "#14B8A6",
    entertainment: "#F59E0B", // brand-amber
    misc: "#94A3B8",
};

const chartConfig: ChartConfig = {
    food: { label: "Food", color: CATEGORY_COLORS.food },
    transport: { label: "Transport", color: CATEGORY_COLORS.transport },
    groceries: { label: "Groceries", color: CATEGORY_COLORS.groceries },
    shopping: { label: "Shopping", color: CATEGORY_COLORS.shopping },
    subscriptions: { label: "Subscriptions", color: CATEGORY_COLORS.subscriptions },
    health: { label: "Health", color: CATEGORY_COLORS.health },
    entertainment: { label: "Entertainment", color: CATEGORY_COLORS.entertainment },
    misc: { label: "Misc", color: CATEGORY_COLORS.misc },
};

export const CategorySpendChart = ({ data }: Props) => {
    const chartData = useMemo(() => {
        const totals = new Map<string, number>();

        // Count all transactions (amounts are always positive from the parser)
        data.forEach(t => {
            if (isInflow(t)) return; // Skip inflows for spending chart

            const amount = Math.abs(MoneyEngine.getMajor(t.money));
            if (amount > 0) {
                const cat = (t.category as string) || "misc";
                totals.set(cat, (totals.get(cat) || 0) + amount);
            }
        });

        return Array.from(totals.entries())
            .map(([category, total]) => ({
                category,
                total: Math.round(total),
                fill: CATEGORY_COLORS[category] ?? CATEGORY_COLORS.misc,
            }))
            .sort((a, b) => b.total - a.total);
    }, [data]);

    const topCategory = chartData[0];
    const totalSpend = chartData.reduce((acc, cur) => acc + cur.total, 0);

    return (
        <Card className="flex flex-col border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl h-full">
            <CardHeader className="items-start p-8 pb-0">
                <CardTitle className="font-sans font-bold text-2xl text-brand-ink">Category Breakdown</CardTitle>
                <CardDescription className="font-sans font-medium text-brand-sage/80">
                    Distribution of monthly outflow
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0 flex items-center justify-center">
                {chartData.length === 0 ? (
                    <div className="flex h-[220px] items-center justify-center text-horizon-muted font-serif italic text-sm">
                        No transactions yet
                    </div>
                ) : (
                    <ChartContainer config={chartConfig} className="w-full aspect-auto h-72">
                        <PieChart>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie
                                data={chartData}
                                dataKey="total"
                                nameKey="category"
                                stroke="0"
                                paddingAngle={2}
                                innerRadius="30%"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                )}
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm p-8 pt-4">
                {topCategory ? (
                    <>
                        <div className="flex items-center gap-2 leading-none font-bold font-sans text-brand-ink">
                            Top: {chartConfig[topCategory.category]?.label ?? topCategory.category}
                            <span className="text-brand-sage/80 font-medium">
                                ₹{topCategory.total.toLocaleString("en-IN")}
                            </span>
                            <TrendingDown className="h-4 w-4 text-brand-coral" />
                        </div>
                        <div className="text-brand-sage/70 font-sans font-medium tracking-tight leading-none mt-1">
                            Total: ₹{totalSpend.toLocaleString("en-IN")} across {chartData.length} categories
                        </div>
                    </>
                ) : (
                    <div className="text-brand-sage/60 font-sans italic leading-none">
                        Log transactions to see breakdown
                    </div>
                )}
            </CardFooter>
        </Card>
    );
};
