"use client";

import { motion } from "framer-motion";
import {
  Brain, Activity, Bell, Calculator, Pill, Clock, Users, Gift,
  Video, Dumbbell, AlertTriangle, Utensils, CalendarCheck, Award,
  FileText, Settings, Zap, Stethoscope, Shield, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { HMMVisualizer } from "@/components/hmm-visualizer";
import { MonteCarloViz } from "@/components/monte-carlo-viz";
import { DataFlowViz } from "@/components/data-flow-viz";

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

function ToolCard({ icon: Icon, name, desc }: {
  icon: React.ComponentType<{ size: number }>; name: string; desc: string;
}) {
  return (
    <motion.div {...childVariant} className="group flex gap-3 p-4 rounded-xl border border-border-subtle bg-surface-card hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <span className="w-9 h-9 rounded-lg bg-primary-muted text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        <Icon size={16} />
      </span>
      <div>
        <div className="text-sm font-semibold font-[family-name:var(--font-mono)] text-ink mb-0.5">{name}</div>
        <div className="text-xs text-ink-secondary leading-relaxed">{desc}</div>
      </div>
    </motion.div>
  );
}

export default function TechnologyPage() {
  return (
    <div className="overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-primary/8 to-transparent rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(oklch(0.45 0.12 185) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted text-primary text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
              Technical Architecture
            </div>
            <h1 className="text-5xl lg:text-6xl max-w-2xl mb-4 leading-[1.08]">How Bewo actually works</h1>
            <p className="text-lg text-ink-secondary max-w-xl leading-relaxed mb-6">
              Clinically-parameterized prediction engine. Agentic AI with 18 tools.
              Doctor-gated for clinical decisions. Full audit trail.
            </p>
            <div className="flex gap-6 text-xs font-[family-name:var(--font-mono)]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-stable" />
                <span className="text-ink-secondary"><span className="font-bold text-stable">3</span> inference algorithms</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-ink-secondary"><span className="font-bold text-primary">9</span> biomarkers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-ink-secondary"><span className="font-bold text-warning">18</span> agentic tools</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== HMM STATE MACHINE ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 rounded-xl bg-primary-muted text-primary flex items-center justify-center">
            <Brain size={20} />
          </span>
          <div>
            <h2 className="text-3xl">Hidden Markov Model</h2>
            <p className="text-sm text-ink-secondary mt-0.5">
              Click states to explore. Clinically-informed transition matrix from published parameters.
            </p>
          </div>
        </motion.div>
        <HMMVisualizer />

        {/* 9 Orthogonal Features Table */}
        <motion.div {...fadeUp} className="mt-8 bg-surface-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <div className="text-xs font-[family-name:var(--font-mono)] text-primary font-bold tracking-widest mb-1">9 ORTHOGONAL FEATURES</div>
            <p className="text-sm text-ink-secondary">Each feature captures a distinct health dimension with minimal correlation to others. Weights sum to 1.0.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-3 pl-6 font-[family-name:var(--font-mono)] text-[10px] text-ink-muted uppercase tracking-wider">Feature</th>
                  <th className="p-3 font-[family-name:var(--font-mono)] text-[10px] text-ink-muted uppercase tracking-wider">Dimension</th>
                  <th className="p-3 font-[family-name:var(--font-mono)] text-[10px] text-ink-muted uppercase tracking-wider">Source</th>
                  <th className="p-3 font-[family-name:var(--font-mono)] text-[10px] text-ink-muted uppercase tracking-wider">Weight</th>
                  <th className="p-3 pr-6 font-[family-name:var(--font-mono)] text-[10px] text-ink-muted uppercase tracking-wider">Clinical Ref</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {[
                  { feature: "glucose_avg", dim: "Glycemic Control", source: "CGM", weight: "25%", ref: "ADA 2024: Target <7.0 mmol/L" },
                  { feature: "glucose_variability", dim: "Glycemic Stability", source: "CGM", weight: "10%", ref: "CV% <36% = stable (Danne 2017)" },
                  { feature: "meds_adherence", dim: "Medication Compliance", source: "App", weight: "18%", ref: "UKPDS: 10% drop = 0.5% HbA1c rise" },
                  { feature: "carbs_intake", dim: "Dietary Input", source: "Photo OCR / Manual", weight: "7%", ref: "ADA: 45-60g carbs/meal" },
                  { feature: "steps_daily", dim: "Physical Activity", source: "Fitbit / Phone", weight: "8%", ref: "WHO: 7000+ steps = 50-70% mortality reduction" },
                  { feature: "resting_hr", dim: "Cardiovascular", source: "Fitbit", weight: "5%", ref: "Normal elderly: 60-80 bpm" },
                  { feature: "hrv_rmssd", dim: "Autonomic Function", source: "Fitbit", weight: "7%", ref: "ARIC: Low HRV predicts neuropathy" },
                  { feature: "sleep_quality", dim: "Sleep / Recovery", source: "Fitbit", weight: "10%", ref: "DiaBeatIt: Poor sleep = +23% glucose var" },
                  { feature: "social_engagement", dim: "Psychosocial", source: "App (calls, msgs)", weight: "10%", ref: "Lancet 2020: Isolation = 2x depression" },
                ].map((f) => (
                  <tr key={f.feature} className="border-b border-border-subtle last:border-0">
                    <td className="p-3 pl-6 font-[family-name:var(--font-mono)] font-semibold text-ink">{f.feature}</td>
                    <td className="p-3 text-ink-secondary">{f.dim}</td>
                    <td className="p-3"><span className="text-primary font-[family-name:var(--font-mono)] font-medium">{f.source}</span></td>
                    <td className="p-3 font-[family-name:var(--font-mono)] font-bold text-stable">{f.weight}</td>
                    <td className="p-3 pr-6 text-ink-muted">{f.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* ===== MONTE CARLO ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 rounded-xl bg-[oklch(0.52_0.14_160_/_0.08)] text-stable flex items-center justify-center">
            <Zap size={20} />
          </span>
          <div>
            <h2 className="text-3xl">48-Hour Crisis Prediction</h2>
            <p className="text-sm text-ink-secondary mt-0.5">
              1,000 stochastic trajectories simulate where the patient is heading.
              Returns crisis probability, expected time-to-crisis, and 95% confidence interval.
            </p>
          </div>
        </motion.div>
        <MonteCarloViz />
      </section>

      {/* ===== THREE ALGORITHMS — dark ===== */}
      <section className="relative py-20 mb-24">
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.14_0.03_260)] via-[oklch(0.16_0.04_260)] to-[oklch(0.12_0.03_260)] rounded-3xl mx-6 overflow-hidden">
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-[oklch(0.45_0.12_185_/_0.05)] rounded-full blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto px-12 relative z-10">
          <motion.div {...fadeUp} className="mb-10">
            <h2 className="text-3xl text-white mb-2">Three Inference Algorithms</h2>
            <p className="text-sm text-[oklch(0.65_0.015_260)]">Layered analysis for maximum clinical accuracy.</p>
          </motion.div>

          <motion.div {...stagger} className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Viterbi Decoding", badge: "EXACT INFERENCE",
                desc: "O(N\u00B2\u00D7T) dynamic programming. Finds the most likely hidden state sequence given observed biomarkers. Returns state classification with confidence score.",
                detail: "Log-space computation prevents underflow. Missing data handled via marginalization.",
              },
              {
                title: "Monte Carlo Simulation", badge: "1,000 PATHS \u00B7 48H",
                desc: "Stochastic forward simulation through the transition matrix. Quantifies crisis probability, expected time-to-crisis, and IQR/95% confidence intervals.",
                detail: "Risk levels: LOW (<15%), MEDIUM (15-30%), HIGH (30-50%), CRITICAL (>50%).",
              },
              {
                title: "Counterfactual Engine", badge: "WHAT-IF ANALYSIS",
                desc: "Bayesian intervention simulation. \"What if patient takes Metformin?\" — modifies observations and re-runs Monte Carlo to show exact risk reduction.",
                detail: "Interventions: take_medication, adjust_carbs, increase_activity. Shows % risk reduction.",
              },
            ].map((m) => (
              <motion.div key={m.title} {...childVariant} className="bg-[oklch(0.20_0.04_260)] rounded-2xl p-6 border border-[oklch(0.28_0.04_260)] hover:border-[oklch(0.35_0.05_260)] transition-colors">
                <h4 className="text-lg font-[family-name:var(--font-display)] text-white mb-2">{m.title}</h4>
                <p className="text-sm text-[oklch(0.65_0.015_260)] leading-relaxed mb-3">{m.desc}</p>
                <p className="text-xs text-[oklch(0.50_0.01_260)] leading-relaxed mb-4">{m.detail}</p>
                <span className="text-[10px] font-[family-name:var(--font-mono)] font-semibold px-2.5 py-1 rounded-md bg-[oklch(0.45_0.12_185_/_0.12)] text-[oklch(0.68_0.10_185)]">
                  {m.badge}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== WHY HMM ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="bg-gradient-to-r from-primary/6 to-transparent border border-primary/20 rounded-2xl p-6">
          <div className="text-xs font-[family-name:var(--font-mono)] text-primary font-bold tracking-widest mb-2">WHY HMM, NOT DEEP LEARNING?</div>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {[
              { q: "Why not LSTMs or Transformers?", a: "A nurse can read \u201CWARNING state, 72% confidence, 0.35 transition to CRISIS.\u201D She cannot read a 512-dimensional embedding. Clinical trust requires interpretability." },
              { q: "Don\u2019t you need big data?", a: "HMMs work with structured clinical parameters from existing literature (ADA 2024, UKPDS, Lancet). No million-patient training dataset required." },
              { q: "What about accuracy?", a: "For structured, low-dimensional time-series with clear clinical semantics, HMMs provide competitive accuracy while maintaining full interpretability." },
              { q: "Regulatory implications?", a: "Explainable AI has a faster HSA pathway than black-box models. We can deploy while competitors are still filing for SaMD classification." },
            ].map((item) => (
              <div key={item.q} className="py-2">
                <span className="font-semibold text-ink">{item.q} </span>
                <span className="text-ink-secondary">{item.a}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== SBAR + CLINICAL GOVERNANCE ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted text-primary text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Clinical Governance
          </div>
          <h2 className="text-3xl">Auto-Generated SBAR Reports</h2>
          <p className="text-sm text-ink-secondary mt-1 max-w-lg">
            Triggered on every state transition. Nurses get structured clinical handoff.
          </p>
        </motion.div>

        <motion.div {...fadeUp} className="bg-surface-card border border-border rounded-2xl p-6 max-w-3xl font-[family-name:var(--font-mono)] text-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-primary" />
            <span className="font-bold text-primary">SBAR Clinical Report — Auto-Generated</span>
          </div>
          {[
            { label: "S", title: "Situation", content: "Patient in WARNING state (72% confidence). 45% crisis probability within 48h." },
            { label: "B", title: "Background", content: "Glucose averaged 11.2 mmol/L (target <7.0). Med adherence dropped to 60%. Steps declining 3 consecutive days." },
            { label: "A", title: "Assessment", content: "Early deterioration pattern. Medication timing issue likely. Glucose variability CV% 38% (above 36% threshold)." },
            { label: "R", title: "Recommendation", content: "Urgent appointment within 3 days. Review medication schedule. Counterfactual: Metformin compliance reduces risk 45% to 18%." },
          ].map((s) => (
            <div key={s.label} className="flex gap-3 py-3 border-b border-border-subtle last:border-0">
              <span className="w-7 h-7 rounded-lg bg-primary-muted text-primary flex items-center justify-center shrink-0 font-bold text-xs">{s.label}</span>
              <div>
                <span className="font-semibold text-ink">{s.title}: </span>
                <span className="text-ink-secondary">{s.content}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ===== DATA PIPELINE ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 rounded-xl bg-primary-muted text-primary flex items-center justify-center">
            <Activity size={20} />
          </span>
          <div>
            <h2 className="text-3xl">End-to-End Pipeline</h2>
            <p className="text-sm text-ink-secondary mt-0.5">
              From device data to real-world action in seconds. Full audit trail for clinical governance.
            </p>
          </div>
        </motion.div>
        <DataFlowViz />
      </section>

      {/* ===== 18 AGENTIC TOOLS ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="flex items-center gap-3 mb-8">
          <span className="w-10 h-10 rounded-xl bg-primary-muted text-primary flex items-center justify-center">
            <Activity size={20} />
          </span>
          <div>
            <h2 className="text-3xl">18 Agentic Tools</h2>
            <p className="text-sm text-ink-secondary mt-0.5">Real tools executing real actions against real systems. Doctor-gated for medication decisions. Never auto-adjusts dosage.</p>
          </div>
        </motion.div>

        <motion.div {...stagger} className="grid md:grid-cols-2 gap-3">
          <ToolCard icon={CalendarCheck} name="book_appointment" desc="Lloyd's algorithm slot optimization. Blind booking (privacy). HealthHub API." />
          <ToolCard icon={Bell} name="send_caregiver_alert" desc="3-tier escalation: push, SMS, voice call. Rate-limited to prevent caregiver fatigue." />
          <ToolCard icon={Calculator} name="calculate_counterfactual" desc="HMM-powered what-if: medication, carb reduction, activity. Shows exact risk %." />
          <ToolCard icon={Pill} name="suggest_medication_adjustment" desc="Dose recommendations for DOCTOR review only. Never auto-adjusts." />
          <ToolCard icon={Clock} name="set_reminder" desc="Medication, glucose, exercise, hydration. Adaptive timing from response patterns." />
          <ToolCard icon={Stethoscope} name="alert_nurse" desc="SBAR auto-attached. Priority routing to nurse dashboard." />
          <ToolCard icon={Users} name="alert_family" desc="Configurable detail level. Fatigue detection prevents alert overload." />
          <ToolCard icon={Gift} name="award_voucher_bonus" desc="Loss-aversion: S$5/week with decay. Prospect theory framing." />
          <ToolCard icon={Video} name="request_medication_video" desc="Personalized education video. Encouraging framing for elderly." />
          <ToolCard icon={Dumbbell} name="suggest_activity" desc="Walk, tai chi, breathing, social call. Context-aware by time + mobility." />
          <ToolCard icon={AlertTriangle} name="escalate_to_doctor" desc="Full HMM snapshot + SBAR attached. Formal clinical escalation." />
          <ToolCard icon={Utensils} name="recommend_food" desc="Singapore hawker center options. Glycemic impact per dish. Cultural." />
          <ToolCard icon={Brain} name="schedule_proactive_checkin" desc="AI-initiated. Risk-rising, inactivity, mood-based triggers." />
          <ToolCard icon={Award} name="celebrate_streak" desc="3/7/14/30-day milestones. Voucher bonus + badge unlock." />
          <ToolCard icon={FileText} name="generate_weekly_report" desc="Glucose, steps, adherence, streaks, grade (A/B/C/D). Auto-sent." />
          <ToolCard icon={Settings} name="adjust_nudge_schedule" desc="Shifts reminders to learned optimal response windows." />
          <ToolCard icon={Shield} name="generate_clinician_summary" desc="Auto SBAR report for nurses. Situation, Background, Assessment, Recommendation." />
          <ToolCard icon={Zap} name="check_drug_interactions" desc="16 interaction pairs checked. Flags conflicts with current medications before any change." />
        </motion.div>
      </section>

      {/* ===== CTA ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <motion.div {...fadeUp} className="text-center py-12">
          <h2 className="text-3xl mb-3">See It All Working Together</h2>
          <p className="text-ink-secondary mb-6 max-w-md mx-auto">
            Watch the AI agent interact with a real patient, execute tools, and generate clinical reports.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/demo" className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary-glow hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
              Product Demo
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
