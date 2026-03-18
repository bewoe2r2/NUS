"use client";

import { motion } from "framer-motion";

const personaItems = [
  { label: "Condition", value: "Type 2 Diabetes + Hypertension", dot: "bg-rose-400" },
  { label: "HbA1c", value: "8.1% (target: 7.0%)", dot: "bg-amber-400" },
  { label: "Language", value: "Singlish and Hokkien", dot: "bg-cyan-400" },
  { label: "Digital literacy", value: "Can barely use a phone", dot: "bg-amber-400" },
  { label: "Adherence", value: "Misses meds 2-3x per week", dot: "bg-rose-400" },
];

export default function Slide02Problem() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Dark rose-tinted atmosphere */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 80% 20%, rgba(244,63,94,0.06) 0%, transparent 60%), linear-gradient(180deg, #000 0%, #0a0506 100%)",
        }}
      />

      {/* Dot grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 w-full py-[8vh] px-[10vw]">
        {/* Top section -- stats as massive numbers */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr_1px_1fr] gap-0 items-start mb-16">
          {/* Stat 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="px-8 py-6"
          >
            <span className="font-mono text-[5.5rem] font-black text-rose-400 leading-none block">
              440K
            </span>
            <p className="text-zinc-300 text-lg font-medium mt-4">diabetics in Singapore</p>
            <p className="text-zinc-600 text-sm mt-1">one in nine adults</p>
          </motion.div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-full bg-gradient-to-b from-transparent via-rose-400/20 to-transparent" />

          {/* Stat 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="px-8 py-6"
          >
            <span className="font-mono text-[5.5rem] font-black text-amber-400 leading-none block">
              3-6mo
            </span>
            <p className="text-zinc-300 text-lg font-medium mt-4">between clinic visits</p>
            <p className="text-zinc-600 text-sm mt-1">alone, unmonitored</p>
          </motion.div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-full bg-gradient-to-b from-transparent via-amber-400/20 to-transparent" />

          {/* Stat 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="px-8 py-6"
          >
            <span className="font-mono text-[5.5rem] font-black text-cyan-400 leading-none block">
              $8,800
            </span>
            <p className="text-zinc-300 text-lg font-medium mt-4">per preventable ER visit</p>
            <p className="text-zinc-600 text-sm mt-1">paid by the system, suffered by the patient</p>
          </motion.div>
        </div>

        {/* Bottom section -- persona card, left-aligned */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="max-w-md"
        >
          {/* 1px rose top accent */}
          <div className="w-20 h-px bg-rose-400/60 mb-6" />

          <h3 className="text-xl font-bold text-white mb-1">Mr. Tan Ah Kow</h3>
          <p className="text-zinc-600 text-sm mb-6">67, lives alone, Toa Payoh HDB</p>

          <div className="flex flex-col gap-3">
            {personaItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.06, duration: 0.3 }}
                className="flex items-start gap-3"
              >
                <span className={`w-2 h-2 rounded-full ${item.dot} mt-1.5 shrink-0`} />
                <div>
                  <span className="text-zinc-600 text-sm">{item.label}: </span>
                  <span className="text-zinc-300 text-sm">{item.value}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="mt-6 text-zinc-500 text-base">
            He represents <span className="text-rose-400 font-semibold">440,000</span> Singaporeans.
          </p>
        </motion.div>
      </div>

      {/* Bottom-right label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-[6vh] right-[8vw] z-10"
      >
        <span className="text-rose-400/60 font-mono text-[11px] uppercase tracking-[0.4em]">
          The Problem
        </span>
      </motion.div>
    </div>
  );
}
