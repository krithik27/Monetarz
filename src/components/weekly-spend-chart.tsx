"use client";

import { useMemo } from "react";
import { TrendingDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { type ParsedSpend, isInflow } from "@/lib/parser";
import { MoneyEngine } from "@/lib/money";

interface Props {
    data: ParsedSpend[];
}

const chartConfig: ChartConfig = {
    spend: {
        label: "Spend",
        color: "#ff9009",
    },
} satisfies ChartConfig;

function getWeekOfMonth(date: Date): number {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    return Math.ceil((date.getDate() + startOfMonth.getDay()) / 7);
}

export const WeeklySpendChart = ({ data }: Props) => {
    const { chartData, heaviestWeek, monthLabel } = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

        const weekTotals: Record<string, number> = {
            "Week 1": 0,
            "Week 2": 0,
            "Week 3": 0,
            "Week 4": 0,
        };

        // Count all transactions — parser yields positive amounts
        data.forEach(t => {
            if (isInflow(t)) return; // Skip inflows for spending chart

            const d = new Date(t.date);
            if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return;
            const amount = Math.abs(MoneyEngine.getMajor(t.money));
            if (amount > 0) {
                const week = Math.min(getWeekOfMonth(d), 4);
                const key = `Week ${week}`;
                weekTotals[key] = (weekTotals[key] || 0) + amount;
            }
        });

        const chartData = Object.entries(weekTotals).map(([week, spend]) => ({
            week,
            spend: Math.round(spend),
        }));

        const heaviestWeek = chartData.reduce(
            (max, cur) => (cur.spend > max.spend ? cur : max),
            chartData[0]
        );

        return { chartData, heaviestWeek, monthLabel };
    }, [data]);

    return (
        <Card className="flex flex-col border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl h-full">
            <CardHeader className="p-8 pb-0">
                <CardTitle className="font-sans font-bold text-2xl text-brand-ink">Weekly Intensity</CardTitle>
                <CardDescription className="font-sans font-medium text-brand-sage/80">
                    {monthLabel} · outflow by week
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pt-4">
                <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        barCategoryGap="25%"
                        margin={{ left: 0, right: 30, top: 4, bottom: 4 }}
                    >
                        <defs>
                            <linearGradient id="grad-weekly" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#ff9009" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#ffc72b" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid horizontal={false} stroke="#ECEFF1" strokeDasharray="3 3" />
                        <XAxis
                            type="number"
                            dataKey="spend"
                            hide
                        />
                        <YAxis
                            dataKey="week"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={12}
                            width={70}
                            className="text-[11px] font-sans font-bold text-brand-ink"
                        />
                        <ChartTooltip
                            cursor={{ fill: "#F8FAFC", radius: 8 }}
                            content={
                                <ChartTooltipContent
                                    className="font-sans"
                                    hideLabel
                                    formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
                                />
                            }
                        />
                        <Bar
                            dataKey="spend"
                            fill="url(#grad-weekly)"
                            radius={[0, 4, 4, 0]}
                            className="opacity-95"
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm p-8 pt-2">
                {heaviestWeek?.spend > 0 ? (
                    <>
                        <div className="flex gap-2 leading-none font-bold font-sans items-center text-brand-ink">
                            Peak: {heaviestWeek.week}
                            <span className="text-brand-sage/80 font-medium">
                                &nbsp;₹{heaviestWeek.spend.toLocaleString("en-IN")}
                            </span>
                            <TrendingDown className="h-4 w-4 text-brand-coral" />
                        </div>
                        <div className="text-brand-sage/70 font-sans font-medium italic leading-none mt-1">
                            Monthly spend intensity
                        </div>
                    </>
                ) : (
                    <div className="text-brand-sage/60 font-sans italic leading-none">
                        No transactions logged this month
                    </div>
                )}
            </CardFooter>
        </Card>
    );
};
