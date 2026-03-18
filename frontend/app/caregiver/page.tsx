"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type PatientState } from "@/lib/api";

const PATIENT_ID = "P001";
const REFRESH_INTERVAL_MS = 30_000;

type AlertAction = "acknowledge" | "on_my_way" | "need_help" | "escalate";

interface Alert {
    id: string;
    message: string;
    severity: "low" | "medium" | "high";
    timestamp: string;
    responded?: boolean;
    response_action?: string;
}

interface WeeklyReport {
    adherence_pct?: number;
    glucose_trend?: string;
    grade?: string;
    summary?: string;
}

interface StreakData {
    streaks?: {
        medication?: { current: number; best: number };
        glucose?: { current: number; best: number };
        [key: string]: { current: number; best: number } | undefined;
    };
}

interface BurdenData {
    score?: number;
    level?: string;
    message?: string;
    recommendation?: string;
}

interface DashboardData {
    patient_status?: string;
    alerts?: Alert[];
    risk_score?: number;
    current_state?: string;
    last_updated?: string;
}
// --- Helpers ---

function stateColor(state: string): { bg: string; text: string; border: string; dot: string; label: string } {
    switch (state) {
        case "CRISIS":
            return { bg: "bg-red-50", text: "text-red-800", border: "border-red-200", dot: "bg-red-500", label: "Act Now" };
        case "WARNING":
            return { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", dot: "bg-amber-500", label: "Heads Up" };
        default:
            return { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500", label: "Safe" };
    }
}

function statusHeadline(state: string): string {
    switch (state) {
        case "CRISIS":
            return "Your father needs attention now";
        case "WARNING":
            return "Your father may need a check-in";
        default:
            return "Your father is safe";
    }
}

function severityBadge(severity: string) {
    switch (severity) {
        case "high":
            return "bg-red-100 text-red-700";
        case "medium":
            return "bg-amber-100 text-amber-700";
        default:
            return "bg-stone-100 text-stone-600";
    }
}

function formatTime(ts: string): string {
    if (!ts) return "";
    try {
        const d = new Date(ts);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    } catch {
        return ts;
    }
}

function burdenMessage(level: string): string {
    switch (level) {
        case "high":
            return "Take a break. We will batch alerts for you.";
        case "moderate":
            return "You have been busy. Remember to take care of yourself too.";
        default:
            return "You are doing great. Keep it up!";
    }
}

function gradeColor(grade: string): string {
    if (!grade) return "text-stone-500";
    const g = grade.toUpperCase();
    if (g === "A" || g === "A+") return "text-emerald-600";
    if (g === "B" || g === "B+") return "text-lime-600";
    if (g === "C" || g === "C+") return "text-amber-600";
    return "text-red-600";
}
// --- Components ---

function StatusHeader({ state, riskScore, lastUpdated }: { state: string; riskScore: number; lastUpdated: string }) {
    const colors = stateColor(state);
    return (
        <div className={`rounded-2xl p-5 ${colors.bg} ${colors.border} border`}>
            <div className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full mt-1.5 ${colors.dot} animate-pulse`} />
                <div className="flex-1">
                    <h1 className={`text-xl font-bold ${colors.text}`}>{statusHeadline(state)}</h1>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                            {colors.label}
                        </span>
                        <span className="text-stone-500">
                            Risk: {(riskScore * 100).toFixed(0)}%
                        </span>
                        {lastUpdated && (
                            <span className="text-stone-400">
                                {formatTime(lastUpdated)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AlertFeed({
    alerts,
    respondingId,
    onRespond,
}: {
    alerts: Alert[];
    respondingId: string | null;
    onRespond: (alertId: string, action: AlertAction) => void;
}) {
    const actionButtons: { action: AlertAction; label: string; style: string }[] = [
        { action: "acknowledge", label: "Got it", style: "bg-stone-100 text-stone-700 hover:bg-stone-200" },
        { action: "on_my_way", label: "On my way", style: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
        { action: "need_help", label: "Need help", style: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
        { action: "escalate", label: "Escalate", style: "bg-red-100 text-red-700 hover:bg-red-200" },
    ];

    if (alerts.length === 0) {
        return (
            <div className="text-center py-8 text-stone-400 text-sm">
                No recent alerts. All quiet.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {alerts.map((alert) => (
                <div key={alert.id} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-stone-800 flex-1">{alert.message}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${severityBadge(alert.severity)}`}>
                            {alert.severity}
                        </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">{formatTime(alert.timestamp)}</p>

                    {alert.responded ? (
                        <div className="mt-3 text-xs text-emerald-600 font-medium">
                            Responded: {alert.response_action?.replace(/_/g, " ")}
                        </div>
                    ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {actionButtons.map((btn) => (
                                <button
                                    key={btn.action}
                                    disabled={respondingId === alert.id}
                                    onClick={() => onRespond(alert.id, btn.action)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${btn.style} disabled:opacity-50`}
                                >
                                    {respondingId === alert.id ? "..." : btn.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
function WeeklySummaryCard({ report }: { report: WeeklyReport | null }) {
    if (!report) {
        return (
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-stone-700 mb-2">This Week</h3>
                <p className="text-xs text-stone-400">Loading weekly summary...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-stone-700 mb-3">This Week</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                    <div className="text-2xl font-bold text-stone-800">
                        {report.adherence_pct != null ? `${report.adherence_pct}%` : "--"}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">Adherence</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-stone-800 capitalize">
                        {report.glucose_trend || "--"}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">Glucose trend</div>
                </div>
                <div>
                    <div className={`text-2xl font-bold ${gradeColor(report.grade || "")}`}>
                        {report.grade || "--"}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">Grade</div>
                </div>
            </div>
            {report.summary && (
                <p className="text-xs text-stone-500 mt-3 leading-relaxed border-t border-stone-100 pt-3">
                    {report.summary}
                </p>
            )}
        </div>
    );
}

function StreakDisplay({ streakData }: { streakData: StreakData | null }) {
    const streaks = streakData?.streaks;
    const items = [
        { key: "medication", label: "Medication" },
        { key: "glucose", label: "Glucose check" },
    ];

    return (
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-stone-700 mb-3">Streaks</h3>
            <div className="space-y-3">
                {items.map(({ key, label }) => {
                    const s = streaks?.[key];
                    const current = s?.current ?? 0;
                    const best = s?.best ?? 0;
                    return (
                        <div key={key} className="flex items-center gap-3">
                            <div className="flex-1">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-sm text-stone-700">{label}</span>
                                    <span className="text-xs text-stone-400">Best: {best}d</span>
                                </div>
                                <div className="mt-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${best > 0 ? Math.min((current / best) * 100, 100) : (current > 0 ? 100 : 0)}%` }}
                                    />
                                </div>
                                <div className="text-xs text-emerald-600 font-medium mt-0.5">
                                    {current} day{current !== 1 ? "s" : ""} running
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
function BurdenCard({ burden }: { burden: BurdenData | null }) {
    if (!burden) {
        return (
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-stone-700 mb-2">How are you doing?</h3>
                <p className="text-xs text-stone-400">Checking in...</p>
            </div>
        );
    }

    const level = burden.level || "low";
    const bgMap: Record<string, string> = {
        low: "bg-emerald-50 border-emerald-200",
        moderate: "bg-amber-50 border-amber-200",
        high: "bg-rose-50 border-rose-200",
    };
    const bg = bgMap[level] || bgMap.low;

    return (
        <div className={`rounded-xl border p-4 shadow-sm ${bg}`}>
            <div className="flex items-start gap-3">
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-stone-700">How are you doing?</h3>
                    <p className="text-sm text-stone-600 mt-1">
                        {burden.message || burdenMessage(level)}
                    </p>
                    {burden.recommendation && (
                        <p className="text-xs text-stone-500 mt-2 italic">{burden.recommendation}</p>
                    )}
                </div>
            </div>
            {burden.score != null && (
                <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                level === "low" ? "bg-emerald-400" : level === "moderate" ? "bg-amber-400" : "bg-rose-400"
                            }`}
                            style={{ width: `${Math.min(burden.score * 100, 100)}%` }}
                        />
                    </div>
                    <span className="text-xs text-stone-500 tabular-nums">{(burden.score * 100).toFixed(0)}%</span>
                </div>
            )}
        </div>
    );
}

function QuickActions() {
    return (
        <div className="grid grid-cols-2 gap-3">
            <a
                href="tel:+6591234567"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors shadow-sm"
            >
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call nurse
            </a>
            <a
                href="tel:+6598765432"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors shadow-sm"
            >
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Call Papa
            </a>
        </div>
    );
}

function Vitals({ biometrics }: { biometrics: PatientState["biometrics"] | null }) {
    if (!biometrics) return null;
    const items = [
        { label: "Glucose", value: `${biometrics.glucose?.toFixed(1) ?? "--"} mmol/L` },
        { label: "Heart rate", value: `${biometrics.hr ?? "--"} bpm` },
        { label: "Steps today", value: `${biometrics.steps?.toLocaleString() ?? "--"}` },
    ];
    return (
        <div className="grid grid-cols-3 gap-2">
            {items.map((item) => (
                <div key={item.label} className="bg-white rounded-xl border border-stone-200 p-3 text-center shadow-sm">
                    <div className="text-sm font-bold text-stone-800 mt-1">{item.value}</div>
                    <div className="text-xs text-stone-500">{item.label}</div>
                </div>
            ))}
        </div>
    );
}
// --- Main Dashboard ---

export default function CaregiverDashboard() {
    const [patientState, setPatientState] = useState<PatientState | null>(null);
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
    const [streakData, setStreakData] = useState<StreakData | null>(null);
    const [burden, setBurden] = useState<BurdenData | null>(null);
    const [respondingId, setRespondingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const fetchAll = useCallback(async () => {
        const [stateRes, dashRes, streakRes, weeklyRes, burdenRes] = await Promise.all([
            api.getPatientState(PATIENT_ID),
            api.getCaregiverDashboard(PATIENT_ID),
            api.getStreaks(PATIENT_ID),
            api.getWeeklyReport(PATIENT_ID),
            api.getCaregiverBurden(PATIENT_ID),
        ]);

        setPatientState(stateRes);
        setDashboard(dashRes);
        setStreakData(streakRes);
        setWeeklyReport(weeklyRes);
        setBurden(burdenRes);

        const rawAlerts: Alert[] = dashRes?.alerts || [];
        setAlerts(rawAlerts);
        setLastRefresh(new Date());
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [fetchAll]);

    const handleRespond = async (alertId: string, action: AlertAction) => {
        setRespondingId(alertId);
        await api.caregiverRespond(alertId, action, PATIENT_ID);
        setAlerts((prev) =>
            prev.map((a) =>
                a.id === alertId ? { ...a, responded: true, response_action: action } : a
            )
        );
        setRespondingId(null);
    };

    const currentState = patientState?.current_state || dashboard?.current_state || "STABLE";
    const riskScore = patientState?.risk_score ?? dashboard?.risk_score ?? 0;
    const lastUpdated = patientState?.last_updated || dashboard?.last_updated || "";

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-stone-500">Loading your father&apos;s dashboard...</p>
                </div>
            </div>
        );
    }
    return (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-stone-800">Hi, caring for Papa</h2>
                    <p className="text-xs text-stone-400">
                        Updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" · "}auto-refreshes every 30s
                    </p>
                </div>
                <button
                    onClick={fetchAll}
                    className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
                    title="Refresh now"
                >
                    <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {/* Patient status */}
            <StatusHeader state={currentState} riskScore={riskScore} lastUpdated={lastUpdated} />

            {/* Vitals */}
            <Vitals biometrics={patientState?.biometrics ?? null} />

            {/* Burden check */}
            <BurdenCard burden={burden} />

            {/* Alerts */}
            <div>
                <h3 className="text-sm font-semibold text-stone-700 mb-2">
                    Recent Alerts
                    {alerts.length > 0 && (
                        <span className="ml-2 text-xs font-normal text-stone-400">
                            {alerts.filter((a) => !a.responded).length} pending
                        </span>
                    )}
                </h3>
                <AlertFeed alerts={alerts} respondingId={respondingId} onRespond={handleRespond} />
            </div>

            {/* Weekly summary */}
            <WeeklySummaryCard report={weeklyReport} />

            {/* Streaks */}
            <StreakDisplay streakData={streakData} />

            {/* Quick actions */}
            <div>
                <h3 className="text-sm font-semibold text-stone-700 mb-2">Quick Actions</h3>
                <QuickActions />
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-stone-300 pt-4 pb-8">
                BeWo Caregiver Dashboard
            </p>
        </div>
    );
}
