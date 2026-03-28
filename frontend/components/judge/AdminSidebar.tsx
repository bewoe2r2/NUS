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
    ChevronLeft,
    Loader2,
} from 'lucide-react';

interface AdminSidebarProps {
    onScenarioInjected: () => void;
    onCollapsedChange?: (collapsed: boolean) => void;
}

type LogType = 'info' | 'success' | 'error' | 'system';

interface LogEntry {
    id: string;
    timestamp: string;
    message: string;
    type: LogType;
}

export function AdminSidebar({ onScenarioInjected, onCollapsedChange }: AdminSidebarProps) {
    const [loading, setLoading] = useState(false);
    const [selectedScenario, setSelectedScenario] = useState('stable_perfect');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [collapsed, setCollapsed] = useState(false);

    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const addLog = (msg: string, type: LogType = 'info') => {
        const entry: LogEntry = {
            id: Math.random().toString(36).slice(2, 11),
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
                await api.runHMM(selectedScenario);
                addLog("HMM analysis converged", 'success');
            } catch {
                addLog("HMM Viterbi inference skipped", 'info');
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
        <aside data-sidebar className={`${collapsed ? 'w-14' : 'w-80'} transition-all duration-300 bg-gradient-to-b from-zinc-900 to-zinc-950 border-r border-zinc-800 h-screen fixed left-0 top-0 flex flex-col font-sans z-50 text-zinc-200 overflow-visible`}>
            {/* COLLAPSE TOGGLE */}
            <button
                onClick={() => { setCollapsed(c => { const next = !c; onCollapsedChange?.(next); return next; }); }}
                title="Toggle sidebar"
                className="absolute top-1/2 -right-3.5 -translate-y-1/2 z-[51] w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-200"
            >
                <ChevronLeft size={14} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            </button>

            {/* HEADER */}
            <div id="sidebar-brand" className={`border-b border-zinc-800 shrink-0 ${collapsed ? 'py-3.5 px-2.5 text-center' : 'px-5 py-5 pb-4'}`}>
                <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xl font-extrabold tracking-[2px] text-white">
                        {collapsed ? 'B' : 'BEWO'}
                    </span>
                    {!collapsed && (
                        <span className="text-sm font-semibold text-zinc-400 tracking-[0.5px]">HEALTH ENGINE</span>
                    )}
                </div>
                {!collapsed && (
                    <p className="text-[11px] text-zinc-500 mt-1 tracking-[0.3px]">NUS-Synapxe-IMDA Healthcare AI Challenge 2026</p>
                )}
            </div>

            <div className={`flex-1 overflow-y-auto ${collapsed ? 'p-0' : 'p-5'}`}>

                {/* STATUS */}
                {!collapsed && (
                    <div className="mb-4 p-2 px-3 bg-emerald-500/[0.08] border border-emerald-500/[0.15] rounded-lg shadow-[inset_0_0_20px_rgba(16,185,129,0.04)] flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 animate-pulse"></span>
                        <span className="text-xs font-medium text-emerald-500">System Online</span>
                        <span className="text-[11px] text-zinc-500 ml-auto">Pipeline Ready</span>
                    </div>
                )}

                {/* SCENARIO SELECTOR */}
                <div id="scenario-list" className={`mb-4 py-3.5 px-5 -mx-5 border-b border-zinc-800 ${collapsed ? 'hidden' : ''}`}>
                    <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[1.5px] mb-2.5">Scenario Selector</h2>
                    <div className="flex flex-col gap-[3px]">
                        {scenarios.map((s) => {
                            const isActive = selectedScenario === s.id;
                            const dotColor = ['stable_perfect', 'stable_noisy', 'recovery'].includes(s.id)
                                ? 'bg-emerald-500'
                                : ['gradual_decline', 'warning_recovery'].includes(s.id)
                                ? 'bg-amber-500'
                                : 'bg-rose-500';
                            return (
                                <button
                                    key={s.id}
                                    data-scenario={s.id}
                                    onClick={() => setSelectedScenario(s.id)}
                                    disabled={loading}
                                    className={`w-full text-left py-[7px] px-2.5 rounded-md flex items-center gap-2.5 transition-all duration-150 font-mono text-xs border
                                        ${isActive
                                            ? 'bg-blue-500/[0.12] text-blue-400 border-blue-500/25'
                                            : 'bg-transparent text-zinc-400 border-transparent hover:bg-zinc-800'}`}
                                >
                                    <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${dotColor}`}></span>
                                    {s.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ACTIONS */}
                <div className={`py-3.5 px-5 -mx-5 border-b border-zinc-800 flex flex-col gap-2 ${collapsed ? 'hidden' : ''}`}>
                    <button
                        id="btn-run-sim"
                        onClick={handleInject}
                        disabled={loading}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2.5 text-[13px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="fill-current" />}
                        {loading ? 'Running Pipeline...' : 'Run Full Simulation'}
                    </button>

                    <button
                        onClick={handleReset}
                        disabled={loading}
                        className="w-full bg-transparent border border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-zinc-300 rounded-lg py-2 text-xs font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        <RotateCcw size={14} />
                        Reset Database
                    </button>
                </div>
            </div>

            {/* CONSOLE LOG */}
            <div className={`flex-1 flex flex-col min-h-0 ${collapsed ? 'px-1.5 py-2.5' : 'px-4 py-2.5'}`}>
                {!collapsed && (
                    <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-[1.5px] mb-2 flex items-center gap-2">
                        <Terminal size={12} />
                        Console Output
                    </div>
                )}
                <div id="sidebar-console" className={`flex-1 bg-zinc-950 border border-zinc-800 rounded-lg overflow-y-auto overflow-x-hidden font-mono leading-[1.7] shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)] min-h-0 ${collapsed ? 'p-1.5 text-[9px]' : 'p-2.5 text-[11px]'}`}>
                    {logs.length === 0 && (
                        <div className="text-zinc-600 italic whitespace-nowrap">
                            {collapsed ? '...' : '[--:--:--] Ready for input...'}
                        </div>
                    )}
                    {logs.map((log) => (
                        <div key={log.id} className="whitespace-pre-wrap break-all">
                            <span className="text-zinc-600 select-none">[{log.timestamp}]</span>{' '}
                            <span className={`
                                ${log.type === 'error' ? 'text-rose-500 font-bold' : ''}
                                ${log.type === 'success' ? 'text-emerald-500 font-medium' : ''}
                                ${log.type === 'system' ? 'text-blue-500' : ''}
                                ${log.type === 'info' ? 'text-zinc-400' : ''}
                            `}>
                                {log.type === 'success' && '> '}
                                {log.type === 'error' && 'x '}
                                {log.message}
                            </span>
                        </div>
                    ))}
                    <div ref={logEndRef} data-log-end="true" aria-hidden="true">{' '}</div>
                </div>
            </div>
        </aside>
    );
}
