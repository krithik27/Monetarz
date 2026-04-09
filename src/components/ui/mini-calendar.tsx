import * as React from "react"
import { addDays, subDays, format, isSameDay } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface MiniCalendarContextValue {
    startDate: Date
    onStartDateChange: (date: Date) => void
    days: number
}

const MiniCalendarContext = React.createContext<MiniCalendarContextValue | null>(null)

export function useMiniCalendar() {
    const context = React.useContext(MiniCalendarContext)
    if (!context) {
        throw new Error("useMiniCalendar must be used within a MiniCalendar")
    }
    return context
}

export function MiniCalendar({
    startDate,
    onStartDateChange,
    days = 7,
    children,
    className,
}: MiniCalendarContextValue & { children: React.ReactNode; className?: string }) {
    return (
        <MiniCalendarContext.Provider value={{ startDate, onStartDateChange, days }}>
            <div className={cn("flex flex-col gap-2", className)}>
                {children}
            </div>
        </MiniCalendarContext.Provider>
    )
}

export function MiniCalendarNavigation({
    direction,
    variant = "ghost",
    className,
}: {
    direction: "prev" | "next"
    variant?: "ghost" | "outline" | "default"
    className?: string
}) {
    const { startDate, onStartDateChange, days } = useMiniCalendar()

    const handleNavigate = () => {
        const newDate = direction === "prev"
            ? subDays(startDate, days)
            : addDays(startDate, days)
        onStartDateChange(newDate)
    }

    return (
        <Button
            variant={variant}
            size="icon"
            className={className}
            onClick={handleNavigate}
        >
            {direction === "prev" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </Button>
    )
}

export function MiniCalendarDays({
    children,
    className,
}: {
    children: (date: Date) => React.ReactNode
    className?: string
}) {
    const { startDate, days } = useMiniCalendar()

    const dates = React.useMemo(() => {
        return Array.from({ length: days }).map((_, i) => addDays(startDate, i))
    }, [startDate, days])

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {dates.map(children)}
        </div>
    )
}

export function MiniCalendarDay({
    date,
    className,
    onClick,
}: {
    date: Date
    className?: string
    onClick?: (date: Date) => void
}) {
    const { startDate, onStartDateChange } = useMiniCalendar()
    const isSelected = isSameDay(date, startDate)

    return (
        <div
            onClick={() => {
                onStartDateChange(date)
                onClick?.(date)
            }}
            data-selected={isSelected}
            className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-all hover:bg-brand-moss/10",
                className
            )}
        >
            <span className="text-[10px] uppercase font-sans tracking-widest opacity-60">
                {format(date, "EEE")}
            </span>
            <span className="text-sm font-serif font-bold">
                {format(date, "d")}
            </span>
        </div>
    )
}
