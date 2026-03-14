
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-accent-500 text-white hover:bg-accent-600",
                secondary:
                    "border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
                destructive:
                    "border-transparent bg-error-bg text-error-text shadow-sm hover:bg-error-bg/80",
                outline: "text-neutral-900 border-neutral-200",
                success:
                    "border-transparent bg-success-bg text-success-text hover:bg-success-bg/80",
                warning:
                    "border-transparent bg-warning-bg text-warning-text hover:bg-warning-bg/80"
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
