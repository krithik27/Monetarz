import * as React from "react"
import { flexRender } from "@tanstack/react-table"
import { useDataGridContext } from "./data-grid"
import { cn } from "@/lib/utils"

export function DataGridTable() {
    const { table, isLoading } = useDataGridContext()

    return (
        <div className="w-full overflow-auto">
            <table className="w-full border-collapse">
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="border-b border-brand-mist/20">
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-brand-sage"
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="relative">
                    {isLoading ? (
                        <tr>
                            <td
                                colSpan={table.getAllColumns().length}
                                className="h-24 text-center text-brand-sage opacity-50 italic"
                            >
                                Loading data...
                            </td>
                        </tr>
                    ) : table.getRowModel().rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={table.getAllColumns().length}
                                className="h-24 text-center text-brand-sage opacity-50 italic"
                            >
                                No results found.
                            </td>
                        </tr>
                    ) : (
                        table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                className="border-b border-brand-mist/10 hover:bg-brand-moss/5 transition-colors"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        key={cell.id}
                                        className="px-4 py-4 text-sm text-brand-moss"
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}
