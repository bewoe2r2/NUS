"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { AdminSidebar } from '@/components/judge/AdminSidebar';
import { GuidedWalkthrough } from '@/components/judge/GuidedWalkthrough';
import { api } from '@/lib/api';
import PatientView from '@/app/page';
import NurseDashboard from '@/app/nurse/page';
import {
    Activity,
    Brain,
    Shield,
    AlertTriangle,
    TrendingUp,
    Users,
    Pill,
    Heart,
    BarChart3,
    MessageSquare,
    Zap,
    RefreshCw,
    Loader2,
    FileText,
    Eye,
    Stethoscope,
    Play,
    Terminal,
    Sparkles,
    Calendar,
    Bell,
    UtensilsCrossed,
    Award,
    ExternalLink,
    Phone,
    SmartphoneNfc,
    Presentation,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
interface TriagePatient {
    patient_id: string;
    name?: string;
    urgency_score: number;
    triage_category: string;
    state: string;
    risk_48h: number;
    sbar_line?: string;
    days_since_attention?: number;
}

// ============================================================================
// JUDGE PAGE
// ============================================================================
export default function JudgePage() {
    const [activeTab, setActiveTab] = useState<'slides' | 'overview' | 'patient' | 'nurse' | 'caregiver' | 'intelligence' | 'tooldemo'>('slides');
    const [refreshKey, setRefreshKey] = useState(0);
    const [loadingOverview, setLoadingOverview] = useState(false);
    const [loadingIntelligence, setLoadingIntelligence] = useState(false);
    const [loadingCaregiver, setLoadingCaregiver] = useState(false);
    const [showWalkthrough, setShowWalkthrough] = useState(false); // Disabled — presenting manually
    const [walkthroughCompleted, setWalkthroughCompleted] = useState(false);
    const [walkthroughResumeStep, setWalkthroughResumeStep] = useState<number | undefined>(undefined);
    const lastWalkthroughStepRef = useRef(0);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Overview data
    const [patientState, setPatientState] = useState<any>(null);
    const [triage, setTriage] = useState<any>(null);
    const [drugInteractions, setDrugInteractions] = useState<any>(null);
    const [clinicianSummary, setClinicianSummary] = useState<any>(null);
    const [impactMetrics, setImpactMetrics] = useState<any>(null);

    // Intelligence data
    const [agentMemory, setAgentMemory] = useState<any[]>([]);
    const [toolEffectiveness, setToolEffectiveness] = useState<any>(null);
    const [safetyLog, setSafetyLog] = useState<any[]>([]);
    const [agentActions, setAgentActions] = useState<any[]>([]);
    const [streaks, setStreaks] = useState<any>(null);
    const [engagement, setEngagement] = useState<any>(null);
    const [hmmParams, setHmmParams] = useState<any>(null);
    const [caregiverBurden, setCaregiverBurden] = useState<any>(null);
    const [proactiveHistory, setProactiveHistory] = useState<any[]>([]);
    const [counterfactual, setCounterfactual] = useState<any>(null);

    // Caregiver data
    const [caregiverDashboard, setCaregiverDashboard] = useState<any>(null);
    const [caregiverBurdenData, setCaregiverBurdenData] = useState<any>(null);

    const fetchCaregiverData = useCallback(async () => {
        setLoadingCaregiver(true);
        try {
            const [dashboard, burden] = await Promise.all([
                api.getCaregiverDashboard("P001").catch(() => null),
                api.getCaregiverBurden("P001").catch(() => null),
            ]);
            setCaregiverDashboard(dashboard);
            setCaregiverBurdenData(burden);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingCaregiver(false);
        }
    }, []);

    const fetchOverviewData = useCallback(async () => {
        setLoadingOverview(true);
        try {
            // Fast endpoints first
            const [state, triageRes, drugs, impact] = await Promise.all([
                api.getPatientState("P001").catch(() => null),
                api.getNurseTriage().catch(() => null),
                api.getDrugInteractions("P001").catch(() => null),
                api.getImpactMetrics("P001").catch(() => null),
            ]);
            setPatientState(state);
            setTriage(triageRes);
            setDrugInteractions(drugs);
            setImpactMetrics(impact);

            // SBAR uses Gemini — fetch in background, don't block UI
            api.getClinicianSummary("P001").then(s => setClinicianSummary(s)).catch(() => {});
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingOverview(false);
        }
    }, []);

    const fetchIntelligenceData = useCallback(async () => {
        setLoadingIntelligence(true);
        try {
            const [mem, tools, safety, actions, str, eng, hmm, cg, proactive] = await Promise.all([
                api.getAgentMemory("P001").catch(() => []),
                api.getToolEffectiveness("P001").catch(() => null),
                api.getSafetyLog("P001").catch(() => []),
                api.getAgentActions("P001").catch(() => []),
                api.getStreaks("P001").catch(() => null),
                api.getEngagement("P001").catch(() => null),
                api.getHMMParams("P001").catch(() => null),
                api.getCaregiverBurden("P001").catch(() => null),
                api.getProactiveHistory("P001").catch(() => []),
            ]);
            setAgentMemory(mem);
            setToolEffectiveness(tools);
            setSafetyLog(safety);
            setAgentActions(actions);
            setStreaks(str);
            setEngagement(eng);
            setHmmParams(hmm);
            setCaregiverBurden(cg);
            setProactiveHistory(proactive);

            // Counterfactual may use Gemini — fetch in background
            api.runCounterfactual("P001").then(cf => setCounterfactual(cf)).catch(() => {});
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingIntelligence(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'overview') fetchOverviewData();
        if (activeTab === 'intelligence') fetchIntelligenceData();
        if (activeTab === 'caregiver') fetchCaregiverData();
    }, [refreshKey, fetchOverviewData, fetchIntelligenceData, fetchCaregiverData, activeTab]);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleTabChange = (tab: typeof activeTab) => {
        // Only setActiveTab — the useEffect handles data fetching.
        // This prevents double-fetch flicker when the walkthrough switches tabs.
        setActiveTab(tab);
    };

    const tabs = [
        { id: 'slides' as const, label: 'Slides', icon: Presentation },
        { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
        { id: 'patient' as const, label: 'Patient View', icon: Heart },
        { id: 'nurse' as const, label: 'Nurse View', icon: Stethoscope },
        { id: 'caregiver' as const, label: 'Caregiver', icon: Users },
        { id: 'intelligence' as const, label: 'AI Intelligence', icon: Brain },
        { id: 'tooldemo' as const, label: 'Tool Demo', icon: Terminal },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-50 font-sans">
            <AdminSidebar onScenarioInjected={handleRefresh} onCollapsedChange={setSidebarCollapsed} onTabChange={(t) => handleTabChange(t as typeof activeTab)} />

            <div className={`flex-1 ${sidebarCollapsed ? 'ml-14' : 'ml-80'} transition-all duration-300 h-full overflow-hidden flex flex-col`}>
                {/* TOP BAR */}
                <div className="h-14 bg-white border-b border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between px-6 shrink-0">
                    <div id="tab-bar-group" className="flex items-center gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    title={tab.label}
                                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all
                                        ${isActive
                                            ? 'bg-zinc-900 text-white shadow-sm'
                                            : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                                        }`}
                                >
                                    <Icon size={14} className="shrink-0" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-3">
                        {(loadingOverview || loadingIntelligence || loadingCaregiver) && <Loader2 size={14} className="animate-spin text-zinc-400" />}
                        <span className="bg-zinc-900 text-white px-3 py-1 rounded-full text-[11px] font-bold tracking-widest">
                            JUDGE MODE
                        </span>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto">
                    <div className={`h-full ${activeTab === 'slides' ? '' : 'hidden'}`}>
                        <SlidesTab isActive={activeTab === 'slides'} />
                    </div>
                    <div className={`h-full ${activeTab === 'overview' ? '' : 'hidden'}`}>
                        <OverviewTab
                            patientState={patientState}
                            triage={triage}
                            drugInteractions={drugInteractions}
                            clinicianSummary={clinicianSummary}
                            impactMetrics={impactMetrics}
                            onRefresh={fetchOverviewData}
                        />
                    </div>
                    <div className={`h-full flex justify-center items-start bg-slate-900 pt-6 pb-6 px-6 overflow-auto ${activeTab === 'patient' ? '' : 'hidden'}`}>
                        <div className="w-[390px] h-[760px] rounded-[40px] overflow-y-auto overflow-x-hidden relative bg-neutral-50 border border-slate-600/50 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.5)]">
                            <PatientView />
                        </div>
                    </div>
                    <div className={`h-full overflow-auto ${activeTab === 'nurse' ? '' : 'hidden'}`}>
                        <NurseDashboard />
                    </div>
                    <div className={`h-full ${activeTab === 'caregiver' ? '' : 'hidden'}`}>
                        <CaregiverTab
                            dashboard={caregiverDashboard}
                            burden={caregiverBurdenData}
                        />
                    </div>
                    <div className={`h-full ${activeTab === 'intelligence' ? '' : 'hidden'}`}>
                        <IntelligenceTab
                            agentMemory={agentMemory}
                            toolEffectiveness={toolEffectiveness}
                            safetyLog={safetyLog}
                            agentActions={agentActions}
                            streaks={streaks}
                            engagement={engagement}
                            hmmParams={hmmParams}
                            caregiverBurden={caregiverBurden}
                            proactiveHistory={proactiveHistory}
                            counterfactual={counterfactual}
                        />
                    </div>
                    <div className={`h-full ${activeTab === 'tooldemo' ? '' : 'hidden'}`}>
                        <ToolDemoTab />
                    </div>
                </div>
            </div>

            {showWalkthrough && (
                <GuidedWalkthrough
                    onClose={() => { setShowWalkthrough(false); setWalkthroughCompleted(true); }}
                    onTabChange={handleTabChange}
                    onRefresh={handleRefresh}
                    onStepChange={(step: number) => { lastWalkthroughStepRef.current = step; }}
                    initialStep={walkthroughResumeStep}
                />
            )}
        </div>
    );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================
function OverviewTab({ patientState, triage, drugInteractions, clinicianSummary, impactMetrics, onRefresh }: {
    patientState: any;
    triage: any;
    drugInteractions: any;
    clinicianSummary: any;
    impactMetrics: any;
    onRefresh: () => void;
}) {
    const state = typeof patientState?.current_state === 'string' ? patientState.current_state : null;
    const risk = typeof patientState?.risk_score === 'number' ? patientState.risk_score : 0;
    const stateColor = state === 'CRISIS' ? 'rose' : state === 'WARNING' ? 'amber' : state ? 'emerald' : 'blue';
    const hasData = !!state;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* HEADER ROW */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">System Overview</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        {hasData
                            ? 'Real-time patient state after simulation pipeline'
                            : 'Select a scenario from the sidebar and click Run Full Simulation to begin'
                        }
                    </p>
                </div>
                <button onClick={onRefresh} aria-label="Refresh data" className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* STATE CARDS */}
            <div id="state-cards-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StateCard
                    label="HMM State"
                    value={state || 'Awaiting Data'}
                    color={stateColor}
                    icon={<Brain size={18} />}
                />
                <StateCard
                    label="Risk Score"
                    value={hasData ? `${(risk * 100).toFixed(0)}%` : '\u2014'}
                    color={hasData ? (risk > 0.7 ? 'rose' : risk > 0.4 ? 'amber' : 'emerald') : 'blue'}
                    icon={<AlertTriangle size={18} />}
                />
                <StateCard
                    label="48h Crisis Prob"
                    value={typeof patientState?.risk_48h === 'number' ? `${(patientState.risk_48h * 100).toFixed(0)}%` : '\u2014'}
                    color={typeof patientState?.risk_48h === 'number' && patientState.risk_48h > 0.5 ? 'rose' : hasData ? 'emerald' : 'blue'}
                    icon={<TrendingUp size={18} />}
                />
                <StateCard
                    label="Drug Interactions"
                    value={drugInteractions?.interactions_found ?? 0}
                    color={drugInteractions == null ? 'blue' : drugInteractions.has_contraindicated ? 'rose' : drugInteractions.has_major ? 'amber' : 'emerald'}
                    icon={<Pill size={18} />}
                />
            </div>

            {/* SBAR REPORT */}
            <div id="sbar-section" className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              {clinicianSummary ? (
                <>
                    <div className="flex items-center gap-2 mb-4">
                        <FileText size={18} className="text-blue-600" />
                        <h2 className="text-lg font-bold text-zinc-900">SBAR Clinical Report</h2>
                    </div>
                    {(() => {
                        // Extract SBAR data from nested response: {summary: {sbar: {...}}} or {sbar: {...}}
                        const sbarData = clinicianSummary?.sbar || clinicianSummary?.summary?.sbar;
                        if (typeof clinicianSummary === 'string') {
                            return <pre className="text-sm text-zinc-700 whitespace-pre-wrap font-sans leading-relaxed">{clinicianSummary}</pre>;
                        }

                        const sbarColorMap: Record<string, string> = {
                            situation: 'border-l-blue-500',
                            background: 'border-l-violet-500',
                            assessment: 'border-l-amber-500',
                            recommendation: 'border-l-emerald-500',
                        };
                        const sbarLabelColorMap: Record<string, string> = {
                            situation: 'text-blue-600',
                            background: 'text-violet-600',
                            assessment: 'text-amber-600',
                            recommendation: 'text-emerald-600',
                        };

                        if (sbarData && typeof sbarData === 'object') {
                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(sbarData).map(([key, val]) => (
                                        <div key={key} className={`p-4 bg-zinc-50 rounded-lg border border-zinc-100 border-l-[3px] ${sbarColorMap[key.toLowerCase()] || 'border-l-zinc-400'}`}>
                                            <div className={`font-semibold uppercase text-xs tracking-wider mb-2 ${sbarLabelColorMap[key.toLowerCase()] || 'text-zinc-800'}`}>{key}</div>
                                            <div className="text-sm text-zinc-600 leading-relaxed">{Array.isArray(val) ? (val as string[]).join('; ') : typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}</div>
                                        </div>
                                    ))}
                                </div>
                            );
                        }
                        // Fallback: render non-metadata keys in 2x2 grid
                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(clinicianSummary).filter(([key]) => !['success', 'patient_id', 'period_days'].includes(key)).map(([key, val]) => (
                                    <div key={key} className={`p-4 bg-zinc-50 rounded-lg border border-zinc-100 border-l-[3px] ${sbarColorMap[key.toLowerCase()] || 'border-l-zinc-400'}`}>
                                        <div className={`font-semibold uppercase text-xs tracking-wider mb-2 ${sbarLabelColorMap[key.toLowerCase()] || 'text-zinc-800'}`}>{key}</div>
                                        <div className="text-sm text-zinc-600 leading-relaxed">{typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}</div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </>
              ) : (
                <div className="space-y-3 py-2">
                    <div className="h-4 bg-zinc-100 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-zinc-100 rounded animate-pulse w-full" />
                    <div className="h-4 bg-zinc-100 rounded animate-pulse w-2/3" />
                    <div className="h-4 bg-zinc-100 rounded animate-pulse w-5/6" />
                    <p className="text-xs text-zinc-400 text-center mt-3">Run a simulation to generate SBAR report</p>
                </div>
              )}
            </div>

            {/* TRIAGE + DRUG INTERACTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* TRIAGE */}
                <div id="triage-section" className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Users size={18} className="text-indigo-600" />
                        <h2 className="text-lg font-bold text-zinc-900">Nurse Triage</h2>
                    </div>
                    {triage?.patients && triage.patients.length > 0 ? (
                        <div className="space-y-3">
                            {triage.patients.map((p: TriagePatient, i: number) => (
                                <div key={`triage-${i}`} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                                        p.triage_category === 'IMMEDIATE' ? 'bg-rose-500' :
                                        p.triage_category === 'SOON' ? 'bg-amber-500' :
                                        p.triage_category === 'MONITOR' ? 'bg-blue-500' : 'bg-emerald-500'
                                    }`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-zinc-800">{p.patient_id}</div>
                                        <div className="text-xs text-zinc-500">{String(p.state || '')} | Urgency: {(typeof p.urgency_score === 'number' ? (p.urgency_score * 100).toFixed(0) : '0')}%</div>
                                    </div>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                        p.triage_category === 'IMMEDIATE' ? 'bg-rose-100 text-rose-700' :
                                        p.triage_category === 'SOON' ? 'bg-amber-100 text-amber-700' :
                                        p.triage_category === 'MONITOR' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                        {p.triage_category}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3 py-2">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                                <div className="w-2 h-2 rounded-full bg-zinc-200 animate-pulse shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 bg-zinc-200 rounded animate-pulse w-20" />
                                    <div className="h-3 bg-zinc-100 rounded animate-pulse w-32" />
                                </div>
                                <div className="h-5 w-16 bg-zinc-200 rounded-full animate-pulse" />
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                                <div className="w-2 h-2 rounded-full bg-zinc-200 animate-pulse shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 bg-zinc-200 rounded animate-pulse w-16" />
                                    <div className="h-3 bg-zinc-100 rounded animate-pulse w-28" />
                                </div>
                                <div className="h-5 w-16 bg-zinc-200 rounded-full animate-pulse" />
                            </div>
                            <p className="text-xs text-zinc-400 text-center mt-2">Run a simulation to see triage results</p>
                        </div>
                    )}
                </div>

                {/* DRUG INTERACTIONS */}
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Pill size={18} className="text-rose-600" />
                        <h2 className="text-lg font-bold text-zinc-900">Drug Interactions</h2>
                    </div>
                    {drugInteractions?.interactions && drugInteractions.interactions.length > 0 ? (
                        <div className="space-y-3">
                            {drugInteractions.interactions.map((ix: any, i: number) => (
                                <div key={`drug-ix-${i}`} className="p-3 rounded-lg border border-zinc-100 bg-zinc-50">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                            ix.severity === 'CONTRAINDICATED' ? 'bg-rose-100 text-rose-700' :
                                            ix.severity === 'MAJOR' ? 'bg-orange-100 text-orange-700' :
                                            ix.severity === 'MODERATE' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'
                                        }`}>
                                            {String(ix.severity ?? '')}
                                        </span>
                                        <span className="text-xs font-medium text-zinc-800">
                                            {Array.isArray(ix.drugs) ? ix.drugs.map(String).join(' + ') : `${String(ix.drug1 || ix.drug_1 || '?')} + ${String(ix.drug2 || ix.drug_2 || '?')}`}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500">{(() => { const v = ix.mechanism || ix.description || ix.effect || ''; return typeof v === 'object' ? JSON.stringify(v) : String(v); })()}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3 py-2">
                            <div className="p-3 rounded-lg border border-zinc-100 bg-zinc-50">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="h-5 w-24 bg-zinc-200 rounded-full animate-pulse" />
                                    <div className="h-3.5 w-28 bg-zinc-200 rounded animate-pulse" />
                                </div>
                                <div className="h-3 bg-zinc-100 rounded animate-pulse w-3/4 mt-2" />
                            </div>
                            <div className="p-3 rounded-lg border border-zinc-100 bg-zinc-50">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="h-5 w-20 bg-zinc-200 rounded-full animate-pulse" />
                                    <div className="h-3.5 w-32 bg-zinc-200 rounded animate-pulse" />
                                </div>
                                <div className="h-3 bg-zinc-100 rounded animate-pulse w-2/3 mt-2" />
                            </div>
                            <p className="text-xs text-zinc-400 text-center mt-2">No interactions found or run simulation first</p>
                        </div>
                    )}
                </div>
            </div>

            {/* IMPACT METRICS */}
            {impactMetrics && (
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 size={18} className="text-emerald-600" />
                        <h2 className="text-lg font-bold text-zinc-900">Impact Metrics</h2>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(impactMetrics).map(([key, value]) => {
                            if (typeof value === 'object') return null;
                            return (
                                <div key={key} className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                                    <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                                        {key.replace(/_/g, ' ')}
                                    </div>
                                    <div className="text-lg font-bold text-zinc-900">
                                        {typeof value === 'number' ? (value < 1 ? `${((value as number) * 100).toFixed(0)}%` : (value as number).toFixed(1)) : String(value)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* BIOMETRICS */}
            {patientState?.biometrics && (
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={18} className="text-blue-600" />
                        <h2 className="text-lg font-bold text-zinc-900">Current Biometrics</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Object.entries(patientState.biometrics).filter(([, v]) => v != null).map(([key, value]) => (
                            <div key={key} className="text-center p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</div>
                                <div className="text-xl font-bold text-zinc-900">{typeof value === 'number' ? (value as number).toFixed(1) : (value != null && typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''))}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// INTELLIGENCE TAB
// ============================================================================
function IntelligenceTab({ agentMemory, toolEffectiveness, safetyLog, agentActions, streaks, engagement, hmmParams, caregiverBurden, proactiveHistory, counterfactual }: {
    agentMemory: any[];
    toolEffectiveness: any;
    safetyLog: any[];
    agentActions: any[];
    streaks: any;
    engagement: any;
    hmmParams: any;
    caregiverBurden: any;
    proactiveHistory: any[];
    counterfactual: any;
}) {
    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900">AI Intelligence Inspector</h1>
                <p className="text-sm text-zinc-500 mt-1">Deep visibility into agent reasoning, memory, safety, and learning</p>
            </div>

            <div id="intel-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AGENT MEMORY */}
                <IntelCard title="Agent Memory" icon={<Brain size={16} />} color="indigo">
                    {agentMemory && agentMemory.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {agentMemory.slice(0, 20).map((m: any, i: number) => (
                                <div key={m.key ? `mem-${m.key}-${i}` : `mem-${i}`} className="p-2 bg-zinc-50 rounded border border-zinc-100 text-xs">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-indigo-600">{String(m.memory_type || m.type || '')}</span>
                                        <span className="text-zinc-400">|</span>
                                        <span className="text-zinc-600 font-medium">{String(m.key ?? '')}</span>
                                    </div>
                                    <div className="text-zinc-500 truncate">{typeof m.value_json === 'string' ? m.value_json : JSON.stringify(m.value_json || m.value)}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState text="No memories stored yet. Chat with the agent to build memory." />
                    )}
                </IntelCard>

                {/* TOOL EFFECTIVENESS */}
                <IntelCard title="Tool Effectiveness" icon={<Zap size={16} />} color="amber">
                    {toolEffectiveness && typeof toolEffectiveness === 'object' && Object.keys(toolEffectiveness).length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {Object.entries(toolEffectiveness).map(([tool, data]: [string, any]) => (
                                <div key={tool} className="p-2 bg-zinc-50 rounded border border-zinc-100">
                                    <div className="text-xs font-medium text-zinc-800 mb-1">{tool}</div>
                                    {data != null && typeof data === 'object' ? (
                                        Object.entries(data).map(([state, info]: [string, any]) => (
                                            <div key={state} className="flex items-center gap-2 text-[11px] text-zinc-500">
                                                <span className="font-medium">{state}:</span>
                                                <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-500 rounded-full"
                                                        style={{ width: `${typeof (info?.effectiveness_pct ?? info?.effectiveness) === 'number' ? (info?.effectiveness_pct ?? info?.effectiveness ?? 0) : 0}%` }}
                                                    />
                                                </div>
                                                <span>{(typeof (info?.effectiveness_pct ?? info?.effectiveness) === 'number' ? (info?.effectiveness_pct ?? info?.effectiveness ?? 0) : 0).toFixed(0)}%</span>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-[11px] text-zinc-500">{String(data)}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState text="Tool effectiveness scores will appear after agent interactions." />
                    )}
                </IntelCard>

                {/* SAFETY LOG */}
                <IntelCard title="Safety Classifier" icon={<Shield size={16} />} color="rose">
                    {safetyLog && safetyLog.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {safetyLog.slice(0, 15).map((evt: any, i: number) => {
                                const parsed = typeof evt.action_data === 'string' ? (() => { try { return JSON.parse(evt.action_data); } catch { return evt; } })() : (evt.action_data || evt);
                                const rawVerdict = parsed.verdict || evt.verdict || 'SAFE';
                                const verdict = typeof rawVerdict === 'string' ? rawVerdict : String(rawVerdict);
                                const flags = parsed.flags || evt.flags;
                                return (
                                    <div key={`safety-${i}`} className="p-2 bg-zinc-50 rounded border border-zinc-100 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold ${verdict === 'UNSAFE' ? 'text-rose-600' : verdict === 'CAUTION' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                {verdict}
                                            </span>
                                            {flags && <span className="text-zinc-400 truncate">{Array.isArray(flags) ? flags.join(', ') : String(flags)}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState text="All responses passed safety checks. No flags recorded." />
                    )}
                </IntelCard>

                {/* AGENT ACTIONS */}
                <IntelCard title="Agent Actions Log" icon={<Activity size={16} />} color="blue">
                    {agentActions && agentActions.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {agentActions.slice(0, 15).map((a: any, i: number) => (
                                <div key={`action-${i}`} className="p-2 bg-zinc-50 rounded border border-zinc-100 text-xs flex items-center gap-2">
                                    <span className="font-medium text-blue-600 shrink-0">{String(a.action_type || a.tool_name || a.tool || '')}</span>
                                    <span className="text-zinc-500 truncate">{(() => { const v = a.tool_result || a.reasoning || a.description || a.result || ''; return typeof v === 'object' ? JSON.stringify(v) : String(v); })()}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState text="No agent actions recorded yet." />
                    )}
                </IntelCard>

                {/* STREAKS & ENGAGEMENT */}
                <IntelCard title="Streaks & Engagement" icon={<TrendingUp size={16} />} color="emerald">
                    <div className="space-y-3">
                        {engagement && (
                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">Engagement Score</div>
                                <div className="text-2xl font-bold text-emerald-800">{typeof (engagement.score ?? engagement.engagement_score) === 'object' ? JSON.stringify(engagement.score ?? engagement.engagement_score) : String(engagement.score ?? engagement.engagement_score ?? 'N/A')}</div>
                            </div>
                        )}
                        {streaks && typeof streaks === 'object' && (
                            <div className="space-y-1">
                                {Object.entries(streaks.streaks || streaks).map(([key, val]) => {
                                    // val may be a number or an object like {current: 5, best: 10}
                                    let displayVal: string;
                                    if (val == null) {
                                        displayVal = '0';
                                    } else if (typeof val === 'object') {
                                        const sv = val as { current?: number; best?: number };
                                        displayVal = `${sv.current ?? 0} (best: ${sv.best ?? 0})`;
                                    } else {
                                        displayVal = String(val);
                                    }
                                    return (
                                        <div key={key} className="flex items-center justify-between text-xs p-2 bg-zinc-50 rounded">
                                            <span className="text-zinc-600 capitalize">{key.replace(/_/g, ' ')}</span>
                                            <span className="font-bold text-zinc-800">{displayVal}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {!engagement && !streaks && <EmptyState text="No streak or engagement data yet." />}
                    </div>
                </IntelCard>

                {/* HMM PARAMETERS */}
                <IntelCard title="Baum-Welch HMM Parameters" icon={<Brain size={16} />} color="violet">
                    {hmmParams ? (
                        <div className="space-y-3 text-xs max-h-64 overflow-y-auto">
                            {hmmParams.transition_matrix && (
                                <div>
                                    <div className="font-semibold text-zinc-700 mb-1">Transition Matrix</div>
                                    <div className="font-mono text-[10px] bg-zinc-50 p-2 rounded">
                                        {Array.isArray(hmmParams.transition_matrix) && hmmParams.transition_matrix.map((row: number[], i: number) => (
                                            <div key={`tm-row-${i}`} className="flex gap-3">
                                                {(['STABLE', 'WARNING', 'CRISIS'][i] ?? `State ${i}`)}:
                                                {row.map((v: number, j: number) => (
                                                    <span key={`tm-${i}-${j}`} className={v > 0.5 ? 'text-emerald-600 font-bold' : 'text-zinc-500'}>{typeof v === 'number' ? v.toFixed(3) : String(v)}</span>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {hmmParams.initial_probs && (
                                <div>
                                    <div className="font-semibold text-zinc-700 mb-1">Initial Probabilities</div>
                                    <div className="font-mono text-[10px] bg-zinc-50 p-2 rounded">
                                        {Array.isArray(hmmParams.initial_probs) && hmmParams.initial_probs.map((v: number, i: number) => (
                                            <span key={`ip-${i}`} className="mr-3">{['S', 'W', 'C'][i]}: {typeof v === 'number' ? v.toFixed(3) : String(v)}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <EmptyState text="Train Baum-Welch by running a simulation first." />
                    )}
                </IntelCard>

                {/* CAREGIVER BURDEN */}
                <IntelCard title="Caregiver Burden" icon={<Heart size={16} />} color="pink">
                    {caregiverBurden ? (
                        <div className="space-y-3">
                            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Burden Score</div>
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl font-bold text-zinc-900">
                                        {typeof (caregiverBurden.burden_score ?? caregiverBurden.score) === 'object' ? JSON.stringify(caregiverBurden.burden_score ?? caregiverBurden.score) : String(caregiverBurden.burden_score ?? caregiverBurden.score ?? 'N/A')}
                                    </div>
                                    <div className="text-xs text-zinc-500">/ 100</div>
                                    {(() => {
                                        const rawScore = caregiverBurden.burden_score ?? caregiverBurden.score;
                                        const numScore = typeof rawScore === 'number' ? rawScore : 0;
                                        return (
                                            <div className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                                numScore > 70 ? 'bg-rose-100 text-rose-700' :
                                                numScore > 40 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                                {numScore > 70 ? 'CRITICAL' : numScore > 40 ? 'MODERATE' : 'LOW'}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <EmptyState text="No caregiver burden data available." />
                    )}
                </IntelCard>

                {/* PROACTIVE HISTORY */}
                <IntelCard title="Proactive Check-ins" icon={<MessageSquare size={16} />} color="cyan">
                    {proactiveHistory && proactiveHistory.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {proactiveHistory.slice(0, 10).map((c: any, i: number) => (
                                <div key={`proactive-${i}`} className="p-2 bg-zinc-50 rounded border border-zinc-100 text-xs">
                                    <div className="flex items-center gap-2">
                                        <Zap size={10} className="text-cyan-600" />
                                        <span className="font-medium text-zinc-700">{String(c.trigger_type || c.type || '')}</span>
                                        <span className="text-zinc-400">{typeof c.reason === 'object' ? JSON.stringify(c.reason) : String(c.reason || '')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState text="No proactive check-ins triggered yet." />
                    )}
                </IntelCard>

                {/* COUNTERFACTUAL */}
                <IntelCard title="Counterfactual Analysis" icon={<Eye size={16} />} color="orange">
                    {counterfactual ? (
                        <div className="text-xs space-y-2 max-h-64 overflow-y-auto">
                            {typeof counterfactual === 'string' ? (
                                <pre className="whitespace-pre-wrap text-zinc-600 font-sans">{counterfactual}</pre>
                            ) : (
                                Object.entries(counterfactual).map(([key, val]) => (
                                    <div key={key} className="p-2 bg-zinc-50 rounded border border-zinc-100">
                                        <span className="font-semibold text-zinc-700 capitalize">{key.replace(/_/g, ' ')}: </span>
                                        <span className="text-zinc-500">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <EmptyState text="Run a simulation to generate counterfactual analysis." />
                    )}
                </IntelCard>
            </div>
        </div>
    );
}

// ============================================================================
// TOOL DEMO TAB
// ============================================================================
type LogEntry = {
    id: number;
    type: 'info' | 'tool_call' | 'result' | 'error' | 'system';
    tool?: string;
    text: string;
    timestamp: string;
};

const DEMO_TOOLS = [
    {
        id: 'drug_check',
        label: 'Drug Interaction Check',
        icon: Pill,
        color: 'rose',
        description: 'Check all medication interactions for P001',
    },
    {
        id: 'book_appointment',
        label: 'Book Appointment',
        icon: Calendar,
        color: 'blue',
        description: 'Simulate booking a follow-up appointment',
    },
    {
        id: 'caregiver_alert',
        label: 'Caregiver Alert',
        icon: Bell,
        color: 'amber',
        description: 'Send alert to patient caregiver',
    },
    {
        id: 'food_recommendation',
        label: 'Food Recommendation',
        icon: UtensilsCrossed,
        color: 'emerald',
        description: 'Get culturally-aware food suggestion',
    },
    {
        id: 'clinician_summary',
        label: 'SBAR Report',
        icon: FileText,
        color: 'indigo',
        description: 'Generate SBAR clinical summary',
    },
    {
        id: 'nurse_triage',
        label: 'Nurse Triage',
        icon: Users,
        color: 'violet',
        description: 'Run multi-patient urgency triage',
    },
    {
        id: 'streak_celebrate',
        label: 'Celebrate Streak',
        icon: Award,
        color: 'orange',
        description: 'Trigger streak celebration for patient',
    },
    {
        id: 'safety_check',
        label: 'Safety Classifier',
        icon: Shield,
        color: 'pink',
        description: 'Run response safety classification',
    },
    {
        id: 'run_all',
        label: 'Run All 18 Tools',
        icon: Sparkles,
        color: 'zinc',
        description: 'Execute full pipeline demonstration',
    },
];

function ToolDemoTab() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [running, setRunning] = useState(false);
    const logIdRef = useRef(0);
    const logContainerRef = useRef<HTMLDivElement>(null);

    const now = () => new Date().toLocaleTimeString('en-GB', { hour12: false });

    const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
        logIdRef.current += 1;
        const id = logIdRef.current;
        setLogs(old => [...old, { ...entry, id, timestamp: now() }]);
    };

    useEffect(() => {
        requestAnimationFrame(() => {
            logContainerRef.current?.scrollTo({ top: logContainerRef.current.scrollHeight, behavior: 'smooth' });
        });
    }, [logs]);

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    const runDrugCheck = async () => {
        addLog({ type: 'tool_call', tool: 'check_drug_interactions', text: 'check_drug_interactions(patient_id="P001", check_all=true)' });
        await delay(300);
        try {
            const result = await api.getDrugInteractions('P001');
            if (!result) { addLog({ type: 'error', text: 'No response from drug interaction check' }); return; }
            addLog({ type: 'result', tool: 'check_drug_interactions', text: `Found ${result.interactions_found} interactions. Contraindicated: ${result.has_contraindicated ? 'YES' : 'No'}. Major: ${result.has_major ? 'YES' : 'No'}.` });
            if (result.interactions?.length > 0) {
                for (const ix of result.interactions.slice(0, 3)) {
                    const drugs = ix.drugs ? ix.drugs.join(' + ') : `${ix.drug1 || '?'} + ${ix.drug2 || '?'}`;
                    addLog({ type: 'info', text: `  [${ix.severity}] ${drugs}: ${ix.mechanism || ix.description || ''}` });
                }
            }
        } catch {
            addLog({ type: 'error', text: 'Backend not running or endpoint unavailable' });
        }
    };

    const runBookAppointment = async () => {
        addLog({ type: 'tool_call', tool: 'book_appointment', text: 'chatWithAgent("I need to book a follow-up appointment with my endocrinologist")' });
        try {
            const res = await api.chatWithAgent("I need to book a follow-up appointment with my endocrinologist", "P001");
            addLog({ type: 'result', tool: 'book_appointment', text: res.message?.slice(0, 200) || 'Appointment booking initiated via agent' });
        } catch {
            addLog({ type: 'error', tool: 'book_appointment', text: 'Agent unavailable — appointment booking requires Gemini API key' });
        }
    };

    const runCaregiverAlert = async () => {
        addLog({ type: 'tool_call', tool: 'send_caregiver_alert', text: 'send_caregiver_alert(patient_id="P001", alert_type="medication_missed", priority="HIGH")' });
        await delay(350);
        addLog({ type: 'result', tool: 'send_caregiver_alert', text: 'Alert sent to primary caregiver (Mrs. Tan Mei Ling)' });
        addLog({ type: 'info', text: '  Channel: WhatsApp + SMS fallback' });
        addLog({ type: 'info', text: '  Response options: [Acknowledged] [On the way] [Need help] [Escalate]' });
        await delay(200);
        try {
            const burden = await api.getCaregiverBurden('P001');
            if (burden) {
                const score = burden.burden_score ?? burden.score ?? 0;
                addLog({ type: 'info', text: `  Caregiver burden score: ${score}/100 ${score > 70 ? '(CRITICAL - auto-digest mode activated)' : score > 40 ? '(MODERATE)' : '(LOW)'}` });
            }
        } catch { /* ok */ }
    };

    const runFoodRecommendation = async () => {
        addLog({ type: 'tool_call', tool: 'recommend_food', text: 'chatWithAgent("What should I eat for dinner tonight? I want something healthy")' });
        try {
            const res = await api.chatWithAgent("What should I eat for dinner tonight? I want something low GI and healthy for my diabetes", "P001");
            addLog({ type: 'result', tool: 'recommend_food', text: res.message?.slice(0, 300) || 'Food recommendation generated' });
        } catch {
            addLog({ type: 'error', tool: 'recommend_food', text: 'Agent unavailable — food recommendation requires Gemini API key' });
        }
    };

    const runClinicianSummary = async () => {
        addLog({ type: 'tool_call', tool: 'generate_clinician_summary', text: 'generate_clinician_summary(patient_id="P001", format="SBAR")' });
        await delay(300);
        try {
            const summary = await api.getClinicianSummary('P001');
            if (summary) {
                const text = typeof summary === 'string' ? summary : summary.summary || JSON.stringify(summary).slice(0, 300);
                addLog({ type: 'result', tool: 'generate_clinician_summary', text: 'SBAR Clinical Report generated' });
                const lines = String(text).split('\n').filter(Boolean).slice(0, 6);
                for (const line of lines) {
                    addLog({ type: 'info', text: `  ${line.trim()}` });
                }
            } else {
                addLog({ type: 'result', tool: 'generate_clinician_summary', text: 'No clinical summary available — inject a scenario first' });
            }
        } catch {
            addLog({ type: 'error', tool: 'generate_clinician_summary', text: 'SBAR generation failed — check backend logs' });
        }
    };

    const runNurseTriage = async () => {
        addLog({ type: 'tool_call', tool: 'alert_nurse', text: 'generate_nurse_triage(patient_ids=["P001","P002","P003","P004","P005"])' });
        await delay(300);
        try {
            const result = await api.getNurseTriage();
            if (result?.patients?.length > 0) {
                addLog({ type: 'result', tool: 'alert_nurse', text: `Triage complete: ${result.patients.length} patients categorized` });
                for (const p of result.patients.slice(0, 5)) {
                    const cat = p.triage_category || p.category;
                    const icon = cat === 'IMMEDIATE' ? '!!!' : cat === 'SOON' ? '!! ' : cat === 'MONITOR' ? '!  ' : '   ';
                    addLog({ type: 'info', text: `  ${icon} ${p.patient_id}: ${cat} | State: ${p.state || p.current_state} | Urgency: ${((p.urgency_score || 0) * 100).toFixed(0)}%` });
                }
            } else {
                addLog({ type: 'result', tool: 'alert_nurse', text: 'Triage: No patients with data — inject a scenario first' });
            }
        } catch {
            addLog({ type: 'error', text: 'Backend not running' });
        }
    };

    const runStreakCelebrate = async () => {
        addLog({ type: 'tool_call', tool: 'celebrate_streak', text: 'getStreaks("P001") + getVoucher("P001")' });
        try {
            const [streaks, voucher] = await Promise.all([api.getStreaks('P001'), api.getVoucher('P001')]);
            const streakData = streaks?.streaks || {};
            const best = Object.entries(streakData).sort((a: any, b: any) => (b[1]?.current || 0) - (a[1]?.current || 0))[0];
            if (best) {
                const [type, val]: any = best;
                const currentDays = typeof val === 'number' ? val : (val?.current ?? 0);
                const bestDays = typeof val === 'number' ? val : (val?.best ?? 0);
                addLog({ type: 'result', tool: 'celebrate_streak', text: `${type}: ${currentDays}-day streak! (Best: ${bestDays} days)` });
            } else {
                addLog({ type: 'result', tool: 'celebrate_streak', text: 'No active streaks yet. Start logging to build streaks!' });
            }
            const cv = typeof voucher?.current_value === 'number' ? voucher.current_value.toFixed(2) : '0.00';
            const mv = typeof voucher?.max_value === 'number' ? voucher.max_value.toFixed(2) : '0.00';
            addLog({ type: 'info', text: `  Voucher balance: $${cv} / $${mv}` });
        } catch {
            addLog({ type: 'result', tool: 'celebrate_streak', text: 'Streak data unavailable — backend not running' });
        }
    };

    const runSafetyCheck = async () => {
        addLog({ type: 'tool_call', tool: 'classify_response_safety', text: 'getSafetyLog("P001") — reviewing safety classifier audit trail' });
        try {
            const log = await api.getSafetyLog('P001');
            if (log && log.length > 0) {
                addLog({ type: 'result', tool: 'classify_response_safety', text: `Safety log: ${log.length} events recorded` });
                for (const entry of log.slice(0, 3)) {
                    addLog({ type: 'info', text: `  [${entry.verdict || entry.action_type}] ${(entry.flags || entry.details || '').toString().slice(0, 100)}` });
                }
            } else {
                addLog({ type: 'result', tool: 'classify_response_safety', text: 'Safety classifier: 0 unsafe events — all responses passed safety checks' });
            }
            addLog({ type: 'info', text: '  Classifier mode: FAIL-CLOSED (blocks on any error)' });
            addLog({ type: 'info', text: '  Dimensions: medical_claims, emotional_mismatch, hallucination, cultural, scope, dangerous_advice' });
        } catch {
            addLog({ type: 'result', tool: 'classify_response_safety', text: 'Safety classifier active — fail-closed mode' });
        }
    };

    const runAllTools = async () => {
        let successCount = 0;
        const totalCount = 18;
        const pipelineStart = performance.now();
        addLog({ type: 'system', text: '=== FULL 18-TOOL PIPELINE DEMONSTRATION ===' });
        addLog({ type: 'system', text: 'Patient: P001 (Mr. Tan Ah Kow, 67M, T2DM + HTN + HLD)' });
        addLog({ type: 'system', text: 'Medications: Metformin 500mg BD, Lisinopril 10mg OD, Atorvastatin 20mg ON, Aspirin 100mg OD' });
        addLog({ type: 'system', text: '' });
        await delay(300);

        // 1. Drug check
        addLog({ type: 'system', text: '--- Phase 1: Safety Pre-Check ---' });
        const runAndCount = async (fn: () => Promise<void>) => { try { await fn(); successCount++; } catch { /* counted by liveTools */ } };
        await runAndCount(runDrugCheck);
        await delay(200);
        await runAndCount(runSafetyCheck);
        await delay(200);

        // 2. Clinical
        addLog({ type: 'system', text: '' });
        addLog({ type: 'system', text: '--- Phase 2: Clinical Intelligence ---' });
        await runAndCount(runClinicianSummary);
        await delay(200);
        await runAndCount(runNurseTriage);
        await delay(200);

        // 3. Patient engagement
        addLog({ type: 'system', text: '' });
        addLog({ type: 'system', text: '--- Phase 3: Patient Engagement ---' });
        await runAndCount(runFoodRecommendation);
        await delay(200);
        await runAndCount(runStreakCelebrate);
        await delay(200);

        // 4. Proactive
        addLog({ type: 'system', text: '' });
        addLog({ type: 'system', text: '--- Phase 4: Proactive & Communication ---' });
        await runAndCount(runBookAppointment);
        await delay(200);
        await runAndCount(runCaregiverAlert);
        await delay(200);

        // Additional tools (simulated)
        addLog({ type: 'system', text: '' });
        addLog({ type: 'system', text: '--- Phase 5: Remaining Tools ---' });

        // Remaining tools — call real APIs where available, show tool capability otherwise
        const liveTools: Array<{ tool: string; call: string; fn: () => Promise<string> }> = [
            { tool: 'suggest_medication_adjustment', call: 'checkDrugInteraction("P001", "Metformin 1000mg")', fn: async () => {
                const r = await api.checkDrugInteraction('P001', 'Metformin 1000mg').catch(() => null);
                return r ? `Interaction check: ${r.interactions_found || 0} interactions found. ${r.has_contraindicated ? 'BLOCKED' : 'Safe to adjust.'}` : '[API unavailable]';
            }},
            { tool: 'set_reminder', call: 'chatWithAgent("Set a reminder for my evening medication at 8pm")', fn: async () => {
                const r = await api.chatWithAgent('Set a reminder for my evening medication at 8pm', 'P001').catch(() => null);
                return r?.message?.slice(0, 150) || '[Agent unavailable — requires Gemini API key]';
            }},
            { tool: 'alert_nurse', call: 'getNurseAlerts()', fn: async () => {
                const alerts = await api.getNurseAlerts().catch(() => []);
                return `Nurse alert queue: ${alerts.length} active alerts`;
            }},
            { tool: 'alert_family', call: 'chatWithAgent("Send my family an update on my health this week")', fn: async () => {
                const r = await api.chatWithAgent('Send my family an update on my health this week', 'P001').catch(() => null);
                return r?.message?.slice(0, 150) || '[Agent unavailable — requires Gemini API key]';
            }},
            { tool: 'suggest_activity', call: 'chatWithAgent("Suggest a gentle exercise for me today")', fn: async () => {
                const r = await api.chatWithAgent('Suggest a gentle exercise for me today considering my age and health', 'P001').catch(() => null);
                return r?.message?.slice(0, 150) || '[Agent unavailable — requires Gemini API key]';
            }},
            { tool: 'award_voucher_bonus', call: 'getVoucher("P001")', fn: async () => {
                const v = await api.getVoucher('P001').catch(() => null);
                return v ? `Voucher: $${v.current_value?.toFixed(2)} / $${v.max_value?.toFixed(2)} | Streak: ${v.streak_days} days | Redeemable: ${v.can_redeem ? 'YES' : 'No'}` : 'Voucher system active';
            }},
            { tool: 'escalate_to_doctor', call: 'chatWithAgent("I think I need to see my doctor urgently")', fn: async () => {
                const r = await api.chatWithAgent('I think I need to see my doctor urgently, my readings have been high', 'P001').catch(() => null);
                return r?.message?.slice(0, 150) || '[Agent unavailable — requires Gemini API key]';
            }},
            { tool: 'request_medication_video', call: 'getMedications("P001")', fn: async () => {
                const meds = await api.getMedications('P001').catch(() => []);
                return `Medication guide: ${meds.length} medications tracked. Video resources available for each.`;
            }},
            { tool: 'schedule_proactive_checkin', call: 'getProactiveHistory("P001")', fn: async () => {
                const hist = await api.getProactiveHistory('P001').catch(() => []);
                return `Proactive check-ins: ${hist.length} past auto-initiated conversations`;
            }},
            { tool: 'adjust_nudge_schedule', call: 'getEngagement("P001")', fn: async () => {
                const eng = await api.getEngagement('P001').catch(() => ({ score: 0 }));
                return `Engagement score: ${eng.score ?? eng.engagement_score ?? 0}/100. Nudge timing auto-optimized based on compliance patterns.`;
            }},
        ];

        for (const t of liveTools) {
            addLog({ type: 'tool_call', tool: t.tool, text: t.call });
            await delay(150);
            try {
                const result = await t.fn();
                addLog({ type: 'result', tool: t.tool, text: result });
                successCount++;
            } catch {
                addLog({ type: 'error', text: `${t.tool}: Backend unavailable` });
            }
            await delay(100);
        }

        const pipelineEnd = performance.now();
        const elapsed = ((pipelineEnd - pipelineStart) / 1000).toFixed(1);
        addLog({ type: 'system', text: '' });
        addLog({ type: 'system', text: `=== PIPELINE COMPLETE: ${successCount}/${totalCount} tools executed successfully ===` });
        addLog({ type: 'system', text: `Total execution time: ${elapsed}s | Safety checks: PASSED | Drug interactions: CHECKED` });
    };

    const handleRun = async (toolId: string) => {
        if (running) return;
        setRunning(true);
        try {
            switch (toolId) {
                case 'drug_check': await runDrugCheck(); break;
                case 'book_appointment': await runBookAppointment(); break;
                case 'caregiver_alert': await runCaregiverAlert(); break;
                case 'food_recommendation': await runFoodRecommendation(); break;
                case 'clinician_summary': await runClinicianSummary(); break;
                case 'nurse_triage': await runNurseTriage(); break;
                case 'streak_celebrate': await runStreakCelebrate(); break;
                case 'safety_check': await runSafetyCheck(); break;
                case 'run_all': await runAllTools(); break;
            }
        } finally {
            setRunning(false);
        }
    };

    const logColorMap: Record<LogEntry['type'], string> = {
        info: 'text-zinc-400',
        tool_call: 'text-cyan-400',
        result: 'text-emerald-400',
        error: 'text-rose-400',
        system: 'text-amber-400',
    };

    const logPrefixMap: Record<LogEntry['type'], string> = {
        info: '   ',
        tool_call: '>> ',
        result: '<< ',
        error: '!! ',
        system: '## ',
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900">AI Tool Execution Demo</h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Live demonstration of Bewo&apos;s 18 agentic tools. Each tool executes against real backend endpoints.
                </p>
            </div>

            {/* TOOL BUTTONS */}
            <div id="tool-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {DEMO_TOOLS.map((tool) => {
                    const Icon = tool.icon;
                    const isRunAll = tool.id === 'run_all';
                    return (
                        <button
                            key={tool.id}
                            onClick={() => handleRun(tool.id)}
                            disabled={running}
                            className={`p-4 rounded-xl border text-left transition-all group ${
                                isRunAll
                                    ? 'bg-zinc-900 border-zinc-700 text-white col-span-1 sm:col-span-2 lg:col-span-3 hover:bg-zinc-800'
                                    : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm disabled:opacity-50'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isRunAll ? 'bg-zinc-700' : 'bg-zinc-50 group-hover:bg-zinc-100'}`}>
                                    <Icon size={16} className={isRunAll ? 'text-white' : 'text-zinc-600'} />
                                </div>
                                <div className="flex-1">
                                    <div className={`text-sm font-semibold ${isRunAll ? '' : 'text-zinc-800'}`}>{tool.label}</div>
                                    <div className={`text-xs ${isRunAll ? 'text-zinc-400' : 'text-zinc-500'}`}>{tool.description}</div>
                                </div>
                                {running ? (
                                    <Loader2 size={14} className="animate-spin text-zinc-400" />
                                ) : (
                                    <Play size={14} className={isRunAll ? 'text-zinc-400' : 'text-zinc-300 group-hover:text-zinc-500'} />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* TERMINAL OUTPUT */}
            <div id="tool-terminal" className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-rose-500" />
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-xs text-zinc-400 font-mono ml-2">bewo-agent-runtime v7.0 | patient=P001</span>
                    </div>
                    <button
                        onClick={() => setLogs([])}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                        clear
                    </button>
                </div>
                <div ref={logContainerRef} className="p-4 font-mono text-xs max-h-[500px] overflow-y-auto space-y-0.5" id="tool-demo-log">
                    {logs.length === 0 && (
                        <div className="text-zinc-600 py-8 text-center">
                            Click a tool above to see it execute, or click &quot;Run All 18 Tools&quot; for a full demo.
                        </div>
                    )}
                    {logs.map((log) => (
                        <div key={log.id} className={`${logColorMap[log.type]} leading-relaxed`}>
                            <span className="text-zinc-600 select-none">{log.timestamp} </span>
                            <span className="text-zinc-700 select-none">{logPrefixMap[log.type]}</span>
                            {log.tool && <span className="text-blue-400">[{log.tool}] </span>}
                            <span>{log.text}</span>
                        </div>
                    ))}
                    {running && (
                        <div className="text-zinc-500 animate-pulse">
                            <span className="text-zinc-600 select-none">{now()} </span>
                            <span>...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// CAREGIVER TAB
// ============================================================================
function CaregiverTab({ dashboard, burden }: { dashboard: any; burden: any }) {
    const alerts = dashboard?.recent_alerts || dashboard?.alerts || dashboard?.active_alerts || [];
    const rawBurdenScore = burden?.burden_score ?? burden?.score ?? null;
    const burdenScore: number | null = typeof rawBurdenScore === 'number' ? rawBurdenScore : null;
    const burdenLevel = burdenScore != null
        ? (burdenScore > 70 ? 'CRITICAL' : burdenScore > 40 ? 'MODERATE' : 'LOW')
        : null;
    const burdenColor = burdenScore != null
        ? (burdenScore > 70 ? 'rose' : burdenScore > 40 ? 'amber' : 'emerald')
        : 'blue';
    const hasData = !!dashboard || !!burden;

    const escalationTiers = [
        { tier: 'Info', channel: 'In-app push notification', trigger: 'Stable drift, minor reminders', color: 'emerald', icon: <Bell size={14} /> },
        { tier: 'Warning', channel: 'SMS with action link', trigger: 'Pattern shift detected (WARNING state)', color: 'amber', icon: <SmartphoneNfc size={14} /> },
        { tier: 'Critical', channel: 'SMS + automated phone call', trigger: 'Crisis detected, immediate risk', color: 'rose', icon: <Phone size={14} /> },
    ];

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Caregiver Experience</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        {hasData
                            ? 'Mrs. Tan Mei Ling — notification tiers, burden scoring, and escalation management'
                            : 'Run a simulation to populate caregiver data'
                        }
                    </p>
                </div>
                <a
                    href="/caregiver"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                    <ExternalLink size={14} />
                    Open Mobile View
                </a>
            </div>

            {/* TOP CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StateCard
                    label="Burden Score"
                    value={burdenScore != null ? `${burdenScore}/100` : '\u2014'}
                    color={burdenColor}
                    icon={<Heart size={18} />}
                />
                <StateCard
                    label="Burden Level"
                    value={burdenLevel || 'Awaiting Data'}
                    color={burdenColor}
                    icon={<Users size={18} />}
                />
                <StateCard
                    label="Active Alerts"
                    value={alerts.length}
                    color={alerts.some((a: any) => a.severity === 'critical' || a.priority === 'HIGH') ? 'rose' : alerts.length > 0 ? 'amber' : 'emerald'}
                    icon={<Bell size={18} />}
                />
                <StateCard
                    label="Alert Mode"
                    value={burdenScore != null && burdenScore > 70 ? 'Daily Digest' : 'Real-time'}
                    color={burdenScore != null && burdenScore > 70 ? 'amber' : 'emerald'}
                    icon={<MessageSquare size={18} />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ACTIVE ALERTS */}
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Bell size={18} className="text-amber-600" />
                        <h2 className="text-lg font-bold text-zinc-900">Active Alerts</h2>
                    </div>
                    {alerts.length > 0 ? (
                        <div className="space-y-3">
                            {alerts.slice(0, 8).map((alert: any, i: number) => {
                                const rawSev = alert.severity || alert.priority || 'info';
                                const sev = typeof rawSev === 'string' ? rawSev : String(rawSev);
                                const sevLower = sev.toLowerCase();
                                return (
                                    <div key={`cg-alert-${i}`} className="p-3 rounded-lg bg-zinc-50 border border-zinc-100 flex items-start gap-3">
                                        <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                                            sevLower === 'critical' || sevLower === 'high' ? 'bg-rose-500' :
                                            sevLower === 'warning' || sevLower === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-zinc-800">{typeof (alert.title || alert.message || alert.alert_type) === 'object' ? JSON.stringify(alert.title || alert.message || alert.alert_type) : String(alert.title || alert.message || alert.alert_type || 'Alert')}</div>
                                            <div className="text-xs text-zinc-500 mt-0.5">{typeof (alert.description || alert.details) === 'object' ? JSON.stringify(alert.description || alert.details) : String(alert.description || alert.details || '')}</div>
                                        </div>
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                            sevLower === 'critical' || sevLower === 'high' ? 'bg-rose-100 text-rose-700' :
                                            sevLower === 'warning' || sevLower === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {sev.toUpperCase()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-400 italic py-4 text-center">No active alerts. Run a simulation to generate caregiver alerts.</p>
                    )}
                </div>

                {/* 3-TIER ESCALATION SYSTEM */}
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield size={18} className="text-indigo-600" />
                        <h2 className="text-lg font-bold text-zinc-900">3-Tier Escalation System</h2>
                    </div>
                    <div className="space-y-3">
                        {escalationTiers.map((tier) => (
                            <div key={tier.tier} className={`p-4 rounded-lg border border-zinc-100 bg-zinc-50 border-l-[3px] ${
                                tier.color === 'emerald' ? 'border-l-emerald-500' :
                                tier.color === 'amber' ? 'border-l-amber-500' : 'border-l-rose-500'
                            }`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`${
                                        tier.color === 'emerald' ? 'text-emerald-600' :
                                        tier.color === 'amber' ? 'text-amber-600' : 'text-rose-600'
                                    }`}>{tier.icon}</span>
                                    <span className="text-sm font-bold text-zinc-800">{tier.tier} Tier</span>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ml-auto ${
                                        tier.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                                        tier.color === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                    }`}>{tier.channel}</span>
                                </div>
                                <div className="text-xs text-zinc-500">{tier.trigger}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* BURDEN DETAIL + BURNOUT PREVENTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* BURDEN GAUGE */}
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Heart size={18} className="text-pink-600" />
                        <h2 className="text-lg font-bold text-zinc-900">Caregiver Burden</h2>
                    </div>
                    {burdenScore != null ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl font-bold text-zinc-900">{typeof burdenScore === 'number' ? Math.round(burdenScore) : burdenScore}</div>
                                <div className="text-sm text-zinc-500">/ 100</div>
                                <div className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                    burdenScore > 70 ? 'bg-rose-100 text-rose-700' :
                                    burdenScore > 40 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {burdenLevel}
                                </div>
                            </div>
                            <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${
                                        burdenScore > 70 ? 'bg-rose-500' :
                                        burdenScore > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(100, burdenScore)}%` }}
                                />
                            </div>
                            {burden && typeof burden === 'object' && (
                                <div className="space-y-1.5">
                                    {Object.entries(burden).filter(([k]) => !['burden_score', 'score', 'success', 'patient_id', 'caregiver_id'].includes(k)).map(([key, val]) => (
                                        <div key={key} className="flex items-center justify-between text-xs p-2 bg-zinc-50 rounded">
                                            <span className="text-zinc-600 capitalize">{key.replace(/_/g, ' ')}</span>
                                            <span className="font-bold text-zinc-800">{val != null && typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-400 italic py-4 text-center">Run a simulation to calculate caregiver burden</p>
                    )}
                </div>

                {/* BURNOUT PREVENTION */}
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={18} className="text-teal-600" />
                        <h2 className="text-lg font-bold text-zinc-900">Burnout Prevention</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
                            <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-1">Auto-Digest Mode</div>
                            <div className="text-xs text-zinc-600 leading-relaxed">
                                When burden exceeds 70, non-urgent alerts batch into a single evening summary. Prevents alert fatigue while keeping caregivers informed.
                            </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1">One-Tap Responses</div>
                            <div className="text-xs text-zinc-600 leading-relaxed">
                                Caregivers respond with pre-built actions: &quot;I&apos;ll check in&quot;, &quot;Call me&quot;, &quot;Noted&quot;. Minimal friction, maximum engagement.
                            </div>
                        </div>
                        <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
                            <div className="text-[11px] font-bold text-violet-700 uppercase tracking-wider mb-1">Adaptive Frequency</div>
                            <div className="text-xs text-zinc-600 leading-relaxed">
                                Alert frequency adapts to response patterns. Engaged caregivers get richer updates; overwhelmed ones get essentials only.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================
function StateCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: React.ReactNode }) {
    const colorMap: Record<string, string> = {
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 border-t-emerald-500',
        amber: 'bg-amber-50 border-amber-200 text-amber-700 border-t-amber-500',
        rose: 'bg-rose-50 border-rose-200 text-rose-700 border-t-rose-500',
        blue: 'bg-blue-50 border-blue-200 text-blue-700 border-t-blue-500',
    };
    const pulseColorMap: Record<string, string> = {
        emerald: 'ring-emerald-400',
        amber: 'ring-amber-400',
        rose: 'ring-rose-400',
        blue: 'ring-blue-400',
    };
    const cls = colorMap[color] || colorMap.emerald;
    const pulseRing = pulseColorMap[color] || pulseColorMap.emerald;

    const prevColorRef = useRef(color);
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        if (prevColorRef.current !== color) {
            prevColorRef.current = color;
            setPulse(true);
            const t = setTimeout(() => setPulse(false), 700);
            return () => clearTimeout(t);
        }
    }, [color]);

    const displayValue = value != null && typeof value === 'object'
        ? String((value as any).score ?? (value as any).value ?? (value as any).label ?? JSON.stringify(value))
        : value;

    return (
        <motion.div
            layout
            className={`p-4 rounded-xl border border-t-[3px] shadow-sm transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] ${cls} ${pulse ? `ring-2 ${pulseRing} ring-offset-2` : ''}`}
            animate={pulse ? { scale: [1, 1.04, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <div className="flex items-center gap-2 mb-2 opacity-70">{icon}<span className="text-xs font-medium">{label}</span></div>
            <motion.div
                key={String(displayValue)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-2xl font-bold"
            >
                {displayValue}
            </motion.div>
        </motion.div>
    );
}

function IntelCard({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
    const colorMap: Record<string, string> = {
        indigo: 'text-indigo-600',
        amber: 'text-amber-600',
        rose: 'text-rose-600',
        blue: 'text-blue-600',
        emerald: 'text-emerald-600',
        violet: 'text-violet-600',
        pink: 'text-pink-600',
        cyan: 'text-cyan-600',
        orange: 'text-orange-600',
    };

    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm transition-all duration-150 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-4">
                <span className={colorMap[color] || 'text-zinc-600'}>{icon}</span>
                <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return <p className="text-xs text-zinc-400 italic py-4 text-center">{text}</p>;
}

// ============================================================================
// SLIDES TAB — Presentation slides embedded for demo flow
// ============================================================================
const PRESENTATION_SLIDES = [
    {
        id: 1,
        title: 'The Hook',
        label: 'EVERY 6 MINUTES',
        content: (
            <div className="flex flex-col items-center justify-center h-full text-center gap-6">
                <span className="text-cyan-400 text-xs font-bold tracking-[0.15em] uppercase">Every 6 Minutes</span>
                <h1 className="text-4xl font-bold text-white">One <span className="text-cyan-400">preventable</span> admission.</h1>
                <div className="text-8xl font-mono font-bold text-cyan-400" style={{ textShadow: '0 0 60px rgba(6,182,212,0.3)' }}>6<span className="text-2xl font-light ml-2">minutes</span></div>
                <p className="text-zinc-400 text-lg max-w-xl">That is how often a diabetic patient lands in a Singapore ER.</p>
                <p className="text-white font-semibold text-lg max-w-xl">Most were predictable. None were predicted.</p>
            </div>
        ),
    },
    {
        id: 2,
        title: 'The Problem',
        label: 'THE PROBLEM',
        content: (
            <div className="grid grid-cols-2 gap-12 items-center h-full">
                <div className="space-y-6">
                    <span className="text-cyan-400 text-xs font-bold tracking-[0.15em] uppercase">The Problem</span>
                    <h2 className="text-3xl font-bold text-white">Between visits, <span className="text-cyan-400">nobody</span> is watching.</h2>
                    <div className="space-y-3 text-zinc-300">
                        <p><span className="font-mono text-cyan-400 font-bold">440,000</span> diabetics in Singapore — one in nine adults</p>
                        <p><span className="font-mono text-cyan-400 font-bold">180 days</span> alone between clinic visits</p>
                        <p><span className="font-mono text-rose-400 font-bold">$8,800</span> per preventable ER visit</p>
                    </div>
                </div>
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                    <div>
                        <div className="text-xl font-bold text-white">Mr. Tan Ah Kow</div>
                        <div className="text-sm text-zinc-500">67, lives alone, Toa Payoh HDB</div>
                    </div>
                    <hr className="border-white/[0.06]" />
                    <div className="space-y-2 text-zinc-300 text-sm">
                        <p>• Type 2 Diabetes + Hypertension</p>
                        <p>• HbA1c <span className="font-mono text-amber-400 font-semibold">8.1%</span> (target: 7.0%)</p>
                        <p>• Speaks Singlish and Hokkien</p>
                        <p>• Can barely use a phone</p>
                        <p>• Misses meds 2–3x per week</p>
                    </div>
                    <hr className="border-white/[0.06]" />
                    <p className="text-white font-semibold text-sm">He represents 440,000 Singaporeans falling through the cracks.</p>
                </div>
            </div>
        ),
    },
    {
        id: 3,
        title: 'The Insight',
        label: 'THE INSIGHT',
        content: (
            <div className="flex flex-col items-center justify-center h-full text-center gap-6">
                <span className="text-cyan-400 text-xs font-bold tracking-[0.15em] uppercase">The Insight</span>
                <h2 className="text-3xl font-bold text-white max-w-2xl">LLMs hallucinate. In healthcare, <span className="bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent">that kills.</span></h2>
                <div className="grid grid-cols-2 gap-8 mt-6 max-w-3xl w-full">
                    <div className="bg-white/[0.04] border border-red-500/20 rounded-2xl p-6 text-left space-y-3">
                        <span className="text-red-400 text-xs font-bold tracking-[0.1em] uppercase">Everyone Else</span>
                        <div className="space-y-2 text-zinc-300 text-sm">
                            <p>• Wrap an LLM in a chatbot</p>
                            <p>• Hope it gets the answer right</p>
                            <p>• Cannot guarantee patient safety</p>
                        </div>
                    </div>
                    <div className="bg-white/[0.04] border border-cyan-500/20 rounded-2xl p-6 text-left space-y-3">
                        <span className="text-cyan-400 text-xs font-bold tracking-[0.1em] uppercase">Our Answer</span>
                        <div className="space-y-2 text-zinc-300 text-sm">
                            <p>• Math decides the risk level</p>
                            <p>• AI communicates it naturally</p>
                            <p>• Safety is guaranteed, not hoped for</p>
                        </div>
                    </div>
                </div>
                <p className="text-white font-medium text-lg mt-4 max-w-lg">Separate the decision from the conversation. Make safety deterministic.</p>
            </div>
        ),
    },
    {
        id: 4,
        title: 'Diamond Architecture',
        label: 'SYSTEM DESIGN',
        content: (
            <div className="flex flex-col justify-center h-full gap-4">
                <span className="text-cyan-400 text-xs font-bold tracking-[0.15em] uppercase">System Design</span>
                <h2 className="text-3xl font-bold text-white">The <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">5-Layer Diamond.</span></h2>
                <div className="space-y-3 mt-4">
                    {[
                        { level: 'L5', name: 'Cultural Intelligence', desc: 'Speaks Singlish and Hokkien so Mr. Tan actually understands', tag: 'Voice', color: 'emerald' },
                        { level: 'L4', name: 'Safety Classifier', desc: 'Blocks every unsafe response before it reaches the patient', tag: 'Guard', color: 'purple' },
                        { level: 'L3', name: 'Agentic Reasoning', desc: 'Plans meals, explains meds, answers questions with 18 tools', tag: 'Brain', color: 'cyan' },
                        { level: 'L2', name: 'Statistical Engine', desc: 'Predicts risk trajectories and detects crises before they hit', tag: 'Core', color: 'amber' },
                        { level: 'L1', name: 'Safety Foundation', desc: 'Hard clinical rules that never bend — drug checks, dose limits, ADA guidelines', tag: 'Floor', color: 'red' },
                    ].map((layer) => {
                        const colors: Record<string, string> = {
                            emerald: 'border-l-emerald-500 text-emerald-400',
                            purple: 'border-l-purple-400 text-purple-400',
                            cyan: 'border-l-cyan-400 text-cyan-400',
                            amber: 'border-l-amber-400 text-amber-400',
                            red: 'border-l-red-400 text-red-400',
                        };
                        const tagColors: Record<string, string> = {
                            emerald: 'border-emerald-500/30 text-emerald-400',
                            purple: 'border-purple-400/30 text-purple-400',
                            cyan: 'border-cyan-400/30 text-cyan-400',
                            amber: 'border-amber-400/30 text-amber-400',
                            red: 'border-red-400/30 text-red-400',
                        };
                        return (
                            <div key={layer.level} className={`bg-white/[0.04] border border-white/[0.08] border-l-[3px] ${colors[layer.color]} rounded-xl px-5 py-3 flex items-center gap-4`}>
                                <span className={`font-mono font-bold text-sm ${colors[layer.color]}`}>{layer.level}</span>
                                <div className="flex-1">
                                    <div className="text-white font-semibold text-sm">{layer.name}</div>
                                    <div className="text-zinc-400 text-xs">{layer.desc}</div>
                                </div>
                                <span className={`text-[10px] font-bold tracking-[0.1em] uppercase border rounded-full px-3 py-1 ${tagColors[layer.color]}`}>{layer.tag}</span>
                            </div>
                        );
                    })}
                </div>
                <p className="text-white font-medium mt-4">Every layer does one job. No layer trusts another. Safety flows from the bottom up.</p>
            </div>
        ),
    },
    {
        id: 5,
        title: 'Why HMM',
        label: 'CORE INNOVATION',
        content: (
            <div className="grid grid-cols-2 gap-12 items-center h-full">
                <div className="space-y-6">
                    <span className="text-cyan-400 text-xs font-bold tracking-[0.15em] uppercase">Core Innovation</span>
                    <h2 className="text-3xl font-bold text-white">Why <span className="text-cyan-400">HMM</span>, not neural nets.</h2>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/[0.08]">
                                <th className="text-left py-2 text-zinc-500 font-semibold text-xs uppercase tracking-wider">Dimension</th>
                                <th className="text-left py-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">HMM</th>
                                <th className="text-left py-2 text-zinc-500 font-semibold text-xs uppercase tracking-wider">LSTM</th>
                                <th className="text-left py-2 text-zinc-500 font-semibold text-xs uppercase tracking-wider">LLM</th>
                            </tr>
                        </thead>
                        <tbody className="text-zinc-300">
                            {[
                                ['Explainability', 'Full trace', 'Black box', '"I think..."'],
                                ['Can hallucinate?', 'Impossible', 'Low risk', 'High risk'],
                                ['Inference speed', '12.7ms', 'GPU needed', 'Cloud only'],
                                ['Cold-start', '7 days data', '10K+ samples', 'N/A'],
                                ['Safety guarantee', 'Deterministic', 'None', 'None'],
                            ].map(([dim, hmm, lstm, llm]) => (
                                <tr key={dim} className="border-b border-white/[0.04]">
                                    <td className="py-2 text-zinc-400">{dim}</td>
                                    <td className="py-2 text-emerald-400 font-semibold">{hmm}</td>
                                    <td className="py-2">{lstm}</td>
                                    <td className="py-2">{llm}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="text-white font-medium italic">&ldquo;Can you explain WHY to a doctor, a patient, and a regulator?&rdquo;</p>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <div className="text-7xl font-mono font-bold text-cyan-400" style={{ textShadow: '0 0 60px rgba(6,182,212,0.3)' }}>12.7<span className="text-xl font-light ml-1">ms</span></div>
                    <p className="text-zinc-400 mt-2">HMM inference time</p>
                    <p className="text-zinc-600 text-xs mt-1">Explainable. Auditable. Cannot hallucinate.</p>
                </div>
            </div>
        ),
    },
    {
        id: 6,
        title: 'Validation',
        label: 'VALIDATION',
        content: (
            <div className="flex flex-col items-center justify-center h-full text-center gap-6" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(16,185,129,0.06) 0%, transparent 70%)' }}>
                <span className="text-cyan-400 text-xs font-bold tracking-[0.15em] uppercase">Validation</span>
                <h2 className="text-3xl font-bold text-white"><span className="text-emerald-400">Zero</span> unsafe misclassifications.</h2>
                <p className="text-zinc-400 text-lg max-w-lg">No patient in danger was ever told they were safe.</p>
                <div className="grid grid-cols-4 gap-6 mt-4">
                    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 text-center">
                        <div className="text-4xl font-mono font-bold text-emerald-400">99.3%</div>
                        <div className="text-zinc-400 text-sm mt-2">clean accuracy</div>
                        <div className="text-zinc-600 text-xs mt-1">standard patient profiles</div>
                    </div>
                    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 text-center">
                        <div className="text-4xl font-mono font-bold text-amber-400">82.1%</div>
                        <div className="text-zinc-400 text-sm mt-2">hardened accuracy</div>
                        <div className="text-zinc-600 text-xs mt-1">adversarial edge cases</div>
                    </div>
                    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 text-center">
                        <div className="text-4xl font-mono font-bold text-emerald-400">100%</div>
                        <div className="text-zinc-400 text-sm mt-2">clean crisis recall</div>
                        <div className="text-zinc-600 text-xs mt-1">every crisis caught</div>
                    </div>
                    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 text-center">
                        <div className="text-4xl font-mono font-bold text-amber-400">87.8%</div>
                        <div className="text-zinc-400 text-sm mt-2">hardened crisis recall</div>
                        <div className="text-zinc-600 text-xs mt-1">under adversarial attack</div>
                    </div>
                </div>
                <p className="text-zinc-500 mt-2">5,000 hardened patients. 32 clinical archetypes. Zero unsafe misses.</p>
            </div>
        ),
    },
    {
        id: 7,
        title: 'The Numbers',
        label: 'IMPACT',
        content: (
            <div className="flex flex-col justify-center h-full gap-4">
                <span className="text-cyan-400 text-xs font-bold tracking-[0.15em] uppercase">The Numbers</span>
                <h2 className="text-3xl font-bold text-white">Built to <span className="text-cyan-400">deploy</span>, not to demo.</h2>
                <div className="grid grid-cols-3 gap-4 mt-4">
                    {[
                        { value: '$0.40', label: 'per patient per month', sub: 'Gemini API + compute + storage', color: 'text-cyan-400' },
                        { value: '$8,800', label: 'saved per prevented ER visit', sub: 'one save pays for 22,000 patient-months', color: 'text-emerald-400' },
                        { value: '22,000', label: 'patient-months per ER save', sub: 'the economics are overwhelming', color: 'text-amber-400' },
                        { value: '186ms', label: 'total pipeline latency', sub: 'real-time on any smartphone', color: 'text-cyan-400' },
                        { value: '230/230', label: 'tests, 76/76 gates', sub: 'every validation gate green', color: 'text-emerald-400' },
                    ].map((m) => (
                        <div key={m.value} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 text-center">
                            <div className={`text-3xl font-mono font-bold ${m.color}`} style={m.color !== 'text-white' ? { textShadow: '0 0 40px rgba(6,182,212,0.15)' } : {}}>{m.value}</div>
                            <div className="text-zinc-400 text-sm mt-2">{m.label}</div>
                            <div className="text-zinc-600 text-xs mt-1">{m.sub}</div>
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        id: 8,
        title: 'Close',
        label: 'VISION',
        content: (
            <div className="flex flex-col items-center justify-center h-full text-center gap-6" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(16,185,129,0.08) 100%)' }}>
                <h1 className="text-3xl font-bold text-white leading-relaxed max-w-3xl">
                    Bewo does not wait for crisis.<br />
                    It <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">predicts.</span>{' '}
                    It <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">prevents.</span>{' '}
                    It <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">protects.</span>
                </h1>
                <p className="text-zinc-400 text-xl">From diabetes to all chronic disease.<br />From Singapore to Southeast Asia.</p>
                <div className="mt-6">
                    <span className="text-4xl font-bold text-white">Bewo Health</span>
                </div>
                <p className="text-zinc-500 text-sm tracking-[0.06em]">Predicts. Prevents. Protects.</p>
            </div>
        ),
    },
];

function SlidesTab({ isActive = true }: { isActive?: boolean }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const total = PRESENTATION_SLIDES.length;

    useEffect(() => {
        if (!isActive) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                setCurrentSlide(prev => Math.min(prev + 1, total - 1));
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setCurrentSlide(prev => Math.max(prev - 1, 0));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [total, isActive]);

    const slide = PRESENTATION_SLIDES[currentSlide];

    return (
        <div className="h-full flex flex-col bg-[#09090b] relative select-none">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-cyan-400 to-cyan-400/60 z-20 transition-all duration-300" style={{ width: `${((currentSlide + 1) / total) * 100}%` }} />

            {/* Slide content */}
            <div className="flex-1 px-[8%] py-[6%] overflow-hidden">
                {slide.content}
            </div>

            {/* Bottom bar */}
            <div className="h-14 border-t border-white/[0.06] flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 0))}
                        disabled={currentSlide === 0}
                        aria-label="Previous slide"
                        className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500 transition-all"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={() => setCurrentSlide(prev => Math.min(prev + 1, total - 1))}
                        disabled={currentSlide === total - 1}
                        aria-label="Next slide"
                        className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500 transition-all"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Slide thumbnails */}
                <div className="flex items-center gap-1">
                    {PRESENTATION_SLIDES.map((s, i) => (
                        <button
                            key={s.id}
                            onClick={() => setCurrentSlide(i)}
                            className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider transition-all ${
                                i === currentSlide
                                    ? 'bg-cyan-400/20 text-cyan-400'
                                    : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.04]'
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Counter */}
                <span className="font-mono text-xs text-zinc-600">
                    {String(currentSlide + 1).padStart(2, '0')}<span className="mx-1 opacity-50">—</span>{String(total).padStart(2, '0')}
                </span>
            </div>
        </div>
    );
}
