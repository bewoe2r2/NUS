
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const res = await api.getPatientHistory(patientId);
                if (res.history && res.history.length > 0) {
                    setData(
                        res.history.map((p) => ({
                            time: new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                            glucose: p.glucose,
                            steps: p.steps || 0,
                        }))
                    );
                } else {
                    setData([]);
                }
            } catch {
                setData([]);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [patientId]);

    if (loading) {
        return (
            <div className="h-[250px] w-full flex flex-col items-center justify-center gap-2 animate-pulse">
                <div className="w-3/4 h-4 bg-slate-200 rounded" />
                <div className="w-1/2 h-3 bg-slate-100 rounded" />
                <div className="w-full h-[180px] bg-slate-50 rounded-lg mt-2" />
            </div>
        );
    }

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
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        interval={3}
                        stroke="#94a3b8"
                    />
                    <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#ef4444"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Glucose (mmol/L)', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#ef4444' }}
                        domain={[0, (dataMax: number) => Math.max(15, Math.ceil(dataMax * 1.1))]}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#3b82f6"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Steps', angle: 90, position: 'insideRight', fontSize: 12, fill: '#3b82f6' }}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar yAxisId="right" dataKey="steps" fill="#3b82f6" fillOpacity={0.2} name="Steps (Count)" barSize={20} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="left" type="monotone" dataKey="glucose" stroke="#ef4444" strokeWidth={2} dot={false} name="Glucose (mmol/L)" animationDuration={1200} animationEasing="ease-out" />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
