"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "One-glance Dashboard",
    description: "Green / yellow / red. Answered in under one second.",
  },
  {
    title: "3-Tier Escalation",
    description: "Info = push notification. Warning = SMS. Critical = phone call.",
  },
  {
    title: "One-tap Response",
    description: "Acknowledge, call, or escalate. No app-switching.",
  },
  {
    title: "Burden Scoring",
    description: "Detects caregiver fatigue. Auto-switches to digest mode.",
  },
];

export default function Slide13Caregiver() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Green gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(52,211,153,0.06) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 w-full flex flex-col items-center py-[10vh] px-[10vw]">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-emerald-400 font-mono text-base tracking-[0.3em] uppercase mb-8"
        >
          For the Caregiver
        </motion.p>

        {/* Full-screen centered quote */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-5xl md:text-7xl font-bold text-white text-center mb-6 leading-tight"
        >
          &ldquo;Your father is{" "}
          <span
            className="text-emerald-400"
            style={{ textShadow: "0 0 100px rgba(52,211,153,0.3)" }}
          >
            safe.
          </span>
          &rdquo;
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="text-zinc-500 text-lg italic mb-14"
        >
          Designed for a working daughter checking her phone during lunch.
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-24 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent mb-14"
        />

        {/* 2x2 grid -- glass panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.1, duration: 0.5 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-7 border-l-4 border-l-emerald-400"
            >
              <h3 className="text-white font-semibold text-lg mb-3">
                {f.title}
              </h3>
              <p className="text-zinc-400 text-base leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
