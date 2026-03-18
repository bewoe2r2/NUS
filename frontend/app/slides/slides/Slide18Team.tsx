"use client";

import { motion } from "framer-motion";

export default function Slide18Team() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Multi-color rotating orb */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full opacity-[0.03]"
        style={{
          background: "conic-gradient(from 180deg, rgba(6,182,212,0.4), rgba(52,211,153,0.4), rgba(168,85,247,0.4), rgba(251,191,36,0.4), rgba(6,182,212,0.4))",
          top: "5%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 w-full flex flex-col items-center py-[10vh] px-[10vw]">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-purple-400 font-mono text-base tracking-[0.3em] uppercase mb-4"
        >
          How We Built This
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-4xl md:text-5xl font-bold text-white mb-16 text-center"
        >
          8 weeks. <span className="text-purple-400">One team.</span> Full stack.
        </motion.h2>

        {/* 4-column timeline bento */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-5xl mb-14">
          {[
            {
              week: "W1-2",
              title: "Research",
              detail: "Clinical interviews, ADA guideline encoding, HMM architecture design",
              color: "text-cyan-400",
              border: "border-t-cyan-400",
            },
            {
              week: "W3-4",
              title: "Core Engine",
              detail: "HMM training, Monte Carlo simulation, safety classifier, drug interaction engine",
              color: "text-emerald-400",
              border: "border-t-emerald-400",
            },
            {
              week: "W5-6",
              title: "Intelligence Layer",
              detail: "SEA-LION + MERaLiON integration, agentic reasoning, ReAct loop",
              color: "text-amber-400",
              border: "border-t-amber-400",
            },
            {
              week: "W7-8",
              title: "Hardening",
              detail: "5,000-patient validation, 230 tests, 76 safety gates, production deploy",
              color: "text-rose-400",
              border: "border-t-rose-400",
            },
          ].map((phase, i) => (
            <motion.div
              key={phase.week}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.1, duration: 0.5 }}
              className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-7 border-t-4 ${phase.border}`}
            >
              <span className={`font-mono text-3xl font-bold ${phase.color} block mb-3`}>
                {phase.week}
              </span>
              <h3 className="text-white font-semibold text-lg mb-3">
                {phase.title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {phase.detail}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Tech stack callout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl px-10 py-6 max-w-4xl w-full"
        >
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm">
            {[
              { label: "Backend", value: "TypeScript + Hono", color: "text-cyan-400" },
              { label: "Frontend", value: "Next.js + Tailwind", color: "text-emerald-400" },
              { label: "AI", value: "SEA-LION + MERaLiON", color: "text-purple-400" },
              { label: "Math", value: "HMM + Monte Carlo + ARIMA", color: "text-amber-400" },
              { label: "Safety", value: "Deterministic rule engine", color: "text-rose-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-zinc-500">{item.label}:</span>
                <span className={`${item.color} font-mono font-medium`}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
