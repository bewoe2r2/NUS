import { cn } from "../../lib/utils";

interface TextProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
    className?: string;
}

export const Display = ({ children, className, ...props }: TextProps) => (
    <h1 className={cn("text-display font-serif font-bold tracking-tighter leading-none text-primary", className)} {...props}>
        {children}
    </h1>
);

export const Hero = ({ children, className, ...props }: TextProps) => (
    <h1 className={cn("text-hero font-serif font-bold tracking-tighter text-primary", className)} {...props}>
        {children}
    </h1>
);

export const H1 = ({ children, className, ...props }: TextProps) => (
    <h1 className={cn("text-3xl font-serif font-bold tracking-tight text-primary", className)} {...props}>
        {children}
    </h1>
);

export const H2 = ({ children, className, ...props }: TextProps) => (
    <h2 className={cn("text-2xl font-serif font-bold tracking-tight text-primary", className)} {...props}>
        {children}
    </h2>
);

export const H3 = ({ children, className, ...props }: TextProps) => (
    <h3 className={cn("text-xl font-serif font-bold text-primary", className)} {...props}>
        {children}
    </h3>
);

export const Body = ({ children, className, ...props }: TextProps) => (
    <p className={cn("text-base text-secondary leading-relaxed", className)} {...props}>
        {children}
    </p>
);

export const BodyLg = ({ children, className, ...props }: TextProps) => (
    <p className={cn("text-lg text-secondary leading-relaxed max-w-prose", className)} {...props}>
        {children}
    </p>
);

export const Mono = ({ children, className, ...props }: TextProps) => (
    <span className={cn("font-mono text-xs uppercase tracking-widest text-accent-navy", className)} {...props}>
        {children}
    </span>
);

export const Label = ({ children, className, ...props }: TextProps) => (
    <span className={cn("font-mono text-xs uppercase tracking-widest text-tertiary", className)} {...props}>
        {children}
    </span>
);
