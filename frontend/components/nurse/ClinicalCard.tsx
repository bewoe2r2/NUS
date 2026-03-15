"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ClinicalCardProps {
    title?: React.ReactNode;
    subtitle?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
    action?: React.ReactNode;
}

export function ClinicalCard({
    title,
    subtitle,
    icon,
    children,
    className,
    contentClassName,
    action
}: ClinicalCardProps) {
    return (
        <Card className={cn(
            "bg-white border-slate-200 shadow-sm transition-all duration-150 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:-translate-y-[2px]",
            className
        )}>
            {(title || icon) && (
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            {icon && (
                                <div className="p-2 rounded-md bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                                    {icon}
                                </div>
                            )}
                            <div>
                                {title && <CardTitle className="text-slate-800 text-base font-semibold tracking-tight">{title}</CardTitle>}
                                {subtitle && <CardDescription className="text-slate-500 text-xs font-medium mt-0.5">{subtitle}</CardDescription>}
                            </div>
                        </div>
                        {action && <div>{action}</div>}
                    </div>
                </CardHeader>
            )}
            <CardContent className={cn("p-5", contentClassName)}>
                {children}
            </CardContent>
        </Card>
    );
}
