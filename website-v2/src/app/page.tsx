"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Watch, Mic, Smartphone, Zap, Brain, Shield, Heart } from "lucide-react";
import Link from "next/link";
import { AnimatedCounter } from "@/components/animated-counter";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

const stagger = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.08 } },
  viewport: { once: true },
};

const childVariant = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
  viewport: { once: true },
};

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative min-h-[85vh] flex items-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/10 via-stable/5 to-transparent blur-3xl animate-float" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-stable/8 via-transparent to-transparent blur-3xl animate-float [animation-delay:2s]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(oklch(0.45 0.12 185) 1px, transparent 1px), linear-gradient(90deg, oklch(0.45 0.12 185) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted text-primary text-xs font-[family-name:var(--font-mono)] font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-stable animate-pulse-slow" />
                Blue Ocean Competition 2026
              </div>

              <h1 className="text-5xl lg:text-6xl mb-6 leading-[1.08]">
                Predicting health crises{" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-primary via-stable to-accent bg-clip-text text-transparent">
                    48 hours early
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-stable to-accent rounded-full opacity-40" />
                </span>
              </h1>

              <p className="text-lg text-ink-secondary max-w-xl mb-8 leading-relaxed">
                Hidden Markov Models detect deterioration from passive sensor data.
                16 AI tools act on clinical context — booking appointments, alerting caregivers,
                adjusting nudge timing. Doctor-gated for medication decisions. The patient&apos;s job is to live their life.
              </p>

              <div className="flex gap-3 flex-wrap mb-8">
                <Link href="/demo" className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary-glow hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                  See Product Demo
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/technology" className="inline-flex items-center gap-2 px-6 py-3 border border-primary/30 text-primary rounded-xl font-semibold text-sm hover:bg-primary-muted transition-all duration-200">
                  Technical Deep-Dive
                  <ChevronRight size={16} />
                </Link>
              </div>

              {/* Quick stat chips */}
              <div className="flex gap-4 text-xs font-[family-name:var(--font-mono)]">
                <span className="text-stable"><span className="font-bold text-sm">48h</span> advance warning</span>
                <span className="text-border">|</span>
                <span className="text-primary"><span className="font-bold text-sm">16</span> AI tools</span>
                <span className="text-border">|</span>
                <span className="text-warning"><span className="font-bold text-sm">S$3</span> /patient/month</span>
              </div>
            </motion.div>

            {/* System at a glance */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const, delay: 0.2 }}
              className="bg-surface-card border border-border rounded-2xl p-6 space-y-4"
            >
              <div className="text-xs font-[family-name:var(--font-mono)] text-ink-muted uppercase tracking-widest">System at a Glance</div>
              {[
                { icon: Watch, label: "9 Biomarkers", detail: "Glucose avg + variability (CGM), steps, resting HR, HRV, sleep quality (Fitbit), meds adherence, carb intake, social engagement (app)", accent: "text-primary" },
                { icon: Brain, label: "3-State HMM", detail: "Viterbi + Monte Carlo + Counterfactual inference", accent: "text-stable" },
                { icon: Zap, label: "16 AI Tools", detail: "Appointments, alerts, vouchers, food recs, check-ins", accent: "text-warning" },
                { icon: Shield, label: "Full Audit Trail", detail: "Auto-SBAR reports, never auto-adjusts medication", accent: "text-primary" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-lg bg-surface-raised ${item.accent} flex items-center justify-center shrink-0`}>
                    <item.icon size={16} />
                  </span>
                  <div>
                    <span className={`text-sm font-semibold font-[family-name:var(--font-mono)] ${item.accent}`}>{item.label}</span>
                    <p className="text-xs text-ink-secondary">{item.detail}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS — 3 steps ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted text-primary text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            How It Works
          </div>
          <h2 className="text-4xl">Three steps. Zero patient effort.</h2>
        </motion.div>

        <motion.div {...stagger} className="grid md:grid-cols-3 gap-5">
          {[
            { step: "01", title: "Sense", desc: "9 biomarkers from 3 sources: glucose avg + variability (CGM), steps + resting HR + HRV + sleep quality (Fitbit), meds adherence + carb intake + social engagement (app). Feeds HMM every 4 hours.", accent: "text-primary", border: "border-primary/20" },
            { step: "02", title: "Predict", desc: "Viterbi decoding classifies patient state. 1,000 Monte Carlo trajectories forecast 48-hour crisis probability with 95% confidence intervals.", accent: "text-stable", border: "border-stable/20" },
            { step: "03", title: "Act", desc: "Gemini AI reasons over clinical context and executes from 16 agentic tools: appointments, alerts, food recs, vouchers, check-ins. Doctor-gated for medication. Full audit trail.", accent: "text-warning", border: "border-warning/20" },
          ].map((s) => (
            <motion.div key={s.step} {...childVariant} className={`relative bg-surface-card border ${s.border} rounded-2xl p-6`}>
              <div className={`font-[family-name:var(--font-mono)] text-3xl font-bold ${s.accent} opacity-20 absolute top-4 right-5`}>{s.step}</div>
              <h3 className="text-xl font-[family-name:var(--font-display)] mb-2">{s.title}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== THE HUMAN COST — Before/After ===== */}
      <section className="relative py-20 my-16">
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.14_0.03_260)] via-[oklch(0.16_0.04_260)] to-[oklch(0.12_0.03_260)] rounded-3xl mx-6 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[oklch(0.45_0.12_185_/_0.06)] rounded-full blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto px-12 relative z-10">
          <motion.div {...fadeUp}>
            <div className="font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-crisis mb-4 uppercase">
              The Human Cost
            </div>
            <h2 className="text-4xl text-white mb-4 max-w-xl">
              Mdm. Tan is 68. She has Type 2 Diabetes.
            </h2>
            <p className="text-[oklch(0.65_0.015_260)] max-w-lg mb-10 leading-relaxed">
              She lives alone in a Toa Payoh HDB flat. Her daughter works full-time. Her polyclinic nurse manages 600 other patients. This is what her next crisis looks like.
            </p>
          </motion.div>

          <motion.div {...stagger} className="grid md:grid-cols-2 gap-6 mb-10">
            {/* WITHOUT Bewo */}
            <motion.div {...childVariant} className="bg-[oklch(0.18_0.04_260)] rounded-2xl p-6 border border-crisis/20 border-t-[3px] border-t-crisis">
              <div className="font-[family-name:var(--font-mono)] text-xs text-crisis font-bold tracking-widest mb-4">WITHOUT BEWO</div>
              <div className="space-y-3 text-sm text-[oklch(0.70_0.01_260)]">
                {[
                  { time: "6 AM", event: "Glucose spikes to 14 mmol/L. Nobody notices.", accent: "text-[oklch(0.50_0.01_260)]" },
                  { time: "2 PM", event: "Misses afternoon Metformin. No reminder.", accent: "text-[oklch(0.50_0.01_260)]" },
                  { time: "9 PM", event: "Feels dizzy, ignores it. No one to call.", accent: "text-warning" },
                  { time: "3 AM", event: "Collapses. Daughter finds her the next morning.", accent: "text-crisis" },
                  { time: "ER", event: "3-day hospital stay. S$8,800 mean inpatient cost for admitted T2DM patients (PLOS One / NHG 2015). Could have been prevented.", accent: "text-crisis" },
                ].map((step) => (
                  <div key={step.time} className="flex gap-3">
                    <span className={`font-[family-name:var(--font-mono)] font-bold text-xs w-10 shrink-0 ${step.accent}`}>{step.time}</span>
                    <span>{step.event}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-[oklch(0.25_0.03_260)] text-center">
                <span className="font-[family-name:var(--font-mono)] font-bold text-2xl text-crisis">S$8,800</span>
                <span className="text-xs text-[oklch(0.45_0.01_260)] ml-2">avg admission with complications (PLOS One 2015)</span>
              </div>
            </motion.div>

            {/* WITH Bewo */}
            <motion.div {...childVariant} className="bg-[oklch(0.18_0.04_260)] rounded-2xl p-6 border border-stable/20 border-t-[3px] border-t-stable">
              <div className="font-[family-name:var(--font-mono)] text-xs text-stable font-bold tracking-widest mb-4">WITH BEWO</div>
              <div className="space-y-3 text-sm text-[oklch(0.70_0.01_260)]">
                {[
                  { time: "6 AM", event: "CGM detects spike. HMM shifts state to WARNING (72% confidence).", accent: "text-stable" },
                  { time: "8 AM", event: "AI initiates check-in: \u201CGood morning! Your glucose is high. Want me to book Dr. Lee?\u201D", accent: "text-stable" },
                  { time: "2 PM", event: "Adaptive reminder fires at her optimal response time. She takes Metformin.", accent: "text-stable" },
                  { time: "4 PM", event: "Counterfactual shown: \u201CRisk dropped 35% \u2192 12% because you took your medication.\u201D", accent: "text-primary" },
                  { time: "9 PM", event: "Glucose stabilizes. Daughter gets a \u201Call clear\u201D notification. Streak: 7 days.", accent: "text-primary" },
                ].map((step) => (
                  <div key={step.time} className="flex gap-3">
                    <span className={`font-[family-name:var(--font-mono)] font-bold text-xs w-10 shrink-0 ${step.accent}`}>{step.time}</span>
                    <span>{step.event}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-[oklch(0.25_0.03_260)] text-center">
                <span className="font-[family-name:var(--font-mono)] font-bold text-2xl text-stable">S$0</span>
                <span className="text-xs text-[oklch(0.45_0.01_260)] ml-2">crisis prevented. She stays home.</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div {...fadeUp} className="bg-[oklch(0.22_0.04_260)] rounded-xl p-5 border border-[oklch(0.28_0.04_260)] text-center">
            <div className="text-[oklch(0.70_0.01_260)] text-sm mb-1">One prevented admission saves</div>
            <div className="font-[family-name:var(--font-mono)] font-bold text-3xl text-white">
              S$8,800
            </div>
            <div className="text-xs text-[oklch(0.50_0.01_260)]">That funds 2,900+ patient-months of Bewo at S$3/mo. ROI at scale is immediate.</div>
          </motion.div>
        </div>
      </section>

      {/* ===== DEVICE INTEGRATION ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted text-primary text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Device Integration
          </div>
          <h2 className="text-4xl">Data from devices, not manual entry</h2>
          <p className="text-sm text-ink-secondary mt-2 max-w-lg">
            Bewo connects to CGM devices and Fitbit wearables for automatic health data.
            Patients can also use voice check-ins, photo OCR, or manual logging.
          </p>
        </motion.div>

        <motion.div {...stagger} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Watch, title: "CGM", desc: "Interstitial glucose every 5 min (FreeStyle Libre, Dexcom G7). Feeds 2 HMM features: glucose_avg and glucose_variability (CV%).", tier: "PREMIUM", accent: "text-primary", bg: "bg-primary-muted" },
            { icon: Heart, title: "Fitbit", desc: "4 HMM features auto-synced: steps_daily, resting_hr, hrv_rmssd (autonomic function), sleep_quality. All via Fitbit Web API.", tier: "ENHANCED", accent: "text-stable", bg: "bg-[oklch(0.52_0.14_160_/_0.08)]" },
            { icon: Smartphone, title: "App Input", desc: "2 HMM features: meds_adherence (tap-to-confirm or auto-detect), carbs_intake (meal photo OCR via Gemini Vision or manual log).", tier: "ALL TIERS", accent: "text-warning", bg: "bg-[oklch(0.62_0.14_80_/_0.08)]" },
            { icon: Mic, title: "Social + Mood", desc: "1 HMM feature: social_engagement (calls, messages, app interactions). Plus text-based mood detection for tone-aware AI responses.", tier: "BASIC", accent: "text-accent", bg: "bg-accent-muted" },
          ].map((d) => (
            <motion.div key={d.title} {...childVariant} className="bg-surface-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
              <span className={`w-11 h-11 rounded-xl ${d.bg} ${d.accent} flex items-center justify-center mb-3`}>
                <d.icon size={20} />
              </span>
              <h3 className="text-base font-semibold mb-1">{d.title}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed mb-3">{d.desc}</p>
              <span className={`text-[10px] font-[family-name:var(--font-mono)] font-semibold ${d.accent} uppercase tracking-wider`}>{d.tier}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== THREE PILLARS ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.52_0.14_160_/_0.08)] text-stable text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Innovation Pillars
          </div>
          <h2 className="text-4xl">Three layers working together</h2>
        </motion.div>

        <motion.div {...stagger} className="grid md:grid-cols-3 gap-5">
          {[
            {
              title: "HMM Prediction",
              tag: "VITERBI + MONTE CARLO + COUNTERFACTUAL",
              desc: "Viterbi decoding on 9 orthogonal biomarkers (each captures a distinct health dimension). 1,000 Monte Carlo trajectories for 48h crisis prediction. Counterfactual \"what-if\" scenarios show exact risk reduction.",
              gradient: "from-primary/8",
              accent: "text-primary",
              border: "border-primary/30",
              stat: "48h",
              statLabel: "advance warning",
            },
            {
              title: "Agentic AI",
              tag: "16 TOOLS \u00B7 GEMINI FLASH \u00B7 REAL ACTIONS",
              desc: "Gemini AI reasons over full clinical context and executes from 16 tools: appointments, caregiver alerts, medication reminders, food recommendations, vouchers. Doctor-gated for clinical decisions.",
              gradient: "from-stable/8",
              accent: "text-stable",
              border: "border-stable/30",
              stat: "16",
              statLabel: "AI tools",
            },
            {
              title: "Behavioral Science",
              tag: "PROSPECT THEORY + NUDGE + FOGG + SDT",
              desc: "Loss-aversion voucher gamification (S$5/week with decay). Adaptive nudge timing learned from response patterns. Mood-aware tone. Daily challenges scaled to clinical state.",
              gradient: "from-warning/8",
              accent: "text-warning",
              border: "border-warning/30",
              stat: "4",
              statLabel: "peer-reviewed frameworks",
            },
          ].map((pillar) => (
            <motion.div key={pillar.title} {...childVariant} className={`group relative bg-gradient-to-b ${pillar.gradient} to-transparent border ${pillar.border} rounded-2xl p-6 hover:shadow-lg transition-all duration-300`}>
              <div className={`font-[family-name:var(--font-mono)] text-[10px] ${pillar.accent} font-semibold tracking-widest mb-3`}>{pillar.tag}</div>
              <h3 className="text-xl mb-2 font-[family-name:var(--font-display)]">{pillar.title}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed mb-4">{pillar.desc}</p>
              <div className="border-t border-border-subtle pt-3 flex items-baseline gap-2">
                <span className={`font-[family-name:var(--font-mono)] font-bold text-2xl ${pillar.accent}`}>{pillar.stat}</span>
                <span className="text-xs text-ink-muted">{pillar.statLabel}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== BEHAVIORAL ENGINE ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.62_0.14_80_/_0.08)] text-warning text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Behavioral Engine
          </div>
          <h2 className="text-4xl">Why patients actually stay</h2>
          <p className="text-sm text-ink-secondary mt-2 max-w-lg">
            Technology predicts crises. Behavioral science prevents them. Every interaction is designed around four peer-reviewed frameworks.
          </p>
        </motion.div>

        <motion.div {...stagger} className="grid md:grid-cols-2 gap-5">
          {[
            {
              title: "Anonymised Peer Comparison",
              desc: "\"Patients like you in the top 20% take their medication within 15 minutes of the reminder.\" Social proof from anonymised cohort data. Patients see where they rank — without seeing anyone else's data.",
              tag: "SOCIAL PROOF",
              accent: "text-primary", border: "border-primary/20",
            },
            {
              title: "Loss-Aversion Vouchers",
              desc: "Start at S$5/week. Decays S$0.25 per missed action. Patients work to keep what they have, not earn what they don't. Loss aversion is 2-2.5x stronger than equivalent gains (Kahneman & Tversky 1979).",
              tag: "PROSPECT THEORY",
              accent: "text-stable", border: "border-stable/20",
            },
            {
              title: "Adaptive Daily Challenges",
              desc: "\"Walk 2,000 steps today\" for WARNING state. \"Try a low-GI hawker meal\" for STABLE. Difficulty scales with clinical state. Completion feeds streak + voucher + engagement score.",
              tag: "SELF-DETERMINATION",
              accent: "text-warning", border: "border-warning/20",
            },
            {
              title: "Optimal Nudge Timing",
              desc: "Reminders shift to when the patient actually responds. Mdm. Tan responds to medication reminders 85% of the time at 7 PM, 12% at 9 AM. The AI learns and adapts per-patient.",
              tag: "FOGG MODEL",
              accent: "text-primary", border: "border-primary/20",
            },
          ].map((b) => (
            <motion.div key={b.title} {...childVariant} className={`bg-surface-card border ${b.border} rounded-2xl p-6`}>
              <span className={`text-[10px] font-[family-name:var(--font-mono)] font-bold ${b.accent} tracking-widest`}>{b.tag}</span>
              <h3 className="text-base font-semibold mt-1 mb-2">{b.title}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== CURRENT PROGRESS ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stable/8 text-stable text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Current Progress
          </div>
          <h2 className="text-4xl">What we&apos;ve built</h2>
          <p className="text-sm text-ink-secondary mt-2 max-w-lg">
            Working system, not a pitch deck. Every component below is implemented and functional.
          </p>
        </motion.div>

        <motion.div {...stagger} className="grid md:grid-cols-2 gap-4">
          {[
            { status: "BUILT", label: "HMM Prediction Engine", detail: "3-state model, 9 orthogonal biomarkers, Viterbi + Monte Carlo + Counterfactual. Runs in Python with clinically-parameterized transition matrices.", accent: "text-stable" },
            { status: "BUILT", label: "16 Agentic AI Tools", detail: "Full tool execution via Gemini: appointments, alerts, vouchers, food recs, streak tracking, weekly reports, nudge scheduling. Doctor-gated for medication.", accent: "text-stable" },
            { status: "BUILT", label: "Patient Chat Interface", detail: "Singlish-aware conversational AI. Mood detection, adaptive tone, counterfactual motivation. Real tool calls visible in conversation.", accent: "text-stable" },
            { status: "BUILT", label: "Nurse Dashboard + SBAR", detail: "Auto-generated SBAR clinical reports on every state transition. Priority-sorted patient list. One-click escalation.", accent: "text-stable" },
            { status: "BUILT", label: "Voucher Gamification Engine", detail: "Loss-aversion S$5/week with decay. Streak tracking (3/7/14/30-day milestones). Daily challenges scaled to clinical state.", accent: "text-stable" },
            { status: "BUILT", label: "Caregiver Alert System", detail: "3-tier escalation (push, SMS, voice). Rate-limited fatigue detection. Configurable detail levels per family member.", accent: "text-stable" },
            { status: "NEXT", label: "Polyclinic Pilot", detail: "Targeting SingHealth polyclinic partnership for real-world validation with 50-100 patients. Seeking Smart Nation grant co-funding.", accent: "text-warning" },
            { status: "NEXT", label: "HealthHub API Integration", detail: "Government health records platform for appointment booking and medical history context. API documentation reviewed.", accent: "text-warning" },
          ].map((item) => (
            <motion.div key={item.label} {...childVariant} className="flex gap-4 p-4 bg-surface-card border border-border rounded-xl">
              <span className={`text-[10px] font-[family-name:var(--font-mono)] font-bold ${item.accent} shrink-0 w-10 pt-0.5`}>{item.status}</span>
              <div>
                <div className="text-sm font-semibold text-ink mb-0.5">{item.label}</div>
                <div className="text-xs text-ink-secondary leading-relaxed">{item.detail}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== CTA ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <motion.div {...fadeUp} className="text-center py-16 relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[300px] h-[300px] rounded-full bg-gradient-to-br from-primary/5 via-stable/3 to-transparent blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="text-3xl mb-3">See Bewo in Action</h2>
            <p className="text-ink-secondary mb-8 max-w-md mx-auto">
              Walk through a real patient interaction with Bewo&apos;s agentic AI in action.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/demo" className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary-glow hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                Product Walkthrough
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/impact" className="group inline-flex items-center gap-2 px-8 py-4 border border-primary/30 text-primary rounded-xl font-semibold hover:bg-primary-muted transition-all duration-200">
                Blue Ocean Analysis
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
