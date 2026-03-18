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
      "Deterministic rules override AI -- always",
      "Constant-time API key comparison",
    ],
  },
];

export default function Slide15Safety() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Subtle red radial */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 30% 70%, rgba(244,63,94,0.05) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full py-[10vh] px-[10vw]">
        {/* Label & Title -- hero TOP */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-rose-400 font-mono text-base tracking-[0.3em] uppercase mb-4"
        >
          Safety & Governance
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-4xl md:text-5xl font-bold text-white mb-14"
        >
          Safety is <span className="text-rose-400">never probabilistic.</span>
        </motion.h2>

        {/* 3-column bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {columns.map((col, i) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.12, duration: 0.5 }}
              className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 border-t-4 ${col.border}`}
            >
              <h3
                className={`${col.color} font-semibold text-lg uppercase tracking-wider mb-6`}
              >
                {col.title}
              </h3>
              <ul className="flex flex-col gap-4">
                {col.items.map((item) => (
                  <li
                    key={item}
                    className="text-zinc-300 text-base leading-relaxed flex items-start gap-3"
                  >
                    <span className="text-zinc-600 mt-1 shrink-0 text-lg">
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
          className="text-center text-zinc-400 text-lg mt-12 italic max-w-3xl mx-auto"
        >
          &ldquo;Take double insulin&rdquo; is <span className="text-rose-400 not-italic font-semibold">impossible</span> to generate.
          Safety rules are deterministic. They fire before the AI ever speaks.
        </motion.p>
      </div>
    </div>
  );
}
