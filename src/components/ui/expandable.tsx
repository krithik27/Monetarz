"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

interface ExpandableContextValue {
    isExpanded: boolean;
    setExpanded: (val: boolean) => void;
}

const ExpandableContext = React.createContext<ExpandableContextValue | null>(null);

export function useExpandable() {
    const context = React.useContext(ExpandableContext);
    if (!context) {
        throw new Error("useExpandable must be used within an Expandable");
    }
    return context;
}

export function Expandable({
    children,
    className,
    expanded: controlledExpanded,
    onExpandedChange,
    onToggle,
    expandDirection,
    expandBehavior,
    transitionDuration,
    easeType,
}: {
    children: React.ReactNode | ((props: ExpandableContextValue) => React.ReactNode);
    className?: string;
    expanded?: boolean;
    onExpandedChange?: (val: boolean) => void;
    onToggle?: () => void;
    expandDirection?: "both" | "horizontal" | "vertical";
    expandBehavior?: "replace" | "overlay";
    transitionDuration?: number;
    easeType?: string;
}) {
    const [uncontrolledExpanded, setUncontrolledExpanded] = React.useState(false);

    const isExpanded = controlledExpanded ?? uncontrolledExpanded;
    const setExpanded = (val: boolean) => {
        if (onExpandedChange) onExpandedChange(val);
        else setUncontrolledExpanded(val);
        if (onToggle) onToggle();
    };

    return (
        <ExpandableContext.Provider value={{ isExpanded, setExpanded }}>
            <div className={cn("relative", className)}>
                {typeof children === "function" ? children({ isExpanded, setExpanded }) : children}
            </div>
        </ExpandableContext.Provider>
    );
}

export function ExpandableTrigger({
    children,
    className,
    asChild = false,
}: {
    children: React.ReactNode;
    className?: string;
    asChild?: boolean;
}) {
    const { isExpanded, setExpanded } = useExpandable();
    const Comp = asChild ? Slot : "div";

    return (
        <Comp
            className={cn("cursor-pointer", className)}
            onClick={() => setExpanded(!isExpanded)}
        >
            {children}
        </Comp>
    );
}

export function ExpandableContent({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const { isExpanded } = useExpandable();

    if (!isExpanded) return null;

    return (
        <div className={className}>
            {children}
        </div>
    );
}
