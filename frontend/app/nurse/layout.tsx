
"use client";

import { NurseSidebar } from "@/components/nurse/NurseSidebar";

export default function NurseLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">
            {/* Sidebar */}
            <NurseSidebar />

            {/* Main Content Area */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                {children}
            </div>
        </div>
    );
}
