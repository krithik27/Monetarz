"use client";

/**
 * CARD FLIP COMPONENT
 * 
 * Adapted from Kokonut UI for Monetarz brand aesthetic.
 * Used for insight cards on the home page.
 * 
 * Design Notes:
 * - Uses brand colors (cream, ink, moss, sage, lichen, mist)
 * - Gambarino (serif) font for titles
 * - Calm, observational tone
 * - Hover to flip interaction
 * 
 * Future Enhancements:
 * - Click handlers for CTA buttons
 * - Accessibility improvements (keyboard navigation)
 * - Loading states
 */

import { ArrowRight, Repeat2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface CardFeature {
  text: string;
  color?: string;
}

export interface CardFlipProps {
  title?: string;
  subtitle?: string;
  description?: string;
  features?: (string | CardFeature)[];
  className?: string;
}

export default function CardFlip({
  title = "Insight",
  subtitle = "Explore your patterns",
  description = "Discover how your spending evolves over time.",
  features = [],
  className,
}: CardFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className={cn(
        "group relative h-[320px] w-full max-w-[320px] [perspective:2000px]",
        className
      )}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={cn(
          "relative h-full w-full",
          "[transform-style:preserve-3d]",
          "transition-all duration-700",
          isFlipped
            ? "[transform:rotateY(180deg)]"
            : "[transform:rotateY(0deg)]"
        )}
      >
        {/* Front of card */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[backface-visibility:hidden] [transform:rotateY(0deg)]",
            "overflow-hidden rounded-2xl",
            "bg-white/60 dark:bg-brand-ink/60",
            "border border-brand-mist dark:border-brand-lichen/20",
            "shadow-sm dark:shadow-lg",
            "transition-all duration-700",
            "group-hover:shadow-md dark:group-hover:shadow-xl",
            "backdrop-blur-sm",
            isFlipped ? "opacity-0" : "opacity-100"
          )}
        >
          <div className="relative h-full overflow-hidden bg-gradient-to-b from-brand-mist/40 to-white/80 dark:from-brand-ink dark:to-brand-ink/90">
            {/* Animated ambient circles */}
            <div className="absolute inset-0 flex items-start justify-center pt-24">
              <div className="relative flex h-[100px] w-[200px] items-center justify-center">
                {[...Array(8)].map((_, i) => (
                  <div
                    className={cn(
                      "absolute h-[50px] w-[50px]",
                      "rounded-full",
                      "animate-[scale_3s_linear_infinite]",
                      "opacity-0",
                      "shadow-[0_0_40px_rgba(143,161,143,0.4)]",
                      "group-hover:animate-[scale_2s_linear_infinite]"
                    )}
                    key={i}
                    style={{
                      animationDelay: `${i * 0.375}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 left-0 p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1.5">
                <h3 className="font-serif text-xl text-brand-ink leading-snug tracking-tight transition-all duration-500 ease-out-expo group-hover:translate-y-[-4px] dark:text-brand-cream">
                  {title}
                </h3>
                <p className="line-clamp-2 text-sm text-brand-sage tracking-tight transition-all delay-[50ms] duration-500 ease-out-expo group-hover:translate-y-[-4px] dark:text-brand-lichen">
                  {subtitle}
                </p>
              </div>
              <div className="group/icon relative">
                <div
                  className={cn(
                    "absolute inset-[-8px] rounded-lg transition-opacity duration-300",
                    "bg-gradient-to-br from-brand-moss/20 via-brand-moss/10 to-transparent"
                  )}
                />
                <Repeat2 className="group-hover/icon:-rotate-12 relative z-10 h-4 w-4 text-brand-moss transition-transform duration-300 group-hover/icon:scale-110" />
              </div>
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[backface-visibility:hidden] [transform:rotateY(180deg)]",
            "rounded-2xl p-6",
            "bg-gradient-to-b from-brand-mist/60 to-white/80 dark:from-brand-ink dark:to-brand-ink/90",
            "border border-brand-mist dark:border-brand-lichen/20",
            "shadow-sm dark:shadow-lg",
            "flex flex-col",
            "transition-all duration-700",
            "group-hover:shadow-md dark:group-hover:shadow-xl",
            "backdrop-blur-sm",
            isFlipped ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <h3 className="font-serif text-lg text-brand-ink leading-snug tracking-tight transition-all duration-500 ease-out-expo group-hover:translate-y-[-2px] dark:text-brand-cream">
                {title}
              </h3>
              <p className="line-clamp-2 text-sm text-brand-sage tracking-tight transition-all duration-500 ease-out-expo group-hover:translate-y-[-2px] dark:text-brand-lichen">
                {description}
              </p>
            </div>

            <div className="space-y-3">
              {features.map((feature, index) => {
                const isObject = typeof feature !== 'string';
                const text = isObject ? feature.text : feature;
                const color = isObject ? feature.color : null;

                return (
                  <div
                    className="flex items-center gap-3 text-sm text-brand-ink transition-all duration-500 dark:text-brand-cream"
                    key={index}
                    style={{
                      transform: isFlipped
                        ? "translateX(0)"
                        : "translateX(-10px)",
                      opacity: isFlipped ? 1 : 0,
                      transitionDelay: `${index * 100 + 150}ms`,
                    }}
                  >
                    <div
                      className={cn(
                        "h-1.5 w-1.5 rounded-full flex-shrink-0",
                        color ? "animate-pulse" : "bg-brand-moss/40"
                      )}
                      style={color ? { backgroundColor: color, boxShadow: `0 0 8px ${color}` } : {}}
                    />
                    <span className="leading-tight font-medium">{text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale {
          0% {
            transform: scale(2);
            opacity: 0;
            box-shadow: 0px 0px 40px rgba(143, 161, 143, 0.4);
          }
          50% {
            transform: translate(0px, -5px) scale(1);
            opacity: 1;
            box-shadow: 0px 8px 20px rgba(143, 161, 143, 0.4);
          }
          100% {
            transform: translate(0px, 5px) scale(0.1);
            opacity: 0;
            box-shadow: 0px 10px 20px rgba(143, 161, 143, 0);
          }
        }
      `}</style>
    </div>
  );
}
