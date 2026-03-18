"use client";

import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, AlertTriangle } from "lucide-react";

interface SurvivalPoint {
    hours: number;
    survival_prob: number;
}

interface HMMSurvivalChartProps {
    data?: SurvivalPoint[];
    risk48h?: number;
}

export function HMMSurvivalChart({ data, risk48h }: HMMSurvivalChartProps) {
    const gradientId = React.useId();

    if (!data || data.length === 0) {
        return (
            <Card className="h-full bg-white border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        Monte Carlo Forecast (48h)
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[250px] gap-2">
                    <Activity className="h-8 w-8 text-slate-200" />
                    <span className="text-sm text-slate-400">Forecast unavailable</span>
                    <span className="text-xs text-slate-300">Requires HMM state classification to generate predictions</span>
                </CardContent>
            </Card>
        );
    }

    // Process data for charts - inverse survival to get "Crisis Probability"
    const chartData = data.map(d => ({
        hours: d.hours,
        crisis_prob: (1 - d.survival_prob) * 100, // Convert to percentage
        survival_prob: d.survival_prob * 100
    }));

    const maxRisk = Math.max(...chartData.map(d => d.crisis_prob));
    const isHighRisk = maxRisk > 50;

    return (
        <Card className="h-full bg-white border-slate-200 shadow-sm overflow-hidden relative">
            <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-slate-800 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                            Monte Carlo Forecast (48h)
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            Probability of crisis event based on N=1000 simulations
                        </CardDescription>
                    </div>
                    {risk48h !== undefined && (
                        <div className={`text-2xl font-bold font-mono tabular-nums ${isHighRisk ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {(risk48h * 100).toFixed(1)}%
                            <span className="text-[10px] font-sans font-semibold text-slate-400 block text-right uppercase tracking-wide">48h Risk</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                            dataKey="hours"
                            stroke="#94a3b8"
                            tickFormatter={(v) => `+${v}h`}
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            tickFormatter={(v) => `${v}%`}
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#f43f5e', fontWeight: 600 }}
                            formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "Crisis Probability"]}
                            labelFormatter={(label) => `Time: +${label} hours`}
                            labelStyle={{ color: '#64748b' }}
                        />
                        <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="3 3" />
                        <Area
                            type="monotone"
                            dataKey="crisis_prob"
                            stroke="#f43f5e"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill={`url(#${gradientId})`}
                            animationDuration={1200}
                            animationEasing="ease-out"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
            {isHighRisk && (
                <div className="absolute bottom-4 left-6 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200">
                    <AlertTriangle className="text-rose-500 h-3.5 w-3.5" />
                    <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wide">Elevated Risk</span>
                </div>
            )}
        </Card>
    );
}
