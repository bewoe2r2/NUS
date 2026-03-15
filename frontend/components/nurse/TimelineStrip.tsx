"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DayData, HealthState } from "@/lib/mockData";
import { CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";

interface TimelineStripProps {
    days: DayData[];
    selectedDate: string | null;
    onSelectDate: (date: string) => void;
}

const stateConfig: Record<HealthState, { bg: string; ring: string; icon: React.ReactNode }> = {
    STABLE: {
        bg: "bg-emerald-500",
        ring: "ring-emerald-400",
        icon: <CheckCircle2 className="h-4 w-4 text-white" />,
    },
    WARNING: {
        bg: "bg-amber-500",
        ring: "ring-amber-400",
        icon: <AlertTriangle className="h-4 w-4 text-white" />,
    },
    CRISIS: {
        bg: "bg-rose-500",
        ring: "ring-rose-400",
        icon: <AlertOctagon className="h-4 w-4 text-white" />,
    },
};

function formatDate(dateStr: string): { day: string; month: string } {
    const date = new Date(dateStr);
    return {
        day: date.getDate().toString().padStart(2, '0'),
        month: date.toLocaleString('default', { month: 'short' }),
    };
}

export function TimelineStrip({ days, selectedDate, onSelectDate }: TimelineStripProps) {
    return (
        <div className="w-full overflow-x-auto pb-2 no-scrollbar">
            <div className="flex gap-2 min-w-max px-1">
                {days.map((day, index) => {
                    const config = stateConfig[day.state];
                    const isSelected = selectedDate === day.date;
                    const { day: dayNum, month } = formatDate(day.date);
                    const isToday = index === days.length - 1;

                    return (
                        <motion.button
                            key={day.date}
                            onClick={() => onSelectDate(day.date)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={cn(
                                "relative flex flex-col items-center justify-center w-14 h-20 rounded-xl transition-all duration-200 cursor-pointer group",
                                config.bg,
                                isSelected && `ring-2 ring-offset-2 ring-offset-slate-50 ${config.ring} scale-105`,
                                !isSelected && "hover:scale-105 hover:shadow-md"
                            )}
                        >
                            {/* Date */}
                            <span className="text-[10px] font-medium text-white/80 uppercase tracking-wide">
                                {month}
                            </span>
                            <span className="text-lg font-bold text-white leading-none mt-0.5">
                                {dayNum}
                            </span>

                            {/* State Icon */}
                            <div className="mt-1.5">
                                {config.icon}
                            </div>

                            {/* Confidence */}
                            <span className="text-[9px] font-medium text-white/70 mt-1">
                                {(day.confidence * 100).toFixed(0)}%
                            </span>

                            {/* Today indicator */}
                            {isToday && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                            )}

                            {/* Selected indicator */}
                            {isSelected && (
                                <motion.div
                                    layoutId="timeline-selector"
                                    className="absolute -bottom-2 w-2 h-2 bg-slate-800 rounded-full"
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
