"use client";

import React, { useMemo } from "react";
import {
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    SortingState,
    ColumnDef,
} from "@tanstack/react-table";
import { ParsedSpend } from "@/lib/parser";
import { DataGrid, DataGridContainer } from "@/features/data-grid/components/data-grid";
import { DataGridTable } from "@/features/data-grid/components/data-grid-table";
import { DataGridPagination } from "@/features/data-grid/components/data-grid-pagination";
import { DataGridColumnHeader } from "@/features/data-grid/components/data-grid-column-header";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/money";

interface SpendDataGridProps {
    data: ParsedSpend[];
    totalAmount: number;
    isLoading?: boolean;
}

export function SpendDataGrid({ data, totalAmount, isLoading }: SpendDataGridProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);

    const columns = useMemo<ColumnDef<ParsedSpend>[]>(() => [
        {
            accessorKey: "date",
            header: ({ column }) => <DataGridColumnHeader column={column} title="Date" />,
            cell: ({ row }) => (
                <div className="text-brand-sage font-sans text-base">
                    {format(row.original.date, "MMM dd, yyyy")}
                </div>
            ),
        },
        {
            accessorKey: "description",
            header: ({ column }) => <DataGridColumnHeader column={column} title="Description" />,
            cell: ({ row }) => (
                <div className="font-serif text-brand-moss font-medium text-lg">
                    {row.original.description}
                </div>
            ),
        },
        {
            accessorKey: "category",
            header: ({ column }) => <DataGridColumnHeader column={column} title="Category" />,
            cell: ({ row }) => (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-moss/10 text-brand-moss border border-brand-moss/20">
                    {row.original.category}
                </span>
            ),
        },
        {
            accessorKey: "amount",
            header: ({ column }) => (
                <div className="w-full text-center">
                    <DataGridColumnHeader column={column} title="Amount" />
                </div>
            ),
            cell: ({ row }) => (
                <div className="font-serif text-brand-ink text-center text-lg">
                    {formatAmount(row.original.amount)}
                </div>
            ),
        },
        {
            id: "percentage",
            header: () => <div className="text-center w-full font-sans text-xs uppercase tracking-wider text-brand-sage">% of Total</div>,
            cell: ({ row }) => {
                const percentage = totalAmount > 0 ? (row.original.amount / totalAmount) * 100 : 0;
                return (
                    <div className="text-center text-brand-sage text-sm font-sans italic opacity-80">
                        {percentage.toFixed(1)}%
                    </div>
                );
            },
        },
    ], [totalAmount]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    const exportToCSV = () => {
        const { exportTransactionsCSV } = require('@/lib/csv-export');
        const csvInput = data.map(s => ({
            id: s.id,
            date: s.date,
            amount: s.amount,
            category: s.category,
            source: s.source
        }));
        exportTransactionsCSV(csvInput);
    };


    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
                <span className="text-xs text-brand-sage uppercase tracking-[0.2em] font-sans">
                    {data.length} Entries
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={exportToCSV}
                    disabled={data.length === 0}
                    className="text-brand-sage hover:text-brand-moss gap-2 text-[10px] uppercase tracking-widest"
                >
                    <Download className="size-3" />
                    Export CSV
                </Button>
            </div>

            <DataGridContainer className="border-brand-mist/20 bg-white/5 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
                <DataGrid
                    table={table}
                    recordCount={data.length}
                    isLoading={isLoading}
                    tableLayout={{
                        rowBorder: true,
                        headerBackground: true,
                        width: "fixed",
                        columnsResizable: true,
                    }}
                    tableClassNames={{
                        headerRow: "bg-brand-moss/5 border-b border-brand-mist/20",
                        bodyRow: "hover:bg-brand-moss/5 transition-colors",
                    }}
                >
                    <DataGridTable />
                    <div className="px-4 border-t border-brand-mist/20">
                        <DataGridPagination
                            className="bg-transparent"
                            sizes={[5, 10, 25, 50]}
                        />
                    </div>
                </DataGrid>
            </DataGridContainer>
        </div>
    );
}
