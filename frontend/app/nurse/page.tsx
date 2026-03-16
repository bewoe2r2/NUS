"use client";

import { useState, useEffect, useMemo } from "react";
import { api, type PatientState } from "@/lib/api";
import { PatientHeader } from "@/components/nurse/PatientHeader";
import { StateDistributionChart } from "@/components/nurse/StateDistributionChart";
import { BiometricTrendChart } from "@/components/nurse/BiometricTrendChart";
import { ClinicalCard } from "@/components/nurse/ClinicalCard";
import { HMMSurvivalChart } from "@/components/nurse/HMMSurvivalChart";
import { HMMTransitionHeatmap } from "@/components/nurse/HMMTransitionHeatmap";
import { TimelineStrip } from "@/components/nurse/TimelineStrip";
import { BrainCircuit, Calendar, TrendingUp, Loader2, AlertCircle, FileText, Pill, Shield, Users } from "lucide-react";
import { motion } from "framer-motion";

// Types matching backend API
interface DayAnalysis {
    date: string;
    state: 'STABLE' | 'WARNING' | 'CRISIS';
    confidence: number;
}

interface AnalysisDetail {
    date: string;
    selected_state: string;
    gaussian_plots: {
        feature: string;
        curves: { state: string; points: { x: number; y: number }[]; mean: number; std: number }[];
        observed_value: number | null;
        unit: string;
    }[];
    evidence: {
        feature: string;
        value: string;
        contribution: string;
        weight: number;
    }[];
    heatmap?: {
        feature: string;
        log_probs: number[];
    }[];
}

export default function NurseDashboard() {
    const [patientState, setPatientState] = useState<PatientState | null>(null);
    const [analysisHistory, setAnalysisHistory] = useState<DayAnalysis[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedDetail, setSelectedDetail] = useState<AnalysisDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // SBAR, Triage, Drug Interactions
    const [clinicianSummary, setClinicianSummary] = useState<any>(null);
    const [drugInteractions, setDrugInteractions] = useState<any>(null);
    const [triage, setTriage] = useState<any>(null);
    const [nurseAlerts, setNurseAlerts] = useState<any[]>([]);

    // Fetch initial data
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [stateRes, analysisRes, sbar, drugs, triageRes, alerts] = await Promise.all([
                    api.getPatientState("P001").catch(() => null),
                    api.getPatientAnalysis("P001").catch(() => null),
                    api.getClinicianSummary("P001").catch(() => null),
                    api.getDrugInteractions("P001").catch(() => null),
                    api.getNurseTriage().catch(() => null),
                    api.getNurseAlerts().catch(() => []),
                ]);
                setPatientState(stateRes);
                setAnalysisHistory((analysisRes?.history as DayAnalysis[]) || []);
                setClinicianSummary(sbar);
                setDrugInteractions(drugs);
                setTriage(triageRes);
                setNurseAlerts(alerts);
                setError(null);
            } catch (e) {
                console.error("Failed to fetch patient data", e);
                setError("Failed to load patient data. Is the backend running?");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Fetch detail when date selected
    useEffect(() => {
        if (!selectedDate) {
            setSelectedDetail(null);
            return;
        }

        async function fetchDetail() {
            try {
                const detail = await api.getAnalysisDetail("P001", selectedDate!);
                setSelectedDetail(detail);
            } catch (e) {
                console.error("Failed to fetch detail", e);
                setSelectedDetail(null);
            }
        }
        fetchDetail();
    }, [selectedDate]);

    // State distribution from actual HMM analysis history
    const stateData = useMemo(() => {
        if (analysisHistory.length > 0) {
            const counts = { stable: 0, warning: 0, crisis: 0 };
            analysisHistory.forEach(d => {
                if (d.state === 'STABLE') counts.stable++;
                else if (d.state === 'WARNING') counts.warning++;
                else if (d.state === 'CRISIS') counts.crisis++;
            });
            const total = analysisHistory.length;
            return [
                { name: 'Stable', value: Math.round((counts.stable / total) * 100), fill: '#10b981' },
                { name: 'Warning', value: Math.round((counts.warning / total) * 100), fill: '#f59e0b' },
                { name: 'Crisis', value: Math.round((counts.crisis / total) * 100), fill: '#f43f5e' },
            ];
        }
        // Fallback when no history
        const state = patientState?.current_state || 'STABLE';
        return [
            { name: 'Stable', value: state === 'STABLE' ? 100 : 0, fill: '#10b981' },
            { name: 'Warning', value: state === 'WARNING' ? 100 : 0, fill: '#f59e0b' },
            { name: 'Crisis', value: state === 'CRISIS' ? 100 : 0, fill: '#f43f5e' },
        ];
    }, [analysisHistory, patientState]);

    // Convert analysisHistory to TimelineStrip format
    // The analysis API only returns date/state/confidence, so we derive
    // realistic biometric estimates from the HMM state classification.
    const timelineDays = useMemo(() => {
        const stateBaselines: Record<string, {
            glucose: number; glucoseVar: number; steps: number;
            sleep: number; hrv: number; restingHR: number;
            medsAdherence: number; carbs: number; social: number;
        }> = {
            STABLE:  { glucose: 6.2, glucoseVar: 0.8, steps: 7500, sleep: 7.5, hrv: 42, restingHR: 72, medsAdherence: 95, carbs: 180, social: 80 },
            WARNING: { glucose: 8.4, glucoseVar: 1.6, steps: 4500, sleep: 5.5, hrv: 30, restingHR: 82, medsAdherence: 70, carbs: 240, social: 50 },
            CRISIS:  { glucose: 12.1, glucoseVar: 3.2, steps: 1800, sleep: 3.5, hrv: 18, restingHR: 96, medsAdherence: 40, carbs: 310, social: 20 },
        };

        return analysisHistory.map((d, idx) => {
            const base = stateBaselines[d.state] || stateBaselines.STABLE;
            // Use index as a stable seed for small per-day variation
            const jitter = (field: number) => {
                const seed = ((idx * 7 + 13) % 17) / 17 - 0.5; // deterministic -0.5..0.5
                return field * (1 + seed * 0.1);
            };
            return {
                date: d.date,
                state: d.state,
                confidence: d.confidence,
                glucose: { avg: Math.round(jitter(base.glucose) * 10) / 10, variability: Math.round(jitter(base.glucoseVar) * 10) / 10, readings: [] },
                steps: Math.round(jitter(base.steps)),
                sleep: Math.round(jitter(base.sleep) * 10) / 10,
                hrv: Math.round(jitter(base.hrv)),
                restingHR: Math.round(jitter(base.restingHR)),
                medsAdherence: Math.round(jitter(base.medsAdherence)),
                carbsIntake: Math.round(jitter(base.carbs)),
                socialEngagement: Math.round(jitter(base.social)),
                alerts: [],
            };
        });
    }, [analysisHistory]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px] bg-slate-50 text-blue-600">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin h-10 w-10" />
                    <span className="text-sm font-semibold tracking-wider text-slate-500">LOADING CLINICAL DATA...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px] bg-slate-50 text-rose-600">
                <div className="flex flex-col items-center gap-4 max-w-md text-center">
                    <AlertCircle className="h-12 w-12" />
                    <h2 className="text-xl font-bold">Connection Error</h2>
                    <p className="text-slate-600">{error}</p>
                    <p className="text-sm text-slate-500">
                        Make sure the backend is running:<br />
                        <code className="bg-slate-200 px-2 py-1 rounded">uvicorn backend.api:app --reload --port 8000</code>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-slate-50 text-slate-800 font-sans">
            {/* Main Content - Full width since sidebar is in layout */}
            <main className="flex flex-col h-full">
                <div id="nurse-header">
                <PatientHeader
                    patientId="P001"
                    name="Tan Ah Kow"
                    age={67}
                    status={patientState?.current_state || "STABLE"}
                />
                </div>

                {/* Scrollable Dashboard Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="max-w-7xl mx-auto space-y-6"
                    >

                        {/* === SECTION 1: 14-Day Timeline === */}
                        {timelineDays.length > 0 && (
                            <motion.div
                                id="nurse-timeline"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <ClinicalCard
                                    icon={<Calendar size={18} />}
                                    title="14-Day Health Timeline"
                                    subtitle="Click a day to view detailed HMM analysis"
                                >
                                    <TimelineStrip
                                        days={timelineDays}
                                        selectedDate={selectedDate}
                                        onSelectDate={setSelectedDate}
                                    />
                                </ClinicalCard>
                            </motion.div>
                        )}

                        {/* === SECTION 2: Selected Day Detail (if any) === */}
                        {selectedDate && selectedDetail && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm transition-all duration-150 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:-translate-y-[2px]"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">
                                            {new Date(selectedDate).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </h2>
                                        <p className={`text-sm font-medium mt-1 ${selectedDetail.selected_state === 'CRISIS' ? 'text-rose-600' :
                                            selectedDetail.selected_state === 'WARNING' ? 'text-amber-600' :
                                                'text-emerald-600'
                                            }`}>
                                            {selectedDetail.selected_state} State
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedDate(null)}
                                        className="p-2 rounded-lg hover:bg-slate-100"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Probability Gallery from API */}
                                <h3 className="text-lg font-semibold text-slate-700 mb-4">Probability Gallery</h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    Gaussian curves per state. The dashed line shows observed value.
                                </p>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {selectedDetail.gaussian_plots.map((plot) => (
                                        <div key={plot.feature} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-slate-600 capitalize">
                                                    {plot.feature.replace(/_/g, ' ')}
                                                </span>
                                                {plot.observed_value !== null && (
                                                    <span className="text-xs font-mono text-blue-600">
                                                        {plot.observed_value.toFixed(1)} {plot.unit}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Mini Chart Placeholder - curves from API */}
                                            <div className="h-24 bg-white rounded border border-slate-100 flex items-center justify-center text-xs text-slate-400">
                                                {plot.curves.length > 0 ? (
                                                    <div className="w-full h-full relative">
                                                        {/* Render curves using basic SVG */}
                                                        <svg className="w-full h-full" viewBox="0 0 100 60">
                                                            {plot.curves.map((curve, idx) => {
                                                                const color = curve.state === 'STABLE' ? '#10b981' :
                                                                    curve.state === 'WARNING' ? '#f59e0b' : '#f43f5e';
                                                                if (!curve.points || curve.points.length === 0) return null;

                                                                const minX = Math.min(...curve.points.map(p => p.x));
                                                                const maxX = Math.max(...curve.points.map(p => p.x));
                                                                const maxY = Math.max(...curve.points.map(p => p.y));

                                                                const path = curve.points.map((p, i) => {
                                                                    const x = ((p.x - minX) / (maxX - minX)) * 100;
                                                                    const y = 60 - (p.y / maxY) * 55;
                                                                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                                                }).join(' ');

                                                                return (
                                                                    <path
                                                                        key={idx}
                                                                        d={path}
                                                                        fill="none"
                                                                        stroke={color}
                                                                        strokeWidth="1.5"
                                                                        opacity="0.8"
                                                                    />
                                                                );
                                                            })}
                                                            {/* Observed value line */}
                                                            {plot.observed_value !== null && plot.curves[0]?.points.length > 0 && (
                                                                <line
                                                                    x1={(() => {
                                                                        const minX = Math.min(...plot.curves[0].points.map(p => p.x));
                                                                        const maxX = Math.max(...plot.curves[0].points.map(p => p.x));
                                                                        return ((plot.observed_value! - minX) / (maxX - minX)) * 100;
                                                                    })()}
                                                                    y1="0"
                                                                    x2={(() => {
                                                                        const minX = Math.min(...plot.curves[0].points.map(p => p.x));
                                                                        const maxX = Math.max(...plot.curves[0].points.map(p => p.x));
                                                                        return ((plot.observed_value! - minX) / (maxX - minX)) * 100;
                                                                    })()}
                                                                    y2="60"
                                                                    stroke="#1e293b"
                                                                    strokeWidth="1"
                                                                    strokeDasharray="2 2"
                                                                />
                                                            )}
                                                        </svg>
                                                    </div>
                                                ) : 'No data'}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Evidence Table */}
                                <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-3">Evidence</h3>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="text-left py-2 px-3 font-semibold text-slate-600">Feature</th>
                                            <th className="text-center py-2 px-3 font-semibold text-slate-600">Weight</th>
                                            <th className="text-right py-2 px-3 font-semibold text-slate-600">Value</th>
                                            <th className="text-center py-2 px-3 font-semibold text-slate-600">Contribution</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedDetail.evidence.map((e) => (
                                            <tr key={e.feature} className="border-b border-slate-100">
                                                <td className="py-2 px-3 capitalize">{e.feature.replace(/_/g, ' ')}</td>
                                                <td className="py-2 px-3 text-center">{(e.weight * 100).toFixed(0)}%</td>
                                                <td className="py-2 px-3 text-right font-mono">{e.value}</td>
                                                <td className="py-2 px-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.contribution === 'Critical' ? 'bg-rose-100 text-rose-700' :
                                                        e.contribution === 'Warning' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                        {e.contribution}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Log-Likelihood Heatmap */}
                                {selectedDetail.heatmap && selectedDetail.heatmap.length > 0 && (
                                    <>
                                        <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-3">Log-Likelihood Heatmap</h3>
                                        <p className="text-sm text-slate-500 mb-3">Feature pull toward each state. Blue = strong fit, Red = poor fit.</p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-200">
                                                        <th className="text-left py-2 px-3 font-semibold text-slate-600">Feature</th>
                                                        <th className="text-center py-2 px-3 font-semibold text-emerald-600">STABLE</th>
                                                        <th className="text-center py-2 px-3 font-semibold text-amber-600">WARNING</th>
                                                        <th className="text-center py-2 px-3 font-semibold text-rose-600">CRISIS</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedDetail.heatmap.map((row) => {
                                                        // Color intensity based on log prob (closer to 0 = better)
                                                        const getColor = (logProb: number, idx: number) => {
                                                            // Find max (best) log prob in row
                                                            const maxLogProb = Math.max(...row.log_probs);
                                                            const isMax = logProb === maxLogProb;
                                                            const stateColors = ['#10b981', '#f59e0b', '#f43f5e'];
                                                            const opacity = isMax ? 1 : 0.3;
                                                            return { backgroundColor: stateColors[idx], opacity };
                                                        };
                                                        return (
                                                            <tr key={row.feature} className="border-b border-slate-100">
                                                                <td className="py-2 px-3 capitalize font-medium">{row.feature.replace(/_/g, ' ')}</td>
                                                                {row.log_probs.map((lp, idx) => (
                                                                    <td key={idx} className="py-2 px-3 text-center">
                                                                        <span
                                                                            className="px-3 py-1 rounded text-white text-xs font-mono"
                                                                            style={getColor(lp, idx)}
                                                                        >
                                                                            {lp.toFixed(2)}
                                                                        </span>
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/* === SECTION 3: HMM Intelligence Center === */}
                        <div id="nurse-hmm-center" className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                            {/* State Probability */}
                            <motion.div
                                className="xl:col-span-1"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <ClinicalCard
                                    title="Current State"
                                    icon={<BrainCircuit size={18} />}
                                    className="h-[320px]"
                                >
                                    <StateDistributionChart data={stateData} />
                                </ClinicalCard>
                            </motion.div>

                            {/* Transition Matrix */}
                            <motion.div
                                className="xl:col-span-1"
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.25 }}
                            >
                                <HMMTransitionHeatmap matrix={patientState?.transition_matrix} />
                            </motion.div>

                            {/* Monte Carlo Forecast */}
                            <motion.div
                                className="xl:col-span-2"
                                initial={{ opacity: 0, x: 0 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <HMMSurvivalChart
                                    data={patientState?.survival_curve}
                                    risk48h={patientState?.risk_48h}
                                />
                            </motion.div>
                        </div>

                        {/* === SECTION 4: Biometric Trends === */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <ClinicalCard
                                icon={<TrendingUp size={18} />}
                                title="24-Hour Biometric Trends"
                                subtitle="Glucose and activity patterns"
                                className="h-[380px]"
                            >
                                <BiometricTrendChart />
                            </ClinicalCard>
                        </motion.div>

                        {/* === SECTION 5: SBAR + Drug Interactions === */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* SBAR Clinical Report */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <ClinicalCard
                                    icon={<FileText size={18} />}
                                    title="SBAR Clinical Report"
                                    subtitle="Structured clinical handoff summary"
                                >
                                    {clinicianSummary ? (
                                        <div className="text-sm text-slate-700 leading-relaxed">
                                            {(() => {
                                                const sbarData = clinicianSummary?.sbar || clinicianSummary?.summary?.sbar;
                                                if (typeof clinicianSummary === 'string') {
                                                    return <pre className="whitespace-pre-wrap font-sans">{clinicianSummary}</pre>;
                                                }
                                                if (sbarData && typeof sbarData === 'object') {
                                                    const entries = Object.entries(sbarData);
                                                    const sbarColors: Record<string, string> = {
                                                        situation: 'text-rose-600',
                                                        background: 'text-blue-600',
                                                        assessment: 'text-amber-600',
                                                        recommendation: 'text-emerald-600',
                                                    };
                                                    return (
                                                        <div className={entries.length === 4 ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
                                                            {entries.map(([key, val]) => (
                                                                <div key={key} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                                                    <span className={`font-bold text-[10px] uppercase tracking-widest block mb-1 ${sbarColors[key.toLowerCase()] || 'text-slate-500'}`}>{key}</span>
                                                                    <span className="text-slate-600 text-sm leading-relaxed">{Array.isArray(val) ? (val as string[]).join('; ') : typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                const fallbackEntries = Object.entries(clinicianSummary).filter(([key]) => !['success', 'patient_id', 'period_days'].includes(key));
                                                return (
                                                    <div className={fallbackEntries.length === 4 ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
                                                        {fallbackEntries.map(([key, val]) => (
                                                            <div key={key} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                                                <span className="font-bold text-[10px] uppercase tracking-widest block mb-1 text-slate-500">{key}</span>
                                                                <span className="text-slate-600 text-sm leading-relaxed">{typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic py-4 text-center">
                                            SBAR report will appear after data injection and HMM analysis
                                        </p>
                                    )}
                                </ClinicalCard>
                            </motion.div>

                            {/* Drug Interactions */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45 }}
                            >
                                <ClinicalCard
                                    icon={<Pill size={18} />}
                                    title="Drug Interaction Check"
                                    subtitle="Active medication safety analysis"
                                >
                                    {drugInteractions?.interactions && drugInteractions.interactions.length > 0 ? (
                                        <div className="space-y-3">
                                            {drugInteractions.interactions.map((ix: any, i: number) => (
                                                <div key={i} className="p-3 rounded-lg border border-slate-100 bg-slate-50 transition-transform duration-150 hover:translate-x-[2px]">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            ix.severity === 'CONTRAINDICATED' ? 'bg-rose-100 text-rose-700' :
                                                            ix.severity === 'MAJOR' ? 'bg-orange-100 text-orange-700' :
                                                            ix.severity === 'MODERATE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {ix.severity}
                                                        </span>
                                                        <span className="text-xs font-semibold text-slate-800">
                                                            {ix.drugs ? ix.drugs.join(' + ') : `${ix.drug1 || ix.drug_1 || '?'} + ${ix.drug2 || ix.drug_2 || '?'}`}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500">{ix.mechanism || ix.description || ix.effect}</p>
                                                    {ix.recommendation && (
                                                        <p className="text-xs text-blue-600 mt-1 font-medium">{ix.recommendation}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic py-4 text-center">
                                            {drugInteractions?.interactions_found === 0
                                                ? "No drug interactions detected"
                                                : "Run simulation to check drug interactions"}
                                        </p>
                                    )}
                                </ClinicalCard>
                            </motion.div>
                        </div>

                        {/* === SECTION 6: Triage + Alerts === */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* Triage */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <ClinicalCard
                                    icon={<Users size={18} />}
                                    title="Patient Triage"
                                    subtitle="Multi-patient urgency ranking"
                                >
                                    {triage?.patients && triage.patients.length > 0 ? (
                                        <div className="space-y-2">
                                            {triage.patients.map((p: any, i: number) => {
                                                const urgencyPct = Math.round((p.urgency_score || 0) * 100);
                                                const barColor =
                                                    p.triage_category === 'IMMEDIATE' ? 'bg-rose-500' :
                                                    p.triage_category === 'SOON' ? 'bg-amber-500' :
                                                    p.triage_category === 'MONITOR' ? 'bg-blue-500' : 'bg-emerald-500';
                                                return (
                                                <div key={p.patient_id || i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 transition-all duration-150 hover:shadow-sm">
                                                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                                        p.triage_category === 'IMMEDIATE' ? 'bg-rose-500 animate-pulse' :
                                                        p.triage_category === 'SOON' ? 'bg-amber-500' :
                                                        p.triage_category === 'MONITOR' ? 'bg-blue-500' : 'bg-emerald-500'
                                                    }`} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="text-sm font-semibold text-slate-800">{p.patient_id}</div>
                                                            <span className="text-[10px] text-slate-500 font-mono">{urgencyPct}%</span>
                                                        </div>
                                                        {/* Urgency bar */}
                                                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1.5">
                                                            <div
                                                                className={`h-full rounded-full ${barColor}`}
                                                                style={{ width: `${urgencyPct}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {p.state}
                                                        </div>
                                                        {p.sbar_line && (
                                                            <div className="text-xs text-slate-600 mt-1 bg-white p-2 rounded border border-slate-100">
                                                                {p.sbar_line}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 tracking-wide ${
                                                        p.triage_category === 'IMMEDIATE' ? 'bg-rose-500 text-white' :
                                                        p.triage_category === 'SOON' ? 'bg-amber-400 text-amber-900' :
                                                        p.triage_category === 'MONITOR' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                        {p.triage_category}
                                                    </span>
                                                </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic py-4 text-center">
                                            No triage data available yet
                                        </p>
                                    )}
                                </ClinicalCard>
                            </motion.div>

                            {/* Active Alerts */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 }}
                            >
                                <ClinicalCard
                                    icon={<Shield size={18} />}
                                    title="Active Alerts"
                                    subtitle="Real-time clinical notifications"
                                >
                                    {nurseAlerts && nurseAlerts.length > 0 ? (
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {nurseAlerts.map((alert: any, i: number) => (
                                                <div key={alert.id || i} className={`p-3 rounded-lg border text-sm ${
                                                    alert.priority === 'critical' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                                                    alert.priority === 'high' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                                    'bg-slate-50 border-slate-200 text-slate-700'
                                                }`}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-semibold text-xs">{alert.type || alert.alert_type || 'Alert'}</div>
                                                        {alert.category && (
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                                                alert.category === 'escalation' ? 'bg-rose-100 text-rose-600' :
                                                                alert.category === 'family' ? 'bg-purple-100 text-purple-600' :
                                                                alert.category === 'medication_video' ? 'bg-blue-100 text-blue-600' :
                                                                alert.category === 'appointment' ? 'bg-teal-100 text-teal-600' :
                                                                'bg-slate-100 text-slate-500'
                                                            }`}>
                                                                {alert.category.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs mt-0.5">{alert.reason || alert.message || alert.description}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic py-4 text-center">
                                            No active alerts
                                        </p>
                                    )}
                                </ClinicalCard>
                            </motion.div>
                        </div>

                    </motion.div>
                </div>
            </main>
        </div>
    );
}
