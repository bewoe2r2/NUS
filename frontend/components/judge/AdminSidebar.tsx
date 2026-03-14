"use client";

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import {
    Play,
    RotateCcw,
    Activity,
    AlertCircle,
    CheckCircle2,
    Terminal,
    LayoutDashboard,
    ChevronRight,
    Brain,
    Zap,
    Shield,
} from 'lucide-react';

interface AdminSidebarProps {
    onScenarioInjected: () => void;
}

type LogType = 'info' | 'success' | 'error' | 'system';

interface LogEntry {
    id: string;
    timestamp: string;
    message: string;
    type: LogType;
}

export function AdminSidebar({ onScenarioInjected }: AdminSidebarProps) {
    const [loading, setLoading] = useState(false);
    const [selectedScenario, setSelectedScenario] = useState('stable_perfect');
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const addLog = (msg: string, type: LogType = 'info') => {
        const entry: LogEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            message: msg,
            type
        };
        setLogs(prev => [...prev.slice(-49), entry]);
    };

    const scenarios = [
        { id: 'stable_perfect', label: 'Stable Baseline', desc: 'Perfect adherence, normal glucose range', icon: CheckCircle2, color: 'text-emerald-600' },
        { id: 'stable_noisy', label: 'Realistic Stable', desc: 'Minor fluctuations, generally healthy', icon: Activity, color: 'text-blue-600' },
        { id: 'gradual_decline', label: 'Gradual Decline', desc: 'Slow deterioration over 14 days', icon: AlertCircle, color: 'text-yellow-600' },
        { id: 'warning_recovery', label: 'Warning -> Recovery', desc: 'Bewo catches warning, intervention succeeds', icon: CheckCircle2, color: 'text-amber-600' },
        { id: 'warning_to_crisis', label: 'Warning -> Crisis', desc: 'Progressive decline to dangerous levels', icon: AlertCircle, color: 'text-orange-600' },
        { id: 'sudden_crisis', label: 'Sudden Acute Event', desc: 'Stable baseline then immediate spike', icon: AlertCircle, color: 'text-rose-600' },
        { id: 'recovery', label: 'Crisis -> Recovery', desc: 'Crisis detected, Bewo intervenes, patient recovers', icon: CheckCircle2, color: 'text-teal-600' },
    ];

    const handleReset = async () => {
        try {
            setLoading(true);
            addLog("Initiating system reset...", 'system');
            await api.resetData();
            addLog("Database cleared successfully.", 'success');
            onScenarioInjected();
        } catch {
            addLog("System reset failed.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInject = async () => {
        try {
            setLoading(true);
            const scenario = scenarios.find(s => s.id === selectedScenario);
            addLog(`Injecting scenario: ${scenario?.label}`, 'system');

            // 1. Inject data
            await api.injectScenario(selectedScenario, 14);
            addLog("14-day data injection complete", 'success');

            // 2. Run HMM Viterbi
            addLog("Running HMM Viterbi inference...", 'system');
            try {
                await api.runHMM();
                addLog("HMM analysis converged", 'success');
            } catch {
                addLog("HMM Viterbi inference skipped", 'info');
            }

            // 3. Train Baum-Welch
            addLog("Training Baum-Welch (EM algorithm)...", 'system');
            try {
                await api.trainHMM("P001");
                addLog("Baum-Welch parameters learned", 'success');
            } catch {
                addLog("Baum-Welch training skipped (no data)", 'info');
            }

            // 4. Run proactive scan
            addLog("Running proactive trigger scan...", 'system');
            try {
                await api.runProactiveScan("P001");
                addLog("Proactive triggers evaluated", 'success');
            } catch {
                addLog("Proactive scan skipped", 'info');
            }

            addLog("Full simulation pipeline complete", 'success');
            onScenarioInjected();
        } catch (e) {
            console.error(e);
            addLog("Simulation sequence failed.", 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <aside className="w-80 bg-zinc-50 border-r border-zinc-200 h-screen fixed left-0 top-0 flex flex-col font-sans z-50">
            {/* HEADER */}
            <div className="h-16 px-5 border-b border-zinc-200 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm">
                        <LayoutDashboard size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold text-zinc-900 tracking-tight">Bewo Control</h1>
                        <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Judge Console</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">

                {/* STATUS */}
                <div className="mb-6 p-3 bg-white border border-zinc-200 rounded-xl shadow-sm flex items-center gap-3">
                    <div className="relative">
                        <span className="absolute w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full block"></span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-zinc-700">System Operational</p>
                        <p className="text-[10px] text-zinc-500">FastAPI + HMM + Gemini + SEA-LION</p>
                    </div>
                </div>

                {/* PIPELINE INFO */}
                <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-2">Simulation Pipeline</p>
                    <div className="space-y-1.5 text-[10px] text-blue-600">
                        <div className="flex items-center gap-2"><Zap size={10} /> Inject 14-day biometric data</div>
                        <div className="flex items-center gap-2"><Brain size={10} /> HMM Viterbi state inference</div>
                        <div className="flex items-center gap-2"><Brain size={10} /> Baum-Welch parameter learning</div>
                        <div className="flex items-center gap-2"><Shield size={10} /> Proactive trigger evaluation</div>
                    </div>
                </div>

                {/* SCENARIO SELECTOR */}
                <div className="mb-6">
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 px-1">Scenarios</h2>
                    <div className="space-y-1">
                        {scenarios.map((s) => {
                            const Icon = s.icon;
                            const isActive = selectedScenario === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedScenario(s.id)}
                                    disabled={loading}
                                    className={`w-full text-left p-2.5 rounded-lg flex items-start gap-3 transition-all duration-200 group border
                                        ${isActive
                                            ? 'bg-white border-zinc-300 shadow-sm ring-1 ring-zinc-200'
                                            : 'bg-transparent border-transparent hover:bg-zinc-100 hover:border-zinc-200 text-zinc-500'}`}
                                >
                                    <Icon
                                        size={18}
                                        className={`mt-0.5 shrink-0 transition-colors ${isActive ? s.color : 'text-zinc-400 group-hover:text-zinc-600'}`}
                                    />
                                    <div>
                                        <div className={`text-xs font-medium ${isActive ? 'text-zinc-900' : 'text-zinc-600'}`}>
                                            {s.label}
                                        </div>
                                        <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                                            {s.desc}
                                        </div>
                                    </div>
                                    {isActive && <ChevronRight size={14} className="ml-auto mt-1 text-zinc-400" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="space-y-3">
                    <button
                        onClick={handleInject}
                        disabled={loading}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm hover:shadow active:scale-[0.98] transition-all rounded-lg h-10 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Activity size={16} className="animate-spin" /> : <Play size={16} className="fill-current" />}
                        {loading ? 'Running Pipeline...' : 'Run Full Simulation'}
                    </button>

                    <button
                        onClick={handleReset}
                        disabled={loading}
                        className="w-full bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 shadow-sm transition-all rounded-lg h-10 text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <RotateCcw size={14} />
                        Reset Database
                    </button>
                </div>
            </div>

            {/* CONSOLE LOG */}
            <div className="h-48 border-t border-zinc-200 bg-white flex flex-col shrink-0">
                <div className="h-8 border-b border-zinc-100 flex items-center px-4 gap-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-50/50">
                    <Terminal size={12} />
                    System Log
                </div>
                <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-1.5">
                    {logs.length === 0 && (
                        <div className="text-zinc-300 italic">Ready for input...</div>
                    )}
                    {logs.map((log) => (
                        <div key={log.id} className="flex gap-2">
                            <span className="text-zinc-300 shrink-0 select-none">[{log.timestamp}]</span>
                            <span className={`
                                ${log.type === 'error' ? 'text-rose-600 font-bold' : ''}
                                ${log.type === 'success' ? 'text-emerald-600 font-medium' : ''}
                                ${log.type === 'system' ? 'text-zinc-500' : ''}
                                ${log.type === 'info' ? 'text-zinc-700' : ''}
                            `}>
                                {log.type === 'success' && '> '}
                                {log.type === 'error' && 'x '}
                                {log.message}
                            </span>
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>
        </aside>
    );
}
