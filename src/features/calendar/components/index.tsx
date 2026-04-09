"use client";

import { getDay, getDaysInMonth, isSameDay } from "date-fns";
import { atom, useAtom } from "jotai";
import {
    Check,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsUpDown,
    X,
    Receipt,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    createContext,
    memo,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Expandable, ExpandableTrigger, ExpandableContent } from "@/components/ui/expandable";
import { format } from "date-fns";
import { calculateRollingAnomaly, DailyAnomaly } from "@/lib/diagnostics";
import { formatAmount } from "@/lib/money";
import { SafeImage } from "@/components/ui/safe-image";
import { useCurrency } from "@/context/CurrencyContext";


export type CalendarState = {
    month: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
    year: number;
};

const monthAtom = atom<CalendarState["month"]>(
    new Date().getMonth() as CalendarState["month"]
);
const yearAtom = atom<CalendarState["year"]>(new Date().getFullYear());
const selectedDateAtom = atom<Date | null>(null);

export const useCalendarMonth = () => useAtom(monthAtom);
export const useCalendarYear = () => useAtom(yearAtom);
export const useSelectedDate = () => useAtom(selectedDateAtom);

type CalendarContextProps = {
    locale: Intl.LocalesArgument;
    startDay: number;
};

const CalendarContext = createContext<CalendarContextProps>({
    locale: "en-US",
    startDay: 0,
});

export type Status = {
    id: string;
    name: string;
    color: string;
};

export type Feature = {
    id: string;
    name: string;
    startAt: Date;
    endAt: Date;
    status: Status;
};

type ComboboxProps = {
    value: string;
    setValue: (value: string) => void;
    data: {
        value: string;
        label: string;
    }[];
    labels: {
        button: string;
        empty: string;
        search: string;
    };
    className?: string;
};

export const monthsForLocale = (
    localeName: Intl.LocalesArgument,
    monthFormat: Intl.DateTimeFormatOptions["month"] = "long"
) => {
    const format = new Intl.DateTimeFormat(localeName, { month: monthFormat })
        .format;

    return [...new Array(12).keys()].map((m) =>
        format(new Date(Date.UTC(2021, m, 2)))
    );
};

export const daysForLocale = (
    locale: Intl.LocalesArgument,
    startDay: number
) => {
    const weekdays: string[] = [];
    const baseDate = new Date(2024, 0, startDay);

    for (let i = 0; i < 7; i++) {
        weekdays.push(
            new Intl.DateTimeFormat(locale, { weekday: "short" }).format(baseDate)
        );
        baseDate.setDate(baseDate.getDate() + 1);
    }

    return weekdays;
};

const Combobox = ({
    value,
    setValue,
    data,
    labels,
    className,
}: ComboboxProps) => {
    const [open, setOpen] = useState(false);

    return (
        <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
                <Button
                    aria-expanded={open}
                    className={cn("w-40 justify-between capitalize bg-white/60 backdrop-blur-md border border-white/20 shadow-sm transition-all hover:bg-white/80", className)}
                    variant="outline"
                >
                    {value
                        ? data.find((item) => item.value === value)?.label
                        : labels.button}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-0 bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-xl overflow-hidden">
                <Command
                    filter={(value, search) => {
                        const label = data.find((item) => item.value === value)?.label;

                        return label?.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                    }}
                >
                    <CommandInput placeholder={labels.search} />
                    <CommandList>
                        <CommandEmpty>{labels.empty}</CommandEmpty>
                        <CommandGroup>
                            {data.map((item) => (
                                <CommandItem
                                    className="capitalize"
                                    key={item.value}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue === value ? "" : currentValue);
                                        setOpen(false);
                                    }}
                                    value={item.value}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === item.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {item.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};



export type CalendarBodyProps = {
    features: Feature[];
    children: (props: { feature: Feature }) => ReactNode;
    onDayClick?: (date: Date) => void;
    densityMode?: boolean;
};

export function CalendarBody({
    features,
    densityMode = false,
    onDayDoubleClick,
    activeCategory,
}: Omit<CalendarBodyProps, "children"> & {
    onDayDoubleClick?: (date: Date) => void;
    activeCategory?: string | null;
}) {
    const [month] = useCalendarMonth();
    const [year] = useCalendarYear();
    const { startDay } = useContext(CalendarContext);
    const { activeCurrency } = useCurrency();

    // Memoize expensive date calculations
    const currentMonthDate = useMemo(
        () => new Date(year, month, 1),
        [year, month]
    );
    const daysInMonth = useMemo(
        () => getDaysInMonth(currentMonthDate),
        [currentMonthDate]
    );
    const firstDay = useMemo(
        () => (getDay(currentMonthDate) - startDay + 7) % 7,
        [currentMonthDate, startDay]
    );

    // Memoize features filtering by day
    const featuresByDay = useMemo(() => {
        const result: { [day: number]: Feature[] } = {};
        for (let day = 1; day <= daysInMonth; day++) {
            const dayFeatures = features.filter((feature) => {
                return isSameDay(new Date(feature.endAt), new Date(year, month, day));
            });
            result[day] = dayFeatures;
        }
        return result;
    }, [features, daysInMonth, year, month]);
    // Calculate max daily spend for this month (for density scaling)
    const maxDailySpend = useMemo(() => {
        let max = 0;
        Object.values(featuresByDay).forEach(dayFeatures => {
            const dailyTotal = dayFeatures.reduce((acc, f) => acc + ((f as any).original?.amount || 0), 0);
            if (dailyTotal > max) max = dailyTotal;
        });
        return max || 1000; // Default to 1000 to avoid div/0 or log(0) issues
    }, [featuresByDay]);

    // --- DAY OVERLAY (LAYER 2) COMPONENTS ---
    // We define these here to have access to day-specific data contextually

    // --- WEEKLY DEVIATION BANNER LOGIC ---
    // Only show if we are viewing the current month
    const isCurrentMonthView = new Date().getMonth() === month && new Date().getFullYear() === year;
    let weeklyBanner = null;

    if (isCurrentMonthView) {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

        let weekTotal = 0;
        let weekRollingAvgSum = 0;
        let daysCounted = 0;

        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            if (d > today) break; // Don't count future

            // Mock spend for diagnostics (inefficient but consistent)
            const mockSpends = features.map(f => ({
                date: new Date(f.startAt),
                amount: (f as any).original?.amount || 0,
                money: { amount: (f as any).original?.amount || 0, currency: "INR" },
                category: f.status.name
            } as any));

            const anomaly = calculateRollingAnomaly(mockSpends, d);
            weekTotal += anomaly.totalSpend;
            weekRollingAvgSum += anomaly.rollingAverage;
            daysCounted++;
        }

        if (daysCounted > 0 && weekRollingAvgSum > 0) {
            const weekDelta = (weekTotal - weekRollingAvgSum) / weekRollingAvgSum;
            const absDelta = Math.abs(weekDelta);
            const direction = weekDelta > 0 ? "above" : "below";

            if (absDelta >= 0.10) { // Only show if > 10% deviation
                const colorClass = weekDelta > 0 ? "text-brand-coral" : "text-brand-moss";
                weeklyBanner = (
                    <div className="col-span-7 mb-4 px-4 py-2 bg-brand-mist/20 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
                        <span className="text-sm font-serif text-brand-sage italic">
                            This week is <span className={cn("font-bold not-italic", colorClass)}>{Math.round(absDelta * 100)}% {direction}</span> your usual rhythm.
                        </span>
                        <div className={cn("h-1 w-16 rounded-full", weekDelta > 0 ? "bg-brand-coral" : "bg-brand-moss")} />
                    </div>
                );
            }
        }
    }

    const days: ReactNode[] = [];
    if (weeklyBanner) {
        // days.push(weeklyBanner); // Pushing to grid children might break layout if not careful.
        // Better to return it separate?
        // CalendarBody returns a grid.
    }

    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="min-h-[120px]" />);
    }

    // Weekly Summary Logic vars
    let currentWeekSpend = 0;
    let daysInCurrentRow = firstDay; // Start with offset


    for (let day = 1; day <= daysInMonth; day++) {
        const dayFeatures = featuresByDay[day] || [];
        const date = new Date(year, month, day);

        // Logic & Contracts
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalSpend = dayFeatures.reduce((acc, f) => acc + ((f as any).original?.amount || 0), 0);

        // --- DIAGNOSTIC LAYER ---
        // We need all spends to calculate rolling average. 
        // Hack: We don't have all spends here easily without context or prop drilling.
        // For the sake of this feature, we will assume `features` contains global history?
        // Actually `features` in CalendarBody seems to be filtered? No, `features` is passed in.
        // If `features` is ALL features, we can map them back to ParsedSpend structure mocked for diagnostics.

        // Optimize: This is O(N*M) inside a loop. 
        // Ideally we pass `dailyAnomalies` map in.
        // For now, let's just calculate it.
        const mockSpends = features.map(f => ({
            date: new Date(f.startAt),
            amount: (f as any).original?.amount || 0,
            money: { amount: (f as any).original?.amount || 0, currency: "INR" },
            category: f.status.name
        } as any));

        const anomaly = calculateRollingAnomaly(mockSpends, date);

        // VISUAL STABILITY: Logarithmic Scale + Low Signal Suppression
        let spendDensity = 0;
        if (totalSpend > 0) {
            // Log scale to compress outliers (so 50k doesn't dwarf 2k)
            // base = 500, max = 15000? 
            // We use a safe log approach:
            const safeSpend = Math.max(1, totalSpend);
            const logSpend = Math.log10(safeSpend);
            const logMax = Math.log10(maxDailySpend * 2); // Extend range slightly
            spendDensity = Math.min(logSpend / logMax, 1);

            // Dampen low-signal days (< ₹200) to avoid "busy" look
            if (totalSpend < 200) {
                spendDensity *= 0.15; // Visually fade these
            } else if (totalSpend < 1000) {
                spendDensity *= 0.6; // Moderate spend
            }
        }

        const hasSpend = totalSpend > 0;

        // Determine dominant category for hint (by highest spend)
        const categoryTotals: Record<string, { amount: number, color: string }> = {};
        dayFeatures.forEach(f => {
            const cat = f.status.name;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const amount = (f as any).original?.amount || 0;
            if (!categoryTotals[cat]) {
                categoryTotals[cat] = { amount: 0, color: f.status.color };
            }
            categoryTotals[cat].amount += amount;
        });

        // Find category with max spend
        let maxCategorySpend = -1;
        let dominantColor = "bg-brand-sage"; // Default

        Object.values(categoryTotals).forEach(c => {
            if (c.amount > maxCategorySpend) {
                maxCategorySpend = c.amount;
                dominantColor = c.color;
            }
        });

        const categoryHintColor = dominantColor;
        const isToday = isSameDay(date, new Date());

        days.push(
            <div key={day} className="relative min-h-[120px] p-1">

                <CalendarMarker
                    day={day}
                    date={date}
                    features={dayFeatures}
                    totalSpend={totalSpend}
                    spendDensity={spendDensity}
                    hasSpend={hasSpend}
                    categoryHintColor={categoryHintColor}
                    densityMode={densityMode}
                    anomaly={anomaly}
                    isToday={isToday}
                    onDoubleClick={() => onDayDoubleClick?.(date)}
                    isDimmed={activeCategory ? dominantColor !== activeCategory : false}
                    isCurrentMonthView={isCurrentMonthView}
                />
            </div>
        );

        // Weekly Summary Logic
        currentWeekSpend += totalSpend;
        daysInCurrentRow++;

        if (daysInCurrentRow === 7 || day === daysInCurrentRow) { // Check if end of row
            // Wait, logic check: 
            // We need to insert the summary AFTER the 7th cell in the row.
            // Grid is now 8 cols. 
            // If daysInCurrentRow reaches 7, we push the summary and reset.
        }

        if (daysInCurrentRow === 7) {
            days.push(
                <div key={`week-sum-${day}`} className="min-h-[120px] p-1 flex flex-col justify-end pb-4 items-end">
                    <span className="text-[10px] uppercase tracking-widest text-brand-sage/50 font-sans mb-1">Total</span>
                    <span className={cn("text-sm font-serif", currentWeekSpend > 0 ? "text-brand-moss" : "text-brand-lichen/50")}>
                        {formatAmount(currentWeekSpend, activeCurrency)}
                    </span>
                </div>
            );
            currentWeekSpend = 0;
            daysInCurrentRow = 0;
        }
    }

    // Fill remaining empty cells to complete the last row up to 7, THEN add the last week's summary
    if (daysInCurrentRow > 0) {
        const remainingCells = 7 - daysInCurrentRow;
        for (let i = 0; i < remainingCells; i++) {
            days.push(<div key={`empty-end-${i}`} className="min-h-[120px]" />);
        }
        // Add final week summary
        days.push(
            <div key={`week-sum-final`} className="min-h-[120px] p-1 flex flex-col justify-end pb-4 items-end">
                <span className="text-[10px] uppercase tracking-widest text-brand-sage/50 font-sans mb-1">Total</span>
                <span className={cn("text-sm font-serif", currentWeekSpend > 0 ? "text-brand-moss" : "text-brand-lichen/50")}>
                    {formatAmount(currentWeekSpend, activeCurrency)}
                </span>
            </div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={`${year}-${month}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="grid flex-grow grid-cols-8 gap-3 md:gap-4 lg:gap-6"
            >
                {weeklyBanner && (
                    <div className="col-span-8">
                        {weeklyBanner}
                    </div>
                )}
                {days}
            </motion.div>
        </AnimatePresence>
    );
};

CalendarBody.displayName = "CalendarBody";

// --- SUB-COMPONENTS FOR LAYER 2 ---


type CalendarMarkerProps = {
    day: number;
    date: Date;
    features: Feature[];
    totalSpend: number;
    spendDensity: number;
    hasSpend: boolean;
    categoryHintColor: string;
    densityMode?: boolean;
    anomaly: DailyAnomaly;
    isToday: boolean;
    isCurrentMonthView?: boolean;
};

const CalendarMarker = ({
    day,
    date,
    features,
    totalSpend,
    spendDensity,
    hasSpend,
    categoryHintColor,
    densityMode = false,
    anomaly,
    isToday,
    onDoubleClick,
    isDimmed = false,
    isCurrentMonthView = false,
}: CalendarMarkerProps & { onDoubleClick?: () => void; isDimmed?: boolean; isCurrentMonthView?: boolean }) => {
    const [selectedDate, setSelectedDate] = useSelectedDate();
    const { activeCurrency } = useCurrency();

    const isExpanded = selectedDate ? isSameDay(selectedDate, date) : false;

    const handleOpen = useCallback(() => {
        setSelectedDate(date);
    }, [date, setSelectedDate]);

    const handleClose = useCallback(() => {
        setSelectedDate(null);
    }, [setSelectedDate]);

    // Escape key listener for the active overlay
    useEffect(() => {
        if (!isExpanded) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isExpanded, handleClose]);

    // Filter categories
    const categories: Record<string, number> = {};
    features.forEach((f) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const original = (f as any).original;
        const cat = f.status.name;
        categories[cat] = (categories[cat] || 0) + (original?.amount || 0);
    });
    const categoryEntries = Object.entries(categories);

    // Calculate if the day belongs to a week that has already ended
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfCurrentWeek = new Date(today);
    startOfCurrentWeek.setDate(today.getDate() - today.getDay());
    
    // We only show the flag on days before the current week started
    const isPastWeek = date < startOfCurrentWeek;

    return (
        <Expandable
            expandDirection="both"
            expandBehavior="replace"
            transitionDuration={0.4}
            easeType="easeInOut"
            expanded={isExpanded}
            onToggle={() => isExpanded ? handleClose() : handleOpen()}
            className="w-full h-full"
        >
            {() => (
                <>
                    <ExpandableTrigger className="w-full h-full group" asChild>
                        <div
                            tabIndex={0}
                            className={cn(
                                "w-full h-full rounded-2xl transition-all duration-700 flex flex-col items-center justify-center relative overflow-hidden ring-1 ring-inset",
                                isDimmed ? "opacity-30 grayscale" : "",
                                // Base state for premium tiles: visible but subtle
                                hasSpend
                                    ? cn(
                                        "bg-brand-cream border border-brand-moss/10 shadow-sm",
                                        isExpanded ? "ring-2 ring-brand-moss/40" : (isToday ? "ring-2 ring-brand-moss" : "ring-brand-moss/5")
                                    )
                                    : cn(
                                        "bg-brand-mist/5 border border-brand-lichen/10 hover:bg-brand-mist/10 hover:border-brand-lichen/20",
                                        isToday ? "ring-2 ring-brand-moss/60 bg-brand-moss/5" : "ring-transparent"
                                    )
                            )}
                            onDoubleClick={onDoubleClick}
                        >
                            {/* Empty Day Background Image Logic */}
                            {!hasSpend && isCurrentMonthView && isPastWeek && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-80 pointer-events-none transition-transform group-hover:scale-105">
                                    <SafeImage
                                        src="/images/green-flag.webp"
                                        alt="Empty Slot Placeholder"
                                        className="w-16 h-16 object-contain"
                                        priority={false}
                                    />
                                </div>
                            )}

                            {/* Day Number - Top Right */}
                            <div className={cn(
                                "absolute top-3 right-4 font-sans text-xs font-medium tracking-tighter transition-colors z-10",
                                hasSpend
                                    ? (densityMode ? "text-[#D85F58]" : "text-brand-moss") // Darker variant of #ff746c for text
                                    : "text-brand-sage/60 group-hover:text-brand-sage"
                            )}>
                                {day}
                            </div>


                            {/* Spend Visualization - Heatmap Layer */}
                            {hasSpend && (
                                <>
                                    {/* Base Layer (Always Coral/Red Palette, Opacity Controlled by Mode) */}
                                    <div
                                        className={cn(
                                            "absolute inset-0 rounded-2xl transition-all duration-700",
                                            anomaly.isAnomaly ? "bg-brand-coral" : "bg-[#ff746c]"
                                        )}
                                        style={{
                                            opacity: densityMode
                                                ? (anomaly.isAnomaly
                                                    ? 0.7 + (Math.min(anomaly.delta, 1) * 0.2) // High + Eligible: 0.7 - 0.9
                                                    : (anomaly.tier === "Moderate" && anomaly.isEligible)
                                                        ? 0.4 + (Math.min(anomaly.delta, 0.5) * 0.4) // Moderate + Eligible: 0.4 - 0.6
                                                        : 0.1 + (spendDensity * 0.7)) // Normal/Ineligible density
                                                : 0 // Invisible in default mode, allowing for smooth fade transition
                                        }}
                                    />

                                    {/* High Anomaly Pulse */}
                                    {densityMode && anomaly.isAnomaly && (
                                        <div className="absolute inset-0 rounded-2xl bg-brand-coral/20 animate-pulse" />
                                    )}
                                </>
                            )}

                            {/* Category Hint Dot OR Anomaly Badge */}
                            {hasSpend && (
                                (densityMode && anomaly.isAnomaly) ? (
                                    <div className="w-1.5 h-1.5 rounded-full absolute bottom-4 bg-brand-rust shadow-[0_0_8px_rgba(216,95,88,0.6)] z-10 animate-pulse" />
                                ) : (
                                    <div className={cn("w-1.5 h-1.5 rounded-full absolute bottom-4 shadow-[0_0_10px_rgba(0,0,0,0.05)] z-10", categoryHintColor)} />
                                )
                            )}
                        </div>
                    </ExpandableTrigger>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12"
                            >
                                {/* Backdrop / Underlay */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={handleClose}
                                    className="absolute inset-0 bg-brand-cream/60 backdrop-blur-xl cursor-zoom-out"
                                />

                                {/* Card */}
                                <div className="relative w-full max-w-sm md:max-w-md shadow-2xl rounded-3xl overflow-hidden bg-[#FAF9F6] ring-1 ring-black/5 z-10">

                                    {/* Close Button - Minimalist X */}
                                    <div className="absolute top-4 right-4 z-[60]">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleClose}
                                            className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-md border border-brand-lichen/20 hover:bg-brand-rust/10 text-brand-rust transition-all duration-300"
                                        >
                                            <X className="w-4 h-4" strokeWidth={2} />
                                        </Button>
                                    </div>

                                    {/* RECEIPT HEADER */}
                                    <div className="p-8 pb-6 border-b border-stone-200/60 border-dashed relative bg-white">
                                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#FAF9F6] shadow-inner" />
                                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#FAF9F6] shadow-inner" />
                                        
                                        <div className="flex items-center gap-3 mb-2 opacity-50 justify-center">
                                            <Receipt className="w-4 h-4" />
                                            <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-semibold">Daily Log</span>
                                        </div>
                                        <h2 className="font-serif text-3xl md:text-4xl text-brand-ink text-center tracking-tight">
                                            {format(date, "MMM d, yyyy")}
                                        </h2>
                                        <p className="text-center font-sans text-brand-sage text-sm mt-3 uppercase tracking-widest font-medium">
                                            {format(date, "EEEE")}
                                        </p>
                                    </div>

                                    {/* RECEIPT TOTAL */}
                                    <div className="py-6 px-8 bg-stone-50 flex flex-col items-center justify-center border-b border-stone-200/40">
                                        <span className="text-[10px] uppercase tracking-widest text-brand-sage font-sans mb-1">Total Spends</span>
                                        <span className={cn("text-4xl font-serif tracking-tight", totalSpend > 0 ? "text-brand-moss" : "text-brand-lichen")}>
                                            {formatAmount(totalSpend, activeCurrency)}
                                        </span>
                                    </div>

                                    {/* ENTRY LIST */}
                                    <div className="p-8 space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar bg-white">
                                        {features.length === 0 && (
                                            <motion.div
                                                exit={{ opacity: 0, y: 10 }}
                                                className="flex flex-col items-center justify-center py-8 text-brand-lichen/50"
                                            >
                                                <div className="w-8 h-8 rounded-full border border-dashed border-current flex items-center justify-center mb-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                </div>
                                                <p className="italic font-serif text-lg text-brand-sage/70">No logs for this day.</p>
                                            </motion.div>
                                        )}
                                        <AnimatePresence mode="popLayout">
                                            {isExpanded && features.map((f, i: number) => {
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                const item = f as any;
                                                return (
                                                    <motion.div
                                                        key={item.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, transition: { delay: i * 0.02, duration: 0.2 } }}
                                                        transition={{ delay: 0.1 + (i * 0.05) }}
                                                        className="flex justify-between items-center group py-2 border-b border-stone-100 last:border-0"
                                                    >
                                                        <div className="flex flex-col gap-1 overflow-hidden">
                                                            <span className="text-base text-brand-ink font-medium group-hover:text-brand-moss transition-colors truncate">
                                                                {item.name}
                                                            </span>
                                                            <span className={cn("text-[10px] w-fit px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold bg-opacity-10", item.status.color, item.status.color.replace('bg-', 'text-'))}>
                                                                {item.status.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-brand-ink/80 font-sans font-medium text-base tabular-nums shrink-0">
                                                            {formatAmount(item.original?.amount, activeCurrency)}
                                                        </span>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>

                                    {/* RECEIPT FOOTER */}
                                    {categoryEntries.length > 1 && (
                                        <div className="px-8 py-5 bg-stone-100 border-t border-stone-200/50 text-[10px] uppercase tracking-wider text-brand-sage flex flex-wrap gap-x-4 gap-y-3 justify-center">
                                            {categoryEntries.map(([cat, amt]) => (
                                                <span key={cat}>
                                                    {cat} <span className="text-brand-moss/60 ml-px">{formatAmount(amt)}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </Expandable>
    );
};

CalendarMarker.displayName = "CalendarMarker";

// Dummy standard export to satisfy linter if needed, but CalendarBody is the main export modified.


export type CalendarDatePickerProps = {
    className?: string;
    children: ReactNode;
};

export const CalendarDatePicker = ({
    className,
    children,
}: CalendarDatePickerProps) => (
    <div className="flex items-center gap-1">{children}</div>
);

export type CalendarMonthPickerProps = {
    className?: string;
};

export const CalendarMonthPicker = ({
    className,
}: CalendarMonthPickerProps) => {
    const [month, setMonth] = useCalendarMonth();
    const { locale } = useContext(CalendarContext);

    // Memoize month data to avoid recalculating date formatting
    const monthData = useMemo(() => {
        return monthsForLocale(locale).map((month, index) => ({
            value: index.toString(),
            label: month,
        }));
    }, [locale]);

    return (
        <Combobox
            className={className}
            data={monthData}
            labels={{
                button: "Select month",
                empty: "No month found",
                search: "Search month",
            }}
            setValue={(value) =>
                setMonth(Number.parseInt(value, 10) as CalendarState["month"])
            }
            value={month.toString()}
        />
    );
};

export type CalendarYearPickerProps = {
    className?: string;
    start: number;
    end: number;
};

export const CalendarYearPicker = ({
    className,
    start,
    end,
}: CalendarYearPickerProps) => {
    const [year, setYear] = useCalendarYear();

    return (
        <Combobox
            className={className}
            data={Array.from({ length: end - start + 1 }, (_, i) => ({
                value: (start + i).toString(),
                label: (start + i).toString(),
            }))}
            labels={{
                button: "Select year",
                empty: "No year found",
                search: "Search year",
            }}
            setValue={(value) => setYear(Number.parseInt(value, 10))}
            value={year.toString()}
        />
    );
};

export type CalendarDatePaginationProps = {
    className?: string;
};

export const CalendarDatePagination = ({
    className,
}: CalendarDatePaginationProps) => {
    const [month, setMonth] = useCalendarMonth();
    const [year, setYear] = useCalendarYear();

    const handlePreviousMonth = useCallback(() => {
        if (month === 0) {
            setMonth(11);
            setYear(year - 1);
        } else {
            setMonth((month - 1) as CalendarState["month"]);
        }
    }, [month, year, setMonth, setYear]);

    const handleNextMonth = useCallback(() => {
        if (month === 11) {
            setMonth(0);
            setYear(year + 1);
        } else {
            setMonth((month + 1) as CalendarState["month"]);
        }
    }, [month, year, setMonth, setYear]);

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Button
                onClick={() => {
                    const now = new Date();
                    setMonth(now.getMonth() as CalendarState["month"]);
                    setYear(now.getFullYear());
                }}
                variant="outline"
                size="sm"
                className="mr-2 h-8 text-xs font-medium text-brand-sage hover:text-brand-moss border-brand-lichen/20 bg-white/50"
            >
                Today
            </Button>
            <Button onClick={handlePreviousMonth} size="icon" variant="ghost">
                <ChevronLeftIcon size={16} />
            </Button>
            <Button onClick={handleNextMonth} size="icon" variant="ghost">
                <ChevronRightIcon size={16} />
            </Button>
        </div>
    );
};

export type CalendarDateProps = {
    children: ReactNode;
};

export const CalendarDate = ({ children }: CalendarDateProps) => (
    <div className="flex items-center justify-between p-3">{children}</div>
);

export type CalendarHeaderProps = {
    className?: string;
};

export const CalendarHeader = ({ className }: CalendarHeaderProps) => {
    const { locale, startDay } = useContext(CalendarContext);

    // Memoize days data to avoid recalculating date formatting
    const daysData = useMemo(() => {
        return daysForLocale(locale, startDay);
    }, [locale, startDay]);

    return (
        <div className={cn("grid flex-grow grid-cols-8 gap-3 md:gap-4 lg:gap-6", className)}>
            {daysData.map((day) => (
                <div className="pb-4 pt-2 text-right text-brand-sage/60 text-[10px] uppercase tracking-widest font-sans font-bold" key={day}>
                    {day}
                </div>
            ))}
            <div className="pb-4 pt-2 text-right text-brand-moss/60 text-[10px] uppercase tracking-widest font-sans font-bold">
                Week
            </div>
        </div>
    );
};

export type CalendarItemProps = {
    feature: Feature;
    className?: string;
};

export const CalendarItem = memo(
    ({ feature, className }: CalendarItemProps) => (
        <div className={cn("flex items-center gap-2", className)}>
            <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                    backgroundColor: feature.status.color,
                }}
            />
            <span className="truncate">{feature.name}</span>
        </div>
    )
);

CalendarItem.displayName = "CalendarItem";

export type CalendarProviderProps = {
    locale?: Intl.LocalesArgument;
    startDay?: number;
    children: ReactNode;
    className?: string;
};

export const CalendarProvider = ({
    locale = "en-US",
    startDay = 0,
    children,
    className,
}: CalendarProviderProps) => (
    <CalendarContext.Provider value={{ locale, startDay }}>
        <div className={cn("relative flex flex-col", className)}>{children}</div>
    </CalendarContext.Provider>
);
