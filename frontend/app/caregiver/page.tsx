"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api, type PatientState } from "@/lib/api";

const DEFAULT_PATIENT_ID = "P001";
const REFRESH_INTERVAL_MS = 30_000;

type AlertAction = "acknowledge" | "on_my_way" | "need_help" | "escalate";

interface Alert {
    id: string | number;
    message: string;
    severity: string;
    timestamp?: string | number;
    timestamp_utc?: number;
    responded?: boolean;
    response_action?: string;
    channel?: string;
    status?: string;
    reason?: string;
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
    recent_alerts?: Alert[];
    risk_score?: number;
    current_state?: string;
    last_updated?: string;
}
// --- Helpers ---

function stateColor(state: string): { bg: string; text: string; border: string; dot: string; label: string; icon: string } {
    switch (state) {
        case "CRISIS":
            return { bg: "bg-error-50", text: "text-error-700", border: "border-error-200", dot: "bg-error-solid", label: "Act Now", icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" };
        case "WARNING":
            return { bg: "bg-warning-50", text: "text-warning-700", border: "border-warning-200", dot: "bg-warning-solid", label: "Heads Up", icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" };
        default:
            return { bg: "bg-success-50", text: "text-success-700", border: "border-success-200", dot: "bg-success-solid", label: "All Safe", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" };
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

function severityBadge(severity: string): { classes: string; label: string; cardBorder: string } {
    switch (severity) {
        case "high":
            return { classes: "bg-error-100 text-error-700", label: "Urgent", cardBorder: "border-l-error-solid" };
        case "medium":
            return { classes: "bg-warning-100 text-warning-700", label: "Attention", cardBorder: "border-l-warning-solid" };
        default:
            return { classes: "bg-neutral-100 text-neutral-600", label: "Info", cardBorder: "border-l-neutral-300" };
    }
}

function formatTime(ts: string | number): string {
    if (!ts && ts !== 0) return "";
    try {
        // Handle Unix timestamps (seconds) from backend — multiply by 1000 for JS Date
        const d = typeof ts === "number" ? new Date(ts > 1e12 ? ts : ts * 1000) : new Date(ts);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        if (diffMs < 0) return "Just now";
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    } catch {
        return String(ts);
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
    if (!grade) return "text-neutral-500";
    const g = grade.toUpperCase();
    if (g === "A" || g === "A+") return "text-success-600";
    if (g === "B" || g === "B+") return "text-success-700";
    if (g === "C" || g === "C+") return "text-warning-600";
    return "text-error-600";
}
// --- Components ---

function StatusHeader({ state, riskScore, lastUpdated }: { state: string; riskScore: number; lastUpdated: string }) {
    const colors = stateColor(state);
    return (
        <div className={`rounded-2xl p-6 ${colors.bg} ${colors.border} border-2 shadow-card animate-in fade-in slide-in-from-bottom-4`}>
            <div className="flex items-start gap-4">
                <div className="shrink-0 mt-0.5">
                    <div className={`w-10 h-10 rounded-full ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                        <svg className={`w-5 h-5 ${colors.text}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d={colors.icon} />
                        </svg>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className={`text-2xl font-bold ${colors.text} leading-tight`}>{statusHeadline(state)}</h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
                            <span className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
                            {colors.label}
                        </span>
                        {lastUpdated && (
                            <span className="text-neutral-400 text-xs">
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
    const actionButtons: { action: AlertAction; label: string; style: string; icon: string }[] = [
        { action: "acknowledge", label: "Got it", style: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300", icon: "M4.5 12.75l6 6 9-13.5" },
        { action: "on_my_way", label: "On my way", style: "bg-accent-100 text-accent-700 hover:bg-accent-200 active:bg-accent-300", icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" },
        { action: "need_help", label: "Need help", style: "bg-warning-100 text-warning-700 hover:bg-warning-200 active:bg-warning-500/20", icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" },
        { action: "escalate", label: "Escalate", style: "bg-error-100 text-error-700 hover:bg-error-200 active:bg-error-500/20", icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" },
    ];

    if (alerts.length === 0) {
        return (
            <div className="bg-success-50 border border-success-200 rounded-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-4">
                <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-sm font-medium text-success-700">All quiet. Nothing needs your attention.</p>
                <p className="text-xs text-neutral-400 mt-1">We will notify you if anything comes up.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {alerts.map((alert, idx) => {
                const badge = severityBadge(alert.severity);
                return (
                    <div
                        key={alert.id}
                        className={`bg-white rounded-2xl border border-neutral-200 border-l-4 ${badge.cardBorder} p-4 shadow-card animate-in fade-in slide-in-from-bottom-4`}
                        style={{ animationDelay: `${idx * 80}ms` }}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <p className="text-sm text-neutral-800 flex-1 leading-relaxed">{typeof alert.message === 'string' ? alert.message : JSON.stringify(alert.message)}</p>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${badge.classes}`}>
                                {badge.label}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1.5">{formatTime(alert.timestamp ?? alert.timestamp_utc ?? "")}</p>

                        {alert.responded ? (
                            <div className="mt-3 flex items-center gap-1.5 text-sm text-success-600 font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Responded: {alert.response_action?.replace(/_/g, " ")}
                            </div>
                        ) : (
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                {actionButtons.map((btn) => (
                                    <button
                                        key={btn.action}
                                        disabled={respondingId === String(alert.id)}
                                        onClick={() => onRespond(String(alert.id), btn.action)}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${btn.style} disabled:opacity-50 min-h-[44px]`}
                                    >
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d={btn.icon} />
                                        </svg>
                                        {respondingId === String(alert.id) ? "..." : btn.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
function WeeklySummaryCard({ report, isLoading = true }: { report: WeeklyReport | null; isLoading?: boolean }) {
    if (!report) {
        return (
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-card">
                <h3 className="text-base font-semibold text-neutral-800 mb-2">This Week</h3>
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin" />
                            Loading weekly summary...
                        </>
                    ) : (
                        <span>No data available</span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-card animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "200ms" }}>
            <h3 className="text-base font-semibold text-neutral-800 mb-4">This Week</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-neutral-50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-neutral-800">
                        {typeof report.adherence_pct === 'number' ? `${report.adherence_pct}%` : "--"}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">Adherence</div>
                </div>
                <div className="bg-neutral-50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-neutral-800 capitalize">
                        {typeof report.glucose_trend === 'string' ? report.glucose_trend : "--"}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">Glucose</div>
                </div>
                <div className="bg-neutral-50 rounded-xl p-3">
                    <div className={`text-2xl font-bold ${gradeColor(typeof report.grade === 'string' ? report.grade : "")}`}>
                        {typeof report.grade === 'string' ? report.grade : "--"}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">Grade</div>
                </div>
            </div>
            {typeof report.summary === 'string' && report.summary && (
                <p className="text-sm text-neutral-500 mt-4 leading-relaxed border-t border-neutral-100 pt-4">
                    {report.summary}
                </p>
            )}
        </div>
    );
}

function StreakDisplay({ streakData }: { streakData: StreakData | null }) {
    const streaks = streakData?.streaks;
    const items = [
        { key: "medication", label: "Medication", emoji: "💊" },
        { key: "glucose", label: "Glucose check", emoji: "🩸" },
    ];

    return (
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-card animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "280ms" }}>
            <h3 className="text-base font-semibold text-neutral-800 mb-4">Streaks</h3>
            <div className="space-y-4">
                {items.map(({ key, label, emoji }) => {
                    const s = streaks?.[key];
                    const current = s?.current ?? 0;
                    const best = s?.best ?? 0;
                    return (
                        <div key={key} className="flex items-start gap-3">
                            <span className="text-lg mt-0.5" role="img" aria-label={label}>{emoji}</span>
                            <div className="flex-1">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-sm font-medium text-neutral-700">{label}</span>
                                    <span className="text-xs text-neutral-400">Best: {best}d</span>
                                </div>
                                <div className="mt-1.5 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-success-solid rounded-full transition-all duration-700 ease-out"
                                        style={{ width: `${best > 0 ? Math.min((current / best) * 100, 100) : (current > 0 ? 100 : 0)}%` }}
                                    />
                                </div>
                                <div className="text-xs text-success-600 font-medium mt-1">
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
function BurdenCard({ burden, isLoading = true }: { burden: BurdenData | null; isLoading?: boolean }) {
    if (!burden) {
        return (
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-card">
                <h3 className="text-base font-semibold text-neutral-800 mb-2">Your wellbeing</h3>
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin" />
                            Checking in...
                        </>
                    ) : (
                        <span>No data available</span>
                    )}
                </div>
            </div>
        );
    }

    const level = typeof burden.level === 'string' ? burden.level : "low";
    const safeScore = typeof burden.score === 'number' ? burden.score : null;
    const safeMessage = typeof burden.message === 'string' ? burden.message : null;
    const safeRecommendation = typeof burden.recommendation === 'string' ? burden.recommendation : null;
    const config: Record<string, { bg: string; bar: string; icon: string }> = {
        low: { bg: "bg-success-50 border-success-200", bar: "bg-success-solid", icon: "M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" },
        moderate: { bg: "bg-warning-50 border-warning-200", bar: "bg-warning-solid", icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" },
        high: { bg: "bg-error-50 border-error-200", bar: "bg-error-solid", icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" },
    };
    const cfg = config[level] || config.low;

    return (
        <div className={`rounded-2xl border-2 p-5 shadow-card animate-in fade-in slide-in-from-bottom-4 ${cfg.bg}`} style={{ animationDelay: "120ms" }}>
            <div className="flex items-start gap-3">
                <div className="shrink-0">
                    <div className={`w-10 h-10 rounded-full bg-white/60 flex items-center justify-center`}>
                        <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                        </svg>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-neutral-800">Your wellbeing</h3>
                    <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
                        {safeMessage || burdenMessage(level)}
                    </p>
                    {safeRecommendation && (
                        <p className="text-xs text-neutral-500 mt-2 leading-relaxed">{safeRecommendation}</p>
                    )}
                </div>
            </div>
            {safeScore != null && (
                <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 h-2.5 bg-white/60 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${cfg.bar}`}
                            style={{ width: `${Math.min(safeScore * 100, 100)}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium text-neutral-500 tabular-nums w-8 text-right">
                        {safeScore <= 0.33 ? "Low" : safeScore <= 0.66 ? "Mid" : "High"}
                    </span>
                </div>
            )}
        </div>
    );
}

function QuickActions() {
    return (
        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "360ms" }}>
            <a
                href="tel:+6591234567"
                className="flex flex-col items-center justify-center gap-2 px-4 py-5 bg-white rounded-2xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 transition-all shadow-card min-h-[72px]"
            >
                <div className="w-10 h-10 rounded-full bg-success-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                </div>
                Call Nurse
            </a>
            <a
                href="tel:+6598765432"
                className="flex flex-col items-center justify-center gap-2 px-4 py-5 bg-white rounded-2xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 transition-all shadow-card min-h-[72px]"
            >
                <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                Call Papa
            </a>
        </div>
    );
}

function Vitals({ biometrics }: { biometrics: PatientState["biometrics"] | null }) {
    if (!biometrics) return null;
    const items = [
        { label: "Glucose", value: typeof biometrics.glucose === 'number' ? biometrics.glucose.toFixed(1) : "--", unit: "mmol/L", icon: "🩸" },
        { label: "Heart rate", value: typeof biometrics.hr === 'number' ? String(biometrics.hr) : "--", unit: "bpm", icon: "💓" },
        { label: "Steps", value: typeof biometrics.steps === 'number' ? biometrics.steps.toLocaleString() : "--", unit: "today", icon: "👟" },
    ];
    return (
        <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "80ms" }}>
            {items.map((item) => (
                <div key={item.label} className="bg-white rounded-2xl border border-neutral-200 p-4 text-center shadow-card">
                    <span className="text-lg" role="img" aria-label={item.label}>{item.icon}</span>
                    <div className="text-lg font-bold text-neutral-800 mt-1">{item.value}</div>
                    <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider mt-0.5">{item.unit}</div>
                </div>
            ))}
        </div>
    );
}
// --- Main Dashboard ---

export default function CaregiverPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-10 h-10 border-3 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <CaregiverDashboard />
        </Suspense>
    );
}

function CaregiverDashboard() {
    const searchParams = useSearchParams();
    const patientId = searchParams.get("patient") || DEFAULT_PATIENT_ID;

    const [patientState, setPatientState] = useState<PatientState | null>(null);
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
    const [streakData, setStreakData] = useState<StreakData | null>(null);
    const [burden, setBurden] = useState<BurdenData | null>(null);
    const [respondingId, setRespondingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const fetchAll = useCallback(async () => {
        try {
            const [stateRes, dashRes, streakRes, weeklyRes, burdenRes] = await Promise.all([
                api.getPatientState(patientId),
                api.getCaregiverDashboard(patientId),
                api.getStreaks(patientId),
                api.getWeeklyReport(patientId),
                api.getCaregiverBurden(patientId),
            ]);

            setPatientState(stateRes);
            setDashboard(dashRes);
            setStreakData(streakRes);
            setWeeklyReport(weeklyRes);
            setBurden(burdenRes);
            setFetchError(false);

            const rawAlerts: Alert[] = dashRes?.alerts || dashRes?.recent_alerts || [];
            setAlerts(rawAlerts);
            setLastRefresh(new Date());
        } catch (err) {
            console.error("Caregiver dashboard fetch failed:", err);
            setFetchError(true);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [fetchAll]);

    const handleRespond = async (alertId: string, action: AlertAction) => {
        setRespondingId(alertId);
        try {
            const result = await api.caregiverRespond(alertId, action, patientId);
            if (result?.success === true) {
                setAlerts((prev) =>
                    prev.map((a) =>
                        String(a.id) === alertId ? { ...a, responded: true, response_action: action } : a
                    )
                );
            }
        } catch (err) {
            console.error("Failed to respond to alert:", err);
        } finally {
            setRespondingId(null);
        }
    };

    const currentState = patientState?.current_state || dashboard?.current_state || "STABLE";
    const riskScore = patientState?.risk_score ?? dashboard?.risk_score ?? 0;
    const lastUpdated = patientState?.last_updated || dashboard?.last_updated || "";

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <div className="w-10 h-10 border-3 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div>
                        <p className="text-base font-medium text-neutral-700">Loading Papa&apos;s dashboard</p>
                        <p className="text-sm text-neutral-400 mt-1">Just a moment...</p>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="max-w-lg mx-auto px-4 pt-6 pb-12 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between animate-in fade-in">
                <div>
                    <h2 className="text-xl font-bold text-neutral-800">Caring for Papa</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                        Updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" · "}refreshes every 30s
                    </p>
                </div>
                <button
                    onClick={fetchAll}
                    className="p-2.5 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
                    title="Refresh now"
                >
                    <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {/* Fetch error banner */}
            {fetchError && (
                <div className="bg-warning-50 border border-warning-200 rounded-2xl px-4 py-3 flex items-center gap-3 animate-in fade-in">
                    <svg className="w-5 h-5 text-warning-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-sm font-medium text-warning-700">Unable to connect to server. Data may be stale.</p>
                </div>
            )}

            {/* Patient status — the hero element */}
            <StatusHeader state={currentState} riskScore={riskScore} lastUpdated={lastUpdated} />

            {/* Vitals at a glance */}
            <Vitals biometrics={patientState?.biometrics ?? null} />

            {/* Alerts — action-required items */}
            <section>
                <h3 className="text-base font-semibold text-neutral-800 mb-3">
                    Recent Alerts
                    {alerts.length > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center text-xs font-semibold text-white bg-error-solid rounded-full w-5 h-5 align-middle">
                            {alerts.filter((a) => !a.responded).length}
                        </span>
                    )}
                </h3>
                <AlertFeed alerts={alerts} respondingId={respondingId} onRespond={handleRespond} />
            </section>

            {/* Caregiver wellbeing */}
            <BurdenCard burden={burden} isLoading={loading} />

            {/* Weekly summary */}
            <WeeklySummaryCard report={weeklyReport} isLoading={loading} />

            {/* Streaks */}
            <StreakDisplay streakData={streakData} />

            {/* Quick actions */}
            <section>
                <h3 className="text-base font-semibold text-neutral-800 mb-3">Quick Actions</h3>
                <QuickActions />
            </section>

            {/* Footer */}
            <p className="text-center text-xs text-neutral-300 pt-6 pb-4">
                BeWo Caregiver Dashboard
            </p>
        </div>
    );
}
