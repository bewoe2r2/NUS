"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

interface Streaks {
    medication?: number;
    glucose_logging?: number;
    exercise?: number;
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

    const items = [
        { emoji: "\uD83D\uDC8A", label: "Meds", value: streaks.medication ?? 0 },
        { emoji: "\uD83E\uDE78", label: "Logging", value: streaks.glucose_logging ?? 0 },
        { emoji: "\uD83D\uDEB6", label: "Exercise", value: streaks.exercise ?? 0 },
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-neutral-100 shadow-sm"
                >
                    <span className="text-base" role="img" aria-label={item.label}>{item.emoji}</span>
                    <span className="text-sm font-bold text-neutral-800 tabular-nums">{item.value}</span>
                    <span className="text-[10px] text-neutral-400 font-medium uppercase">{item.label}</span>
                </div>
            ))}
        </motion.div>
    );
}
