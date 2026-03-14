import { cn } from "../../lib/utils";

interface AccentCardProps {
    children: React.ReactNode;
    className?: string;
    color?: string;
}

/** Accent card — whiter than page, hairline border, 2px left accent stripe */
export const AccentCard = ({ children, className, color = '#354f8c' }: AccentCardProps) => (
    <div
        className={cn("bg-surface border border-border-hairline relative", className)}
        style={{ borderLeft: `2px solid ${color}` }}
    >
        {children}
    </div>
);

interface MetricCardProps {
    label: string;
    value: string;
    sub?: string;
    color?: string;
    className?: string;
    large?: boolean;
}

/** MetricCard — analyst-portfolio pattern: label(10px tracked uppercase) → value(mono bold) → context */
export const MetricCard = ({ label, value, sub, color = '#354f8c', className, large }: MetricCardProps) => (
    <div
        className={cn("bg-surface border border-border-hairline relative", large ? "p-6" : "p-4", className)}
        style={{ borderLeft: `2px solid ${color}` }}
    >
        <div className="label-metric mb-1.5" style={{ color: color }}>{label}</div>
        <div className={cn("value-metric", large ? "text-3xl" : "text-2xl")}>{value}</div>
        {sub && <div className="text-xs text-tertiary mt-1.5">{sub}</div>}
    </div>
);

interface PillBadgeProps {
    children: React.ReactNode;
    color?: string;
    bg?: string;
    className?: string;
}

/** Category pill — 10px mono, tracked, muted bg */
export const PillBadge = ({ children, color = '#354f8c', bg = '#f0f2fa', className }: PillBadgeProps) => (
    <span
        className={cn("pill", className)}
        style={{ color, backgroundColor: bg }}
    >
        {children}
    </span>
);

/** Stat row item — for horizontal stat displays */
export const StatItem = ({ value, label, color }: { value: string; label: string; color?: string }) => (
    <div>
        <div className="value-metric text-xl" style={color ? { color } : undefined}>{value}</div>
        <div className="label-metric mt-0.5">{label}</div>
    </div>
);
