"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Target, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Challenge {
    challenge: string;
    progress?: number;
    target?: number;
    unit?: string;
}

export function DailyChallengeCard() {
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchChallenge() {
            try {
                const data = await api.getDailyChallenge("P001");
                if (data) setChallenge(data);
            } catch (e) {
                console.error("Daily challenge fetch failed", e);
            } finally {
                setLoading(false);
            }
        }
        fetchChallenge();
    }, []);

    if (loading) {
        return (
            <div className="w-full bg-white rounded-3xl border border-neutral-100 p-6 flex items-center justify-center h-20 shadow-card">
                <Loader2 className="animate-spin text-neutral-300" size={20} />
            </div>
        );
    }

    if (!challenge) return null;

    const progress = challenge.progress ?? 0;
    const target = challenge.target ?? 100;
    const pct = target > 0 ? Math.min(Math.round((progress / target) * 100), 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white rounded-3xl border border-accent-100 p-6 shadow-card"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-accent-50 rounded-xl">
                    <Target size={20} className="text-accent-500" />
                </div>
                <div>
                    <div className="text-xs uppercase font-bold tracking-widest text-neutral-500">Today&apos;s Goal</div>
                    <div className="text-lg font-semibold text-neutral-800 leading-tight">
                        {challenge.challenge}
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-accent-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>
            <div className="mt-2 text-sm text-neutral-500 font-medium text-right">
                {pct}% done
            </div>
        </motion.div>
    );
}
