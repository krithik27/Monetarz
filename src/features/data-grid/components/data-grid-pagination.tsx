import * as React from "react"
import { useDataGridContext } from "./data-grid"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface DataGridPaginationProps {
    className?: string
    sizes?: number[]
}

export function DataGridPagination({ className, sizes = [10, 20, 30, 40, 50] }: DataGridPaginationProps) {
    const { table } = useDataGridContext()

    return (
        <div className={cn("flex items-center justify-between py-4", className)}>
            <div className="flex-1 text-sm text-brand-sage font-sans italic">
                {table.getFilteredRowModel().rows.length} rows total
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-brand-sage font-sans uppercase tracking-widest text-[10px]">Rows per page</p>
                    <select
                        className="h-8 w-[70px] rounded-md border border-brand-mist/20 bg-transparent text-sm text-brand-moss focus:outline-none font-sans"
                        value={table.getState().pagination.pageSize}
                        onChange={(e) => {
                            table.setPageSize(Number(e.target.value))
                        }}
                    >
                        {sizes.map((pageSize) => (
                            <option key={pageSize} value={pageSize}>
                                {pageSize}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium text-brand-moss font-serif">
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        className="hidden h-8 w-8 p-0 lg:flex text-brand-sage hover:text-brand-moss"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 text-brand-sage hover:text-brand-moss"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 text-brand-sage hover:text-brand-moss"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        className="hidden h-8 w-8 p-0 lg:flex text-brand-sage hover:text-brand-moss"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
