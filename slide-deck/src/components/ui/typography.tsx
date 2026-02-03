import { cn } from "../../lib/utils";
import React from "react";

interface TextProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
    className?: string;
    gradient?: boolean;
}

export const Display = ({ children, className, gradient, ...props }: TextProps) => (
    <h1
        className={cn(
            "text-display font-semibold tracking-tighter leading-none",
            gradient && "text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60",
            className
        )}
        {...props}
    >
        {children}
    </h1>
);

export const H1 = ({ children, className, ...props }: TextProps) => (
    <h1 className={cn("text-h1 font-semibold tracking-tight text-primary", className)} {...props}>
        {children}
    </h1>
);

export const H2 = ({ children, className, ...props }: TextProps) => (
    <h2 className={cn("text-h2 font-medium tracking-tight text-white", className)} {...props}>
        {children}
    </h2>
);

export const H3 = ({ children, className, ...props }: TextProps) => (
    <h3 className={cn("text-h3 font-medium tracking-normal text-secondary", className)} {...props}>
        {children}
    </h3>
);

export const BodyLg = ({ children, className, ...props }: TextProps) => (
    <p className={cn("text-body-lg text-secondary/80 font-light max-w-prose", className)} {...props}>
        {children}
    </p>
);

export const Mono = ({ children, className, ...props }: TextProps) => (
    <span className={cn("font-mono text-sm uppercase tracking-widest text-accent-cyan", className)} {...props}>
        {children}
    </span>
);
