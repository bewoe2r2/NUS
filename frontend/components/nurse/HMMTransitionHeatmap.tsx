"use client";

import { Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GitCompare, ArrowRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HMMTransitionHeatmapProps {
    matrix?: number[][];
}

export function HMMTransitionHeatmap({ matrix }: HMMTransitionHeatmapProps) {
    if (!matrix || matrix.length !== 3 || matrix.some(row => !Array.isArray(row) || row.length !== 3)) {
        return (
            <Card className="h-full bg-white border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                        <GitCompare className="h-4 w-4 text-blue-500" />
                        Transition Dynamics
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[200px] gap-2">
                    <GitCompare className="h-8 w-8 text-slate-200" />
                    <span className="text-sm text-slate-400">No transition model loaded</span>
                    <span className="text-xs text-slate-300">Transition matrix populates after HMM analysis</span>
                </CardContent>
            </Card>
        );
    }

    const states = ["STABLE", "WARNING", "CRISIS"];
    const colors = ["bg-emerald-500", "bg-amber-500", "bg-rose-500"];
    const textColors = ["text-emerald-700", "text-amber-700", "text-rose-700"];

    // Helper to get opacity based on probability
    const getOpacity = (prob: number) => Math.max(0.1, prob);

    return (
        <Card className="h-full bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-slate-800 flex items-center gap-2">
                    <GitCompare className="h-4 w-4 text-blue-500" />
                    Transition Dynamics
                </CardTitle>
                <CardDescription className="text-slate-500">
                    State transition probabilities (4h window)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-[5rem_1fr_1fr_1fr] gap-1.5 items-center">
                    {/* Header Row */}
                    <div className="h-8 w-20 flex items-end justify-end pr-2">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">From / To</span>
                    </div>
                    {states.map((s, i) => (
                        <div key={s} className={`text-[10px] font-bold text-center uppercase tracking-wide ${textColors[i]}`}>
                            {s}
                        </div>
                    ))}

                    {/* Rows */}
                    {states.map((fromState, i) => (
                        <Fragment key={`row-${i}`}>
                            {/* Row Label */}
                            <div key={`label-${i}`} className={`text-[10px] font-bold uppercase tracking-wide ${textColors[i]} flex items-center justify-end gap-1 pr-2`}>
                                {fromState}
                            </div>

                            {/* Cells */}
                            {matrix[i].map((prob, j) => (
                                <TooltipProvider key={`${i}-${j}`}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`h-12 rounded-md flex items-center justify-center border border-slate-100 transition-all hover:scale-105 cursor-help
                                                    ${i === j ? 'border-dashed border-slate-300' : ''}`}
                                                style={{
                                                    backgroundColor: i === 0 ? `rgba(16, 185, 129, ${getOpacity(prob)})` :
                                                        i === 1 ? `rgba(245, 158, 11, ${getOpacity(prob)})` :
                                                            `rgba(244, 63, 94, ${getOpacity(prob)})`
                                                }}
                                            >
                                                <span className={`text-xs font-bold font-mono ${prob > 0.5 ? 'text-white' : 'text-slate-700'}`}>
                                                    {(prob * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-white border-slate-200 text-slate-900 shadow-xl">
                                            <p className="font-bold text-slate-800">
                                                {fromState} <ArrowRight className="inline w-3 h-3 text-slate-400" /> {states[j]}
                                            </p>
                                            <p className="text-slate-500 text-xs">
                                                Probability: <span className="text-slate-900 font-mono">{(prob * 100).toFixed(1)}%</span>
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </Fragment>
                    ))}
                </div>

                <div className="mt-4 flex gap-4 justify-center text-[10px] text-slate-400 font-medium">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Stable</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Warning</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Crisis</div>
                </div>
            </CardContent>
        </Card>
    );
}
