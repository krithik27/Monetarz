import React, { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { CartesianGrid, Area, AreaChart, XAxis, LabelList } from "recharts"
import { TrendingUp } from 'lucide-react'

export function FlowVelocityBoard({ boundedSummaries }: { boundedSummaries: { date: string; total_amount: number }[] }) {
    const chartData = useMemo(() => {
        return [...boundedSummaries]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(d => ({
                day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
                amount: Math.round(d.total_amount)
            }))
    }, [boundedSummaries])

    const chartConfig = {
        amount: {
            label: "Spend",
            color: "#8569e4",
        }
    } satisfies ChartConfig

    const maxSpend = Math.max(...chartData.map(d => d.amount), 0)

    if (boundedSummaries.length === 0) {
        return (
            <div className="bg-white/40 border border-brand-mist/20 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
                <p className="font-serif italic text-brand-sage opacity-40">No distribution data available for this range.</p>
            </div>
        )
    }

    return (
        <Card className="flex flex-col bg-white/60 border-brand-mist/20 rounded-3xl overflow-hidden backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border hover:bg-white/80 transition-colors">
            <CardHeader className="items-center pb-0">
                <CardTitle className="font-serif text-brand-moss text-xl">Flow Velocity</CardTitle>
                <CardDescription className="text-brand-sage/60 uppercase tracking-widest text-[10px] font-bold">Spending Rhythm</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer config={chartConfig} className="w-full h-64">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 25, left: 12, right: 12, bottom: 20 }}
                    >
                        <defs>
                            <linearGradient id="fillAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8569e4" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8569e4" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={12}
                            className="text-[10px] font-serif uppercase tracking-widest text-brand-sage/60"
                        />
                        <ChartTooltip
                            cursor={{ stroke: '#F1F5F9', strokeWidth: 2 }}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Area
                            dataKey="amount"
                            type="natural"
                            fill="url(#fillAmount)"
                            stroke="#8569e4"
                            strokeWidth={3}
                            animationDuration={2000}
                        >
                            <LabelList
                                position="top"
                                offset={12}
                                className="fill-brand-moss/80 font-serif text-[10px] font-bold"
                                formatter={(val: number) => val > maxSpend * 0.4 ? `₹${val}` : ''}
                            />
                        </Area>
                    </AreaChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm pb-8 px-8">
                <div className="flex gap-2 leading-none font-serif text-brand-moss font-medium">
                    Peak Momentum: {Math.round(maxSpend)} <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-brand-sage/60 text-[10px] uppercase tracking-widest font-bold">
                    Temporal spending intensity
                </div>
            </CardFooter>
        </Card>
    )
}
