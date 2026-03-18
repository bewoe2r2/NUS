"use client";

import { motion } from "framer-motion";

const columns = [
  {
    title: "Data Protection",
    color: "text-rose-400",
    border: "border-t-rose-400",
    items: [
      "PDPA compliant by design",
      "Data never leaves Singapore",
      "PII de-identified before every LLM call",
      "Prompt injection sanitization",
    ],
  },
  {
    title: "Clinical Safety",
    color: "text-amber-400",
    border: "border-t-amber-400",
    items: [
      "6-dimension safety classifier",
      "Drug interaction engine pre-screens every output",
      "ADA 2024 guidelines hardcoded",
      "Fail-closed: crash = safe fallback",
    ],
  },
  {
    title: "Audit & Compliance",
    color: "text-teal-400",
    border: "border-t-teal-400",
    items: [
      "Full decision audit trail",
      "Every HMM state transition logged",
      "Deterministic rules override AI — always",
      "Constant-time API key comparison",
    ],
  },
];

export default function Slide13Safety() {
  return (
    <div className="relative flex items-center justify-center w-full h-full p-[8vh_8vw]">
      {/* Subtle red radial background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 70%, rgba(244,63,94,0.04) 0%, transparent 55%)",
        }}
      />

      <div className="relative z-10 w-full max-w-5xl">
        {/* Label & Title */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-rose-400 font-mono text-sm tracking-[0.2em] uppercase mb-3"
        >
          Safety & Governance
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-2xl font-bold text-white mb-10"
        >
          Safety is never probabilistic.
        </motion.h2>

        {/* 3-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((col, i) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.12, duration: 0.5 }}
              className={`bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7 border-t-4 ${col.border}`}
            >
              <h3
                className={`${col.color} font-semibold text-sm uppercase tracking-wider mb-5`}
              >
                {col.title}
              </h3>
              <ul className="flex flex-col gap-3">
                {col.items.map((item) => (
                  <li
                    key={item}
                    className="text-zinc-300 text-sm leading-relaxed flex items-start gap-2"
                  >
                    <span className="text-zinc-600 mt-0.5 shrink-0">
                      &#x25AA;
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom quote */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-center text-zinc-400 text-sm mt-10 italic max-w-2xl mx-auto"
        >
          &ldquo;Take double insulin&rdquo; is impossible to generate. Safety
          rules are deterministic. They fire before the AI ever speaks.
        </motion.p>
      </div>
    </div>
  );
}
