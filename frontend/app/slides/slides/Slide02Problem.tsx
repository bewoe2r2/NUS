"use client";

import { motion } from "framer-motion";

const stats = [
  {
    number: "440K",
    description: "diabetics in Singapore",
    detail: "one in nine adults",
    color: "text-rose-400",
    borderColor: "border-l-rose-400",
    glowColor: "rgba(244,63,94,0.3)",
  },
  {
    number: "3-6mo",
    description: "between clinic visits",
    detail: "alone, unmonitored",
    color: "text-amber-400",
    borderColor: "border-l-amber-400",
    glowColor: "rgba(251,191,36,0.3)",
  },
  {
    number: "$8,800",
    description: "per preventable ER visit",
    detail: "paid by the system, suffered by the patient",
    color: "text-cyan-400",
    borderColor: "border-l-cyan-400",
    glowColor: "rgba(6,182,212,0.3)",
  },
];

const personaItems = [
  { label: "Condition", value: "Type 2 Diabetes + Hypertension", dot: "bg-rose-400" },
  { label: "HbA1c", value: "8.1% (target: 7.0%)", dot: "bg-amber-400" },
  { label: "Language", value: "Singlish and Hokkien", dot: "bg-cyan-400" },
  { label: "Digital literacy", value: "Can barely use a phone", dot: "bg-amber-400" },
  { label: "Adherence", value: "Misses meds 2-3x per week", dot: "bg-rose-400" },
];

export default function Slide02Problem() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Animated gradient background */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full opacity-[0.03]"
        style={{
          background: "radial-gradient(circle, rgba(244,63,94,0.6), transparent 70%)",
          bottom: "-20%",
          right: "-10%",
        }}
        animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 w-full py-[10vh] px-[10vw]">
        {/* Label & Title */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-rose-400 font-mono text-base tracking-[0.3em] uppercase mb-4"
        >
          The Problem
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-4xl md:text-5xl font-bold text-white mb-12"
        >
          Between visits, <span className="text-rose-400">nobody is watching.</span>
        </motion.h2>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12">
          {/* Left: Stats - left aligned with colored left border */}
          <div className="flex flex-col gap-10">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.number}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.5 }}
                className={`${stat.borderColor} border-l-4 pl-8`}
              >
                <span
                  className={`font-mono text-[4rem] font-bold ${stat.color} block leading-none`}
                  style={{ textShadow: `0 0 80px ${stat.glowColor}` }}
                >
                  {stat.number}
                </span>
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-zinc-300 text-lg leading-snug font-medium">
                    {stat.description}
                  </span>
                  <span className="text-zinc-500 text-sm">
                    {stat.detail}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right: Persona card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="rounded-3xl bg-white/[0.03] border border-white/[0.06] p-10"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-white">
                Mr. Tan Ah Kow
              </h3>
              <p className="text-zinc-500 text-sm mt-2">
                67, lives alone, Toa Payoh HDB
              </p>
            </div>

            {/* Accent divider */}
            <div className="w-full h-px bg-gradient-to-r from-rose-400/30 via-white/[0.06] to-transparent mb-6" />

            <div className="flex flex-col gap-4">
              {personaItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
                  className="flex items-start gap-4"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${item.dot} mt-1.5 shrink-0`}
                  />
                  <div>
                    <span className="text-zinc-500 text-sm">{item.label}: </span>
                    <span className="text-zinc-200 text-sm font-medium">{item.value}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Thin divider + bottom line */}
            <div className="w-full h-px bg-white/[0.06] mt-8" />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              className="mt-5 text-zinc-400 text-base italic"
            >
              He represents <span className="text-rose-400 font-semibold not-italic">440,000</span> Singaporeans.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
