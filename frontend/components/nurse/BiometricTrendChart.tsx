
"use client";

import { useEffect, useState } from "react";
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { api } from "@/lib/api";

type TrendPoint = {
    time: string;
    glucose: number | null;
    steps: number;
};

export function BiometricTrendChart({ patientId = "P001" }: { patientId?: string }) {
    const [data, setData] = useState<TrendPoint[]>([]);

    useEffect(() => {
        async function load() {
            try {
                const res = await api.getPatientHistory(patientId);
                if (res.history && res.history.length > 0) {
                    setData(
                        res.history.map((p) => ({
                            time: new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                            glucose: p.glucose,
                            steps: p.steps || 0,
                        }))
                    );
                    return;
                }
            } catch {
                // Fall through to empty state
            }
            setData([]);
        }
        load();
    }, [patientId]);

    if (data.length === 0) {
        return (
            <div className="h-[250px] w-full flex flex-col items-center justify-center gap-2">
                <span className="text-slate-400 text-sm">No biometric readings recorded for this period</span>
                <span className="text-slate-300 text-xs">Data will populate automatically once patient monitoring begins</span>
            </div>
        );
    }

    return (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="time"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval={3}
                        stroke="#94a3b8"
                    />
                    <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#ef4444"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Glucose (mmol/L)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#ef4444' }}
                        domain={[0, 15]}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#3b82f6"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Steps', angle: 90, position: 'insideRight', fontSize: 10, fill: '#3b82f6' }}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar yAxisId="right" dataKey="steps" fill="#3b82f6" fillOpacity={0.2} name="Steps (Count)" barSize={20} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="left" type="monotone" dataKey="glucose" stroke="#ef4444" strokeWidth={2} dot={false} name="Glucose (mmol/L)" />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
