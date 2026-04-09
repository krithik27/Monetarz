"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ParsedSpend } from "@/lib/parser";
import { cn } from "@/lib/utils";

interface Props {
    data: ParsedSpend[];
}

const chartConfig: ChartConfig = {
    count: {
        label: "Transactions",
        color: "#ff822d",
    },
};

export const TransactionFrequencyChart = ({ data }: Props) => {
    const chartData = useMemo(() => {
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return date.toISOString().split("T")[0];
        });

        const counts = new Map<string, number>();
        last30Days.forEach(d => counts.set(d, 0));

        data.forEach(t => {
            const dateStr = new Date(t.date).toISOString().split("T")[0];
            if (counts.has(dateStr)) {
                counts.set(dateStr, (counts.get(dateStr) || 0) + 1);
            }
        });

        return Array.from(counts.entries()).map(([date, count]) => ({
            date,
            count,
        }));
    }, [data]);

    const totalCount = data.length;
    const avgDaily = (totalCount / 30).toFixed(1);

    return (
        <Card className="@container/card border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl h-full">
            <CardHeader className="p-8">
                <CardTitle className="font-sans font-bold text-2xl text-brand-ink">Activity Pulse</CardTitle>
                <CardDescription className="font-sans font-medium text-brand-sage/80">
                    Daily transaction frequency overview
                </CardDescription>

                <div className="mt-6 flex items-center gap-6">
                    <div className="space-y-1">
                        <p className="text-brand-sage/70 text-[10px] font-sans font-medium uppercase tracking-wider">Total Entries</p>
                        <p className="text-2xl font-sans font-bold text-brand-ink tabular-nums">{totalCount}</p>
                    </div>
                    <div className="bg-brand-lichen/30 h-10 w-px"></div>
                    <div className="space-y-1">
                        <p className="text-brand-sage/70 text-[10px] font-sans font-medium uppercase tracking-wider">Avg. Daily</p>
                        <p className="text-2xl font-sans font-bold text-brand-ink tabular-nums">{avgDaily}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-6 pb-8">
                <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ff822d" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f6c2cf" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#adcce0ff" strokeDasharray="3 3" />
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
                        <YAxis hide />
                        <ChartTooltip
                            cursor={{ stroke: '#f6c2cf', strokeWidth: 1, strokeDasharray: '4 4' }}
                            content={<ChartTooltipContent className="font-sans" indicator="line" />}
                        />
                        <Area
                            dataKey="count"
                            type="monotone"
                            fill="url(#fillCount)"
                            stroke="#ff822d"
                            strokeWidth={2.5}
                            stackId="a"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};
