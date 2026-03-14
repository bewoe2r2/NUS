"use client";

import { motion } from "framer-motion";
import {
  TrendingDown, Clock, Users, DollarSign, Activity, Award, AlertCircle,
  BarChart3, Heart,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
  ResponsiveContainer,
} from "recharts";
import { AnimatedCounter } from "@/components/animated-counter";
import { LiveChatSim } from "@/components/live-chat-sim";

/* ─── animation presets ─── */

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

/* ─── radar chart data ─── */

const blueOceanData = [
  { factor: "Crisis Prediction", bewo: 95, polyclinic: 10, livongo: 20 },
  { factor: "Agentic Actions", bewo: 90, polyclinic: 5, livongo: 15 },
  { factor: "Behavioral Science", bewo: 85, polyclinic: 15, livongo: 40 },
  { factor: "Caregiver Support", bewo: 80, polyclinic: 60, livongo: 25 },
  { factor: "Cultural Context", bewo: 85, polyclinic: 30, livongo: 10 },
  { factor: "Clinical Integration", bewo: 75, polyclinic: 80, livongo: 20 },
  { factor: "Patient Engagement", bewo: 90, polyclinic: 25, livongo: 50 },
  { factor: "Cost Efficiency", bewo: 85, polyclinic: 30, livongo: 60 },
];

const errcData = [
  {
    category: "ELIMINATE",
    costNote: "Removes cost",
    items: [
      "Manual glucose log reviews by nurses (time-intensive, 1:600 ratio makes it unsustainable)",
      "Reactive-only crisis response (ER visits avg S$8,800 with complications)",
      "One-size-fits-all reminder timing",
      "Alert fatigue from undifferentiated notifications",
    ],
    accent: "border-crisis", textAccent: "text-crisis",
  },
  {
    category: "REDUCE",
    costNote: "Lowers cost",
    items: [
      "Preventable hospital admissions (early intervention reduces inpatient cost, currently 61% of total diabetes spend)",
      "Nurse workload per patient (AI auto-triage + SBAR replaces manual glucose log review)",
      "Time-to-intervention: from next polyclinic visit (weeks) to same-day AI-initiated check-in",
      "Patient data entry burden: passive sensing replaces manual logging",
    ],
    accent: "border-warning", textAccent: "text-warning",
  },
  {
    category: "RAISE",
    costNote: "Better outcomes",
    items: [
      "Prediction accuracy (48h advance warning vs 0h reactive)",
      "Personalization (mood, timing, culture, Singlish dialect)",
      "Caregiver quality of life (fatigue detection + rate limiting)",
      "Clinical audit (auto-SBAR on every state transition)",
    ],
    accent: "border-primary", textAccent: "text-primary",
  },
  {
    category: "CREATE",
    costNote: "New value",
    items: [
      "Counterfactual \u201Cwhat-if\u201D motivation (\u201C35% \u2192 12% risk if you take Metformin\u201D)",
      "16-tool agentic AI (real actions, not just suggestions \u2014 doctor-gated for medication)",
      "Loss-aversion voucher gamification (S$5/week with decay)",
      "AI-initiated proactive check-ins (no patient trigger needed)",
    ],
    accent: "border-stable", textAccent: "text-stable",
  },
];

/* ─── section timing marker ─── */

function SectionMarker({ time, label }: { time: string; label: string }) {
  return (
    <div className="max-w-6xl mx-auto px-6 pt-20 pb-6">
      <div className="flex items-center gap-3">
        <span className="font-[family-name:var(--font-mono)] text-xs font-bold text-primary bg-primary-muted px-2.5 py-1 rounded-md">
          {time}
        </span>
        <span className="text-xs font-[family-name:var(--font-mono)] text-ink-muted uppercase tracking-widest">
          {label}
        </span>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PITCH PAGE — single scroll, script order
   ═══════════════════════════════════════════════════════════════ */

export default function PitchPage() {
  return (
    <div className="overflow-hidden">

      {/* ╔══════════════════════════════════════════╗
          ║  0:00  THE HOOK                          ║
          ╚══════════════════════════════════════════╝ */}

      <SectionMarker time="0:00" label="The Hook — Singapore Healthcare Context" />

      {/* Singapore Healthcare Context */}
      <section id="singapore-context" className="max-w-6xl mx-auto px-6 mb-16">
        <motion.div {...fadeUp} className="bg-gradient-to-br from-surface-raised via-surface to-surface-raised rounded-3xl border border-border-subtle p-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.52_0.16_25_/_0.08)] text-crisis text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Singapore Healthcare Context
          </div>
          <h2 className="text-4xl mb-6">Why Singapore. Why Now.</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { stat: "20%+", desc: "of Singaporeans aged 60-74 have diabetes. Overall prevalence ~9.5% (MOH National Population Health Survey 2022)" },
                { stat: "S$2,034", desc: "mean annual direct medical cost per T2DM patient. 61% goes to inpatient care alone (PLOS One / NHG Singapore 2015)" },
                { stat: "S$8,800", desc: "mean cost for T2DM patients with at least one hospital admission \u2014 the preventable cost we target (PLOS One 2015)" },
                { stat: "1:600", desc: "nurse-to-chronic-patient ratio in polyclinics \u2014 physically impossible to manage reactively (SingHealth Annual Report 2023)" },
              ].map((item) => (
                <div key={item.stat} className="flex gap-3 items-start">
                  <span className="font-[family-name:var(--font-mono)] font-bold text-lg text-primary shrink-0 w-16 text-right">{item.stat}</span>
                  <span className="text-sm text-ink-secondary leading-relaxed">{item.desc}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold">Government Alignment</h3>
              {[
                { initiative: "Smart Nation Initiative", detail: "AI-first healthcare innovation. S$3.3B digital health investment (2024-2029)." },
                { initiative: "Healthier SG", detail: "National program shifting chronic care from hospitals to community. Bewo extends this digitally." },
                { initiative: "HealthHub API", detail: "Government health records platform open for innovation partnerships." },
                { initiative: "CHAS Clinics Network", detail: "1,800+ Community Health Assist Scheme clinics \u2014 our distribution channel." },
              ].map((g) => (
                <div key={g.initiative} className="flex gap-2 items-start">
                  <span className="text-stable text-xs mt-1">&#10003;</span>
                  <div>
                    <span className="text-sm font-semibold text-ink">{g.initiative}: </span>
                    <span className="text-sm text-ink-secondary">{g.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Impact Metrics — 4 stat cards */}
      <section id="impact-metrics" className="max-w-6xl mx-auto px-6 mb-16">
        <motion.div {...stagger} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: TrendingDown, value: 2034, suffix: "", prefix: "S$", label: "Avg Annual Cost / T2DM Patient", sub: "Direct medical cost (PLOS One / NHG 2015)", accent: "text-stable", borderAccent: "from-stable" },
            { icon: Clock, value: 61, suffix: "%", prefix: "", label: "Spent on Inpatient Care", sub: "S$1,237 of S$2,034 avg (PLOS One 2015)", accent: "text-primary", borderAccent: "from-primary" },
            { icon: Users, value: 20, suffix: "%+", label: "Diabetes in Ages 60-74", sub: "Highest prevalence in developed Asia (MOH 2022)", accent: "text-warning", borderAccent: "from-warning" },
            { icon: DollarSign, value: 8800, prefix: "S$", suffix: "", label: "Avg Admission with Complications", sub: "T2DM patients with \u22651 admission (PLOS One 2015)", accent: "text-crisis", borderAccent: "from-crisis" },
          ].map((m) => (
            <motion.div
              key={m.label}
              {...childVariant}
              className="relative bg-surface-card border border-border rounded-2xl p-6 text-center overflow-hidden group hover:shadow-md transition-shadow"
            >
              <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${m.borderAccent} to-transparent`} />
              <span className={`w-11 h-11 rounded-xl bg-surface-raised ${m.accent} flex items-center justify-center mx-auto mb-3`}>
                <m.icon size={20} />
              </span>
              <div className="font-[family-name:var(--font-mono)] font-bold text-3xl text-ink mb-1">
                <AnimatedCounter value={m.value} prefix={m.prefix} suffix={m.suffix} />
              </div>
              <div className="text-sm font-semibold mb-0.5">{m.label}</div>
              <div className="text-xs text-ink-muted">{m.sub}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>


      {/* ╔══════════════════════════════════════════╗
          ║  0:30  WHAT BEWO DOES                    ║
          ╚══════════════════════════════════════════╝ */}

      <SectionMarker time="0:30" label="What Bewo Does — Three Pillars" />

      {/* Innovation Pillars */}
      <section id="what-bewo-does" className="max-w-6xl mx-auto px-6 mb-16">
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


      {/* ╔══════════════════════════════════════════╗
          ║  1:00  BLUE OCEAN STRATEGY               ║
          ╚══════════════════════════════════════════╝ */}

      <SectionMarker time="1:00" label="Blue Ocean Strategy — As-Is Canvas" />

      {/* As-Is Strategy Canvas */}
      <section id="as-is-canvas" className="max-w-6xl mx-auto px-6 mb-12">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.52_0.16_25_/_0.08)] text-crisis text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            As-Is Strategy Canvas
          </div>
          <h2 className="text-3xl">The Red Ocean: convergent value curves</h2>
          <p className="text-sm text-ink-secondary mt-1 max-w-lg">
            Existing players compete on the same factors with similar profiles. No crisis prediction, no agentic actions, no behavioral science. A classic red ocean.
          </p>
        </motion.div>

        <motion.div {...fadeUp} className="bg-surface-card border border-crisis/20 rounded-2xl p-8">
          <ResponsiveContainer width="100%" height={360}>
            <RadarChart data={blueOceanData}>
              <PolarGrid stroke="oklch(0.86 0.008 265)" />
              <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11, fill: "oklch(0.42 0.02 265)" }} />
              <Radar name="SingHealth Polyclinic CDM" dataKey="polyclinic" stroke="oklch(0.52 0.16 25)" fill="oklch(0.52 0.16 25)" fillOpacity={0.08} strokeWidth={2} />
              <Radar name="Livongo / MySugr" dataKey="livongo" stroke="oklch(0.58 0.01 265)" fill="oklch(0.58 0.01 265)" fillOpacity={0.05} strokeWidth={2} strokeDasharray="5 5" />
              <Legend wrapperStyle={{ fontSize: "12px", fontFamily: "var(--font-mono)", paddingTop: "16px" }} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs text-ink-muted font-[family-name:var(--font-mono)] text-center">
            Both incumbents cluster around Clinical Integration but score near-zero on Crisis Prediction, Agentic Actions, and Behavioral Science.
          </div>
        </motion.div>
      </section>

      {/* ERRC Grid */}
      <section id="errc-grid" className="relative py-20 mb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.14_0.03_260)] via-[oklch(0.16_0.04_260)] to-[oklch(0.12_0.03_260)] rounded-3xl mx-6 overflow-hidden">
          <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-[oklch(0.45_0.12_185_/_0.04)] rounded-full blur-[80px]" />
        </div>

        <div className="max-w-6xl mx-auto px-12 relative z-10">
          <motion.div {...fadeUp} className="mb-10">
            <h2 className="text-3xl text-white mb-2">ERRC Grid (Four Actions Framework)</h2>
            <p className="text-sm text-[oklch(0.65_0.015_260)]">
              How Bewo simultaneously achieves differentiation AND low cost.
            </p>
          </motion.div>

          <motion.div {...stagger} className="grid md:grid-cols-2 gap-5">
            {errcData.map((section) => (
              <motion.div
                key={section.category}
                {...childVariant}
                className={`bg-[oklch(0.20_0.04_260)] rounded-2xl p-6 border border-[oklch(0.28_0.04_260)] border-t-[3px] ${section.accent}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className={`font-[family-name:var(--font-mono)] text-sm font-bold tracking-widest ${section.textAccent}`}>
                    {section.category}
                  </div>
                  <span className="text-[10px] font-[family-name:var(--font-mono)] text-[oklch(0.45_0.01_260)] bg-[oklch(0.25_0.03_260)] px-2 py-0.5 rounded">
                    {section.costNote}
                  </span>
                </div>
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    className={`text-sm text-[oklch(0.75_0.01_260)] py-2 flex items-start gap-2 ${
                      i < section.items.length - 1 ? "border-b border-[oklch(0.26_0.03_260)]" : ""
                    }`}
                  >
                    <span className={`${section.textAccent} text-xs mt-0.5`}>&#9656;</span>
                    <span>{item}</span>
                  </div>
                ))}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* To-Be Strategy Canvas */}
      <section id="to-be-canvas" className="max-w-6xl mx-auto px-6 mb-16">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.52_0.14_160_/_0.08)] text-stable text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            To-Be Strategy Canvas
          </div>
          <h2 className="text-3xl">The Blue Ocean: Bewo&apos;s divergent value curve</h2>
          <p className="text-sm text-ink-secondary mt-1 max-w-lg">
            After applying the ERRC Grid, Bewo creates a fundamentally different value curve that doesn&apos;t compete &mdash; it makes the competition irrelevant.
          </p>
        </motion.div>

        <motion.div {...fadeUp} className="bg-surface-card border border-stable/20 rounded-2xl p-8">
          <ResponsiveContainer width="100%" height={420}>
            <RadarChart data={blueOceanData}>
              <PolarGrid stroke="oklch(0.86 0.008 265)" />
              <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11, fill: "oklch(0.42 0.02 265)" }} />
              <Radar name="Bewo" dataKey="bewo" stroke="oklch(0.45 0.12 185)" fill="oklch(0.45 0.12 185)" fillOpacity={0.18} strokeWidth={2.5} />
              <Radar name="SingHealth Polyclinic CDM" dataKey="polyclinic" stroke="oklch(0.52 0.16 25)" fill="oklch(0.52 0.16 25)" fillOpacity={0.03} strokeWidth={1} strokeDasharray="5 5" />
              <Radar name="Livongo / MySugr" dataKey="livongo" stroke="oklch(0.58 0.01 265)" fill="oklch(0.58 0.01 265)" fillOpacity={0.02} strokeWidth={1} strokeDasharray="3 3" />
              <Legend wrapperStyle={{ fontSize: "12px", fontFamily: "var(--font-mono)", paddingTop: "16px" }} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs text-ink-muted font-[family-name:var(--font-mono)] text-center">
            Bewo&apos;s value curve diverges on 5 factors while reducing Clinical Integration dependency (nurses augmented, not replaced).
          </div>
        </motion.div>
      </section>


      {/* ╔══════════════════════════════════════════╗
          ║  1:50  PRODUCT DEMO                      ║
          ╚══════════════════════════════════════════╝ */}

      <SectionMarker time="1:50" label="Product Demo — Live Chat Simulation" />

      {/* Live Chat + Context */}
      <section id="live-demo" className="max-w-6xl mx-auto px-6 mb-16">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.62_0.14_80_/_0.08)] text-warning text-xs font-[family-name:var(--font-mono)] font-medium mb-3">
            <span className="w-2 h-2 rounded-full bg-stable animate-pulse-slow" />
            8:30 AM &mdash; Proactive Check-in
          </div>
          <h2 className="text-3xl">A Day in the Life of Mdm. Tan</h2>
          <p className="text-sm text-ink-secondary mt-1 max-w-xl">
            68 years old, Type 2 Diabetes. Enhanced tier (Fitbit connected).
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
                  { theory: "Nudge Theory", detail: "Reminder set at 7 PM \u2014 learned from her historical response patterns (85% response rate at 7 PM)." },
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
          </motion.div>
        </div>
      </section>

      {/* Cost Comparison */}
      <section id="cost-comparison" className="max-w-6xl mx-auto px-6 mb-16">
        <motion.div {...fadeUp} className="grid md:grid-cols-2 gap-5">
          <div className="bg-surface-card border border-crisis/20 rounded-2xl p-6 border-t-[3px] border-t-crisis">
            <div className="font-[family-name:var(--font-mono)] text-xs text-crisis font-bold tracking-widest mb-3">WITHOUT BEWO</div>
            <p className="text-sm text-ink-secondary leading-relaxed">Glucose spike unnoticed for 6 weeks. Missed medications compound. ER admission at 3 AM.</p>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-baseline gap-3">
              <span className="font-[family-name:var(--font-mono)] font-bold text-2xl text-crisis">S$8,800</span>
              <span className="text-xs text-ink-muted">mean inpatient cost per admitted T2DM patient</span>
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

      {/* Nurse Dashboard */}
      <section id="nurse-dashboard" className="relative py-20 mb-16">
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
                    <div className="text-[10px] text-[oklch(0.48_0.01_260)]">Age {p.age}, T2DM &middot; {p.tier}</div>
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


      {/* ╔══════════════════════════════════════════╗
          ║  3:00  COMMERCIAL VIABILITY              ║
          ╚══════════════════════════════════════════╝ */}

      <SectionMarker time="3:00" label="Commercial Viability — Noncustomers" />

      {/* Three Tiers of Noncustomers */}
      <section id="noncustomers" className="max-w-6xl mx-auto px-6 mb-16">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted text-primary text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Three Tiers of Noncustomers
          </div>
          <h2 className="text-3xl">Unlocking demand beyond existing patients</h2>
          <p className="text-sm text-ink-secondary mt-1 max-w-lg">
            Blue Ocean Strategy identifies three tiers of people who don&apos;t currently use chronic disease management solutions.
          </p>
        </motion.div>

        <motion.div {...stagger} className="grid md:grid-cols-3 gap-5">
          {[
            {
              tier: "Tier 1", title: "Soon-to-be Noncustomers",
              pop: "Existing polyclinic patients",
              desc: "Patients who currently visit polyclinics but disengage between visits. They tried the existing system but find it too manual, too impersonal, and too slow.",
              solution: "Bewo\u2019s zero-effort device integration + proactive AI eliminates the friction that drives disengagement.",
              accent: "text-primary", border: "border-primary/30",
            },
            {
              tier: "Tier 2", title: "Refusing Noncustomers",
              pop: "Pre-diabetics + early-stage",
              desc: "Pre-diabetics and early-stage patients who consciously reject clinical management. They don\u2019t see themselves as \u201Csick enough\u201D for a hospital-grade system.",
              solution: "Bewo\u2019s consumer-friendly chat interface + gamified vouchers make health management feel like a lifestyle app, not a clinical tool.",
              accent: "text-stable", border: "border-stable/30",
            },
            {
              tier: "Tier 3", title: "Unexplored Noncustomers",
              pop: "Unmonitored elderly",
              desc: "Elderly with undiagnosed or unmonitored conditions. They\u2019ve never been in the market because no one reached them \u2014 family caregivers manage informally.",
              solution: "Bewo\u2019s caregiver dashboard + family alerts + passive sensing means even low-tech-savvy patients can be monitored with minimal effort.",
              accent: "text-warning", border: "border-warning/30",
            },
          ].map((t) => (
            <motion.div key={t.tier} {...childVariant} className={`bg-surface-card border ${t.border} rounded-2xl p-6`}>
              <div className={`font-[family-name:var(--font-mono)] text-[10px] ${t.accent} font-bold tracking-widest mb-1`}>{t.tier}</div>
              <h3 className="text-lg font-[family-name:var(--font-display)] mb-1">{t.title}</h3>
              <div className={`font-[family-name:var(--font-mono)] font-bold text-sm ${t.accent} mb-3`}>{t.pop}</div>
              <p className="text-sm text-ink-secondary leading-relaxed mb-3">{t.desc}</p>
              <div className="border-t border-border-subtle pt-3">
                <span className="text-xs font-semibold text-ink">Bewo&apos;s answer: </span>
                <span className="text-xs text-ink-secondary leading-relaxed">{t.solution}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Price Corridor of the Mass */}
      <section id="price-corridor" className="max-w-6xl mx-auto px-6 mb-16">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.62_0.14_80_/_0.08)] text-warning text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Price Corridor of the Mass
          </div>
          <h2 className="text-3xl">Pricing within the mass corridor</h2>
        </motion.div>

        <motion.div {...fadeUp} className="bg-surface-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-[family-name:var(--font-mono)] text-xs text-ink-muted uppercase tracking-wider w-[180px]">Alternative</th>
                  <th className="text-left p-4 font-[family-name:var(--font-mono)] text-xs text-ink-muted uppercase tracking-wider">Type</th>
                  <th className="text-left p-4 font-[family-name:var(--font-mono)] text-xs text-ink-muted uppercase tracking-wider">Price</th>
                  <th className="text-left p-4 font-[family-name:var(--font-mono)] text-xs text-ink-muted uppercase tracking-wider">Limitations</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {[
                  { alt: "Livongo / MySugr", type: "Same form", price: "US$75-100/mo", limit: "Data tracking only, no prediction, no agentic actions, US-centric", accent: "text-ink-secondary" },
                  { alt: "SingHealth Polyclinic CDM", type: "Same form", price: "S$20-50/visit (subsidised)", limit: "Reactive, 1:600 nurse ratio, weeks between visits", accent: "text-ink-secondary" },
                  { alt: "Home nursing visits", type: "Different form", price: "S$80-200/visit", limit: "Human-dependent, not scalable, no prediction", accent: "text-ink-secondary" },
                  { alt: "ER admission (crisis)", type: "Diff. form, same function", price: "S$8,800/episode", limit: "Reactive, traumatic, maximum cost", accent: "text-crisis" },
                  { alt: "Bewo (Enhanced)", type: "Our price", price: "S$3/patient/mo", limit: "", accent: "text-stable" },
                ].map((row) => (
                  <tr key={row.alt} className={`border-b border-border-subtle ${row.accent === "text-stable" ? "bg-stable/4" : ""}`}>
                    <td className={`p-4 font-[family-name:var(--font-mono)] font-semibold ${row.accent === "text-stable" ? "text-stable font-bold" : "text-ink"}`}>{row.alt}</td>
                    <td className="p-4 text-ink-secondary">{row.type}</td>
                    <td className={`p-4 font-[family-name:var(--font-mono)] font-bold ${row.accent}`}>{row.price}</td>
                    <td className="p-4 text-ink-muted">{row.limit || <span className="text-stable font-semibold">Predictive + agentic + behavioural at 96% lower cost</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-surface-raised text-[10px] font-[family-name:var(--font-mono)] text-ink-muted">
            Strategic price set within the lower bound of the corridor to maximize mass adoption via B2G model. Government pays, patient pays nothing.
          </div>
        </motion.div>
      </section>

      {/* Revenue Model */}
      <section id="revenue-model" className="relative py-20 mb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.14_0.03_260)] via-[oklch(0.16_0.04_260)] to-[oklch(0.12_0.03_260)] rounded-3xl mx-6 overflow-hidden">
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[oklch(0.52_0.14_160_/_0.04)] rounded-full blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto px-12 relative z-10">
          <motion.div {...fadeUp} className="mb-10">
            <div className="font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-[oklch(0.60_0.08_160)] mb-3 uppercase">Revenue Model</div>
            <h2 className="text-3xl text-white mb-2">How Bewo Makes Money</h2>
            <p className="text-sm text-[oklch(0.65_0.015_260)]">
              B2G (Business-to-Government) SaaS model. Patients pay nothing. Government saves on hospitalisations.
            </p>
          </motion.div>

          <motion.div {...stagger} className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              {
                tier: "Basic Tier", price: "S$1", period: "/patient/mo",
                features: ["Phone-only data collection", "HMM prediction (9 features, phone-based)", "AI chat companion", "Voucher gamification"],
                accent: "text-[oklch(0.65_0.01_260)]",
              },
              {
                tier: "Enhanced Tier", price: "S$3", period: "/patient/mo",
                features: ["+ Fitbit auto-sync (passive collection)", "Full 16-tool agent", "Caregiver dashboard", "Weekly auto-reports"],
                accent: "text-primary", highlight: true,
              },
              {
                tier: "Premium Tier", price: "S$5", period: "/patient/mo",
                features: ["+ CGM real-time glucose", "Severity-based nurse triage", "Video education content", "Advanced counterfactuals"],
                accent: "text-stable",
              },
            ].map((t) => (
              <motion.div
                key={t.tier}
                {...childVariant}
                className={`bg-[oklch(0.20_0.04_260)] rounded-2xl p-6 border ${t.highlight ? "border-primary/40" : "border-[oklch(0.28_0.04_260)]"}`}
              >
                <div className={`font-[family-name:var(--font-mono)] text-xs font-bold ${t.accent} tracking-widest mb-3`}>{t.tier}</div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-[family-name:var(--font-mono)] font-bold text-white">{t.price}</span>
                  <span className="text-sm text-[oklch(0.50_0.01_260)]">{t.period}</span>
                </div>
                {t.features.map((f) => (
                  <div key={f} className="text-sm text-[oklch(0.70_0.01_260)] py-1.5 flex items-start gap-2">
                    <span className={`${t.accent} text-xs mt-0.5`}>&#10003;</span>
                    <span>{f}</span>
                  </div>
                ))}
              </motion.div>
            ))}
          </motion.div>

          <motion.div {...fadeUp} className="bg-[oklch(0.18_0.03_260)] rounded-xl p-5 border border-[oklch(0.25_0.03_260)]">
            <div className="text-xs font-[family-name:var(--font-mono)] text-[oklch(0.50_0.01_260)] uppercase tracking-widest mb-2">Unit Economics</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { label: "Avg Revenue/Patient", value: "S$3/mo" },
                { label: "Est. COGS", value: "~S$0.40/mo" },
                { label: "Gross Margin", value: "87%" },
                { label: "Payback (govt)", value: "1 admission = S$8.8K" },
              ].map((u) => (
                <div key={u.label}>
                  <div className="text-lg font-[family-name:var(--font-mono)] font-bold text-white">{u.value}</div>
                  <div className="text-[10px] text-[oklch(0.45_0.01_260)]">{u.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* TAM / SAM / SOM */}
      <section id="market-sizing" className="max-w-6xl mx-auto px-6 mb-16">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted text-primary text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Market Sizing
          </div>
          <h2 className="text-3xl">Singapore &rarr; ASEAN &rarr; Global</h2>
          <p className="text-sm text-ink-secondary mt-1 max-w-md">
            Bottom-up analysis based on patient populations and per-patient value.
          </p>
        </motion.div>

        <motion.div {...stagger} className="grid md:grid-cols-3 gap-5">
          {[
            {
              label: "SOM", title: "Singapore Phase 1", value: "S$720K",
              desc: "200K diabetics aged 60+. S$3/patient/month B2G. 10% penetration (20K patients) in 3 years via SingHealth polyclinic pilots.",
              accent: "text-warning", border: "border-warning/30", gradient: "from-warning/6",
            },
            {
              label: "SAM", title: "ASEAN Expansion", value: "US$2.0B",
              desc: "56M diabetics over 50 across ASEAN (WHO SEARO 2023). Same architecture, new emission parameters. US$3/patient/month B2G licensing.",
              accent: "text-stable", border: "border-stable/30", gradient: "from-stable/6",
            },
            {
              label: "TAM", title: "Global Opportunity", value: "US$4.8B",
              desc: "537M diabetics worldwide (IDF Atlas). Disease-agnostic HMM architecture scales to COPD, heart failure, CKD. AI chronic disease management market.",
              accent: "text-primary", border: "border-primary/30", gradient: "from-primary/6",
            },
          ].map((m) => (
            <motion.div key={m.label} {...childVariant} className={`relative bg-gradient-to-b ${m.gradient} to-transparent border ${m.border} rounded-2xl p-6`}>
              <div className={`font-[family-name:var(--font-mono)] text-[10px] ${m.accent} font-bold tracking-widest mb-2`}>{m.label}</div>
              <div className={`font-[family-name:var(--font-mono)] font-bold text-4xl ${m.accent} mb-1`}>{m.value}</div>
              <h3 className="text-base font-semibold mb-2">{m.title}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed">{m.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* BOI Sequence */}
      <section id="boi-sequence" className="max-w-6xl mx-auto px-6 mb-16">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.52_0.14_160_/_0.08)] text-stable text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Blue Ocean Idea Index
          </div>
          <h2 className="text-3xl">Sequence of Strategic Validation</h2>
          <p className="text-sm text-ink-secondary mt-1 max-w-lg">
            Every blue ocean idea must pass four sequential tests: Buyer Utility, Price, Cost, and Adoption.
          </p>
        </motion.div>

        <motion.div {...stagger} className="grid md:grid-cols-4 gap-4">
          {[
            {
              step: "1", title: "Buyer Utility",
              question: "Is there exceptional utility?",
              answer: "YES",
              detail: "48h crisis prediction (no competitor offers this). 16 agentic tools that take real actions. Zero patient effort via passive sensing. Loss-aversion gamification.",
              accent: "text-stable", border: "border-stable/30", bg: "bg-stable/6",
            },
            {
              step: "2", title: "Strategic Price",
              question: "Is the price accessible to the mass?",
              answer: "YES",
              detail: "S$1-5/mo B2G (government pays). 96% cheaper than Livongo. Patient cost: S$0. Government ROI: 1 prevented admission (S$8,800) funds 2,900 patient-months.",
              accent: "text-primary", border: "border-primary/30", bg: "bg-primary/6",
            },
            {
              step: "3", title: "Target Cost",
              question: "Can we achieve the cost target?",
              answer: "YES",
              detail: "COGS ~S$0.40/mo (Gemini Flash API). 87% gross margin at S$3/mo price point. No custom hardware. Python + FastAPI on standard cloud.",
              accent: "text-warning", border: "border-warning/30", bg: "bg-warning/6",
            },
            {
              step: "4", title: "Adoption",
              question: "Are adoption hurdles addressed?",
              answer: "YES",
              detail: "Nurses: SBAR reports they already understand. Patients: zero-effort. Government: aligns with Healthier SG + Smart Nation. Caregivers: reduces their burden.",
              accent: "text-primary", border: "border-primary/30", bg: "bg-primary/6",
            },
          ].map((s) => (
            <motion.div key={s.step} {...childVariant} className={`relative bg-gradient-to-b ${s.bg} to-transparent border ${s.border} rounded-2xl p-5`}>
              <div className={`font-[family-name:var(--font-mono)] text-3xl font-bold ${s.accent} opacity-15 absolute top-3 right-4`}>{s.step}</div>
              <div className={`font-[family-name:var(--font-mono)] text-[10px] ${s.accent} font-bold tracking-widest mb-1`}>TEST {s.step}</div>
              <h3 className="text-base font-semibold mb-1">{s.title}</h3>
              <p className="text-xs text-ink-muted mb-2 italic">{s.question}</p>
              <div className={`inline-block text-[10px] font-[family-name:var(--font-mono)] font-bold ${s.accent} bg-surface-card px-2 py-0.5 rounded mb-2`}>{s.answer}</div>
              <p className="text-xs text-ink-secondary leading-relaxed">{s.detail}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>


      {/* ╔══════════════════════════════════════════╗
          ║  4:00  EXECUTION & FEASIBILITY           ║
          ╚══════════════════════════════════════════╝ */}

      <SectionMarker time="4:00" label="Execution & Feasibility" />

      {/* Tipping Point Leadership */}
      <section id="tipping-point" className="max-w-6xl mx-auto px-6 mb-16">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted text-primary text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Tipping Point Leadership
          </div>
          <h2 className="text-3xl">Overcoming adoption barriers with limited resources</h2>
          <p className="text-sm text-ink-secondary mt-1 max-w-lg">
            Four organizational hurdles, four answers.
          </p>
        </motion.div>

        <motion.div {...stagger} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              hurdle: "Cognitive",
              problem: "Stakeholders don\u2019t see the need for change",
              tactic: "Live demo at polyclinics: show a nurse the 48h crisis prediction on a real (anonymized) patient profile. Seeing is believing.",
              accent: "text-primary", border: "border-primary/20",
            },
            {
              hurdle: "Resource",
              problem: "No budget, no team, no infrastructure",
              tactic: "Zero hardware cost (uses existing phones + Fitbits). Gemini Flash API at S$0.40/mo COGS. Smart Nation innovation grants cover pilot costs.",
              accent: "text-stable", border: "border-stable/20",
            },
            {
              hurdle: "Motivational",
              problem: "Nurses and patients resist new workflows",
              tactic: "Nurses: SBAR reports they already know. Zero new workflow. Patients: zero effort required (passive sensing + AI-initiated). Caregivers: reduces their burden.",
              accent: "text-warning", border: "border-warning/20",
            },
            {
              hurdle: "Political",
              problem: "Institutional resistance from healthcare establishment",
              tactic: "Doctor-gated medication decisions (no clinical authority threat). Government alignment via Healthier SG mandate. Polyclinic pilot = low-risk proof-of-value.",
              accent: "text-crisis", border: "border-crisis/20",
            },
          ].map((h) => (
            <motion.div key={h.hurdle} {...childVariant} className={`bg-surface-card border ${h.border} rounded-2xl p-5`}>
              <div className={`font-[family-name:var(--font-mono)] text-[10px] ${h.accent} font-bold tracking-widest mb-1`}>{h.hurdle.toUpperCase()} HURDLE</div>
              <p className="text-xs text-ink-muted italic mb-2">{h.problem}</p>
              <div className="border-t border-border-subtle pt-2">
                <span className="text-xs font-semibold text-ink">Our tactic: </span>
                <span className="text-xs text-ink-secondary leading-relaxed">{h.tactic}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Technical Feasibility */}
      <section id="tech-feasibility" className="max-w-6xl mx-auto px-6 mb-16">
        <motion.div {...fadeUp} className="bg-gradient-to-br from-surface-raised via-surface to-surface-raised rounded-3xl border border-border-subtle p-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted text-primary text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Technical Feasibility
          </div>
          <h2 className="text-3xl mb-6">No new technology required</h2>
          <p className="text-sm text-ink-secondary mb-6 max-w-lg">
            Every component of Bewo uses existing, proven technology. No research breakthroughs needed.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { tech: "Hidden Markov Models", status: "Proven since 1960s", detail: "Used in speech recognition, bioinformatics, finance. Our parameters from clinical literature." },
              { tech: "Gemini AI (Google)", status: "Production API", detail: "Function calling for tool execution. Flash model for real-time response. Available today." },
              { tech: "CGM + Fitbit APIs", status: "Existing devices", detail: "FreeStyle Libre, Dexcom G7, Fitbit Web API. No custom hardware needed." },
              { tech: "Singapore HealthHub", status: "Government API", detail: "National health records platform. Open for innovation partnerships." },
              { tech: "Python + FastAPI", status: "Industry standard", detail: "Backend runs on standard cloud infrastructure. SQLite for local, Postgres for scale." },
              { tech: "Behavioral Science", status: "Peer-reviewed", detail: "Prospect Theory (Kahneman 1979), Nudge (Thaler 2008), Fogg Model (2009). All published." },
            ].map((t) => (
              <div key={t.tech} className="flex gap-3 items-start py-3 border-b border-border-subtle last:border-0">
                <span className="text-stable text-xs mt-1">&#10003;</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{t.tech}</span>
                    <span className="text-[10px] font-[family-name:var(--font-mono)] text-stable bg-[oklch(0.52_0.14_160_/_0.08)] px-1.5 py-0.5 rounded">{t.status}</span>
                  </div>
                  <span className="text-xs text-ink-secondary">{t.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>


      {/* ╔══════════════════════════════════════════╗
          ║  4:40  CLOSE                             ║
          ╚══════════════════════════════════════════╝ */}

      <SectionMarker time="4:40" label="Close" />

      {/* Closing Hero */}
      <section id="close" className="relative min-h-[60vh] flex items-center mb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/10 via-stable/5 to-transparent blur-3xl animate-float" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-stable/8 via-transparent to-transparent blur-3xl animate-float [animation-delay:2s]" />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10 py-24 text-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted text-primary text-xs font-[family-name:var(--font-mono)] font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-stable animate-pulse-slow" />
              Blue Ocean Competition 2026
            </div>

            <h2 className="text-5xl lg:text-6xl mb-6 leading-[1.08] max-w-3xl mx-auto">
              The patient&apos;s job is to{" "}
              <span className="bg-gradient-to-r from-primary via-stable to-accent bg-clip-text text-transparent">
                live their life
              </span>
            </h2>

            <p className="text-lg text-ink-secondary max-w-2xl mx-auto leading-relaxed mb-8">
              Every chronic disease app asks patients to change their behaviour. Bewo changes the system instead.
              More value for patients &mdash; 48-hour warning, zero effort, personalised motivation.
              Lower cost for government &mdash; fewer ER visits, fewer nurse hours, fewer preventable admissions.
            </p>

            <div className="inline-flex items-center gap-4 text-sm font-[family-name:var(--font-mono)]">
              <span className="text-stable font-bold">Value Innovation</span>
              <span className="text-border">|</span>
              <span className="text-ink-secondary">More value AND lower cost, simultaneously</span>
            </div>

            <div className="mt-12 flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary-glow">
                <Heart size={16} className="text-white" />
              </div>
            </div>
            <div className="mt-3">
              <span className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-ink">
                BEWO
              </span>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
