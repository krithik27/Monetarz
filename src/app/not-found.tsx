"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function NotFound() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-brand-cream selection:bg-brand-lichen/30">
            <div className="max-w-md w-full text-center space-y-10">
                {/* Animated Error Code */}
                <div className="relative h-[20rem] flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="text-[12rem] font-serif leading-none text-brand-moss/20 select-none"
                    >
                        404
                    </motion.div>
                </div>

                {/* Calm Messaging */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="space-y-4"
                >
                    <h1 className="text-2xl md:text-3xl font-serif text-brand-ink tracking-tight">
                        Lost in the flow
                    </h1>
                    <p className="text-brand-sage text-lg font-serif italic leading-relaxed">
                        The page you're looking for has drifted away. <br />
                        Let's return to the safety of your journal.
                    </p>
                </motion.div>

                {/* Action */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                >
                    <Button
                        asChild
                        variant="ghost"
                        className="group font-serif text-brand-sage hover:text-brand-moss gap-2 transition-all duration-500"
                    >
                        <Link href="/">
                            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                            Return Home
                        </Link>
                    </Button>
                </motion.div>
            </div>

            {/* Decorative pulse */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.03, 0.06, 0.03],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-brand-moss blur-[120px]"
                />
            </div>
        </main>
    )
}
