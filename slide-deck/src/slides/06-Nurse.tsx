import { motion } from "framer-motion";
import { SlideLayout } from "../components/layout/slide-layout";

const R = ({ children, d = 0, className }: { children: React.ReactNode; d?: number; className?: string }) => (
    <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45, delay: d, ease: "easeOut" }} className={className}>
        {children}
    </motion.div>
);

/* ── ReAct trace — the star of this slide ─────────────────────────── */
const ReActTrace = () => {
    const turns = [
        {
            step: "1",
            action: "OBSERVE",
            color: "#354f8c",
            content: "Patient state: WARNING (0.67). Glucose: 9.8 mmol/L (↑ 1.2 from baseline). Missed morning Metformin. Heart rate: 88 bpm. 12-day streak active. Preference: responds to voucher incentives, dislikes medical jargon.",
        },
        {
            step: "2",
            action: "THINK",
            color: "#3d8c5a",
            content: "Glucose elevated + missed medication = compounding risk. But patient has a 12-day streak worth preserving. Priority: medication reminder framed as streak protection, not medical warning. Check drug interactions before confirming.",
        },
        {
            step: "3",
            action: "ACT",
            color: "#b8860b",
            content: "→ check_drug_interactions(metformin, lisinopril) → MILD interaction, safe to proceed\n→ set_reminder(metformin, 2:00 PM) → Reminder set\n→ Monte Carlo forecast: 31% crisis probability if no intervention within 24h",
        },
        {
            step: "4",
            action: "OBSERVE",
            color: "#354f8c",
            content: "Tools executed successfully. Drug interaction: MILD (no action needed). Reminder confirmed. Forecast: 31% → 8% if medication taken within 4 hours. Voucher balance: 340 points. Next milestone: 14-day streak = 50 bonus points.",
        },
        {
            step: "5",
            action: "RESPOND",
            color: "#a63d3d",
            content: "\"Uncle Tan ah, your sugar a bit high today leh — 9.8. Morning Metformin got missed, I set reminder for 2pm already. 12-day streak still going strong! Two more days and you get 50 bonus points for the hawker voucher. 💪\"",
        },
    ];

    return (
        <div className="bg-surface border border-border-hairline p-5 relative">
            <div className="absolute top-3 right-3">
                <span className="text-[9px] font-mono font-bold text-white bg-[#3d8c5a] px-2.5 py-1 rounded-full">
                    ✓ 6-dim safety check PASSED
                </span>
            </div>
            <div className="space-y-0">
                {turns.map((t, i) => (
                    <motion.div
                        key={t.step}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 + i * 0.15, duration: 0.35 }}
                        className="flex items-stretch"
                    >
                        {/* Step indicator */}
                        <div className="w-8 shrink-0 flex flex-col items-center pt-1">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-bold text-white" style={{ backgroundColor: t.color }}>
                                {t.step}
                            </div>
                            {i < turns.length - 1 && <div className="w-px flex-1 my-1" style={{ backgroundColor: t.color + "40" }} />}
                        </div>
                        {/* Content */}
                        <div className="flex-1 pl-3 pb-3">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider" style={{ color: t.color }}>{t.action}</span>
                            <p className="text-[12px] text-secondary leading-relaxed mt-1 whitespace-pre-line">{t.content}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export const NurseSlide = () => (
    <SlideLayout>
        <div className="flex flex-col h-full">
            <R>
                <div className="label-section text-accent-navy mb-4">Technical Deep-Dive</div>
            </R>

            <R d={0.08}>
                <h1 className="font-serif text-[2.8rem] font-bold tracking-tight leading-[1.08] text-primary max-w-4xl mb-4">
                    The agent reasons in 5 steps —{" "}
                    <span className="text-accent-navy">not a chatbot, a clinical decision system.</span>
                </h1>
            </R>

            {/* Hero — ReAct trace */}
            <R d={0.2}>
                <ReActTrace />
            </R>

            {/* 3 callouts below */}
            <R d={0.7}>
                <div className="grid grid-cols-3 gap-8 mt-5">
                    {[
                        {
                            pill: "Memory",
                            title: "Remembers every patient",
                            body: "3 types: episodic (past conversations), semantic (medical facts), preference (likes/dislikes). Auto-consolidation across sessions.",
                            color: "#3d8c5a",
                        },
                        {
                            pill: "Learning",
                            title: "Tools improve over time",
                            body: "Effectiveness scored per-tool, per-patient-state. Agent learns that vouchers work for Uncle Tan but breathing exercises work for Mdm Lim.",
                            color: "#b8860b",
                        },
                        {
                            pill: "Proactive",
                            title: "Reaches out first",
                            body: "6 trigger types fire without patient input: glucose_rising, sustained_risk, logging_gap, med_nudge, streak_save, mood_followup.",
                            color: "#354f8c",
                        },
                    ].map(c => (
                        <div key={c.title}>
                            <div className="flex items-center gap-2.5 mb-2">
                                <span className="pill text-white text-[10px] font-bold px-2.5 py-0.5" style={{ backgroundColor: c.color }}>{c.pill}</span>
                                <span className="label-section text-primary">{c.title}</span>
                            </div>
                            <p className="text-[13px] text-secondary leading-relaxed">{c.body}</p>
                        </div>
                    ))}
                </div>
            </R>
        </div>
    </SlideLayout>
);
