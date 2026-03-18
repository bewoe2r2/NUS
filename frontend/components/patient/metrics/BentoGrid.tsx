
"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, Heart, Footprints } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/animation-utils";
import { GlucoseMiniChart } from "./GlucoseMiniChart";

interface Biometrics {
    glucose: number;
    steps: number;
    hr: number;
    glucose_variability?: number;
}

interface BentoGridProps {
    biometrics?: Biometrics | null;
    className?: string;
}

export function BentoGrid({ biometrics, className }: BentoGridProps) {
    const glucose = biometrics?.glucose;
    const steps = biometrics?.steps;
    const hr = biometrics?.hr;
    const hasData = biometrics != null;

    // Logic for colors — detect hypo (<4.0), normal (4.0-7.8), elevated (>7.8)
    const glucoseVal = glucose ?? 0;
    const isHypo = hasData && glucoseVal < 4.0;
    const isElevated = hasData && glucoseVal > 7.8;
    const glucoseColor = !hasData ? "text-neutral-400" : isHypo ? "text-error-text" : isElevated ? "text-warning-text" : "text-success-text";
    const glucoseBg = !hasData ? "bg-neutral-100" : isHypo ? "bg-error-bg" : isElevated ? "bg-warning-bg" : "bg-success-bg";

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className={cn("grid grid-cols-2 gap-4", className)}
        >
            {/* GLUCOSE - LARGE CELL */}
            <motion.div variants={fadeInUp} className="col-span-2">
                <Card className="p-6 flex flex-col justify-between h-full bg-white relative overflow-hidden rounded-3xl group hover:border-accent-200 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
                    <div className="flex justify-between items-start z-10">
                        <div className="flex items-center gap-2 text-neutral-500 font-medium text-sm uppercase tracking-wider">
                            <Activity size={18} />
                            <span>Avg. Glucose</span>
                        </div>
                        <span className={cn("px-3 py-1 rounded-full text-sm font-bold", glucoseBg, glucoseColor)}>
                            {!hasData ? "\u2014" : isHypo ? "LOW" : isElevated ? "ELEVATED" : "NORMAL"}
                        </span>
                    </div>

                    <div className="mt-6 flex items-baseline gap-2 z-10">
                        <span className={cn("text-5xl font-bold tracking-tight", glucoseColor)}>
                            {hasData ? glucoseVal.toFixed(1) : "\u2014"}
                        </span>
                        <span className="text-neutral-400 font-medium">mmol/L</span>
                    </div>

                    {/* Micro-chart visualization (CSS Bar) */}
                    <div className="mt-6 w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <motion.div
                            className={cn("h-full", isHypo ? "bg-error-500" : isElevated ? "bg-warning-500" : "bg-success-500")}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((glucoseVal / 15) * 100, 100)}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                        />
                    </div>
                    {/* 7-Day Glucose Sparkline */}
                    <GlucoseMiniChart />
                </Card>
            </motion.div>

            {/* STEPS */}
            <motion.div variants={fadeInUp}>
                <Card className="p-5 flex flex-col justify-between h-32 rounded-3xl transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
                    <div className="text-neutral-500 text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Footprints size={16} /> Activity
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-neutral-900">{hasData ? (steps ?? 0).toLocaleString() : "\u2014"}</div>
                        <div className="text-sm text-neutral-400 mt-1">steps today</div>
                    </div>
                </Card>
            </motion.div>

            {/* HEART RATE */}
            <motion.div variants={fadeInUp}>
                <Card className="p-5 flex flex-col justify-between h-32 rounded-3xl transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
                    <div className="text-neutral-500 text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Heart size={16} /> Heart Rate
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-neutral-900">{hasData ? (hr ?? 0) : "\u2014"}</div>
                        <div className="text-sm text-neutral-400 mt-1">bpm (resting)</div>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
}
