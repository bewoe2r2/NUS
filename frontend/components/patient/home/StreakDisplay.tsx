"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

interface StreakValue {
    current?: number;
    best?: number;
    last_action?: string;
}

interface Streaks {
    medication?: number | StreakValue;
    glucose_logging?: number | StreakValue;
    exercise?: number | StreakValue;
}

export function StreakDisplay() {
    const [streaks, setStreaks] = useState<Streaks | null>(null);

    useEffect(() => {
        async function fetchStreaks() {
            try {
                const data = await api.getStreaks("P001");
                if (data?.streaks) setStreaks(data.streaks);
                else if (data) setStreaks(data);
            } catch (e) {
                console.error("Streaks fetch failed", e);
            }
        }
        fetchStreaks();
    }, []);

    if (!streaks) return null;

    const getVal = (v: number | StreakValue | undefined): number => {
        if (v == null) return 0;
        if (typeof v === "number") return v;
        return v.current ?? 0;
    };

    const items = [
        { emoji: "\uD83D\uDC8A", label: "Meds", value: getVal(streaks.medication) },
        { emoji: "\uD83E\uDE78", label: "Logging", value: getVal(streaks.glucose_logging) },
        { emoji: "\uD83D\uDEB6", label: "Exercise", value: getVal(streaks.exercise) },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4 py-2"
        >
            {items.map((item) => (
                <div
                    key={item.label}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-neutral-100 shadow-sm"
                >
                    <span className="text-lg" role="img" aria-label={item.label}>{item.emoji}</span>
                    <span className="text-base font-bold text-neutral-800 tabular-nums">{item.value}</span>
                    <span className="text-xs text-neutral-500 font-medium uppercase">{item.label}</span>
                </div>
            ))}
        </motion.div>
    );
}
