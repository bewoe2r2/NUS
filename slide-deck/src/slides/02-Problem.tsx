import { motion } from "framer-motion";
import { SlideLayout } from "../components/layout/slide-layout";

const R = ({ children, d = 0, className }: { children: React.ReactNode; d?: number; className?: string }) => (
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: d, ease: "easeOut" }} className={className}>
        {children}
    </motion.div>
);

/* ── Patient journey timeline ─────────────────────────────────────── */
const PatientTimeline = () => {
    const events = [
        { day: "Day 1", label: "Glucose starts rising", detail: "Fasting: 7.2 → 8.1 mmol/L", missed: true, color: "#b8860b" },
        { day: "Day 14", label: "Sustained elevation", detail: "HbA1c trending upward", missed: true, color: "#b8860b" },
        { day: "Day 45", label: "Numbness in feet", detail: "Neuropathy beginning", missed: true, color: "#a63d3d" },
        { day: "Day 90", label: "Scheduled clinic visit", detail: "Doctor finally sees her", missed: false, color: "#354f8c" },
        { day: "Day 91", label: "ER admission — DKA", detail: "$8,800 hospital bill", missed: false, color: "#a63d3d" },
    ];
    return (
        <div className="py-8">
            <div className="flex items-start relative">
                {/* Connecting line */}
                <div className="absolute top-[18px] left-[40px] right-[40px] h-[2px] bg-border-hairline" />
                {events.map((e, i) => (
                    <div key={e.day} className="flex-1 relative flex flex-col items-center text-center px-2">
                        {/* Node */}
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            transition={{ delay: 0.4 + i * 0.15, type: "spring", stiffness: 200 }}
                            className={`relative z-10 w-9 h-9 rounded-full border-[3px] flex items-center justify-center ${
                                e.missed ? "bg-white" : ""
                            }`}
                            style={{
                                borderColor: e.color,
                                backgroundColor: e.missed ? "white" : e.color,
                            }}
                        >
                            {!e.missed && <div className="w-2 h-2 rounded-full bg-white" />}
                        </motion.div>
                        {/* Labels */}
                        <div className="mt-3">
                            <div className="text-xs font-mono font-bold" style={{ color: e.color }}>{e.day}</div>
                            <div className="text-[13px] text-primary font-medium leading-tight mt-1">{e.label}</div>
                            <div className="text-[11px] text-tertiary mt-0.5">{e.detail}</div>
                            {e.missed && (
                                <div className="mt-1.5">
                                    <span className="text-[10px] font-mono font-bold text-accent-crimson uppercase tracking-wider bg-[#fdf2f2] px-2 py-0.5">
                                        No one watching
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ProblemSlide = () => (
    <SlideLayout>
        <div className="flex flex-col h-full">
            <R>
                <div className="label-section text-accent-crimson mb-4">The Problem</div>
            </R>

            <R d={0.08}>
                <h1 className="font-serif text-[3rem] font-bold tracking-tight leading-[1.08] text-primary max-w-3xl mb-2">
                    Mdm Tan, 72. Her glucose was rising for 45 days.{" "}
                    <span className="text-accent-crimson">Nobody noticed.</span>
                </h1>
            </R>

            {/* Hero — patient journey timeline */}
            <R d={0.2}>
                <PatientTimeline />
            </R>

            {/* 3 problem cards */}
            <R d={0.4}>
                <div className="rule-strong" />
            </R>
            <div className="grid grid-cols-3 gap-0 mt-1">
                {[
                    {
                        title: "Manual logging fails",
                        stat: "67%",
                        body: "of patients abandon health apps within 3 months. The elderly never start. Current tools assume digital literacy that 72% of seniors don't have.",
                        color: "#a63d3d",
                    },
                    {
                        title: "Reactive care model",
                        stat: "180 days",
                        body: "between clinic visits. A crisis develops in 48 hours. 85% of diabetic complications are detectable weeks before clinical presentation — if anyone is watching.",
                        color: "#b8860b",
                    },
                    {
                        title: "Nurse overload",
                        stat: "1 : 100",
                        body: "nurse to patient ratio. No triage tools. No predictive data. It takes 15 minutes to manually review one patient. 100 patients = 25 hours/day. Impossible.",
                        color: "#354f8c",
                    },
                ].map((p, i) => (
                    <R key={p.title} d={0.45 + i * 0.08}>
                        <div className={`pt-5 pb-4 ${i > 0 ? "pl-8 border-l border-border-hairline" : ""} ${i < 2 ? "pr-8" : ""}`}>
                            <div className="value-metric text-2xl mb-1" style={{ color: p.color }}>{p.stat}</div>
                            <h3 className="font-serif text-lg font-bold text-primary mb-2">{p.title}</h3>
                            <p className="text-[13px] text-secondary leading-relaxed">{p.body}</p>
                        </div>
                    </R>
                ))}
            </div>
        </div>
    </SlideLayout>
);
