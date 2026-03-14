import { motion } from "framer-motion";
import { SlideLayout } from "../components/layout/slide-layout";
import { PhoneMockup, BrowserMockup } from "../components/ui/mockups";

const R = ({ children, d = 0, className }: { children: React.ReactNode; d?: number; className?: string }) => (
    <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45, delay: d, ease: "easeOut" }} className={className}>
        {children}
    </motion.div>
);

/* ── Annotation callout ───────────────────────────────────────────── */
const Callout = ({ label, color, side }: { label: string; color: string; side: "left" | "right" }) => (
    <div className={`flex items-center gap-1.5 ${side === "right" ? "flex-row-reverse" : ""}`}>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[10px] font-mono font-bold" style={{ color }}>{label}</span>
    </div>
);

export const IntelligenceSlide = () => (
    <SlideLayout>
        <div className="flex flex-col h-full">
            <R>
                <div className="label-section text-accent-navy mb-4">Product in Action</div>
            </R>

            <R d={0.08}>
                <h1 className="font-serif text-[2.8rem] font-bold tracking-tight leading-[1.08] text-primary max-w-4xl mb-6">
                    Day 1: Bewo detects what{" "}
                    <span className="text-accent-crimson">90 days of standard care would miss.</span>
                </h1>
            </R>

            {/* Hero — side-by-side product screenshots */}
            <R d={0.2}>
                <div className="grid grid-cols-[240px_1fr] gap-8 items-start mb-6">
                    {/* Patient app */}
                    <div>
                        <div className="label-metric text-accent-navy mb-3">Patient Companion</div>
                        <div className="relative">
                            <PhoneMockup src="/app-shots/patient-hero.png" alt="Bewo patient app" />
                            {/* Annotation callouts */}
                            <div className="absolute -right-2 top-[15%] translate-x-full space-y-4">
                                <Callout label="AI Risk Score" color="#a63d3d" side="left" />
                                <Callout label="Singlish Chat" color="#3d8c5a" side="left" />
                                <Callout label="Voucher Rewards" color="#b8860b" side="left" />
                                <Callout label="Med Reminders" color="#354f8c" side="left" />
                            </div>
                        </div>
                    </div>

                    {/* Nurse dashboard */}
                    <div>
                        <div className="label-metric text-accent-navy mb-3">Clinical Dashboard</div>
                        <div className="relative">
                            <BrowserMockup src="/app-shots/nurse-full.png" url="bewo.health/clinical" className="w-full" />
                            {/* Annotation callouts */}
                            <div className="absolute -left-2 top-[10%] -translate-x-full space-y-3">
                                <Callout label="HMM State" color="#b8860b" side="right" />
                                <Callout label="Triage Queue" color="#a63d3d" side="right" />
                                <Callout label="SBAR Report" color="#354f8c" side="right" />
                                <Callout label="Drug Checker" color="#3d8c5a" side="right" />
                            </div>
                        </div>
                    </div>
                </div>
            </R>

            {/* Flow arrow */}
            <R d={0.45}>
                <div className="flex items-center justify-center gap-3 mb-6">
                    {["Patient monitored", "AI detects risk", "Nurse alerted", "Crisis prevented"].map((step, i) => (
                        <div key={step} className="flex items-center gap-3">
                            <div className="bg-accent-highlight text-accent-navy text-[11px] font-mono font-bold px-3 py-1.5 rounded">
                                {step}
                            </div>
                            {i < 3 && <span className="text-tertiary font-bold text-lg">→</span>}
                        </div>
                    ))}
                </div>
            </R>

            {/* Mdm Tan callback — narrative resolution */}
            <R d={0.55}>
                <div className="bg-[#fdf8f0] border-l-4 border-[#b8860b] p-5">
                    <div className="flex items-start gap-4">
                        <div className="shrink-0">
                            <div className="w-12 h-12 rounded-full bg-[#b8860b] flex items-center justify-center text-white text-lg font-serif font-bold">T</div>
                        </div>
                        <div>
                            <div className="text-[13px] font-serif font-bold text-primary mb-1">Remember Mdm Tan from Slide 2?</div>
                            <p className="text-[13px] text-secondary leading-relaxed">
                                With Bewo, her glucose rise is caught at <strong className="text-accent-crimson">Day 1</strong> — not Day 90.
                                Her nurse is contacted by <strong className="text-accent-navy">Day 2</strong>.
                                The $8,800 ER visit <strong className="text-[#3d8c5a]">never happens</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            </R>
        </div>
    </SlideLayout>
);
