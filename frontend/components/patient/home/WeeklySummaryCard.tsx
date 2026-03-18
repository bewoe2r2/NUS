"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ChevronDown, ChevronUp, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface WeeklyData {
    adherence_pct?: number;
    days_in_target?: number;
    grade?: string;
    summary?: string;
}

const FALLBACK_WEEKLY: WeeklyData = {
    adherence_pct: 78,
    days_in_target: 5,
    grade: "B",
    summary: "Good progress this week. Keep logging your glucose and staying active.",
};

export function WeeklySummaryCard() {
    const [data, setData] = useState<WeeklyData>(FALLBACK_WEEKLY);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        async function fetchReport() {
            try {
                const res = await api.getWeeklyReport("P001");
                if (res && typeof res === "object" && (res.adherence_pct != null || res.grade != null || res.days_in_target != null)) {
                    setData(res);
                }
                // If API returns null/empty, keep fallback — never show skeleton
            } catch (e) {
                console.error("Weekly report fetch failed", e);
                // Keep fallback data
            }
        }
        fetchReport();
    }, []);

    const adherence = data.adherence_pct ?? 0;
    const daysInTarget = data.days_in_target ?? 0;
    const grade = data.grade ?? "B";

    const gradeColor = cn({
        "text-success-600 bg-success-50 border-success-200": grade === "A",
        "text-accent-600 bg-accent-50 border-accent-200": grade === "B",
        "text-warning-600 bg-warning-50 border-warning-200": grade === "C",
        "text-error-600 bg-error-bg border-error-200": grade === "D" || grade === "F",
        "text-neutral-600 bg-neutral-50 border-neutral-200": !["A", "B", "C", "D", "F"].includes(grade),
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white rounded-3xl border border-neutral-100 shadow-card overflow-hidden"
        >
            {/* Collapsed header - always visible */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-6 min-h-[56px] active:bg-neutral-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-neutral-50 rounded-xl">
                        <CalendarDays size={20} className="text-neutral-500" />
                    </div>
                    <span className="font-semibold text-lg text-neutral-800">This Week</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className={cn("px-3 py-1 rounded-full text-base font-bold border", gradeColor)}>
                        {grade}
                    </span>
                    {open ? (
                        <ChevronUp size={20} className="text-neutral-400" />
                    ) : (
                        <ChevronDown size={20} className="text-neutral-400" />
                    )}
                </div>
            </button>

            {/* Expanded content */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-5 grid grid-cols-2 gap-4">
                            <div className="bg-neutral-50 rounded-2xl p-4 text-center">
                                <div className="text-2xl font-bold text-neutral-800">{adherence}%</div>
                                <div className="text-sm text-neutral-500 mt-1">Adherence</div>
                            </div>
                            <div className="bg-neutral-50 rounded-2xl p-4 text-center">
                                <div className="text-2xl font-bold text-neutral-800">{daysInTarget}/7</div>
                                <div className="text-sm text-neutral-500 mt-1">Days In Target</div>
                            </div>
                        </div>
                        {typeof data.summary === 'string' && data.summary && (
                            <div className="px-6 pb-6 text-base text-neutral-600 leading-relaxed">
                                {data.summary}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
