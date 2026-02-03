import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";

const Reveal = ({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) => (
    <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
        className={className}
    >
        {children}
    </motion.div>
);

export function HeroOverlay() {
    return (
        <div className="absolute inset-0 z-10 p-24 flex flex-col justify-center pointer-events-none">
            <div className="max-w-4xl space-y-2">
                <Reveal delay={0.2}>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-px w-12 bg-accent-cyan" />
                        <span className="text-secondary tracking-[0.2em] text-sm font-semibold uppercase">Nexus Protocol v3.0</span>
                    </div>
                </Reveal>

                <Reveal delay={0.4}>
                    <h1 className="text-8xl font-semibold text-primary tracking-tight leading-[0.9]">
                        Sovereign <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-indigo">
                            Health
                        </span>
                    </h1>
                </Reveal>

                <Reveal delay={0.6}>
                    <p className="text-2xl text-secondary mt-8 max-w-xl font-light leading-relaxed">
                        The first predictive, privacy-preserving oracle for human longevity.
                    </p>
                </Reveal>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-12 left-24 right-24 border-t border-slate-200 pt-8 flex justify-between items-end"
            >
                <div className="space-y-1">
                    <div className="text-xs font-mono text-tertiary uppercase tracking-widest">System Status</div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                        <span className="text-sm font-medium text-primary">Operational // 99.9% Uptime</span>
                    </div>
                </div>

                <div className="flex gap-16">
                    <div className="space-y-1">
                        <div className="text-xs font-mono text-tertiary uppercase tracking-widest">Version</div>
                        <div className="text-sm font-medium text-primary">3.1.4 (Stable)</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs font-mono text-tertiary uppercase tracking-widest">Encryption</div>
                        <div className="text-sm font-medium text-primary">AES-256-GCM</div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
