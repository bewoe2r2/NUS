import { motion } from "framer-motion";
import { SlideLayout } from "../components/layout/slide-layout";
import { PhoneMockup, BrowserMockup } from "../components/ui/mockups";

const R = ({ children, d = 0, className }: { children: React.ReactNode; d?: number; className?: string }) => (
    <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45, delay: d, ease: "easeOut" }} className={className}>
        {children}
    </motion.div>
);

export const CloseSlide = () => (
    <SlideLayout>
        <div className="flex flex-col justify-center items-center h-full text-center">
            {/* Hero brand */}
            <R>
                <div className="mb-12">
                    <h1 className="font-serif text-[4.5rem] font-bold tracking-tight text-primary leading-none mb-4">
                        Bewo
                    </h1>
                    <p className="font-serif text-[2rem] text-accent-crimson font-bold tracking-tight">
                        Before crisis. Not after.
                    </p>
                </div>
            </R>

            {/* Product screenshots flanking */}
            <R d={0.15}>
                <div className="flex items-center justify-center gap-10 mb-12">
                    <PhoneMockup src="/app-shots/patient-hero.png" alt="Patient app" className="w-[160px]" />
                    <div className="space-y-3 text-left max-w-md">
                        <div className="text-[13px] text-secondary leading-relaxed">
                            Real prediction <span className="font-mono text-[#b8860b] font-bold">(HMM + Monte Carlo)</span>.
                            Real agent <span className="font-mono text-[#3d8c5a] font-bold">(5-turn ReAct, 18 tools)</span>.
                            Real safety <span className="font-mono text-[#a63d3d] font-bold">(6-dim classifier)</span>.
                        </div>
                        <div className="text-[13px] font-mono text-accent-navy font-bold">20,000+ lines of production code.</div>
                    </div>
                    <BrowserMockup src="/app-shots/nurse-full.png" url="bewo.health/clinical" className="w-[280px]" />
                </div>
            </R>

            {/* Demo scenarios */}
            <R d={0.3}>
                <div className="mb-10">
                    <div className="label-section text-accent-navy mb-3">5 Live Demo Scenarios</div>
                    <div className="flex gap-3 justify-center">
                        {[
                            "Stable Baseline",
                            "Realistic Stable",
                            "Warning → Recovery",
                            "Warning → Crisis",
                            "Sudden Acute",
                        ].map(s => (
                            <span key={s} className="pill bg-accent-highlight text-accent-navy text-[11px]">{s}</span>
                        ))}
                    </div>
                    <div className="text-xs text-tertiary font-mono mt-3">Live prototype available for demonstration</div>
                </div>
            </R>

            {/* Footer */}
            <R d={0.4}>
                <div className="border-t border-border-hairline pt-5 w-full max-w-2xl">
                    <div className="flex justify-between items-center">
                        <span className="label-metric text-tertiary">NUS &times; Synapxe &times; IMDA &middot; AI Innovation Challenge 2026</span>
                        <span className="font-serif text-base font-bold text-primary tracking-tight">Team Bewo</span>
                    </div>
                </div>
            </R>
        </div>
    </SlideLayout>
);
