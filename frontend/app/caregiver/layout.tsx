"use client";

export default function CaregiverLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-stone-50 font-sans">
            {children}
        </div>
    );
}
