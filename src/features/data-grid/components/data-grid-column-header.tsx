import * as React from "react"
import { Column } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DataGridColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
    column: Column<TData, TValue>
    title: string
}

export function DataGridColumnHeader<TData, TValue>({
    column,
    title,
    className,
}: DataGridColumnHeaderProps<TData, TValue>) {
    if (!column.getCanSort()) {
        return <div className={cn(className)}>{title}</div>
    }

    return (
        <div className={cn("flex items-center space-x-2", className)}>
            <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent text-brand-sage hover:text-brand-moss"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                <span className="font-sans text-[10px] uppercase tracking-widest font-bold">{title}</span>
                {column.getIsSorted() === "desc" ? (
                    <ArrowDown className="ml-2 h-3 w-3" />
                ) : column.getIsSorted() === "asc" ? (
                    <ArrowUp className="ml-2 h-3 w-3" />
                ) : (
                    <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />
                )}
            </Button>
        </div>
    )
}
