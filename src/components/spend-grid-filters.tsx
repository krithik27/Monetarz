"use client";

import React from "react";
import { SpendFilters } from "@/lib/spend-filters";
import { Button } from "@/components/ui/button";
import { DataGridColumnFilter } from "@/features/data-grid/components/data-grid-column-filter";
import { Search, RotateCcw } from "lucide-react";

interface SpendGridFiltersProps {
    filters: SpendFilters;
    onFiltersChange: (filters: SpendFilters) => void;
    categories: string[];
}

export function SpendGridFilters({ filters, onFiltersChange, categories }: SpendGridFiltersProps) {
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFiltersChange({ ...filters, searchQuery: e.target.value });
    };

    const handleCategoryChange = (selected: string[]) => {
        onFiltersChange({ ...filters, categories: selected.length > 0 ? selected : undefined });
    };

    const resetFilters = () => {
        onFiltersChange({
            searchQuery: "",
            categories: undefined,
            dateRange: undefined,
            amountRange: undefined,
        });
    };

    const categoryOptions = categories.map(cat => ({
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        value: cat,
    }));

    return (
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-brand-mist/10">
            {/* Description Search */}
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-brand-sage opacity-50" />
                <input
                    type="text"
                    placeholder="Search descriptions..."
                    value={filters.searchQuery || ""}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 bg-brand-cream/10 border border-brand-mist/20 rounded-xl text-sm text-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/20 transition-all"
                />
            </div>

            {/* Category Filter */}
            <DataGridColumnFilter
                title="Categories"
                options={categoryOptions}
                //@ts-ignore - Mocking column-like filter behavior
                column={{
                    getFilterValue: () => filters.categories || [],
                    setFilterValue: (val: any) => handleCategoryChange(val || []),
                    getFacetedUniqueValues: () => new Map(),
                }}
            />

            {/* Reset */}
            <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-brand-sage hover:text-brand-moss gap-2"
            >
                <RotateCcw className="size-4" />
                Reset
            </Button>
        </div>
    );
}
