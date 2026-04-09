"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import ReactLenis from "lenis/react";
import React, { useRef } from "react";

const screenshots = [
  {
    title: "Log expenses effortlessly, the moment they happen.",
    src: "/images/landing/home1.png",
  },
  {
    title: "See your spending patterns unfold over time.",
    src: "/images/landing/cal2.png",
  },
  {
    title: "Insights that reveal your spending behavior. Where your money flows—and why. Clarity, not just charts.",
    src: "/images/landing/analytics3.png",
  },
  {
    title: "Small questions that lead to better choices. Let your opinions help us improve.",
    src: "/images/landing/feedback4.png",
  },
];

const StickyScreenshotCard = ({
  i,
  title,
  src,
  progress,
  range,
  targetScale,
}: {
  i: number;
  title: string;
  src: string;
  progress: any;
  range: [number, number];
  targetScale: number;
}) => {
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div className="h-screen sticky top-0 flex items-center justify-center">
      <motion.div
        style={{ scale }}
        className="rounded-[2rem] relative flex flex-col w-full max-w-5xl mx-4 md:mx-8 origin-top overflow-hidden bg-white border border-brand-lichen/20 shadow-2xl shadow-brand-moss/10"
      >
        {/* Screenshot */}
        <div className="relative aspect-[16/9] md:aspect-[16/10] overflow-hidden">
          <img
            src={src}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Caption */}
        <div className="px-6 md:px-8 py-4 md:py-6 bg-white">
          <p className="text-base md:text-xl text-brand-ink font-serif italic leading-relaxed text-center">
            {title}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const ScreenshotStack = () => {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <ReactLenis root>
      <section
        ref={container}
        className="relative bg-brand-cream"
        style={{ height: `${screenshots.length * 100 + 100}vh` }}
      >
        {/* Section header - sticky at top initially */}
        <div className="h-screen sticky top-0 flex flex-col items-center justify-center z-0 pointer-events-none">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/5 border border-orange-500/10 text-orange-600 text-[10px] tracking-widest uppercase mb-8 backdrop-blur-sm font-bold"
          >
            explore the experience
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl text-brand-ink font-black lowercase tracking-tight max-w-3xl mx-auto px-6"
          >
            a journal for your{" "}
            <span className="font-serif italic font-light text-orange-500">
              money mind.
            </span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <span className="text-xs uppercase tracking-widest text-brand-sage/40">
              scroll to explore
            </span>
            <div className="w-px h-12 bg-gradient-to-b from-brand-sage/40 to-transparent mx-auto mt-2" />
          </motion.div>
        </div>

        {/* Card stack */}
        <div className="relative -mt-[100vh]">
          {screenshots.map((screenshot, i) => {
            const targetScale = 1 - (screenshots.length - i) * 0.05;
            const startRange = (i + 1) / (screenshots.length + 1);
            const endRange = (i + 2) / (screenshots.length + 1);
            return (
              <StickyScreenshotCard
                key={`screenshot_${i}`}
                i={i}
                {...screenshot}
                progress={scrollYProgress}
                range={[startRange, endRange]}
                targetScale={targetScale}
              />
            );
          })}
        </div>
      </section>
    </ReactLenis>
  );
};

export { ScreenshotStack };
