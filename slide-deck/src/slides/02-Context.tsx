import { motion } from "framer-motion";
import { SlideLayout } from "../components/layout/slide-layout";
import { H2, BodyLg } from "../components/ui/typography";

// Visual: Step Function (The "Boolean Trap")
const StepGraph = () => (
    <svg viewBox="0 0 400 200" className="w-full h-48 stroke-current">
        {/* Axis */}
        <line x1="0" y1="180" x2="400" y2="180" stroke="oklch(100% 0 0 / 0.2)" strokeWidth="2" />
        <line x1="20" y1="0" x2="20" y2="200" stroke="oklch(100% 0 0 / 0.2)" strokeWidth="2" />

        {/* Data Line - Flat then abrupt jump */}
        <path
            d="M20,150 L250,150 L250,20 L380,20"
            fill="none"
            stroke="oklch(60% 0.22 25)" // Red
            strokeWidth="4"
        />

        {/* Threshold Line */}
        <line x1="0" y1="85" x2="400" y2="85" stroke="white" strokeDasharray="4 4" strokeOpacity="0.3" />
        <text x="260" y="40" fill="oklch(60% 0.22 25)" className="font-mono text-xs">CRISIS DETECTED (LATE)</text>
    </svg>
);

// Visual: Gradient Curve (The "Reality")
const GradientGraph = () => (
    <svg viewBox="0 0 400 200" className="w-full h-48 stroke-current">
        {/* Axis */}
        <line x1="0" y1="180" x2="400" y2="180" stroke="oklch(100% 0 0 / 0.2)" strokeWidth="2" />
        <line x1="20" y1="0" x2="20" y2="200" stroke="oklch(100% 0 0 / 0.2)" strokeWidth="2" />

        {/* Data Line - Smooth Exponential */}
        <path
            d="M20,160 C100,160 150,150 200,120 S300,80 380,20"
            fill="none"
            stroke="url(#cyanGradient)"
            strokeWidth="4"
        />
        <defs>
            <linearGradient id="cyanGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="oklch(65% 0.2 145)" /> {/* Green/Stable */}
                <stop offset="50%" stopColor="oklch(75% 0.18 85)" />  {/* Warning */}
                <stop offset="100%" stopColor="oklch(60% 0.22 25)" /> {/* Crisis */}
            </linearGradient>
        </defs>

        {/* Points on curve */}
        <circle cx="100" cy="160" r="4" fill="oklch(65% 0.2 145)" />
        <text x="90" y="180" fill="oklch(65% 0.2 145)" className="font-mono text-xs">DRIFT</text>

        <circle cx="200" cy="120" r="4" fill="oklch(75% 0.18 85)" />
        <text x="190" y="100" fill="oklch(75% 0.18 85)" className="font-mono text-xs">WARNING</text>

        <circle cx="340" cy="40" r="4" fill="oklch(60% 0.22 25)" />
        <text x="330" y="20" fill="oklch(60% 0.22 25)" className="font-mono text-xs">CRISIS</text>
    </svg>
);

export const ContextSlide = () => {
    return (
        <SlideLayout>
            <div className="grid grid-cols-2 gap-24 h-full items-center">

                {/* Left: The Old Way */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 0.5, x: 0 }}
                    className="grayscale hover:grayscale-0 transition-all duration-500"
                >
                    <H2 className="mb-4 text-secondary">The Boolean Trap</H2>
                    <div className="bg-white/5 p-8 rounded-xl border border-white/10 mb-6">
                        <StepGraph />
                    </div>
                    <BodyLg>
                        Traditional systems trigger on <strong className="text-white">single data points</strong>.
                        <br />
                        Result: False Positives. Alarm Fatigue. No Context.
                    </BodyLg>
                </motion.div>

                {/* Right: The New Way */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <H2 className="mb-4 text-white">The Gradient Reality</H2>
                    <div className="bg-white/5 p-8 rounded-xl border border-accent-cyan/30 mb-6 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                        <GradientGraph />
                    </div>
                    <BodyLg>
                        HMMs model deterioration as a <strong className="text-accent-cyan text-glow-cyan">continuous trajectory</strong>.
                        <br />
                        We detect the *slope* before the *threshold*.
                    </BodyLg>
                </motion.div>

            </div>
        </SlideLayout>
    );
};
