import { motion } from "framer-motion";
import { SlideLayout } from "../components/layout/slide-layout";
import { H2, Mono } from "../components/ui/typography";
import { GlassCard } from "../components/ui/glass-card";
import { Activity, Pill, Utensils, Footprints, Heart, Zap, Moon, Users, Scale } from "lucide-react";

// Data derived from hmm_engine.py
const features = [
    { name: "Glucose Avg", weight: "25%", desc: "Glycemic Control", icon: Activity },
    { name: "Glucose Var", weight: "10%", desc: "Stability (CV%)", icon: Scale },
    { name: "Meds Adherence", weight: "18%", desc: "Behavioral Ratio", icon: Pill },
    { name: "Carbs Intake", weight: "7%", desc: "Dietary Input", icon: Utensils },
    { name: "Steps Daily", weight: "8%", desc: "Physical Output", icon: Footprints },
    { name: "Resting HR", weight: "5%", desc: "Cardio Baseline", icon: Heart },
    { name: "HRV (RMSSD)", weight: "7%", desc: "Autonomic Stress", icon: Zap, highlight: true },
    { name: "Sleep Quality", weight: "10%", desc: "Recovery", icon: Moon },
    { name: "Social Engagement", weight: "10%", desc: "Psychosocial", icon: Users },
];

const container = {
    show: { transition: { staggerChildren: 0.05 } }
};

const item = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1 }
};

export const FeaturesSlide = () => {
    return (
        <SlideLayout>
            <H2 className="mb-8">9 Orthogonal Dimensions</H2>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-3 gap-6 h-[70vh]"
            >
                {features.map((f, i) => (
                    <motion.div key={i} variants={item} className="h-full">
                        <GlassCard
                            className="h-full flex flex-col justify-between"
                            active={f.highlight}
                        >
                            <div className="flex justify-between items-start">
                                <f.icon className={`w-8 h-8 ${f.highlight ? 'text-accent-cyan' : 'text-secondary'}`} />
                                <Mono className="text-xs opacity-50">{f.weight}</Mono>
                            </div>

                            <div>
                                <h3 className={`text-xl font-medium mb-1 ${f.highlight ? 'text-white' : 'text-secondary/90'}`}>
                                    {f.name}
                                </h3>
                                <p className="text-sm opacity-60 font-light">{f.desc}</p>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </motion.div>
        </SlideLayout>
    );
};
