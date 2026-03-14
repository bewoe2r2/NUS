"use client";

import { motion } from "framer-motion";
import { Activity, Award, AlertCircle, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";
import { LiveChatSim } from "@/components/live-chat-sim";
import { AgentFlow } from "@/components/agent-flow";
import { AnimatedCounter } from "@/components/animated-counter";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

const childVariant = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
  viewport: { once: true },
};

const stagger = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.06 } },
  viewport: { once: true },
};

export default function DemoPage() {
  return (
    <div className="overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-stable/6 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-gradient-to-tl from-primary/6 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted text-primary text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
              <span className="w-2 h-2 rounded-full bg-stable animate-pulse-slow" />
              Live Product Demo
            </div>
            <h1 className="text-5xl lg:text-6xl max-w-2xl mb-4 leading-[1.08]">
              A day in the life of Mdm. Tan
            </h1>
            <p className="text-lg text-ink-secondary max-w-xl leading-relaxed">
              68 years old, Type 2 Diabetes. Enhanced tier (Fitbit connected).
              Watch how Bewo&apos;s AI agent proactively manages her health — no user trigger needed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== AGENT PIPELINE ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 rounded-xl bg-primary-muted text-primary flex items-center justify-center">
            <Activity size={20} />
          </span>
          <div>
            <h2 className="text-3xl">Agent Decision Pipeline</h2>
            <p className="text-sm text-ink-secondary mt-0.5">
              From raw biomarker data to real-world action in under 3 seconds. Every step is audited.
            </p>
          </div>
        </motion.div>
        <AgentFlow />
      </section>

      {/* ===== LIVE CHAT + CONTEXT ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.62_0.14_80_/_0.08)] text-warning text-xs font-[family-name:var(--font-mono)] font-medium mb-3">
            8:30 AM — Proactive Check-in
          </div>
          <h2 className="text-3xl">AI-Initiated Conversation</h2>
          <p className="text-sm text-ink-secondary mt-1">
            Bewo detects WARNING state via Fitbit HRV + CGM glucose data. Initiates check-in without patient action.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
          <LiveChatSim />

          <motion.div {...stagger} className="space-y-5">
            {/* Behavioral Science */}
            <motion.div {...childVariant} className="bg-gradient-to-r from-warning/8 to-transparent border border-warning/20 rounded-2xl p-6">
              <div className="text-xs font-[family-name:var(--font-mono)] text-warning uppercase tracking-widest mb-3">
                Behavioral Science in Action
              </div>
              <div className="space-y-3">
                {[
                  { theory: "Prospect Theory", detail: "Counterfactual framing: \"35% to 12%\" loss-aversion trigger. Patient sees what they LOSE by not acting." },
                  { theory: "Fogg Model", detail: "Motivation (risk data) + Ability (simple action: take pill) + Trigger (proactive message at optimal time)." },
                  { theory: "Nudge Theory", detail: "Reminder set at 7 PM — learned from her historical response patterns (85% response rate at 7 PM)." },
                  { theory: "Self-Determination", detail: "Streak maintenance (6 days) gives autonomy. Food choice gives control. Voucher gives competence feedback." },
                ].map((b) => (
                  <div key={b.theory} className="flex gap-3">
                    <span className="text-warning text-xs mt-0.5">&#9656;</span>
                    <div>
                      <span className="text-xs font-semibold text-ink">{b.theory}: </span>
                      <span className="text-xs text-ink-secondary leading-relaxed">{b.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Streaks + Voucher */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div {...childVariant} className="bg-surface-card border border-border rounded-2xl p-5">
                <div className="text-xs font-[family-name:var(--font-mono)] text-ink-muted uppercase tracking-widest mb-3">Active Streaks</div>
                <div className="space-y-2">
                  {[
                    { label: "Medication", days: 6, accent: "text-primary" },
                    { label: "Glucose Log", days: 14, accent: "text-stable" },
                    { label: "App Login", days: 9, accent: "text-warning" },
                  ].map((s) => (
                    <div key={s.label} className="flex justify-between items-center">
                      <span className="text-xs text-ink-secondary">{s.label}</span>
                      <span className={`font-[family-name:var(--font-mono)] font-bold text-lg ${s.accent}`}>
                        <AnimatedCounter value={s.days} />
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div {...childVariant} className="bg-gradient-to-b from-stable/8 to-transparent border border-stable/20 rounded-2xl p-5">
                <div className="text-xs font-[family-name:var(--font-mono)] text-stable uppercase tracking-widest mb-2">Weekly Voucher</div>
                <div className="text-3xl font-[family-name:var(--font-mono)] font-bold text-stable mb-1">
                  S$<AnimatedCounter value={4.50} decimals={2} />
                </div>
                <div className="text-xs text-ink-secondary">Decays S$0.25/missed action</div>
                <div className="text-[10px] text-ink-muted mt-2 font-[family-name:var(--font-mono)]">
                  Loss aversion: 2-2.5x stronger than gain framing (Kahneman 1979)
                </div>
              </motion.div>
            </div>

            {/* Patient Tiers */}
            <motion.div {...childVariant} className="bg-surface-card border border-border rounded-2xl p-5">
              <div className="text-xs font-[family-name:var(--font-mono)] text-ink-muted uppercase tracking-widest mb-3">Patient Data Tiers</div>
              <div className="space-y-2">
                {[
                  { tier: "BASIC", data: "Phone only — 9 features via phone sensors + manual entry", features: "9/9 phone", accent: "text-ink-secondary" },
                  { tier: "ENHANCED", data: "Phone + Fitbit — 4 features (HR, HRV, sleep, steps) auto-synced", features: "5/9 passive", accent: "text-primary", active: true },
                  { tier: "PREMIUM", data: "Phone + Fitbit + CGM — adds real-time glucose + variability", features: "7/9 passive", accent: "text-stable" },
                ].map((t) => (
                  <div key={t.tier} className={`flex items-center gap-3 p-2 rounded-lg ${t.active ? "bg-primary-muted" : ""}`}>
                    <span className={`text-[10px] font-[family-name:var(--font-mono)] font-bold ${t.accent} w-[64px]`}>{t.tier}</span>
                    <span className="text-xs text-ink-secondary flex-1">{t.data}</span>
                    <span className="text-[10px] font-[family-name:var(--font-mono)] text-ink-muted">{t.features}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== COST COMPARISON ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="grid md:grid-cols-2 gap-5">
          <div className="bg-surface-card border border-crisis/20 rounded-2xl p-6 border-t-[3px] border-t-crisis">
            <div className="font-[family-name:var(--font-mono)] text-xs text-crisis font-bold tracking-widest mb-3">WITHOUT BEWO</div>
            <p className="text-sm text-ink-secondary leading-relaxed">Glucose spike unnoticed for 6 weeks. Missed medications compound. ER admission at 3 AM.</p>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-baseline gap-3">
              <span className="font-[family-name:var(--font-mono)] font-bold text-2xl text-crisis">S$8,800</span>
              <span className="text-xs text-ink-muted">mean inpatient cost per admitted T2DM patient (PLOS One / NHG 2015)</span>
            </div>
          </div>

          <div className="bg-surface-card border border-stable/20 rounded-2xl p-6 border-t-[3px] border-t-stable">
            <div className="font-[family-name:var(--font-mono)] text-xs text-stable font-bold tracking-widest mb-3">WITH BEWO</div>
            <p className="text-sm text-ink-secondary leading-relaxed">AI detected WARNING at 6 AM. Check-in at 8:30 AM. Medication reminded. Crisis prevented. Streak continues.</p>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-baseline gap-3">
              <span className="font-[family-name:var(--font-mono)] font-bold text-2xl text-stable">~S$0.01</span>
              <span className="text-xs text-ink-muted">estimated cost per AI interaction (Gemini Flash)</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== NURSE DASHBOARD — dark ===== */}
      <section className="relative py-20 mb-24">
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.14_0.03_260)] via-[oklch(0.16_0.04_260)] to-[oklch(0.12_0.03_260)] rounded-3xl mx-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[oklch(0.45_0.12_185_/_0.04)] rounded-full blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto px-12 relative z-10">
          <motion.div {...fadeUp} className="mb-10">
            <div className="font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-[oklch(0.60_0.08_260)] mb-3 uppercase">Nurse Dashboard</div>
            <h2 className="text-3xl text-white mb-2">Clinical Oversight View</h2>
            <p className="text-sm text-[oklch(0.62_0.015_260)]">
              7 alert sources unified. Priority-sorted. AI-triaged. Caregiver fatigue detection.
            </p>
          </motion.div>

          {/* Alert Queue */}
          <motion.div {...fadeUp} className="bg-[oklch(0.20_0.04_260)] rounded-2xl border border-[oklch(0.28_0.04_260)] p-6 mb-6">
            <div className="text-xs font-[family-name:var(--font-mono)] text-[oklch(0.50_0.04_260)] uppercase tracking-widest mb-4">Priority Alert Queue</div>
            {[
              { priority: "CRITICAL", patient: "Mr. Lim (P003)", message: "Glucose >15 mmol/L for 6h. 3 missed medications. Family auto-alerted via SMS + voice call.", time: "2 min ago", accent: "text-crisis", icon: AlertCircle },
              { priority: "WARNING", patient: "Mdm. Tan (P001)", message: "WARNING state (72%). Missed evening med. Counterfactual shown \u2014 patient complied. SBAR generated.", time: "15 min ago", accent: "text-warning", icon: Activity },
              { priority: "INFO", patient: "Mr. Goh (P007)", message: "Weekly report: Grade A. 14-day medication streak. Engagement score: 94/100 (Champion).", time: "1 hr ago", accent: "text-stable", icon: Award },
            ].map((alert, i) => (
              <div key={i} className={`flex gap-3 py-3 items-start ${i < 2 ? "border-b border-[oklch(0.26_0.03_260)]" : ""}`}>
                <span className={`w-7 h-7 rounded-lg bg-[oklch(0.24_0.04_260)] ${alert.accent} flex items-center justify-center shrink-0`}>
                  <alert.icon size={13} />
                </span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-sm font-semibold text-white">{alert.patient}</span>
                    <span className={`text-[10px] font-[family-name:var(--font-mono)] font-bold ${alert.accent}`}>{alert.priority}</span>
                  </div>
                  <div className="text-xs text-[oklch(0.65_0.01_260)] leading-relaxed">{alert.message}</div>
                  <div className="text-[10px] text-[oklch(0.45_0.01_260)] mt-1">{alert.time}</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Patient Cards */}
          <motion.div {...stagger} className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Mdm. Tan", age: 68, state: "WARNING", risk: 35, streak: "6 days", engagement: 78, engLabel: "Strong", tier: "Enhanced", accent: "text-warning", borderAccent: "border-warning", dotBg: "bg-warning" },
              { name: "Mr. Lim", age: 72, state: "CRISIS", risk: 78, streak: "0 days", engagement: 22, engLabel: "Disengaging", tier: "Premium", accent: "text-crisis", borderAccent: "border-crisis", dotBg: "bg-crisis" },
              { name: "Mr. Goh", age: 65, state: "STABLE", risk: 5, streak: "14 days", engagement: 94, engLabel: "Champion", tier: "Basic", accent: "text-stable", borderAccent: "border-stable", dotBg: "bg-stable" },
            ].map((p) => (
              <motion.div key={p.name} {...childVariant} className={`bg-[oklch(0.20_0.04_260)] rounded-2xl border border-[oklch(0.28_0.04_260)] p-6 border-t-[3px] ${p.borderAccent}`}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-sm font-semibold text-white">{p.name}</div>
                    <div className="text-[10px] text-[oklch(0.48_0.01_260)]">Age {p.age}, T2DM \u00B7 {p.tier}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${p.dotBg} animate-pulse-slow`} />
                    <span className={`text-xs font-[family-name:var(--font-mono)] font-bold ${p.accent}`}>{p.state}</span>
                  </div>
                </div>

                <div className="text-xs text-[oklch(0.65_0.01_260)] mb-3">
                  <div className="flex justify-between py-1.5 border-b border-[oklch(0.25_0.03_260)]">
                    <span>Crisis Risk (48h)</span>
                    <span className={`font-[family-name:var(--font-mono)] font-bold ${p.accent}`}>
                      <AnimatedCounter value={p.risk} suffix="%" />
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[oklch(0.25_0.03_260)]">
                    <span>Med Streak</span>
                    <span className="font-[family-name:var(--font-mono)] font-medium text-[oklch(0.80_0.01_260)]">{p.streak}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Engagement</span>
                    <span className="font-[family-name:var(--font-mono)] font-medium text-[oklch(0.80_0.01_260)]">{p.engLabel}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-[oklch(0.45_0.01_260)]">Engagement Score</span>
                    <span className={`font-[family-name:var(--font-mono)] ${p.accent}`}>{p.engagement}/100</span>
                  </div>
                  <div className="h-1.5 bg-[oklch(0.25_0.03_260)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${p.engagement}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
                      className={`h-full ${p.dotBg} rounded-full`}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== WEEKLY REPORT ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="flex items-center gap-3 mb-8">
          <span className="w-10 h-10 rounded-xl bg-primary-muted text-primary flex items-center justify-center">
            <BarChart3 size={20} />
          </span>
          <div>
            <h2 className="text-3xl">Auto-Generated Weekly Report</h2>
            <p className="text-sm text-ink-secondary mt-0.5">Sent every Sunday. Includes letter grade (A/B/C/D), glucose stats, and achievements.</p>
          </div>
        </motion.div>

        <motion.div {...fadeUp} className="bg-surface-card border border-border rounded-2xl p-8 max-w-4xl">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-border-subtle">
            <div>
              <div className="text-base font-bold font-[family-name:var(--font-display)]">Mdm. Tan \u2014 Weekly Health Summary</div>
              <div className="text-xs text-ink-muted font-[family-name:var(--font-mono)]">Week of Feb 14, 2026 \u2014 Auto-generated by Bewo Agent</div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-[oklch(0.52_0.14_160_/_0.06)] flex items-center justify-center">
              <span className="text-3xl font-[family-name:var(--font-mono)] font-bold text-stable">B+</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Avg Glucose", value: 7.8, suffix: " mmol/L", status: "In range", accent: "text-stable", border: "border-stable", decimals: 1 },
              { label: "Avg Steps", value: 4200, suffix: "", status: "84% of goal", accent: "text-primary", border: "border-primary", decimals: 0 },
              { label: "Med Adherence", value: 86, suffix: "%", status: "6-day streak", accent: "text-stable", border: "border-stable", decimals: 0 },
              { label: "Agent Actions", value: 23, suffix: "", status: "91% success", accent: "text-primary", border: "border-primary", decimals: 0 },
            ].map((m) => (
              <div key={m.label} className={`p-4 bg-surface-raised rounded-xl border-l-[3px] ${m.border}`}>
                <div className="text-[10px] uppercase text-ink-muted tracking-wide mb-1">{m.label}</div>
                <div className="text-lg font-[family-name:var(--font-mono)] font-bold">
                  <AnimatedCounter value={m.value} suffix={m.suffix} decimals={m.decimals} />
                </div>
                <div className={`text-xs ${m.accent} font-medium mt-0.5`}>{m.status}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-ink-muted mb-2">Achievements This Week</div>
            <div className="flex gap-2 flex-wrap">
              {["6-day medication streak!", "Met step goal 5/7 days", "Glucose in range 6/7 days", "Completed 4 daily challenges"].map((b) => (
                <span key={b} className="text-xs px-2.5 py-1 rounded-full bg-[oklch(0.52_0.14_160_/_0.08)] text-stable font-[family-name:var(--font-mono)] font-medium">{b}</span>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== CTA ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <motion.div {...fadeUp} className="text-center py-12">
          <h2 className="text-3xl mb-3">Dive Into the Architecture</h2>
          <p className="text-ink-secondary mb-6 max-w-md mx-auto">
            See the exact HMM parameters, transition matrix, and all 16 tools under the hood.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/technology" className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary-glow hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
              Technical Deep-Dive
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/impact" className="inline-flex items-center gap-2 px-8 py-4 border border-primary/30 text-primary rounded-xl font-semibold hover:bg-primary-muted transition-all duration-200">
              Blue Ocean Analysis
              <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
