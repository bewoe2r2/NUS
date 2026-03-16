
"use client";

import { Bell, Search } from "lucide-react";

export function PatientHeader({
    patientId = "P001",
    name = "Tan Ah Kow",
    age = 67,
    status = "STABLE"
}: {
    patientId?: string,
    name?: string,
    age?: number,
    status?: "STABLE" | "WARNING" | "CRISIS" | "UNKNOWN"
}) {

    const statusColors = {
        STABLE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        WARNING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        CRISIS: "bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse",
        UNKNOWN: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    };

    return (
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-10 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            {/* LEFT: Patient Context */}
            <div className="flex items-center gap-6">
                <div>
                    <h1 className="text-lg font-bold text-slate-900">{name}</h1>
                    <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-medium">
                        <span>ID: {patientId}</span>
                        <span>•</span>
                        <span>{age} Y.O.</span>
                        <span>•</span>
                        <span>Type 2 Diabetes</span>
                    </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[status] || statusColors.STABLE}`}>
                    {status}
                </div>
            </div>

            {/* RIGHT: Global Actions */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search records..."
                        aria-label="Search patients"
                        className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64"
                    />
                </div>
                <button aria-label="Notifications" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full relative">
                    <Bell size={20} />
                    {status === 'CRISIS' && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                    )}
                </button>
            </div>
        </header>
    );
}
