import { motion } from "framer-motion";
import { SlideLayout } from "../components/layout/slide-layout";

const R = ({ children, d = 0, className }: { children: React.ReactNode; d?: number; className?: string }) => (
    <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45, delay: d, ease: "easeOut" }} className={className}>
        {children}
    </motion.div>
);

/* ── Outcome comparison ───────────────────────────────────────────── */
const OutcomeComparison = () => (
    <div className="grid grid-cols-2 gap-6">
        {/* Without Bewo */}
        <div className="bg-[#fdf2f2] border border-[#a63d3d30] p-6">
            <div className="text-sm font-mono font-bold text-accent-crimson mb-5">Without Bewo</div>
            <div className="space-y-4">
                {[
                    { day: "Day 1", event: "Glucose starts rising", color: "#b8860b" },
                    { day: "Day 45", event: "Complications developing", color: "#a63d3d" },
                    { day: "Day 91", event: "ER admission — DKA", color: "#a63d3d" },
                ].map(e => (
                    <div key={e.day} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                        <span className="text-[11px] font-mono font-bold w-14 shrink-0" style={{ color: e.color }}>{e.day}</span>
                        <span className="text-[13px] text-secondary">{e.event}</span>
                    </div>
                ))}
            </div>
            <div className="mt-6 pt-4 border-t border-[#a63d3d20]">
                <div className="value-metric text-3xl text-accent-crimson">$14,200+</div>
                <div className="text-xs font-mono text-tertiary mt-1">Total cost per crisis episode</div>
            </div>
        </div>

        {/* With Bewo */}
        <div className="bg-[#f0fdf4] border border-[#3d8c5a30] p-6">
            <div className="text-sm font-mono font-bold text-[#3d8c5a] mb-5">With Bewo</div>
            <div className="space-y-4">
                {[
                    { day: "Day 1", event: "AI detects glucose trend", color: "#3d8c5a" },
                    { day: "Day 2", event: "Nurse contacted, intervention", color: "#354f8c" },
                    { day: "Day 7", event: "Patient stabilized", color: "#3d8c5a" },
                ].map(e => (
                    <div key={e.day} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                        <span className="text-[11px] font-mono font-bold w-14 shrink-0" style={{ color: e.color }}>{e.day}</span>
                        <span className="text-[13px] text-secondary">{e.event}</span>
                    </div>
                ))}
            </div>
            <div className="mt-6 pt-4 border-t border-[#3d8c5a20]">
                <div className="value-metric text-3xl text-[#3d8c5a]">$420/yr</div>
                <div className="text-xs font-mono text-tertiary mt-1">Monitoring cost per patient</div>
            </div>
        </div>
    </div>
);

export const ImpactSlide = () => (
    <SlideLayout>
        <div className="flex flex-col h-full">
            <R>
                <div className="label-section text-accent-navy mb-4">Impact</div>
            </R>

            <R d={0.08}>
                <h1 className="font-serif text-[2.8rem] font-bold tracking-tight leading-[1.08] text-primary max-w-4xl mb-4">
                    40% of ER admissions prevented.{" "}
                    <span className="text-[#3d8c5a]">$8,800 saved per patient.</span>
                </h1>
            </R>

            {/* 3 hero metrics */}
            <R d={0.15}>
                <div className="flex items-baseline gap-16 mb-8">
                    {[
                        { value: "40%", label: "Preventable ER admissions", sub: "Based on MOH data", color: "#a63d3d" },
                        { value: "48h", label: "Early crisis prediction", sub: "Monte Carlo confidence", color: "#b8860b" },
                        { value: "$8,800", label: "Saved per prevention", sub: "Average DKA admission cost", color: "#3d8c5a" },
                    ].map(s => (
                        <div key={s.label}>
                            <span className="value-metric text-4xl" style={{ color: s.color }}>{s.value}</span>
                            <div className="label-metric mt-1">{s.label}</div>
                            <div className="text-xs text-tertiary mt-0.5">{s.sub}</div>
                        </div>
                    ))}
                </div>
            </R>

            {/* Outcome comparison */}
            <R d={0.3}>
                <OutcomeComparison />
            </R>

            {/* Scale projection */}
            <R d={0.55}>
                <div className="bg-accent-highlight border border-[#354f8c20] p-5 mt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="label-section text-accent-navy mb-1">At Scale — 300,000 Patients</div>
                            <p className="text-[13px] text-secondary">Deploying across Singapore's diabetic population through Healthier SG polyclinics</p>
                        </div>
                        <div className="flex gap-10">
                            <div className="text-right">
                                <div className="value-metric text-2xl text-accent-navy">$211M</div>
                                <div className="text-[10px] font-mono text-tertiary">Annual savings</div>
                            </div>
                            <div className="text-right">
                                <div className="value-metric text-2xl text-accent-crimson">24,000</div>
                                <div className="text-[10px] font-mono text-tertiary">ER visits prevented</div>
                            </div>
                        </div>
                    </div>
                </div>
            </R>
        </div>
    </SlideLayout>
);
