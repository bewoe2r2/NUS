"use client";

import { motion } from "framer-motion";

const columns = [
  {
    title: "Data Protection",
    color: "text-rose-400",
    accent: "#f43f5e",
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
    accent: "#f59e0b",
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
    accent: "#2dd4bf",
    items: [
      "Full decision audit trail",
      "Every HMM state transition logged",
      "Deterministic rules override AI \u2014 always",
      "Constant-time API key comparison",
    ],
  },
];

export default function Slide15Safety() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Deep rose-black atmosphere */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 40% 40% at 80% 80%, rgba(244,63,94,0.05) 0%, transparent 60%),
            linear-gradient(180deg, #0a0204 0%, #000 100%)
          `,
        }}
      />

      {/* Diagonal warning stripe texture -- very subtle */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(244,63,94,0.3) 40px, rgba(244,63,94,0.3) 41px)",
        }}
      />

      <div className="relative z-10 w-full py-[8vh] px-[8vw]">
        {/* Title area */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-12"
        >
          <span className="inline-block text-[11px] font-mono uppercase tracking-[0.35em] text-rose-400/80 border border-rose-400/20 rounded-full px-4 py-1.5 mb-4">
            Safety &amp; Governance
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
            Safety is{" "}
            <span className="font-extralight text-rose-400">never probabilistic.</span>
          </h2>
        </motion.div>

        {/* Three columns -- minimal, separated by vertical lines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mb-12">
          {columns.map((col, i) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.12, duration: 0.5 }}
              className={`py-6 px-6 ${i > 0 ? "md:border-l md:border-white/[0.04]" : ""}`}
            >
              <h3 className={`${col.color} text-sm font-semibold uppercase tracking-wider mb-6`}>
                {col.title}
              </h3>
              <ul className="flex flex-col gap-3.5">
                {col.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div
                      className="w-1 h-1 rounded-full shrink-0 mt-2 opacity-40"
                      style={{ background: col.accent }}
                    />
                    <span className="text-zinc-400 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom quote -- the key line */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="border-t border-white/[0.04] pt-8"
        >
          <p className="text-zinc-500 text-lg font-light max-w-3xl">
            &ldquo;Take double insulin&rdquo; is{" "}
            <span className="text-rose-400 font-bold not-italic">impossible</span> to generate.
            Safety rules are deterministic. They fire before the AI ever speaks.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
