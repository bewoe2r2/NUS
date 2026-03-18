"use client";

import { motion } from "framer-motion";

const metrics = [
  {
    value: "99.3%",
    label: "accuracy on clean clinical data",
    color: "text-emerald-400",
  },
  {
    value: "100%",
    label: "crisis recall — every true crisis detected",
    color: "text-emerald-300",
  },
  {
    value: "82.1%",
    label: "accuracy on hardened validation — the hard cases",
    color: "text-cyan-400",
  },
];

export default function Slide08Validation() {
  return (
    <div className="relative flex items-center justify-center w-full h-full p-[8vh_8vw]">
      {/* Green radial background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(52,211,153,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center text-center">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-emerald-400 font-mono text-sm tracking-[0.2em] uppercase mb-6"
        >
          Validation
        </motion.p>

        {/* Giant "0" */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
        >
          <span
            className="font-mono text-[14rem] leading-none font-bold text-emerald-400"
            style={{
              textShadow:
                "0 0 80px rgba(52,211,153,0.5), 0 0 160px rgba(52,211,153,0.25), 0 0 240px rgba(52,211,153,0.1)",
            }}
          >
            0
          </span>
        </motion.div>

        {/* Subtitle */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="text-2xl font-bold text-white mt-2 mb-2"
        >
          unsafe misclassifications
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="text-zinc-400 text-sm mb-12 max-w-xl"
        >
          No patient in danger was ever told they were safe.
          <br />
          5,000 hardened patients. 32 clinical archetypes. 230 tests passing.
        </motion.p>

        {/* Three metric columns */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          className="grid grid-cols-3 gap-8 w-full max-w-2xl"
        >
          {metrics.map((m, i) => (
            <div key={m.value} className="flex flex-col items-center">
              <span
                className={`font-mono text-4xl font-bold ${m.color}`}
              >
                {m.value}
              </span>
              <span className="text-zinc-500 text-xs mt-2 leading-snug max-w-[180px]">
                {m.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
