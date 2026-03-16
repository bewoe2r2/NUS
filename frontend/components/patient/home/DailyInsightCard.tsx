"use client";

import { motion } from "framer-motion";
import { Brain, TrendingDown, TrendingUp, Minus, Activity, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyInsightCardProps {
    state: string; // STABLE | WARNING | CRISIS
    riskScore: number;
    lastUpdated: string;
    trend?: "IMPROVING" | "DECLINING" | "STABLE";
}

export function DailyInsightCard({ state, riskScore, lastUpdated, trend = "STABLE" }: DailyInsightCardProps) {
    const isCrisis = state === "CRISIS";
    const isWarning = state === "WARNING";
    const isStable = state === "STABLE";

    // Config based on state
    const config = {
        CRISIS: {
            bg: "bg-error-bg",
            border: "border-error-200",
            text: "text-error-700",
            icon: AlertTriangle,
            badge: "bg-error-500 text-white",
            shadow: "shadow-glow ring-2 ring-error-100",
            greeting: "Action Required",
            message: "Your risk markers are critically high. Immediate intervention recommended."
        },
        WARNING: {
            bg: "bg-warning-bg",
            border: "border-warning-200",
            text: "text-warning-700",
            icon: Activity,
            badge: "bg-warning-500 text-white",
            shadow: "shadow-lg ring-1 ring-warning-100",
            greeting: "Caution Advised",
            message: "We detected a drift in your physiological patterns. Let's stabilize this."
        },
        STABLE: {
            bg: "bg-gradient-to-br from-success-bg to-white",
            border: "border-success-200",
            text: "text-neutral-800",
            icon: ShieldCheck,
            badge: "bg-success-500 text-white",
            shadow: "shadow-card",
            greeting: "You are doing well",
            message: "Your biomarkers indicate a stable metabolic state. Keep up the routine!"
        }
    }[state] || {
        bg: "bg-neutral-50",
        border: "border-neutral-200",
        text: "text-neutral-500",
        icon: Minus,
        badge: "bg-neutral-500 text-white",
        shadow: "shadow-sm",
        greeting: "Health Monitor",
        message: "Gathering data for analysis..."
    };

    const StatusIcon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "relative overflow-hidden rounded-3xl p-6 border transition-all duration-500",
                config.bg, config.border, config.shadow
            )}
        >
            {/* Header / Badge */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm", config.text)}>
                        <StatusIcon size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-bold tracking-widest opacity-60">Bewo AI</div>
                        <div className="font-bold text-lg leading-tight">{config.greeting}</div>
                    </div>
                </div>

                <div className={cn("px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5", config.badge)}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {state}
                </div>
            </div>

            {/* Main Message */}
            <p className={cn("text-lg font-medium mb-6 leading-relaxed", isStable ? "text-neutral-600" : config.text)}>
                "{config.message}"
            </p>

            {/* Data Grid */}
            <div className="grid grid-cols-3 gap-2 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-inner">
                {/* 1. Merlion Risk */}
                <div className="flex flex-col items-center justify-center p-2 border-r border-neutral-200/50">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 mb-1">Merlion Risk</span>
                    <span className={cn("text-2xl font-display font-bold tabular-nums",
                        riskScore > 0.50 ? "text-error-600" : "text-neutral-800"
                    )}>
                        {Math.round(riskScore * 100)}%
                    </span>
                </div>

                {/* 2. Trend */}
                <div className="flex flex-col items-center justify-center p-2 border-r border-neutral-200/50">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 mb-1">Trend (48h)</span>
                    <div className="flex items-center gap-1">
                        {/* TrendingDown = risk going down = improving; TrendingUp = risk rising = declining */}
                        {trend === "IMPROVING" && <TrendingDown size={18} className="text-success-500" />}
                        {trend === "DECLINING" && <TrendingUp size={18} className="text-error-500" />}
                        {trend === "STABLE" && <Minus size={18} className="text-neutral-400" />}
                        <span className="text-sm font-semibold text-neutral-700 capitalize">{trend.toLowerCase()}</span>
                    </div>
                </div>

                {/* 3. Volatility derived from HMM state */}
                <div className="flex flex-col items-center justify-center p-2">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 mb-1">Volatility</span>
                    <span className={cn("text-lg font-semibold", isCrisis ? "text-error-600" : isWarning ? "text-warning-600" : "text-neutral-700")}>
                        {isCrisis ? "High" : isWarning ? "Moderate" : "Low"}
                    </span>
                </div>
            </div>

            {/* Footer / Psychology Note */}
            <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500 italic">
                <Brain size={12} className="text-accent-500" />
                <span>
                    {isStable
                        ? "Consistency is key. You're building a great streak."
                        : "Small adjustments now prevent larger issues later."
                    }
                </span>
            </div>
        </motion.div>
    );
}
