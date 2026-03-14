
"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Props = {
    data: { name: string; value: number; fill: string }[];
};

export function StateDistributionChart({ data }: Props) {
    if (!data || data.length === 0) return null;

    return (
        <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        startAngle={180}
                        endAngle={0}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center -mt-10 gap-6 text-xs font-medium text-slate-500">
                {data.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                        {d.name} ({Math.round(d.value)}%)
                    </div>
                ))}
            </div>
        </div>
    );
}
