"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// --- Stylish Icons ---

const HomeIcon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = ({
  size = 20,
  ...props
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 3L4 9V21H9V15H15V21H20V9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const WeeklyIcon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = ({
  size = 20,
  ...props
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M18 20V10M12 20V4M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = ({
  size = 20,
  ...props
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const AnalyticsIcon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = ({
  size = 20,
  ...props
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M3 3V21H21M7 16L11 12L15 16L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HorizonIcon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = ({
  size = 20,
  ...props
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const MoreIcon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = ({
  size = 20,
  ...props
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
    <circle cx="19" cy="12" r="1" fill="currentColor"/>
    <circle cx="5" cy="12" r="1" fill="currentColor"/>
  </svg>
);

// Mapping labels to icons for default if not provided
const ICON_MAP: Record<string, React.FC<any>> = {
  Today: HomeIcon,
  Weekly: WeeklyIcon,
  Calendar: CalendarIcon,
  Analytics: AnalyticsIcon,
  Horizon: HorizonIcon,
  More: MoreIcon,
};

export interface NavItem {
  id: string;
  title: string;
  href?: string;
  icon?: React.ComponentType<any>;
}

interface DiscreteTabsProps {
  items: NavItem[];
  moreItems?: NavItem[];
  className?: string;
}

export default function DiscreteTabs({ items, moreItems, className }: DiscreteTabsProps) {
  const pathname = usePathname();

  return (
    <div className={cn("flex gap-2 items-center", className)}>
      {items.map((item) => {
        const Icon = item.icon || ICON_MAP[item.title] || HomeIcon;
        const isActive = pathname === item.href;

        return (
          <TabButton
            key={item.id}
            title={item.title}
            href={item.href}
            ButtonIcon={Icon}
            isActive={isActive}
          />
        );
      })}

      {moreItems && moreItems.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <TabButton
              title="More"
              ButtonIcon={MoreIcon}
              isActive={false} // Popover trigger shouldn't stay active in that sense
            />
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            className="w-48 mb-4 p-2 rounded-2xl border border-brand-lichen/20 bg-brand-cream/95 backdrop-blur-xl shadow-xl space-y-1"
          >
            {moreItems.map((mItem) => (
              <Link
                key={mItem.id}
                href={mItem.href || "#"}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-moss/10 text-brand-sage hover:text-brand-moss transition-colors"
              >
                {mItem.icon && <mItem.icon className="size-4" />}
                <span className="font-serif text-lg">{mItem.title}</span>
              </Link>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

const TabButton = React.forwardRef<
  HTMLDivElement,
  {
    title: string;
    href?: string;
    ButtonIcon: React.ComponentType<any>;
    isActive: boolean;
    [key: string]: any;
  }
>(({ title, href, ButtonIcon, isActive, ...props }, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const content = (
    <motion.div
      ref={ref}
      layoutId={"button-id-" + title}
      transition={{
        layout: {
          type: "spring",
          damping: 20,
          stiffness: 230,
          mass: 1.2,
          ease: [0.215, 0.61, 0.355, 1],
        },
      }}
      className="w-fit h-fit flex"
      style={{ willChange: "transform" }}
      {...props}
    >
      <motion.div
        layout
        transition={{
          layout: {
            type: "spring",
            damping: 20,
            stiffness: 230,
            mass: 1.2,
          },
        }}
        className={cn(
          "flex items-center font-mono uppercase gap-1.5 bg-brand-cream/80 outline outline-2 outline-background/10 overflow-hidden shadow-md transition-all duration-300 ease-out p-3 cursor-pointer",
          isActive ? "bg-brand-moss text-brand-cream px-4" : "text-brand-sage hover:text-brand-moss px-3",
          "rounded-[25px]"
        )}
      >
        <motion.div
          layoutId={"icon-id" + title}
          className="shrink-0"
          style={{ willChange: "transform" }}
        >
          <ButtonIcon size={20} />
        </motion.div>
        {isActive && (
          <motion.div
            className="flex items-center"
            initial={isLoaded ? { opacity: 0, width: 0, filter: "blur(4px)" } : false}
            animate={{ opacity: 1, width: "auto", filter: "blur(0px)" }}
            transition={{
              duration: isLoaded ? 0.3 : 0,
              ease: [0.86, 0, 0.07, 1],
            }}
          >
            <motion.span
              layoutId={"text-id-" + title}
              className="text-[10px] font-bold font-sans uppercase whitespace-nowrap relative inline-block ml-1"
              style={{ willChange: "transform" }}
            >
              {title}
            </motion.span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
});

TabButton.displayName = "TabButton";
