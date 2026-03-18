"use client";

import { motion } from "framer-motion";

const features = [
  { title: "One-glance Dashboard", description: "Green / yellow / red. Answered in under one second." },
  { title: "3-Tier Escalation", description: "Info = push notification. Warning = SMS. Critical = phone call." },
  { title: "One-tap Response", description: "Acknowledge, call, or escalate. No app-switching." },
  { title: "Burden Scoring", description: "Detects caregiver fatigue. Auto-switches to digest mode." },
];

export default function Slide13Caregiver() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Deep black -- content at top, bottom 40% is empty breathing room */}
      <div className="absolute inset-0 bg-black" />

      <div className="relative z-10 w-full h-full flex flex-col pt-[8vh] px-[8vw]">
        {/* TOP section -- all content lives here */}
        <div className="flex-shrink-0">
          {/* The quote -- fills the width */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-10"
          >
            <span className="text-emerald-400 font-mono text-[11px] uppercase tracking-[0.4em] block mb-6">
              For the Caregiver
            </span>
            <h1 className="text-5xl md:text-7xl font-extralight text-white leading-tight">
              &ldquo;Your father is{" "}
              <span className="font-black text-emerald-400">safe.</span>&rdquo;
            </h1>
            <p className="text-zinc-600 text-base font-light italic mt-4">
              Designed for a working daughter checking her phone during lunch.
            </p>
          </motion.div>

          {/* Thin emerald line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="w-24 h-px bg-emerald-400/30 origin-left mb-10"
          />

          {/* Features -- horizontal row, not cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.08, duration: 0.4 }}
                className="border-t border-emerald-400/15 pt-4"
              >
                <h3 className="text-zinc-200 text-sm font-semibold mb-2">{f.title}</h3>
                <p className="text-zinc-600 text-xs leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom 40% is intentionally EMPTY -- breathing room */}
      </div>
    </div>
  );
}
