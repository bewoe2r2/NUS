"use client";

import { motion } from "framer-motion";

const phases = [
  {
    week: "W1-2",
    title: "Research",
    detail: "Clinical interviews, ADA guideline encoding, HMM architecture design",
    color: "text-cyan-400",
    accent: "#06b6d4",
  },
  {
    week: "W3-4",
    title: "Core Engine",
    detail: "HMM training, Monte Carlo simulation, safety classifier, drug interaction engine",
    color: "text-emerald-400",
    accent: "#10b981",
  },
  {
    week: "W5-6",
    title: "Intelligence",
    detail: "SEA-LION + MERaLiON integration, agentic reasoning, ReAct loop",
    color: "text-amber-400",
    accent: "#f59e0b",
  },
  {
    week: "W7-8",
    title: "Hardening",
    detail: "5,000-patient validation, 230 tests, 76 safety gates, production deploy",
    color: "text-rose-400",
    accent: "#f43f5e",
  },
];

export default function Slide18Team() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Neutral zinc -- different from all other slides */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, #0a0a0a 0%, #111113 50%, #0a0a0a 100%)",
        }}
      />

      <div className="relative z-10 w-full py-[8vh] px-[8vw]">
        {/* Title -- impact weight */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-14"
        >
          <span className="text-zinc-500 font-mono text-[11px] uppercase tracking-[0.4em] block mb-4">
            How We Built This
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
            8 weeks.{" "}
            <span className="font-extralight text-zinc-400">One team. Full stack.</span>
          </h2>
        </motion.div>

        {/* Timeline -- horizontal flow with connected dots */}
        <div className="relative mb-14">
          {/* Connection line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className="absolute top-5 left-0 right-0 h-px bg-gradient-to-r from-cyan-400/20 via-amber-400/20 to-rose-400/20 origin-left"
          />

          <div className="grid grid-cols-4 gap-6">
            {phases.map((phase, i) => (
              <motion.div
                key={phase.week}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
                className="relative pt-12"
              >
                {/* Dot on the line */}
                <div
                  className="absolute top-3 left-0 w-4 h-4 rounded-full border-2 bg-black"
                  style={{ borderColor: phase.accent }}
                />

                <span className={`font-mono text-3xl font-bold ${phase.color} block mb-2 opacity-40`}>
                  {phase.week}
                </span>
                <h3 className="text-white font-semibold text-lg mb-2">{phase.title}</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">{phase.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tech stack -- inline, minimal */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="border-t border-white/[0.04] pt-8"
        >
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {[
              { label: "Backend", value: "TypeScript + Hono", color: "text-cyan-400" },
              { label: "Frontend", value: "Next.js + Tailwind", color: "text-emerald-400" },
              { label: "AI", value: "SEA-LION + MERaLiON", color: "text-purple-400" },
              { label: "Math", value: "HMM + Monte Carlo + ARIMA", color: "text-amber-400" },
              { label: "Safety", value: "Deterministic rule engine", color: "text-rose-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-zinc-600">{item.label}:</span>
                <span className={`${item.color} font-mono font-medium`}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
