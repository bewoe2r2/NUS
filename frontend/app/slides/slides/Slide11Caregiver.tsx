"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "One-glance Dashboard",
    description:
      "Green / yellow / red. Answered in under one second.",
  },
  {
    title: "3-Tier Escalation",
    description:
      "Info = push notification. Warning = SMS. Critical = phone call.",
  },
  {
    title: "One-tap Response",
    description:
      "Acknowledge, call, or escalate. No app-switching.",
  },
  {
    title: "Burden Scoring",
    description:
      "Detects caregiver fatigue. Auto-switches to digest mode.",
  },
];

export default function Slide11Caregiver() {
  return (
    <div className="flex items-center justify-center w-full h-full p-[8vh_8vw]">
      <div className="w-full max-w-5xl flex flex-col items-center">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-emerald-400 font-mono text-sm tracking-[0.2em] uppercase mb-6"
        >
          For the Caregiver
        </motion.p>

        {/* Hero quote */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-5xl font-bold text-white text-center mb-14"
        >
          &ldquo;Your father is safe.&rdquo;
        </motion.h1>

        {/* 2x2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full mb-10">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-6 border-l-4 border-l-emerald-400"
            >
              <h3 className="text-white font-semibold text-sm mb-2">
                {f.title}
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom line */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.5 }}
          className="text-zinc-500 text-sm text-center italic"
        >
          Designed for a working daughter checking her phone during lunch.
        </motion.p>
      </div>
    </div>
  );
}
