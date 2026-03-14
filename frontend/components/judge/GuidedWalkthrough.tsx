"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import {
    ChevronRight,
    ChevronLeft,
    X,
    Play,
    Loader2,
    Sparkles,
    Brain,
    Shield,
    Heart,
    Stethoscope,
    Terminal,
    BarChart3,
    AlertTriangle,
    CheckCircle2,
} from "lucide-react";

type TabId = "overview" | "patient" | "nurse" | "intelligence" | "tooldemo";

interface WalkthroughStep {
    id: string;
    title: string;
    subtitle: string;
    body: string;
    tab?: TabId;
    action?: () => Promise<void>;
    actionLabel?: string;
    highlight?: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
}

interface GuidedWalkthroughProps {
    onClose: () => void;
    onTabChange: (tab: TabId) => void;
    onRefresh: () => void;
}

export function GuidedWalkthrough({ onClose, onTabChange, onRefresh }: GuidedWalkthroughProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [actionRunning, setActionRunning] = useState(false);
    const [actionDone, setActionDone] = useState<Set<number>>(new Set());

    const runAction = useCallback(async (action: () => Promise<void>, stepIdx: number) => {
        setActionRunning(true);
        try {
            await action();
            setActionDone(prev => new Set(prev).add(stepIdx));
            onRefresh();
        } catch (e) {
            console.error("Walkthrough action failed:", e);
        } finally {
            setActionRunning(false);
        }
    }, [onRefresh]);

    const injectScenario = useCallback(async (scenario: string) => {
        await api.resetData();
        await api.injectScenario(scenario, 14);
        await api.runHMM();
        try { await api.trainHMM("P001"); } catch { /* ok */ }
    }, []);

    const steps: WalkthroughStep[] = [
        {
            id: "welcome",
            title: "Welcome to Bewo",
            subtitle: "AI-Powered Chronic Disease Management",
            body: "This guided demo walks you through Bewo's live system. Every button fires real API calls against our backend — HMM inference, AI agent reasoning, safety classification, and nurse triage. Nothing is mocked.\n\nYou'll see how Bewo predicts diabetes crises 48 hours early, and how the system responds across patient, nurse, and clinical views.",
            icon: <Sparkles size={20} />,
            badge: "START",
            badgeColor: "bg-blue-500",
        },
        {
            id: "inject_crisis",
            title: "Step 1: Inject a Crisis Scenario",
            subtitle: "Simulating 14 days of patient data ending in crisis",
            body: "We'll inject the \"Warning → Crisis\" scenario: 5 days stable, 5 days declining, then 4 days of crisis. Glucose spikes to 15+ mmol/L, medication adherence drops to 30%, steps collapse.\n\nThis triggers the full pipeline: data injection → HMM Viterbi inference → Baum-Welch parameter learning.",
            tab: "overview",
            action: () => injectScenario("warning_to_crisis"),
            actionLabel: "Inject Warning→Crisis Scenario",
            icon: <AlertTriangle size={20} />,
            badge: "CRISIS",
            badgeColor: "bg-rose-500",
        },
        {
            id: "overview_crisis",
            title: "Step 2: Observe the Dashboard",
            subtitle: "HMM detected CRISIS state — everything turns red",
            body: "Look at the Overview tab now:\n\n• HMM State: CRISIS (red card) — Viterbi decoded the hidden state sequence\n• Risk Score: 95% — Monte Carlo simulation of 48h crisis probability\n• SBAR Report: Auto-generated clinical summary with Situation, Background, Assessment, Recommendation\n• Drug Interactions: Checked against 16 interaction pairs\n• Nurse Triage: Patient flagged as IMMEDIATE — highest urgency",
            tab: "overview",
            icon: <BarChart3 size={20} />,
            badge: "OBSERVE",
            badgeColor: "bg-rose-500",
        },
        {
            id: "nurse_view",
            title: "Step 3: Nurse Dashboard",
            subtitle: "Auto-triage puts this patient at the top of the queue",
            body: "Switch to Nurse View. The nurse sees:\n\n• Triage queue sorted by urgency — CRISIS patients surface automatically\n• SBAR report generated without nurse input\n• Drug interaction warnings inline\n• Biometric trends with color-coded risk indicators\n\nThis replaces manual chart review. One nurse can monitor 100+ patients.",
            tab: "nurse",
            icon: <Stethoscope size={20} />,
            badge: "NURSE",
            badgeColor: "bg-rose-500",
        },
        {
            id: "patient_view",
            title: "Step 4: Patient Experience",
            subtitle: "The patient sees a caring companion, not a clinical dashboard",
            body: "Switch to Patient View. The patient app shows:\n\n• Risk indicator with trend direction (Declining)\n• AI companion that speaks Singlish and remembers preferences\n• Voice check-in with sentiment analysis\n• Medication tracking with voucher gamification\n• Daily insights personalized to their condition\n\nThe patient never sees raw HMM states — just empathetic guidance.",
            tab: "patient",
            icon: <Heart size={20} />,
            badge: "PATIENT",
            badgeColor: "bg-rose-500",
        },
        {
            id: "inject_recovery",
            title: "Step 5: Now Watch Recovery",
            subtitle: "Bewo detects crisis, intervenes, patient recovers",
            body: "This is the key differentiator. We'll inject the \"Recovery\" scenario: patient starts in CRISIS, Bewo's agent intervenes (medication reminders, nurse alerts, caregiver notifications), and over 14 days the patient recovers to STABLE.\n\nWatch the state cards turn from red → amber → green.",
            tab: "overview",
            action: () => injectScenario("recovery"),
            actionLabel: "Inject Recovery Scenario",
            icon: <CheckCircle2 size={20} />,
            badge: "RECOVERY",
            badgeColor: "bg-emerald-500",
        },
        {
            id: "overview_recovery",
            title: "Step 6: Recovery Confirmed",
            subtitle: "STABLE state restored — crisis was prevented",
            body: "The Overview now shows:\n\n• HMM State: STABLE (green) — patient recovered\n• Risk Score: ~22% (down from 95%)\n• Trend: IMPROVING\n• 14-Day History: CRISIS → WARNING → STABLE progression\n• SBAR: \"Metrics within acceptable range. Continue monitoring.\"\n\nThis is what Bewo does: detect early, intervene automatically, prevent ER admissions.",
            tab: "overview",
            icon: <BarChart3 size={20} />,
            badge: "RESOLVED",
            badgeColor: "bg-emerald-500",
        },
        {
            id: "tool_demo",
            title: "Step 7: AI Tool Pipeline",
            subtitle: "18 agentic tools executing against real endpoints",
            body: "Switch to Tool Demo and click \"Run Full Pipeline\". You'll see all 18 tools fire in sequence:\n\n1. Safety Pre-Check — drug interactions + safety classifier\n2. Clinical Intelligence — SBAR generation + nurse triage\n3. Patient Engagement — food recommendations + streak celebration\n4. Proactive Communication — appointment booking + caregiver alerts\n5. Remaining Tools — medication adjustments, reminders, escalation\n\nEvery call hits a real API endpoint. No mocks.",
            tab: "tooldemo",
            icon: <Terminal size={20} />,
            badge: "18 TOOLS",
            badgeColor: "bg-cyan-500",
        },
        {
            id: "intelligence",
            title: "Step 8: Under the Hood",
            subtitle: "Agent memory, tool learning, safety audit trail",
            body: "The AI Intelligence tab shows what makes this a true agentic system:\n\n• Cross-session memory — episodic, semantic, preference types\n• Tool effectiveness scoring — learns which tools work per patient per state\n• Safety classifier audit trail — every response checked on 6 dimensions\n• HMM parameters — learned transition matrices via Baum-Welch (EM)\n• Caregiver burden scoring — prevents alert fatigue\n• Proactive trigger history — agent reaches out first",
            tab: "intelligence",
            icon: <Brain size={20} />,
            badge: "AI",
            badgeColor: "bg-purple-500",
        },
        {
            id: "closing",
            title: "Before Crisis. Not After.",
            subtitle: "20K+ lines of production code. Live system. Real prediction.",
            body: "What you've just seen is not a prototype — it's a working system:\n\n• 3-state HMM with Viterbi decoding + Baum-Welch learning\n• 5-turn ReAct agent with 18 tools and cross-session memory\n• 6-dimension safety classifier on every response\n• Merlion anomaly detection for glucose forecasting\n• 53 API routes, 35 database tables\n• Multi-stakeholder: patient companion + nurse triage + caregiver alerts\n\nTry any scenario from the sidebar. Or chat with the AI agent in the Patient View. Everything is live.",
            icon: <Shield size={20} />,
            badge: "BEWO",
            badgeColor: "bg-zinc-900",
        },
    ];

    const step = steps[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === steps.length - 1;
    const hasAction = !!step.action;
    const isDone = actionDone.has(currentStep);

    const goNext = () => {
        if (isLast) { onClose(); return; }
        const next = currentStep + 1;
        setCurrentStep(next);
        if (steps[next].tab) onTabChange(steps[next].tab!);
    };

    const goPrev = () => {
        if (isFirst) return;
        const prev = currentStep - 1;
        setCurrentStep(prev);
        if (steps[prev].tab) onTabChange(steps[prev].tab!);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
            {/* Dim overlay */}
            <div className="absolute inset-0 bg-black/20 pointer-events-auto" onClick={onClose} />

            {/* Bottom panel */}
            <div className="relative w-full max-w-2xl mb-6 mx-4 pointer-events-auto animate-in slide-in-from-bottom duration-300">
                <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
                    {/* Progress bar */}
                    <div className="h-1 bg-zinc-100">
                        <div
                            className="h-full bg-zinc-900 transition-all duration-500 ease-out"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>

                    {/* Header */}
                    <div className="px-6 pt-5 pb-3 flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl ${step.badgeColor} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                                {step.icon}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-zinc-900">{step.title}</h2>
                                </div>
                                <p className="text-sm text-zinc-500 mt-0.5">{step.subtitle}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 pb-4">
                        <div className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                            {step.body}
                        </div>
                    </div>

                    {/* Action button (if step has one) */}
                    {hasAction && (
                        <div className="px-6 pb-4">
                            <button
                                onClick={() => runAction(step.action!, currentStep)}
                                disabled={actionRunning || isDone}
                                className={`w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all
                                    ${isDone
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98] shadow-sm"
                                    }
                                    disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                                {actionRunning ? (
                                    <><Loader2 size={16} className="animate-spin" /> Running Pipeline...</>
                                ) : isDone ? (
                                    <><CheckCircle2 size={16} /> Done — Data Injected</>
                                ) : (
                                    <><Play size={16} className="fill-current" /> {step.actionLabel}</>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Footer nav */}
                    <div className="px-6 pb-5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            {steps.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setCurrentStep(i);
                                        if (steps[i].tab) onTabChange(steps[i].tab!);
                                    }}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                        i === currentStep ? "bg-zinc-900 w-6" : i < currentStep ? "bg-zinc-400" : "bg-zinc-200"
                                    }`}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400 mr-2">
                                {currentStep + 1} / {steps.length}
                            </span>
                            {!isFirst && (
                                <button
                                    onClick={goPrev}
                                    className="h-9 px-4 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 flex items-center gap-1 transition-colors"
                                >
                                    <ChevronLeft size={14} /> Back
                                </button>
                            )}
                            <button
                                onClick={goNext}
                                disabled={hasAction && !isDone && !actionRunning}
                                className={`h-9 px-5 rounded-lg text-sm font-semibold flex items-center gap-1 transition-all
                                    ${isLast
                                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                        : "bg-zinc-900 text-white hover:bg-zinc-800"
                                    }
                                    disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                                {isLast ? "Explore Freely" : "Next"} <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
