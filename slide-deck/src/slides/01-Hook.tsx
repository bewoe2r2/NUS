import { motion } from "framer-motion";
import { SlideLayout } from "../components/layout/slide-layout";
import { PhoneMockup } from "../components/ui/mockups";

const R = ({ children, d = 0, className }: { children: React.ReactNode; d?: number; className?: string }) => (
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: d, ease: "easeOut" }} className={className}>
        {children}
    </motion.div>
);

export const HookSlide = () => (
    <SlideLayout>
        <div className="flex flex-col justify-center h-full">
            <R>
                <div className="label-section text-accent-crimson mb-6">Singapore's Silent Crisis</div>
            </R>

            <R d={0.1}>
                <h1 className="font-serif font-bold tracking-tight leading-[1.0] text-primary mb-12 max-w-4xl">
                    <span className="text-[3.8rem] block">Every 6 months, a doctor checks.</span>
                    <span className="text-[3.8rem] text-accent-crimson block">Every 6 hours, a crisis begins.</span>
                </h1>
            </R>

            {/* Hero — the gap vs. continuous monitoring */}
            <R d={0.2}>
                <div className="grid grid-cols-[1fr_2px_280px] gap-10 items-center mb-14">
                    <div className="space-y-6">
                        <div className="flex items-end gap-3">
                            <span className="text-[7rem] font-serif font-bold text-accent-crimson leading-none">180</span>
                            <div className="pb-3">
                                <div className="text-2xl font-serif font-bold text-primary">days</div>
                                <div className="text-sm text-secondary">between clinic visits</div>
                            </div>
                        </div>
                        {/* Visual timeline */}
                        <div className="relative h-4">
                            <div className="absolute inset-0 bg-subtle rounded-full" />
                            <motion.div className="absolute left-0 top-0 h-full rounded-full" style={{ background: "linear-gradient(90deg, #e5e5e5 0%, #a63d3d40 50%, #e5e5e5 100%)" }}
                                initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1, delay: 0.5 }} />
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-accent-navy border-2 border-white shadow-md" />
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-accent-navy border-2 border-white shadow-md" />
                            <motion.div className="absolute left-[35%] top-1/2 -translate-y-1/2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1, type: "spring" }}>
                                <div className="w-6 h-6 rounded-full bg-accent-crimson border-2 border-white shadow-md flex items-center justify-center">
                                    <span className="text-[9px] text-white font-bold">!</span>
                                </div>
                            </motion.div>
                        </div>
                        <div className="flex gap-8 text-xs text-tertiary">
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-accent-navy" /> Clinic visit</div>
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-accent-crimson" /> Crisis develops undetected</div>
                            <div className="text-accent-crimson font-mono font-bold">A patient can deteriorate and recover without anyone knowing.</div>
                        </div>
                    </div>

                    <div className="h-52 bg-border-hairline" />

                    <div>
                        <div className="label-metric text-accent-navy mb-3">Bewo monitors continuously</div>
                        <PhoneMockup src="/app-shots/patient-hero.png" alt="Bewo real-time dashboard" />
                    </div>
                </div>
            </R>

            {/* 3 anchor stats */}
            <R d={0.4}>
                <div className="rule-strong pt-5">
                    <div className="flex items-baseline gap-16">
                        {[
                            { value: "$4B", label: "Annual SG diabetes spend", sub: "61% goes to emergency treatment" },
                            { value: "40%", label: "Preventable ER admissions", sub: "Avoidable with early detection" },
                            { value: "440K", label: "Diabetic patients in Singapore", sub: "1 in 5 adults over 60" },
                        ].map(s => (
                            <div key={s.label}>
                                <span className="value-metric text-3xl text-accent-crimson">{s.value}</span>
                                <div className="label-metric mt-1">{s.label}</div>
                                <div className="text-xs text-tertiary mt-0.5">{s.sub}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </R>
        </div>

        <div className="absolute bottom-5 left-slide-p right-slide-p flex justify-between items-center border-t border-border-hairline pt-3">
            <span className="label-metric text-tertiary">NUS &times; Synapxe &times; IMDA &middot; AI Innovation Challenge 2026</span>
            <span className="font-serif text-base font-bold text-primary tracking-tight">Bewo</span>
        </div>
    </SlideLayout>
);
