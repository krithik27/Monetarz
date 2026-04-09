import * as React from "react"
import { Table } from "@tanstack/react-table"
import { cn } from "@/lib/utils"

interface DataGridContextValue<TData> {
    table: Table<TData>
    isLoading?: boolean
    recordCount?: number
}

const DataGridContext = React.createContext<DataGridContextValue<any> | null>(null)

export function useDataGridContext<TData>() {
    const context = React.useContext(DataGridContext)
    if (!context) {
        throw new Error("useDataGridContext must be used within a DataGrid")
    }
    return context as DataGridContextValue<TData>
}

interface DataGridProps<TData> {
    table: Table<TData>
    recordCount?: number
    isLoading?: boolean
    children: React.ReactNode
    tableLayout?: {
        rowBorder?: boolean
        headerBackground?: boolean
        width?: "fixed" | "auto"
        columnsResizable?: boolean
    }
    tableClassNames?: {
        headerRow?: string
        bodyRow?: string
    }
}

export function DataGrid<TData>({
    table,
    recordCount,
    isLoading,
    children,
}: DataGridProps<TData>) {
    return (
        <DataGridContext.Provider value={{ table, isLoading, recordCount }}>
            <div className="relative w-full overflow-hidden">
                {children}
            </div>
        </DataGridContext.Provider>
    )
}

export function DataGridContainer({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={cn("rounded-md border", className)}>
            {children}
        </div>
    )
}
