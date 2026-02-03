import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    active?: boolean; // Highlighted state
}

export const GlassCard = ({ children, className, hover = true, active = false }: GlassCardProps) => {
    return (
        <motion.div
            whileHover={hover ? { scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" } : {}}
            className={cn(
                "glass-panel rounded-xl p-6 relative overflow-hidden transition-colors duration-300",
                active && "border-accent-cyan/50 shadow-[0_0_30px_oklch(60%_0.22_200_/_0.15)]",
                className
            )}
        >
            {active && (
                <div className="absolute inset-0 bg-accent-cyan/5 pointer-events-none" />
            )}
            {children}
        </motion.div>
    );
};
