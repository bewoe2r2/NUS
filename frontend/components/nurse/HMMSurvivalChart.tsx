"use client";

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
    if (!data || data.length === 0) {
        return (
            <Card className="h-full bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardContent className="flex items-center justify-center h-full text-slate-500">
                    No forecast data available
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
        <Card className="h-full bg-white border-slate-200 shadow-none overflow-hidden relative">
            <CardHeader className="pb-2">
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
                        <div className={`text-2xl font-bold ${isHighRisk ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {(risk48h * 100).toFixed(1)}%
                            <span className="text-xs font-normal text-slate-400 block text-right">48h Risk</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
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
                            fill="url(#colorRisk)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
            {isHighRisk && (
                <div className="absolute top-4 right-20 animate-pulse">
                    <AlertTriangle className="text-rose-500 h-6 w-6 opacity-60" />
                </div>
            )}
        </Card>
    );
}
