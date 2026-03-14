import { motion } from "framer-motion";
import { SlideLayout } from "../components/layout/slide-layout";
import { BrowserMockup } from "../components/ui/mockups";

const R = ({ children, d = 0, className }: { children: React.ReactNode; d?: number; className?: string }) => (
    <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45, delay: d, ease: "easeOut" }} className={className}>
        {children}
    </motion.div>
);

/* ── 4-Layer architecture stack ───────────────────────────────────── */
const ArchStack = () => {
    const layers = [
        {
            label: "Interface",
            color: "#a63d3d",
            sub: "User-facing apps",
            items: ["Patient Companion — Singlish AI chat, risk dashboard, voucher rewards", "Nurse Dashboard — Multi-patient triage, SBAR, drug checker", "Judge Console — 5 scenarios, pipeline inspection, audit trail", "Caregiver Portal — Bidirectional alerts, burden assessment"],
        },
        {
            label: "Agent",
            color: "#3d8c5a",
            sub: "Agentic AI runtime",
            items: ["5-Turn ReAct Loop — Observe → Think → Act → Observe → Respond", "18 AI Tools — book, alert, award, check drugs, celebrate, report...", "Cross-Session Memory — Episodic + Semantic + Preference types", "Safety Classifier — 6-dimension pre-delivery filter"],
        },
        {
            label: "Intelligence",
            color: "#b8860b",
            sub: "ML prediction",
            items: ["Hidden Markov Model — 3-state Viterbi + per-patient Baum-Welch", "Monte Carlo Forecast — 1,000 simulations, 48h crisis probability", "Merlion Anomaly Detection — Biometric time-series scoring", "Proactive Scheduler — 6 trigger types, no patient input needed"],
        },
        {
            label: "Data",
            color: "#354f8c",
            sub: "Foundation",
            items: ["35 SQLite Tables — Patients, vitals, meds, memory, safety, tools...", "53 API Routes — RESTful FastAPI + Pydantic validation", "Wearable Pipeline — Continuous glucose, HR, SpO2, BP, steps, sleep", "Event-Driven Scheduler — Cron + real-time trigger orchestration"],
        },
    ];

    return (
        <div className="space-y-1.5">
            {layers.map((layer, li) => (
                <motion.div
                    key={layer.label}
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + li * 0.1, duration: 0.4 }}
                    className="bg-surface border border-border-hairline overflow-hidden"
                >
                    <div className="flex items-stretch">
                        <div className="w-28 shrink-0 flex flex-col items-center justify-center py-2.5" style={{ backgroundColor: layer.color }}>
                            <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">{layer.label}</span>
                            <span className="text-[8px] text-white/70 font-mono">{layer.sub}</span>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-0">
                            {layer.items.map((item, ii) => {
                                const [name, desc] = item.split(" — ");
                                return (
                                    <div key={item} className={`px-3 py-2 ${ii % 2 !== 0 ? "border-l border-border-hairline" : ""} ${ii >= 2 ? "border-t border-border-hairline" : ""}`}>
                                        <div className="text-[10px] font-mono font-bold" style={{ color: layer.color }}>{name}</div>
                                        <p className="text-[9px] text-secondary leading-tight">{desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

/* ── Code metrics strip ───────────────────────────────────────────── */
const CodeMetrics = () => (
    <div className="flex items-center justify-between bg-subtle border border-border-hairline px-5 py-3">
        {[
            { v: "20K+", l: "Lines of code", color: "#354f8c" },
            { v: "53", l: "API routes", color: "#354f8c" },
            { v: "35", l: "DB tables", color: "#b8860b" },
            { v: "18", l: "AI tools", color: "#3d8c5a" },
            { v: "6", l: "Safety checks", color: "#a63d3d" },
            { v: "5", l: "ReAct turns", color: "#354f8c" },
        ].map(m => (
            <div key={m.l} className="text-center">
                <div className="value-metric text-base" style={{ color: m.color }}>{m.v}</div>
                <div className="text-[9px] font-mono text-tertiary">{m.l}</div>
            </div>
        ))}
    </div>
);

export const PatientSlide = () => (
    <SlideLayout>
        <div className="flex flex-col h-full">
            <div className="flex items-start justify-between mb-2">
                <div>
                    <R><div className="label-section text-accent-navy mb-2">Architecture</div></R>
                    <R d={0.06}>
                        <h1 className="font-serif text-[2.6rem] font-bold tracking-tight leading-[1.05] text-primary">
                            4-layer AI pipeline.{" "}
                            <span className="text-tertiary">Data → Intelligence → Agent → Interface.</span>
                        </h1>
                    </R>
                </div>
                <R d={0.1}>
                    <div className="flex gap-2 shrink-0 ml-4">
                        {["Diamond v7", "Production-Grade"].map(b => (
                            <span key={b} className="pill bg-accent-highlight text-accent-navy">{b}</span>
                        ))}
                    </div>
                </R>
            </div>

            {/* Architecture stack */}
            <R d={0.15}>
                <ArchStack />
            </R>

            {/* Bottom: metrics + judge screenshot */}
            <div className="grid grid-cols-[1fr_320px] gap-4 mt-3">
                <R d={0.5}>
                    <CodeMetrics />
                </R>
                <R d={0.55}>
                    <div>
                        <div className="label-metric text-accent-navy mb-1">Live Simulation Console</div>
                        <BrowserMockup src="/app-shots/judge-overview.png" url="bewo.health/judge" className="w-full" />
                    </div>
                </R>
            </div>
        </div>
    </SlideLayout>
);
