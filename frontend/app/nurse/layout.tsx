
"use client";

import { useState, useEffect } from "react";
import { NurseSidebar } from "@/components/nurse/NurseSidebar";

export default function NurseLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isIframe, setIsIframe] = useState(false);

    useEffect(() => {
        try {
            setIsIframe(window.self !== window.top);
        } catch {
            // cross-origin iframes throw; treat as iframe
            setIsIframe(true);
        }
    }, []);

    return (
        <div className="h-screen bg-slate-50 flex font-sans">
            {/* Sidebar - hidden when embedded in an iframe (e.g. judge page) */}
            {!isIframe && <NurseSidebar />}

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col h-full ${isIframe ? '' : 'md:ml-64'}`}>
                {children}
            </div>
        </div>
    );
}
