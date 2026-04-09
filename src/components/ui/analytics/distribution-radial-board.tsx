import React, { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { PolarGrid, RadialBar, RadialBarChart } from "recharts"
import { TrendingUp } from 'lucide-react'

export function DistributionRadialBoard({ dominance }: { dominance: { category: string; total: number }[] }) {
    // Transform data for Recharts
    const chartData = useMemo(() => {
        return dominance
            .sort((a, b) => b.total - a.total)
            .slice(0, 5) // Top 5 for premium focus
            .map((item, i) => ({
                category: item.category,
                total: item.total,
                // Premium palette: variations of #ff4d00 (Rich Orange)
                fill: i === 0 ? "#ff4d00" :
                    i === 1 ? "#ff6726" :
                        i === 2 ? "#ff814d" :
                            i === 3 ? "#ff9b73" : "#ffb599"
            }))
    }, [dominance])

    const chartConfig = useMemo(() => {
        const config: ChartConfig = {
            total: {
                label: "Amount",
            }
        }
        chartData.forEach((item) => {
            config[item.category] = {
                label: item.category,
                color: item.fill
            }
        })
        return config
    }, [chartData])

    const totalVolume = dominance.reduce((sum, item) => sum + item.total, 0)

    if (dominance.length === 0) {
        return (
            <div className="bg-white/40 border border-brand-mist/20 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
                <p className="font-serif italic text-brand-sage opacity-40">No distribution data available for this range.</p>
            </div>
        )
    }

    return (
        <Card className="flex flex-col bg-white/60 border-brand-mist/20 rounded-3xl overflow-hidden backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border hover:bg-white/80 transition-colors">
            <CardHeader className="items-center pb-0">
                <CardTitle className="font-serif text-brand-moss text-xl">Allocation</CardTitle>
                <CardDescription className="text-brand-sage/60 uppercase tracking-widest text-[10px] font-bold">Category Distribution</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[330px]"
                >
                    <RadialBarChart
                        data={chartData}
                        innerRadius={50}
                        outerRadius={130}
                        startAngle={90}
                        endAngle={-270}
                    >
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel nameKey="category" />}
                        />
                        <PolarGrid gridType="circle" stroke="rgba(0,0,0,0.15)" />
                        <RadialBar
                            dataKey="total"
                            background
                            cornerRadius={12}
                            animationDuration={1500}
                            animationEasing="ease-in-out"
                        />
                    </RadialBarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm mt-[-70px] pb-8">
                <div className="flex items-center gap-2 leading-none font-serif text-brand-moss font-medium">
                    Total Volume: {Math.round(totalVolume)} <TrendingUp className="h-4 w-4" />
                </div>
            </CardFooter>
        </Card>
    )
}
