import { motion } from "framer-motion";
import { SlideLayout } from "../components/layout/slide-layout";

const R = ({ children, d = 0, className }: { children: React.ReactNode; d?: number; className?: string }) => (
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: d, ease: "easeOut" }} className={className}>
        {children}
    </motion.div>
);

export const SolutionSlide = () => {
    const bars = [
        { label: "ER Admissions", pct: 61, value: "$2.44B", color: "#a63d3d" },
        { label: "Outpatient", pct: 22, value: "$0.88B", color: "#354f8c" },
        { label: "Medications", pct: 11, value: "$0.44B", color: "#b8860b" },
        { label: "Prevention", pct: 6, value: "$0.24B", color: "#3d8c5a" },
    ];

    return (
        <SlideLayout>
            <div className="flex flex-col h-full">
                <R>
                    <div className="label-section text-accent-navy mb-4">The Insight</div>
                </R>

                <R d={0.08}>
                    <h1 className="font-serif text-[3rem] font-bold tracking-tight leading-[1.08] text-primary max-w-4xl mb-8">
                        Singapore spends $4B treating crises{" "}
                        <span className="text-accent-navy">it could have predicted.</span>
                    </h1>
                </R>

                {/* Hero — expenditure bar chart */}
                <R d={0.2}>
                    <div className="mb-10">
                        <div className="flex items-baseline justify-between mb-4">
                            <span className="label-section text-primary">Annual Diabetes Expenditure — $4.0B Total</span>
                            <span className="text-sm font-mono text-accent-crimson font-bold">61% goes to emergencies that could be prevented</span>
                        </div>
                        <div className="space-y-3">
                            {bars.map(b => (
                                <div key={b.label} className="flex items-center gap-4">
                                    <span className="text-sm font-mono text-tertiary w-28 shrink-0 text-right">{b.label}</span>
                                    <div className="flex-1 bg-subtle h-10 relative overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${b.pct}%` }}
                                            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                                            className="h-full flex items-center justify-end pr-3"
                                            style={{ backgroundColor: b.color }}
                                        >
                                            <span className="text-sm font-mono font-bold text-white">{b.value}</span>
                                        </motion.div>
                                    </div>
                                    <span className="text-sm font-mono font-bold w-12 shrink-0" style={{ color: b.color }}>{b.pct}%</span>
                                </div>
                            ))}
                        </div>
                        <div className="text-xs text-tertiary font-mono mt-3">
                            Source: Singapore MOH Annual Health Statistics 2024
                        </div>
                    </div>
                </R>

                {/* Why Now — 3 cards */}
                <R d={0.5}>
                    <div className="rule-strong pt-5">
                        <div className="label-section text-accent-navy mb-4">Why Now</div>
                        <div className="grid grid-cols-3 gap-8">
                            {[
                                {
                                    pill: "Policy",
                                    title: "Healthier SG 2025",
                                    body: "$3.9B government commitment to preventive care transformation. The policy window for AI-enabled chronic disease management is open.",
                                },
                                {
                                    pill: "Data",
                                    title: "Wearable Adoption",
                                    body: "Smart Health TePP targets 250K seniors with health trackers by 2026. Continuous biometric data is available at population scale for the first time.",
                                },
                                {
                                    pill: "Regulation",
                                    title: "AI Governance Ready",
                                    body: "Singapore's AI Governance Framework provides clear guidelines for healthcare AI. Bewo is built to comply from day one — PDPA, explainability, doctor-gated.",
                                },
                            ].map(r => (
                                <div key={r.title}>
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <span className="pill bg-accent-highlight text-accent-navy">{r.pill}</span>
                                        <span className="label-section text-primary">{r.title}</span>
                                    </div>
                                    <p className="text-[13px] text-secondary leading-relaxed">{r.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </R>
            </div>
        </SlideLayout>
    );
};
