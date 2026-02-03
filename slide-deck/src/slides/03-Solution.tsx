import { motion } from "framer-motion";
import { SlideLayout } from "../components/layout/slide-layout";
import { H2, Mono } from "../components/ui/typography";

const Node = ({ state, color, sub, pulse = false }: any) => (
    <div className="flex flex-col items-center gap-4 relative z-10">
        <div
            className={`w-48 h-48 rounded-full border-2 ${color} backdrop-blur-md flex items-center justify-center relative
        ${pulse ? 'animate-pulse-slow' : ''}`}
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)' }}
        >
            <div className={`absolute inset-0 rounded-full blur-xl opacity-20 bg-current ${color.replace('border-', 'text-')}`} />
            <span className={`text-2xl font-bold tracking-widest ${color.replace('border-', 'text-')}`}>{state}</span>
        </div>
        <Mono className="opacity-70">{sub}</Mono>
    </div>
);

const Arrow = () => (
    <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 100, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="h-0.5 bg-gradient-to-r from-white/10 to-white/50 w-24 relative"
    >
        <div className="absolute right-0 -top-1 w-2 h-2 border-t-2 border-r-2 border-white/50 rotate-45" />
    </motion.div>
);

export const SolutionSlide = () => {
    return (
        <SlideLayout className="items-center">
            <div className="absolute top-12 left-12">
                <H2>Architecture: 3-State Hidden Markov Model</H2>
            </div>

            <div className="flex items-center gap-8 mt-12 scale-110">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                    <Node
                        state="STABLE"
                        color="border-status-success"
                        sub="P(Stay) = 96%"
                    />
                </motion.div>

                <Arrow />

                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                    <Node
                        state="WARNING"
                        color="border-status-warning"
                        sub="Intervention Window"
                    />
                </motion.div>

                <Arrow />

                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
                    <Node
                        state="CRISIS"
                        color="border-accent-rose"
                        sub="Sticky State (>84% Stay)"
                        pulse
                    />
                </motion.div>
            </div>

            <div className="absolute bottom-12 right-12 text-right">
                <Mono className="text-secondary block">Inference Speed</Mono>
                <span className="text-4xl font-mono text-accent-cyan text-glow-cyan">{"<"}50ms</span>
                <Mono className="block mt-1 text-xs opacity-50">Pure Python / Edge Optimized</Mono>
            </div>
        </SlideLayout>
    );
};
