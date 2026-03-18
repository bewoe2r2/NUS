"use client";

import { useEffect, useState } from "react";
import { api, type HistoryPoint } from "@/lib/api";
import { LineChart, Line, ResponsiveContainer, ReferenceLine } from "recharts";

export function GlucoseMiniChart() {
    const [points, setPoints] = useState<{ value: number }[]>([]);

    useEffect(() => {
        async function fetchHistory() {
            try {
                const data = await api.getPatientHistory("P001");
                if (data?.history?.length) {
                    const recent = data.history.slice(-7).map((p: HistoryPoint) => ({
                        value: p.glucose,
                    }));
                    setPoints(recent);
                }
            } catch (e) {
                console.error("History fetch failed", e);
            }
        }
        fetchHistory();
    }, []);

    if (points.length < 2) return null;

    const latest = points[points.length - 1].value;
    const strokeColor =
        latest > 7.8
            ? "var(--warning-solid, #f59e0b)"
            : latest < 4.0
              ? "var(--error-solid, #ef4444)"
              : "var(--success-solid, #22c55e)";

    return (
        <div className="w-full h-12 mt-3">
            <div className="text-[10px] text-neutral-400 font-medium mb-1">7-day trend</div>
            <ResponsiveContainer width="100%" height={32}>
                <LineChart data={points}>
                    <ReferenceLine y={7.8} stroke="#e5e7eb" strokeDasharray="2 2" />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={strokeColor}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={800}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
