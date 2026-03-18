
"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Props = {
    data: { name: string; value: number; fill: string }[];
};

export function StateDistributionChart({ data }: Props) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[200px] w-full flex items-center justify-center text-slate-400 text-sm">
                Awaiting HMM state classification data
            </div>
        );
    }

    // Find the dominant state for center label
    const dominant = data.reduce((a, b) => (a.value > b.value ? a : b), data[0]);

    return (
        <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                        animationDuration={1000}
                        animationEasing="ease-out"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                        formatter={(value: number | undefined) => [`${Math.round(value ?? 0)}%`]}
                    />
                    {/* Center label */}
                    <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-800 text-xl font-bold" style={{ fontSize: '22px', fontWeight: 700 }}>
                        {Math.round(dominant.value)}%
                    </text>
                    <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-400" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {dominant.name}
                    </text>
                </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-5 text-xs font-medium text-slate-500 -mt-2">
                {data.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.fill }} />
                        <span>{d.name}</span>
                        <span className="font-mono text-slate-700">{Math.round(d.value)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
