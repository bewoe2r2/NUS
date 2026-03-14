"use client";

import { useState } from "react";
import { Activity, Clock, AlertCircle, Settings, LayoutDashboard, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
    disabled?: boolean;
}

function SidebarItem({ icon, label, active, onClick, disabled }: SidebarItemProps) {
    const [showHint, setShowHint] = useState(false);

    const handleClick = () => {
        if (disabled) {
            setShowHint(true);
            setTimeout(() => setShowHint(false), 1500);
            return;
        }
        onClick?.();
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "px-3 py-2.5 rounded-md flex items-center gap-3 font-medium cursor-pointer transition-all duration-200 group relative",
                active
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                    : disabled
                        ? "text-slate-400 hover:bg-slate-50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
        >
            {active && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r-full" />
            )}
            <div className={cn("transition-transform duration-200", active ? "scale-105" : "group-hover:scale-105")}>
                {icon}
            </div>
            <span>{label}</span>
            {showHint && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full animate-in fade-in duration-200">
                    Coming soon
                </span>
            )}
        </div>
    );
}

export function NurseSidebar() {
    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shadow-sm z-30">
            {/* Header */}
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3 text-slate-800 font-bold text-xl tracking-tight">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-blue-100 rounded-full scale-110" />
                        <Activity className="h-6 w-6 text-blue-600 relative z-10" />
                    </div>
                    <span>
                        BEWO <span className="text-blue-600 font-extrabold">CLINICAL</span>
                    </span>
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-1">
                    Decision Support System
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto">

                <div className="space-y-1">
                    <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Dashboard</div>
                    <SidebarItem icon={<LayoutDashboard size={18} />} label="Overview" active />
                    <SidebarItem icon={<Activity size={18} />} label="Live Monitoring" disabled />
                    <SidebarItem icon={<BrainCircuit size={18} />} label="HMM Analysis" disabled />
                </div>

                <div className="space-y-1">
                    <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Management</div>
                    <SidebarItem icon={<Clock size={18} />} label="History Logs" disabled />
                    <SidebarItem icon={<AlertCircle size={18} />} label="Alerts & Risks" disabled />
                </div>
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-slate-200 transition-all cursor-pointer group">
                    <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm">
                        SC
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">Sarah Chen, RN</div>
                        <div className="text-xs text-slate-500">Senior Nurse Lead</div>
                    </div>
                    <Settings className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
            </div>
        </aside>
    );
}
