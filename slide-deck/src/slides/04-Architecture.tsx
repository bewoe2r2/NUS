import { motion } from "framer-motion";
import { SlideLayout } from "../components/layout/slide-layout";
import { PhoneMockup, BrowserMockup } from "../components/ui/mockups";

const R = ({ children, d = 0, className }: { children: React.ReactNode; d?: number; className?: string }) => (
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: d, ease: "easeOut" }} className={className}>
        {children}
    </motion.div>
);

/* ── Pipeline flow diagram ────────────────────────────────────────── */
const PipelineFlow = () => {
    const stages = [
        { label: "Wearable\nData", desc: "Glucose, HR, SpO2, BP, steps, sleep", color: "#354f8c", icon: "⌚" },
        { label: "HMM\nEngine", desc: "3-state Viterbi + Baum-Welch learning", color: "#b8860b", icon: "📊" },
        { label: "48h\nForecast", desc: "1,000 Monte Carlo crisis simulations", color: "#a63d3d", icon: "⚡" },
        { label: "AI\nAgent", desc: "5-turn ReAct with 18 tools + memory", color: "#3d8c5a", icon: "🤖" },
        { label: "Safety\nFilter", desc: "6-dimension check before delivery", color: "#8585a0", icon: "🛡" },
        { label: "Patient\nNurse\nCaregiver", desc: "Personalized, culturally-adapted action", color: "#354f8c", icon: "👥" },
    ];

    return (
        <div className="relative py-6">
            {/* Connection line */}
            <div className="absolute top-1/2 left-[60px] right-[60px] h-[3px] bg-border-hairline -translate-y-1/2" />
            <div className="flex justify-between relative">
                {stages.map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 180 }}
                        className="flex flex-col items-center text-center w-[130px]"
                    >
                        <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center text-xl shadow-sm relative z-10"
                            style={{ backgroundColor: s.color }}
                        >
                            <span className="text-white">{s.icon}</span>
                        </div>
                        <div className="mt-2 text-[11px] font-mono font-bold text-primary whitespace-pre-line leading-tight">{s.label}</div>
                        <div className="mt-1 text-[10px] text-tertiary leading-tight max-w-[120px]">{s.desc}</div>
                        {i < stages.length - 1 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + i * 0.1 }}
                                className="absolute top-[28px] text-tertiary text-lg font-bold"
                                style={{ left: `calc(${((i + 1) / stages.length) * 100}% - 8px)` }}
                            >
                                →
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

/* ── Three pillars ────────────────────────────────────────────────── */
const ThreePillars = () => {
    const pillars = [
        {
            title: "Predict",
            color: "#a63d3d",
            stat: "48h",
            statLabel: "early warning",
            body: "Hidden Markov Model with Baum-Welch training + Monte Carlo simulation. Not dashboards \u2014 real probabilistic forecasting of crisis events.",
        },
        {
            title: "Personalize",
            color: "#3d8c5a",
            stat: "18",
            statLabel: "AI tools",
            body: "5-turn ReAct agent with cross-session memory. Speaks Singlish. Remembers Uncle Tan hates needles and responds best to voucher incentives.",
        },
        {
            title: "Prioritize",
            color: "#354f8c",
            stat: "1:100+",
            statLabel: "nurse ratio enabled",
            body: "Auto-triage across all patients. SBAR reports generated instantly. Drug interactions flagged. One nurse can now manage 100+ patients effectively.",
        },
    ];

    return (
        <div className="grid grid-cols-3 gap-8">
            {pillars.map(p => (
                <div key={p.title} className="relative">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="pill text-white text-xs font-bold px-3 py-1" style={{ backgroundColor: p.color }}>{p.title}</span>
                    </div>
                    <div className="value-metric text-3xl mb-1" style={{ color: p.color }}>{p.stat}</div>
                    <div className="text-xs font-mono text-tertiary mb-3">{p.statLabel}</div>
                    <p className="text-[13px] text-secondary leading-relaxed">{p.body}</p>
                </div>
            ))}
        </div>
    );
};

export const ArchitectureSlide = () => (
    <SlideLayout>
        <div className="flex flex-col h-full">
            <R>
                <div className="label-section text-accent-navy mb-4">The Solution</div>
            </R>

            <R d={0.08}>
                <h1 className="font-serif text-[3rem] font-bold tracking-tight leading-[1.08] text-primary max-w-4xl mb-2">
                    Bewo predicts diabetes crises 48 hours{" "}
                    <span className="text-accent-crimson">before they happen.</span>
                </h1>
            </R>

            {/* Hero — pipeline flow */}
            <R d={0.2}>
                <PipelineFlow />
            </R>

            {/* 3 pillars */}
            <R d={0.4}>
                <div className="rule-strong pt-5 mb-8">
                    <ThreePillars />
                </div>
            </R>

            {/* Product screenshots */}
            <R d={0.55}>
                <div className="grid grid-cols-[200px_1fr] gap-6 items-end">
                    <div>
                        <div className="label-metric text-accent-navy mb-2">Patient Companion</div>
                        <PhoneMockup src="/app-shots/patient-hero.png" alt="Bewo patient app" />
                    </div>
                    <div>
                        <div className="label-metric text-accent-navy mb-2">Clinical Dashboard</div>
                        <BrowserMockup src="/app-shots/nurse-full.png" url="bewo.health/clinical" className="w-full" />
                    </div>
                </div>
            </R>
        </div>
    </SlideLayout>
);
