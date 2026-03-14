import { motion } from "framer-motion";
import { SlideLayout } from "../components/layout/slide-layout";

const R = ({ children, d = 0, className }: { children: React.ReactNode; d?: number; className?: string }) => (
    <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45, delay: d, ease: "easeOut" }} className={className}>
        {children}
    </motion.div>
);

/* ── Safety pipeline ──────────────────────────────────────────────── */
const SafetyPipeline = () => {
    const checks = [
        { label: "Medical\nClaims", desc: "Verify factual accuracy", color: "#a63d3d" },
        { label: "Emotional\nMatch", desc: "Tone matches patient state", color: "#b8860b" },
        { label: "Hallucination", desc: "No fabricated information", color: "#354f8c" },
        { label: "Cultural", desc: "Appropriate for context", color: "#3d8c5a" },
        { label: "Scope", desc: "Within system boundaries", color: "#8585a0" },
        { label: "Dangerous\nContent", desc: "No harmful suggestions", color: "#a63d3d" },
    ];

    return (
        <div className="bg-surface border border-border-hairline p-6">
            <div className="flex items-center gap-4">
                {/* Input */}
                <div className="bg-[#f0f0f5] border border-border-hairline px-4 py-3 text-center shrink-0">
                    <div className="text-[10px] font-mono font-bold text-tertiary">Agent</div>
                    <div className="text-[10px] font-mono text-tertiary">Response</div>
                </div>

                <span className="text-tertiary font-bold text-lg">→</span>

                {/* 6 checkboxes */}
                <div className="flex-1 flex gap-2">
                    {checks.map((c, i) => (
                        <motion.div
                            key={c.label}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 200 }}
                            className="flex-1 text-center"
                        >
                            <div className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-white text-sm font-bold mb-1.5" style={{ backgroundColor: c.color }}>
                                ✓
                            </div>
                            <div className="text-[9px] font-mono font-bold whitespace-pre-line leading-tight" style={{ color: c.color }}>{c.label}</div>
                            <div className="text-[8px] text-tertiary mt-0.5">{c.desc}</div>
                        </motion.div>
                    ))}
                </div>

                <span className="text-tertiary font-bold text-lg">→</span>

                {/* Output */}
                <div className="bg-[#f0fdf4] border border-[#3d8c5a40] px-4 py-3 text-center shrink-0">
                    <div className="text-[10px] font-mono font-bold text-[#3d8c5a]">Delivery</div>
                    <div className="text-[10px] font-mono text-[#3d8c5a]">or Block</div>
                </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center justify-center gap-8 mt-5 pt-4 border-t border-border-hairline">
                <div className="text-center">
                    <span className="value-metric text-xl text-accent-crimson">4.2%</span>
                    <div className="text-[10px] font-mono text-tertiary">responses blocked & regenerated</div>
                </div>
                <div className="text-center">
                    <span className="value-metric text-xl text-[#3d8c5a]">0</span>
                    <div className="text-[10px] font-mono text-tertiary">unsafe deliveries</div>
                </div>
                <div className="text-center">
                    <span className="value-metric text-xl text-accent-navy">100%</span>
                    <div className="text-[10px] font-mono text-tertiary">full audit trail</div>
                </div>
            </div>
        </div>
    );
};

/* ── 3 trust pillars ──────────────────────────────────────────────── */
const TrustPillars = () => {
    const pillars = [
        {
            icon: "🔒",
            title: "PDPA Compliant",
            color: "#354f8c",
            body: "Encrypted at rest and in transit. Consent management built-in. No PII in logs. Data sovereignty maintained in Singapore.",
        },
        {
            icon: "📋",
            title: "SG AI Framework Aligned",
            color: "#3d8c5a",
            body: "Explainable decisions with full audit trail. Fairness-tested across demographics. Transparency reports for every interaction.",
        },
        {
            icon: "👨‍⚕",
            title: "Doctor-Gated",
            color: "#a63d3d",
            body: "All medication changes require clinician approval. AI suggests, doctor decides. Zero autonomous prescribing. Nurse-in-the-loop for critical alerts.",
        },
    ];

    return (
        <div className="grid grid-cols-3 gap-8">
            {pillars.map(p => (
                <div key={p.title}>
                    <div className="flex items-center gap-2.5 mb-3">
                        <span className="text-xl">{p.icon}</span>
                        <span className="label-section font-bold" style={{ color: p.color }}>{p.title}</span>
                    </div>
                    <p className="text-[13px] text-secondary leading-relaxed">{p.body}</p>
                </div>
            ))}
        </div>
    );
};

export const SafetySlide = () => (
    <SlideLayout>
        <div className="flex flex-col h-full">
            <R>
                <div className="label-section text-accent-navy mb-4">Safety & Trust</div>
            </R>

            <R d={0.08}>
                <h1 className="font-serif text-[2.8rem] font-bold tracking-tight leading-[1.08] text-primary max-w-4xl mb-8">
                    Every AI response passes 6 safety checks{" "}
                    <span className="text-accent-crimson">before reaching a patient.</span>
                </h1>
            </R>

            {/* Hero — safety pipeline */}
            <R d={0.2}>
                <SafetyPipeline />
            </R>

            {/* Trust pillars */}
            <R d={0.6}>
                <div className="rule-strong pt-6 mt-6">
                    <TrustPillars />
                </div>
            </R>
        </div>
    </SlideLayout>
);
