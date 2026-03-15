"use client";

import { motion } from "framer-motion";
import {
  TrendingDown, Clock, Users, DollarSign, ArrowRight, Globe, Layers,
  Shield, Heart, Brain, Target, Megaphone, Building2, Smartphone,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
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
      "18-tool agentic AI (real actions, not just suggestions \u2014 doctor-gated for medication)",
      "Loss-aversion voucher gamification (S$5/week with decay)",
      "AI-initiated proactive check-ins (no patient trigger needed)",
    ],
    accent: "border-stable", textAccent: "text-stable",
  },
];

export default function ImpactPage() {
  return (
    <div className="overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-stable/8 to-transparent rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(oklch(0.45 0.12 185) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.52_0.14_160_/_0.08)] text-stable text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
              Blue Ocean Strategy
            </div>
            <h1 className="text-5xl lg:text-6xl max-w-2xl mb-4 leading-[1.08]">
              The patient shouldn&apos;t have to try
            </h1>
            <p className="text-lg text-ink-secondary max-w-xl leading-relaxed">
              Every chronic disease solution today assumes patients must be motivated to act.
              Bewo eliminates the management burden entirely.
            </p>
          </motion.div>

          {/* THE INSIGHT — the one thing judges should remember */}
          <motion.div {...fadeUp} className="mt-8 bg-gradient-to-r from-primary/8 to-transparent border border-primary/20 rounded-2xl p-6 max-w-2xl">
            <div className="text-xs font-[family-name:var(--font-mono)] text-primary font-bold tracking-widest mb-2">OUR BLUE OCEAN INSIGHT</div>
            <p className="text-ink leading-relaxed">
              Chronic disease management has a hidden assumption: the patient must actively participate.
              Log your glucose. Remember your pills. Attend your appointments. When they don&apos;t, the system blames &ldquo;non-compliance.&rdquo;
            </p>
            <p className="text-ink leading-relaxed mt-2">
              Bewo shifts the burden from the patient to the system. HMMs predict crises from passive sensor data.
              Agentic AI takes real actions — booking appointments, alerting caregivers, adjusting nudge timing.
              The patient&apos;s job is to <span className="text-primary font-semibold">live their life</span>, not to manage their disease.
              This simultaneously reduces cost (fewer nurse hours, fewer ER visits) and increases value (48h advance warning, zero patient burden).
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== IMPACT METRICS ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...stagger} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: TrendingDown, value: 2034, suffix: "", prefix: "S$", label: "Avg Annual Cost / T2DM Patient", sub: "Direct medical cost including inpatient, outpatient, A&E (PLOS One / NHG Singapore 2015)", accent: "text-stable", borderAccent: "from-stable" },
            { icon: Clock, value: 61, suffix: "%", prefix: "", label: "Spent on Inpatient Care", sub: "S$1,237 of S$2,034 avg goes to hospitalisation alone (PLOS One 2015)", accent: "text-primary", borderAccent: "from-primary" },
            { icon: Users, value: 20, suffix: "%+", label: "Diabetes in Ages 60-74", sub: "Highest prevalence in developed Asia (MOH National Population Health Survey 2022)", accent: "text-warning", borderAccent: "from-warning" },
            { icon: DollarSign, value: 8800, prefix: "S$", suffix: "", label: "Avg Admission with Complications", sub: "T2DM patients with \u22651 inpatient admission (PLOS One / NHG Singapore 2015)", accent: "text-crisis", borderAccent: "from-crisis" },
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

      {/* ===== TAM / SAM / SOM ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted text-primary text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Market Sizing
          </div>
          <h2 className="text-3xl">Total Addressable Market</h2>
          <p className="text-sm text-ink-secondary mt-1 max-w-md">
            Bottom-up analysis based on patient populations and per-patient value.
          </p>
        </motion.div>

        <motion.div {...stagger} className="grid md:grid-cols-3 gap-5">
          {[
            {
              label: "TAM", title: "Total Addressable", value: "US$4.8B",
              desc: "Global AI-powered chronic disease management market (Grand View Research 2024). 537M diabetics worldwide (IDF Diabetes Atlas, 10th Ed 2021).",
              accent: "text-primary", border: "border-primary/30", gradient: "from-primary/6",
            },
            {
              label: "SAM", title: "Serviceable Addressable", value: "US$2.0B",
              desc: "ASEAN diabetics over 50: ~56M patients (WHO SEARO 2023). US$3/patient/month B2G SaaS licensing to government health systems.",
              accent: "text-stable", border: "border-stable/30", gradient: "from-stable/6",
            },
            {
              label: "SOM", title: "Serviceable Obtainable", value: "S$720K",
              desc: "Singapore Phase 1: ~200K diabetics aged 60+ (20% prevalence of ~1M residents 60+, MOH NPHS 2022). S$3/patient/month B2G. 10% penetration (20K patients) in 3 years via SingHealth polyclinic pilots.",
              accent: "text-warning", border: "border-warning/30", gradient: "from-warning/6",
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

      {/* ===== AS-IS STRATEGY CANVAS ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-12">
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

      {/* ===== TO-BE STRATEGY CANVAS ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.52_0.14_160_/_0.08)] text-stable text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            To-Be Strategy Canvas
          </div>
          <h2 className="text-3xl">The Blue Ocean: Bewo&apos;s divergent value curve</h2>
          <p className="text-sm text-ink-secondary mt-1 max-w-lg">
            After applying the ERRC Grid, Bewo creates a fundamentally different value curve that doesn&apos;t compete — it makes the competition irrelevant.
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
            Bewo&apos;s value curve diverges on 5 factors (Crisis Prediction, Agentic Actions, Behavioral Science, Cultural Context, Patient Engagement) while reducing Clinical Integration dependency (nurses augmented, not replaced).
          </div>
        </motion.div>
      </section>

      {/* ===== ERRC GRID — dark ===== */}
      <section className="relative py-20 mb-24">
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

      {/* ===== SIX PATHS FRAMEWORK ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted text-primary text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Six Paths Framework
          </div>
          <h2 className="text-3xl">How we found the Blue Ocean</h2>
          <p className="text-sm text-ink-secondary mt-1 max-w-lg">
            Six systematic paths to reconstruct market boundaries and unlock new value.
          </p>
        </motion.div>

        <motion.div {...stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              path: "Path 1", title: "Alternative Industries",
              insight: "Chronic disease management exists across hospitals, apps, and insurance wellness programs. None combine prediction + action + behavioral science.",
              bewo: "Bewo merges clinical monitoring (hospitals), consumer engagement (apps), and cost reduction (insurance) into one system.",
              accent: "text-primary", border: "border-primary/20",
            },
            {
              path: "Path 2", title: "Strategic Groups",
              insight: "Budget apps (free, low engagement) vs. premium clinical systems (expensive, high friction). No middle ground.",
              bewo: "Bewo is premium capability at budget cost: S$1-5/mo B2G, but with 18 agentic tools and HMM prediction.",
              accent: "text-stable", border: "border-stable/20",
            },
            {
              path: "Path 3", title: "Buyer Chain",
              insight: "Existing solutions target doctors (prescribers) or patients (users). Caregivers and nurses are overlooked.",
              bewo: "Bewo serves all four: patients (chat), nurses (SBAR dashboard), caregivers (alerts), government (cost savings).",
              accent: "text-warning", border: "border-warning/20",
            },
            {
              path: "Path 4", title: "Complementary Offerings",
              insight: "Glucose monitoring is siloed from medication, activity, diet, and social support. Patients manage each separately.",
              bewo: "Bewo integrates 9 biomarkers across all dimensions. One system handles glucose, meds, food, steps, sleep, and social engagement.",
              accent: "text-primary", border: "border-primary/20",
            },
            {
              path: "Path 5", title: "Functional-Emotional Appeal",
              insight: "Clinical tools are purely functional (data tracking). Consumer apps are emotional but lack clinical depth.",
              bewo: "Bewo is clinically rigorous AND emotionally intelligent: Singlish dialect, mood detection, loss-aversion vouchers, streak celebrations.",
              accent: "text-stable", border: "border-stable/20",
            },
            {
              path: "Path 6", title: "Across Time",
              insight: "Aging populations + rising diabetes prevalence + AI maturity + government digital health push = convergence point is now.",
              bewo: "Singapore\u2019s Smart Nation initiative, Healthier SG, and 20%+ elderly diabetes prevalence make 2026 the ideal entry point.",
              accent: "text-warning", border: "border-warning/20",
            },
          ].map((p) => (
            <motion.div key={p.path} {...childVariant} className={`bg-surface-card border ${p.border} rounded-2xl p-5`}>
              <div className={`font-[family-name:var(--font-mono)] text-[10px] ${p.accent} font-bold tracking-widest mb-1`}>{p.path}</div>
              <h3 className="text-base font-semibold mb-2">{p.title}</h3>
              <p className="text-xs text-ink-muted leading-relaxed mb-2">{p.insight}</p>
              <div className="border-t border-border-subtle pt-2">
                <span className="text-xs font-semibold text-ink">Bewo: </span>
                <span className="text-xs text-ink-secondary leading-relaxed">{p.bewo}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== THREE TIERS OF NONCUSTOMERS ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
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
              desc: "Patients who currently visit polyclinics but disengage between visits. They tried the existing system but find it too manual, too impersonal, and too slow to respond to day-to-day crises.",
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

      {/* ===== BUYER UTILITY MAP ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.62_0.14_80_/_0.08)] text-warning text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Buyer Utility Map
          </div>
          <h2 className="text-3xl">Where Bewo creates new utility</h2>
          <p className="text-sm text-ink-secondary mt-1 max-w-lg">
            Mapping the six utility levers across the buyer experience cycle reveals where existing solutions fail and Bewo creates breakthrough value.
          </p>
        </motion.div>

        <motion.div {...fadeUp} className="bg-surface-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-[family-name:var(--font-mono)] text-xs text-ink-muted uppercase tracking-wider w-[140px]">Utility Lever</th>
                  <th className="text-left p-4 font-[family-name:var(--font-mono)] text-xs text-ink-muted uppercase tracking-wider">Purchase</th>
                  <th className="text-left p-4 font-[family-name:var(--font-mono)] text-xs text-ink-muted uppercase tracking-wider">Delivery</th>
                  <th className="text-left p-4 font-[family-name:var(--font-mono)] text-xs text-ink-muted uppercase tracking-wider">Use</th>
                  <th className="text-left p-4 font-[family-name:var(--font-mono)] text-xs text-ink-muted uppercase tracking-wider">Supplement</th>
                  <th className="text-left p-4 font-[family-name:var(--font-mono)] text-xs text-ink-muted uppercase tracking-wider">Maintenance</th>
                  <th className="text-left p-4 font-[family-name:var(--font-mono)] text-xs text-ink-muted uppercase tracking-wider">Disposal</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {[
                  { lever: "Productivity", purchase: "", delivery: "", use: "18 tools auto-execute actions", supplement: "Weekly auto-reports", maintenance: "OTA model updates", disposal: "" },
                  { lever: "Simplicity", purchase: "Free app, no hardware needed", delivery: "Auto device pairing", use: "Voice + photo input", supplement: "", maintenance: "Zero config updates", disposal: "One-tap data export" },
                  { lever: "Convenience", purchase: "", delivery: "Instant onboarding", use: "AI-initiated (zero effort)", supplement: "Caregiver dashboard", maintenance: "", disposal: "" },
                  { lever: "Risk Reduction", purchase: "", delivery: "", use: "48h crisis prediction", supplement: "SBAR clinical reports", maintenance: "Continuous recalibration", disposal: "Full audit trail" },
                  { lever: "Fun & Image", purchase: "", delivery: "Gamified streaks", use: "Voucher rewards (S$5/wk)", supplement: "Achievement badges", maintenance: "", disposal: "" },
                  { lever: "Sustainability", purchase: "B2G model (govt pays)", delivery: "", use: "3-tier privacy", supplement: "Anonymized research data", maintenance: "PDPA compliant", disposal: "Right to erasure" },
                ].map((row) => (
                  <tr key={row.lever} className="border-b border-border-subtle">
                    <td className="p-4 font-[family-name:var(--font-mono)] font-bold text-ink">{row.lever}</td>
                    <td className="p-4 text-ink-secondary">{row.purchase || <span className="text-ink-muted/40">&mdash;</span>}</td>
                    <td className="p-4 text-ink-secondary">{row.delivery || <span className="text-ink-muted/40">&mdash;</span>}</td>
                    <td className="p-4">{row.use ? <span className="text-primary font-medium">{row.use}</span> : <span className="text-ink-muted/40">&mdash;</span>}</td>
                    <td className="p-4 text-ink-secondary">{row.supplement || <span className="text-ink-muted/40">&mdash;</span>}</td>
                    <td className="p-4 text-ink-secondary">{row.maintenance || <span className="text-ink-muted/40">&mdash;</span>}</td>
                    <td className="p-4 text-ink-secondary">{row.disposal || <span className="text-ink-muted/40">&mdash;</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-surface-raised text-[10px] font-[family-name:var(--font-mono)] text-ink-muted">
            Green cells = Bewo&apos;s primary utility creation points. Existing solutions score zero in Crisis Prediction, Agentic Actions, and Behavioral Gamification.
          </div>
        </motion.div>
      </section>

      {/* ===== REVENUE MODEL — dark ===== */}
      <section className="relative py-20 mb-24">
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.14_0.03_260)] via-[oklch(0.16_0.04_260)] to-[oklch(0.12_0.03_260)] rounded-3xl mx-6 overflow-hidden">
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[oklch(0.52_0.14_160_/_0.04)] rounded-full blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto px-12 relative z-10">
          <motion.div {...fadeUp} className="mb-10">
            <div className="font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-[oklch(0.60_0.08_160)] mb-3 uppercase">Revenue Model</div>
            <h2 className="text-3xl text-white mb-2">How Bewo Makes Money</h2>
            <p className="text-sm text-[oklch(0.65_0.015_260)]">
              B2G (Business-to-Government) SaaS model. Patients pay nothing. Government saves on hospitalizations.
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
                features: ["+ Fitbit auto-sync (passive collection)", "Full 18-tool agent", "Caregiver dashboard", "Weekly auto-reports"],
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

      {/* ===== PRICE CORRIDOR OF THE MASS ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.62_0.14_80_/_0.08)] text-warning text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Price Corridor of the Mass
          </div>
          <h2 className="text-3xl">Pricing within the mass corridor</h2>
          <p className="text-sm text-ink-secondary mt-1 max-w-lg">
            Identifying the right strategic price band by comparing same-form, different-form, and different-form-same-function alternatives.
          </p>
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

      {/* ===== BOI SEQUENCE ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
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
              detail: "48h crisis prediction (no competitor offers this). 18 agentic tools that take real actions. Zero patient effort via passive sensing. Loss-aversion gamification.",
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
              detail: "COGS ~S$0.40/mo (Gemini Flash API). 87% gross margin at S$3/mo price point. No custom hardware. Python + FastAPI on standard cloud. HMM is computationally trivial.",
              accent: "text-warning", border: "border-warning/30", bg: "bg-warning/6",
            },
            {
              step: "4", title: "Adoption",
              question: "Are adoption hurdles addressed?",
              answer: "YES",
              detail: "Nurses: SBAR reports they already understand. Patients: zero-effort (no new behaviour required). Government: aligns with Healthier SG + Smart Nation. Caregivers: reduces their burden.",
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

      {/* ===== GO-TO-MARKET ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted text-primary text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Go-to-Market Strategy
          </div>
          <h2 className="text-3xl">Three-channel acquisition</h2>
        </motion.div>

        <motion.div {...stagger} className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Building2, title: "Polyclinic Partnerships",
              desc: "Pilot with 3 SingHealth polyclinics. Nurses onboard patients during routine diabetes checkups. Zero patient acquisition cost.",
              stat: "70%", statLabel: "of acquisition",
              accent: "text-primary", bg: "bg-primary-muted", border: "border-primary/20",
            },
            {
              icon: Megaphone, title: "Community Health Posts",
              desc: "Partner with Community Health Assist Scheme (CHAS) clinics and Senior Activity Centres. Train community health ambassadors.",
              stat: "20%", statLabel: "of acquisition",
              accent: "text-stable", bg: "bg-[oklch(0.52_0.14_160_/_0.08)]", border: "border-stable/20",
            },
            {
              icon: Smartphone, title: "Digital + Referral",
              desc: "HealthHub integration surfaces Bewo to existing users. Caregiver referral loop: family members invite other elderly relatives.",
              stat: "10%", statLabel: "of acquisition",
              accent: "text-warning", bg: "bg-[oklch(0.62_0.14_80_/_0.08)]", border: "border-warning/20",
            },
          ].map((c) => (
            <motion.div key={c.title} {...childVariant} className={`bg-surface-card border ${c.border} rounded-2xl p-6`}>
              <span className={`w-11 h-11 rounded-xl ${c.bg} ${c.accent} flex items-center justify-center mb-3`}>
                <c.icon size={20} />
              </span>
              <h3 className="text-base font-semibold mb-2">{c.title}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed mb-3">{c.desc}</p>
              <div className="border-t border-border-subtle pt-3 flex items-baseline gap-2">
                <span className={`font-[family-name:var(--font-mono)] font-bold text-2xl ${c.accent}`}>{c.stat}</span>
                <span className="text-xs text-ink-muted">{c.statLabel}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== COMPETITIVE MOAT ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted text-primary text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Competitive Moat
          </div>
          <h2 className="text-3xl">Why Bewo Can&apos;t Be Replicated</h2>
        </motion.div>

        <motion.div {...stagger} className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Brain, title: "Interpretable by design",
              desc: "Competitors use black-box deep learning. We chose HMMs specifically because nurses can read the output: \u201CWARNING state, 72% confidence, 0.35 transition to CRISIS.\u201D Clinical trust is the moat — you can\u2019t retrofit interpretability onto a neural network.",
              accent: "text-primary", bg: "bg-primary-muted", border: "border-primary/20",
            },
            {
              icon: Shield, title: "Regulatory head start",
              desc: "Explainable AI has a faster HSA/regulatory pathway than black-box models. Auto-SBAR, full audit trail, and \u201Cnever auto-adjusts medication\u201D means we can deploy while competitors are still filing for SaMD classification.",
              accent: "text-stable", bg: "bg-[oklch(0.52_0.14_160_/_0.08)]", border: "border-stable/20",
            },
            {
              icon: Heart, title: "Behavioral compounding",
              desc: "Streaks, voucher decay, adaptive nudge timing, and mood-aware tone create compounding engagement. Each week a patient uses Bewo, switching cost increases. Loss-aversion mechanics compound engagement over time while competitors rely on willpower alone.",
              accent: "text-warning", bg: "bg-[oklch(0.62_0.14_80_/_0.08)]", border: "border-warning/20",
            },
          ].map((m) => (
            <motion.div key={m.title} {...childVariant} className={`bg-surface-card border ${m.border} rounded-2xl p-6 hover:shadow-md transition-shadow`}>
              <span className={`w-11 h-11 rounded-xl ${m.bg} ${m.accent} flex items-center justify-center mb-3`}>
                <m.icon size={20} />
              </span>
              <h3 className="text-base font-semibold mb-2">{m.title}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed">{m.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== PIONEER-MIGRATOR-SETTLER MAP ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted text-primary text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Pioneer-Migrator-Settler Map
          </div>
          <h2 className="text-3xl">Where Bewo sits in the market</h2>
          <p className="text-sm text-ink-secondary mt-1 max-w-lg">
            Mapping market players by value innovation. Pioneers create new value curves. Migrators improve. Settlers compete on price.
          </p>
        </motion.div>

        <motion.div {...fadeUp} className="bg-surface-card border border-border rounded-2xl p-8">
          <div className="grid grid-cols-3 gap-6">
            {[
              {
                zone: "Settlers",
                subtitle: "Me-too, compete on price",
                players: ["Traditional polyclinic CDM", "Generic glucose trackers", "Basic reminder apps"],
                desc: "Same value curve as existing solutions. Compete on subsidies or convenience. No new value creation.",
                accent: "text-ink-muted", border: "border-border-subtle", bg: "bg-surface-raised",
              },
              {
                zone: "Migrators",
                subtitle: "Better than competition",
                players: ["Livongo / MySugr", "Dexcom Clarity", "Health2Sync"],
                desc: "Improved data visualization and tracking. Still reactive. No prediction, no agentic actions, no behavioural economics.",
                accent: "text-warning", border: "border-warning/30", bg: "bg-warning/4",
              },
              {
                zone: "Pioneers",
                subtitle: "New value curve entirely",
                players: ["Bewo"],
                desc: "Predictive (48h HMM). Agentic (18 tools that act). Behavioural (loss-aversion gamification). Culturally contextual (Singlish, hawker food). Creates value curves that don\u2019t exist in the market.",
                accent: "text-stable", border: "border-stable/30", bg: "bg-stable/6",
              },
            ].map((z) => (
              <div key={z.zone} className={`border ${z.border} rounded-xl p-5 ${z.bg}`}>
                <div className={`font-[family-name:var(--font-mono)] text-xs font-bold ${z.accent} tracking-widest mb-1`}>{z.zone.toUpperCase()}</div>
                <div className="text-[10px] text-ink-muted mb-3">{z.subtitle}</div>
                <div className="space-y-1 mb-3">
                  {z.players.map((p) => (
                    <div key={p} className={`text-sm ${z.accent === "text-stable" ? "font-bold text-stable" : "text-ink-secondary"}`}>
                      {z.accent === "text-stable" ? "\u2192 " : "\u2022 "}{p}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">{z.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== TIPPING POINT LEADERSHIP ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted text-primary text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Tipping Point Leadership
          </div>
          <h2 className="text-3xl">Overcoming adoption barriers with limited resources</h2>
          <p className="text-sm text-ink-secondary mt-1 max-w-lg">
            Blue Ocean execution requires breaking through four organizational hurdles without large budgets or political capital.
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
              tactic: "Nurses: SBAR reports they already know. Zero new workflow. Patients: zero effort required (passive sensing + AI-initiated). Caregivers: reduces their burden, not adds to it.",
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

      {/* ===== FAIR PROCESS ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.52_0.14_160_/_0.08)] text-stable text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Fair Process
          </div>
          <h2 className="text-3xl">Building trust through procedural justice</h2>
          <p className="text-sm text-ink-secondary mt-1 max-w-lg">
            Blue Ocean execution succeeds when stakeholders feel the process is fair — even if they don&apos;t fully agree with every outcome.
          </p>
        </motion.div>

        <motion.div {...stagger} className="grid md:grid-cols-3 gap-5">
          {[
            {
              principle: "Engagement",
              desc: "Involve stakeholders in the design process from the start.",
              bewo: "Polyclinic nurses co-design SBAR report format. Patients choose nudge timing preferences. Caregivers set their own alert thresholds. Government sets clinical safety boundaries.",
              accent: "text-primary", border: "border-primary/20",
            },
            {
              principle: "Explanation",
              desc: "Explain the reasoning behind every decision transparently.",
              bewo: "HMM is fully interpretable (not black-box). Every alert includes: state, confidence score, transition probability, and triggering biomarkers. Nurses see WHY, not just WHAT.",
              accent: "text-stable", border: "border-stable/20",
            },
            {
              principle: "Expectation Clarity",
              desc: "State clearly what is expected of each role.",
              bewo: "Patients: do nothing different. Nurses: review SBAR when flagged. Doctors: approve/reject medication suggestions. Caregivers: respond to alerts. No ambiguity.",
              accent: "text-warning", border: "border-warning/20",
            },
          ].map((p) => (
            <motion.div key={p.principle} {...childVariant} className={`bg-surface-card border ${p.border} rounded-2xl p-6`}>
              <div className={`font-[family-name:var(--font-mono)] text-[10px] ${p.accent} font-bold tracking-widest mb-1`}>{p.principle.toUpperCase()}</div>
              <p className="text-xs text-ink-muted italic mb-3">{p.desc}</p>
              <div className="border-t border-border-subtle pt-3">
                <span className="text-xs font-semibold text-ink">Bewo: </span>
                <span className="text-xs text-ink-secondary leading-relaxed">{p.bewo}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== SCALABILITY ROADMAP ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.52_0.14_160_/_0.08)] text-stable text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Scalability
          </div>
          <h2 className="text-3xl">Growth Roadmap</h2>
        </motion.div>

        <motion.div {...stagger} className="space-y-4">
          {[
            {
              icon: Users, phase: "Phase 1", region: "Singapore",
              patients: "20K patients (10%)", timeline: "2026\u20132027", revenue: "S$720K SOM",
              desc: "Polyclinic pilots. HealthHub API integration. 3 patient tiers. Government co-funding via Smart Nation grants.",
              accent: "text-primary", borderAccent: "border-primary/30", gradient: "from-primary/6",
            },
            {
              icon: Globe, phase: "Phase 2", region: "ASEAN Expansion",
              patients: "56M patients", timeline: "2028\u20132029", revenue: "US$680M SAM",
              desc: "Malaysia, Thailand, Indonesia. HMM retraining per regional clinical data. Cultural food databases. Multi-language support.",
              accent: "text-stable", borderAccent: "border-stable/30", gradient: "from-stable/6",
            },
            {
              icon: Layers, phase: "Phase 3", region: "Multi-Chronic Disease",
              patients: "537M+ globally", timeline: "2030+", revenue: "US$4.8B TAM",
              desc: "Hypertension, COPD, heart failure. Same agentic architecture, new HMM emission models per condition. Global licensing.",
              accent: "text-warning", borderAccent: "border-warning/30", gradient: "from-warning/6",
            },
          ].map((p) => (
            <motion.div
              key={p.phase}
              {...childVariant}
              className={`bg-gradient-to-r ${p.gradient} to-transparent border ${p.borderAccent} rounded-2xl p-8 flex gap-6 items-start`}
            >
              <span className={`w-14 h-14 rounded-2xl bg-surface-card border border-border flex items-center justify-center ${p.accent} shrink-0 shadow-sm`}>
                <p.icon size={24} />
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <div className={`font-[family-name:var(--font-mono)] text-xs ${p.accent} font-medium`}>
                    {p.phase} — {p.timeline}
                  </div>
                  <div className={`font-[family-name:var(--font-mono)] text-xs ${p.accent} font-bold`}>{p.revenue}</div>
                </div>
                <h3 className="text-xl font-[family-name:var(--font-display)] mb-1">{p.region}</h3>
                <div className="font-[family-name:var(--font-mono)] font-bold text-2xl mb-2">{p.patients}</div>
                <p className="text-sm text-ink-secondary leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== TECHNICAL FEASIBILITY ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
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

      {/* ===== RISKS & MITIGATIONS ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.52_0.16_25_/_0.08)] text-crisis text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Risks & Mitigations
          </div>
          <h2 className="text-3xl">What could go wrong</h2>
          <p className="text-sm text-ink-secondary mt-1 max-w-md">
            We&apos;ve identified six key risks and designed mitigations into the architecture from day one.
          </p>
        </motion.div>

        <motion.div {...stagger} className="grid md:grid-cols-2 gap-4">
          {[
            {
              risk: "Model predicts crisis that doesn\u2019t happen (false positive)",
              severity: "HIGH",
              mitigation: "AI routes to nurse for confirmation before escalation. No automated medical action. SBAR report includes confidence score so nurses can prioritize.",
              accent: "text-crisis", border: "border-crisis/20",
            },
            {
              risk: "Model misses a real crisis (false negative)",
              severity: "CRITICAL",
              mitigation: "Multi-signal design: 9 biomarkers cross-validate each other. If CGM fails, HRV + steps + medication adherence still detect deterioration. System never replaces clinical judgment.",
              accent: "text-crisis", border: "border-crisis/20",
            },
            {
              risk: "HSA classifies Bewo as Software as Medical Device (SaMD)",
              severity: "MEDIUM",
              mitigation: "Bewo provides decision SUPPORT, not decisions. It never auto-adjusts medication. Designed to fall under wellness/monitoring category, not diagnostic. Legal review budgeted in Phase 1.",
              accent: "text-warning", border: "border-warning/20",
            },
            {
              risk: "Patient data breach or PDPA violation",
              severity: "HIGH",
              mitigation: "3-tier privacy by design. Tier 1 data deleted in <24h. Tier 2 encrypted on-device. Tier 3 anonymized. No PII in cloud. Audio never stored.",
              accent: "text-warning", border: "border-warning/20",
            },
            {
              risk: "Government procurement cycles too slow (18-24 months)",
              severity: "MEDIUM",
              mitigation: "Pilot with 3 polyclinics under innovation sandbox (faster approval). Smart Nation grant funding covers pilot cost. Proof-of-value before procurement.",
              accent: "text-primary", border: "border-primary/20",
            },
            {
              risk: "Gemini AI hallucinates or gives inappropriate advice",
              severity: "HIGH",
              mitigation: "AI only selects from 18 predefined tools with constrained parameters. Cannot freestyle medical advice. HMM is deterministic — AI interprets, not diagnoses. Full audit log on every action.",
              accent: "text-warning", border: "border-warning/20",
            },
          ].map((r) => (
            <motion.div key={r.risk} {...childVariant} className={`bg-surface-card border ${r.border} rounded-2xl p-5`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-[family-name:var(--font-mono)] font-bold ${r.accent}`}>RISK</span>
                <span className={`text-[10px] font-[family-name:var(--font-mono)] ${r.accent} bg-surface-raised px-2 py-0.5 rounded`}>{r.severity}</span>
              </div>
              <p className="text-sm text-ink font-medium mb-2">{r.risk}</p>
              <p className="text-xs text-ink-secondary leading-relaxed"><span className="text-stable font-semibold">Mitigation:</span> {r.mitigation}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== SINGAPORE CONTEXT ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <motion.div {...fadeUp} className="bg-gradient-to-br from-surface-raised via-surface to-surface-raised rounded-3xl border border-border-subtle p-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.52_0.16_25_/_0.08)] text-crisis text-xs font-[family-name:var(--font-mono)] font-medium mb-4">
            Singapore Healthcare Context
          </div>
          <h2 className="text-3xl mb-6">Why Singapore. Why Now.</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { stat: "20%+", desc: "of Singaporeans aged 60-74 have diabetes. Overall prevalence ~9.5% (MOH National Population Health Survey 2022)" },
                { stat: "S$2,034", desc: "mean annual direct medical cost per T2DM patient. 61% goes to inpatient care alone (PLOS One / NHG Singapore 2015)" },
                { stat: "S$8,800", desc: "mean cost for T2DM patients with at least one hospital admission — the preventable cost we target (PLOS One 2015)" },
                { stat: "1:600", desc: "nurse-to-chronic-patient ratio in polyclinics — physically impossible to manage reactively (SingHealth Annual Report 2023)" },
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
                { initiative: "CHAS Clinics Network", detail: "1,800+ Community Health Assist Scheme clinics — our distribution channel." },
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

      {/* ===== CTA ===== */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <motion.div {...fadeUp} className="text-center py-16 relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[300px] h-[300px] rounded-full bg-gradient-to-br from-stable/5 via-primary/3 to-transparent blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="text-3xl mb-3">See the Product</h2>
            <p className="text-ink-secondary mb-8 max-w-md mx-auto">
              Walk through a real patient interaction with Bewo&apos;s agentic AI in action.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/demo"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary-glow hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                Product Walkthrough
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/technology"
                className="inline-flex items-center gap-2 px-8 py-4 border border-primary/30 text-primary rounded-xl font-semibold hover:bg-primary-muted transition-all duration-200"
              >
                Technical Deep-Dive
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
