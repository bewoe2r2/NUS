import { SlideLayout } from "../components/layout/slide-layout";
import { H2, Mono } from "../components/ui/typography";
import { motion } from "framer-motion";

const Row = ({ label, left, right, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay }}
        className="grid grid-cols-3 border-b border-white/10 last:border-none group hover:bg-white/5 transition-colors"
    >
        <div className="p-8 text-secondary font-medium flex items-center">{label}</div>
        <div className="p-8 text-accent-rose font-mono flex items-center border-l border-white/5 group-hover:border-white/10">{left}</div>
        <div className="p-8 text-status-success font-mono flex items-center font-bold border-l border-white/5 group-hover:border-white/10 bg-status-success/5">{right}</div>
    </motion.div>
);

export const DefenseSlide = () => {
    return (
        <SlideLayout className="items-center">
            <H2 className="mb-16">Architecture Defense</H2>

            <div className="w-full max-w-6xl border border-white/10 rounded-2xl overflow-hidden bg-surface backdrop-blur-xl">
                {/* Header */}
                <div className="grid grid-cols-3 bg-white/5 border-b border-white/10">
                    <div className="p-6 text-sm uppercase tracking-widest text-secondary/50 font-bold">Metric</div>
                    <div className="p-6 text-sm uppercase tracking-widest text-secondary/50 font-bold border-l border-white/5">Transformers (LLM)</div>
                    <div className="p-6 text-sm uppercase tracking-widest text-accent-cyan/80 font-bold border-l border-white/5 bg-accent-cyan/5">NEXUS (HMM)</div>
                </div>

                <Row
                    delay={0.2}
                    label="Data Requirement"
                    left="10,000+ Profiles (Big Data)"
                    right="1 Profile (Bayesian Priors)"
                />
                <Row
                    delay={0.4}
                    label="Explainability"
                    left="Black Box (Neurons)"
                    right="Transparent (Probabilities)"
                />
                <Row
                    delay={0.6}
                    label="Compute Cost"
                    left="GPU / Cloud Only (Drain)"
                    right="CPU / Edge Ready (Light)"
                />
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-16 text-center"
            >
                <Mono className="text-secondary">"In Healthcare, explainability is not a feature. It's a requirement."</Mono>
            </motion.div>
        </SlideLayout>
    );
};
