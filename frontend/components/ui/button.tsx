
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * BUTTON COMPONENT SPECIFICATION
 * 
 * Architecture:
 * - Uses `cva` for scalable variant management
 * - Uses `Radix Slot` for polymorphism (render as `a` tag or `button`)
 * - Implements strict accessibility focus rings using `ring-offset` pattern
 * 
 * Variants:
 * - Default: Solid Medical Blue (Accent-500)
 * - Destructive: Error Red (Error-500)
 * - Outline: Bordered Neutral-200
 * - Secondary: Subtle Neutral-100 background
 * - Ghost: Transparent, hover effect only
 * - Glass: Blur backdrop, border, white text (Hero usage)
 */

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default: "bg-accent-500 text-white hover:bg-accent-600 shadow-sm hover:shadow-md transition-all",
                destructive: "bg-error-500 text-white hover:bg-error-600 shadow-sm",
                outline: "border border-neutral-200 bg-transparent hover:bg-neutral-100 text-neutral-900",
                secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 shadow-sm",
                ghost: "hover:bg-neutral-100 hover:text-neutral-900",
                link: "text-accent-500 underline-offset-4 hover:underline",
                glass: "bg-glass-surface backdrop-blur-md border border-neutral-200 text-neutral-900 hover:bg-white/50 shadow-sm hover:shadow-float",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-12 rounded-lg px-8 text-base",
                icon: "h-10 w-10",
                xl: "h-14 rounded-xl px-10 text-lg",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, isLoading = false, children, ...props }, ref) => {
        // If asChild is true, we merge props onto the child element (Slot)
        // Otherwise we render a standard button
        const Comp = asChild ? Slot : "button";

        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={props.disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {children}
                    </>
                ) : (
                    children
                )}
            </Comp>
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
