import {
    ArrowDownToLineIcon,
    RefreshCwIcon,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ParsedSpend } from "@/lib/parser";
import { isInflow } from "@/lib/parser";
import { MoneyEngine } from "@/lib/money";

interface Props {
    data: ParsedSpend[];
}

const chartConfig: ChartConfig = {
    inflow: {
        label: "Inflow",
        color: "#10B981",
    },
    outflow: {
        label: "Outflow",
        color: "#F43F5E",
    },
};

import { useSpends } from "@/context/SpendsContext";

export const InteractiveFinancialChart = ({ data }: Props) => {
    const { incomeSources } = useSpends();

    // ── Data Processing ────────────────────────────────────────────────────────
    const chartData = useMemo(() => {
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return date.toISOString().split("T")[0];
        });

        const dailyStats = new Map<string, { inflow: number; outflow: number }>();
        last30Days.forEach(date => dailyStats.set(date, { inflow: 0, outflow: 0 }));

        // 1. Process actual logged transactions
        data.forEach(t => {
            const dateStr = new Date(t.date).toISOString().split("T")[0];
            const stats = dailyStats.get(dateStr);
            if (stats) {
                const amount = MoneyEngine.getMajor(t.money);
                if (isInflow(t)) {
                    stats.inflow += amount;
                } else {
                    stats.outflow += amount;
                }
            }
        });

        // 2. Inject Wallet/Projected Income as dynamic entries based on their day of month
        // This ensures "Inflow Wallet" additions are reflected on their specific scheduled days.
        incomeSources.forEach(source => {
            const scheduledDay = source.dayOfMonth || 1;

            // Check each day in the last 30 days to see if it matches the source's day
            last30Days.forEach(dateStr => {
                const date = new Date(dateStr);
                if (date.getDate() === scheduledDay) {
                    const stats = dailyStats.get(dateStr);
                    if (stats) {
                        stats.inflow += source.amount;
                    }
                }
            });
        });

        return Array.from(dailyStats.entries()).map(([date, stats]) => ({
            date,
            inflow: stats.inflow,
            outflow: stats.outflow,
        }));
    }, [data, incomeSources]);

    const totalInflow = chartData.reduce((acc, curr) => acc + curr.inflow, 0);
    const totalOutflow = chartData.reduce((acc, curr) => acc + curr.outflow, 0);
    const balance = totalInflow - totalOutflow;

    return (
        <Card className="@container/card border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl h-full">
            <CardHeader className="p-8">
                <CardTitle className="font-sans font-bold text-2xl text-brand-ink">Cash Flow Dynamics</CardTitle>
                <CardDescription className="font-sans font-medium text-brand-sage/80">
                    30-Day Inflow vs. Outflow Analysis
                </CardDescription>

                <div className="mt-8 flex flex-wrap items-center gap-8">
                    <div className="space-y-1">
                        <p className="text-brand-sage/70 text-xs font-sans font-medium uppercase tracking-wider">Total Inflow</p>
                        <p className="text-3xl font-sans font-bold text-emerald-600 tabular-nums">₹{totalInflow.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="hidden sm:block bg-brand-lichen/30 h-12 w-px"></div>
                    <div className="space-y-1">
                        <p className="text-brand-sage/70 text-xs font-sans font-medium uppercase tracking-wider">Total Outflow</p>
                        <p className="text-3xl font-sans font-bold text-red-500 tabular-nums">₹{totalOutflow.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="hidden sm:block bg-brand-lichen/30 h-12 w-px"></div>
                    <div className="space-y-1">
                        <p className="text-brand-sage/70 text-xs font-sans font-medium uppercase tracking-wider">Net Balance</p>
                        <p className={cn("text-3xl font-sans font-bold tabular-nums", balance >= 0 ? "text-emerald-600" : "text-red-500")}>
                            {balance >= 0 ? "+" : "-"}₹{Math.abs(balance).toLocaleString("en-IN")}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-6 pb-8">
                <ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
                    <BarChart data={chartData} barCategoryGap="20%" barGap={4}>
                        <defs>
                            <linearGradient id="grad-inflow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10B981" />
                                <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                            <linearGradient id="grad-outflow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#F43F5E" />
                                <stop offset="100%" stopColor="#E11D48" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#F1F5F9" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={12}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                });
                            }}
                            className="text-[11px] font-sans font-medium text-brand-sage"
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            width={50}
                            className="text-[11px] font-sans font-medium text-brand-sage"
                            tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                        />
                        <ChartTooltip
                            cursor={{ fill: '#F8FAFC', radius: 8 }}
                            content={
                                <ChartTooltipContent
                                    className="font-sans"
                                    labelFormatter={(value) => {
                                        return new Date(value).toLocaleDateString("en-IN", {
                                            month: "long",
                                            day: "numeric",
                                        });
                                    }}
                                    indicator="dot"
                                />
                            }
                        />
                        <Bar
                            dataKey="inflow"
                            fill="url(#grad-inflow)"
                            radius={[4, 4, 0, 0]}
                            className="opacity-95"
                        />
                        <Bar
                            dataKey="outflow"
                            fill="url(#grad-outflow)"
                            radius={[4, 4, 0, 0]}
                            className="opacity-95"
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};
