"use client";

import { motion } from "framer-motion";

const stats = [
  {
    number: "440K",
    description: "diabetics in Singapore — one in nine adults",
    color: "text-cyan-400",
  },
  {
    number: "180",
    description: "days between clinic visits — alone, unmonitored",
    color: "text-amber-400",
    unit: "days",
  },
  {
    number: "$8,800",
    description: "per preventable ER visit — paid by the system, suffered by the patient",
    color: "text-rose-400",
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
    <div className="flex items-center justify-center w-full h-full p-[8vh_8vw]">
      <div className="w-full max-w-6xl">
        {/* Label & Title */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-rose-400 font-mono text-sm tracking-[0.2em] uppercase mb-3"
        >
          The Problem
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-2xl font-semibold text-white mb-10"
        >
          Between visits, nobody is watching.
        </motion.h2>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Stats */}
          <div className="flex flex-col gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.number}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.5 }}
                className="flex items-baseline gap-6"
              >
                <span
                  className={`font-mono text-5xl font-bold ${stat.color} min-w-[140px] text-left`}
                >
                  {stat.number}
                </span>
                <span className="text-zinc-400 text-base leading-snug">
                  {stat.description}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Right: Persona card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8"
          >
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white">
                Mr. Tan Ah Kow
              </h3>
              <p className="text-zinc-500 text-sm mt-1">
                67, lives alone, Toa Payoh HDB
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {personaItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
                  className="flex items-start gap-3"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${item.dot} mt-2 shrink-0`}
                  />
                  <div>
                    <span className="text-zinc-500 text-sm">{item.label}: </span>
                    <span className="text-zinc-300 text-sm">{item.value}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              className="mt-6 pt-4 border-t border-white/[0.06] text-zinc-400 text-sm italic"
            >
              He represents 440,000 Singaporeans.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
