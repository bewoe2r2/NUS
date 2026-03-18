"use client";

import { motion } from "framer-motion";

const rows = [
  {
    dim: "Explainability",
    hmm: "Full trace",
    hmmIcon: "check",
    lstm: "Black box",
    lstmIcon: "cross",
    llm: '"I think..."',
    llmIcon: "cross",
  },
  {
    dim: "Hallucination",
    hmm: "Impossible",
    hmmIcon: "check",
    lstm: "Low",
    lstmIcon: "warn",
    llm: "High",
    llmIcon: "cross",
  },
  {
    dim: "On-device",
    hmm: "<1ms",
    hmmIcon: "check",
    lstm: "GPU needed",
    lstmIcon: "warn",
    llm: "Cloud only",
    llmIcon: "cross",
  },
  {
    dim: "Cold-start",
    hmm: "7 days",
    hmmIcon: "check",
    lstm: "10K+ samples",
    lstmIcon: "warn",
    llm: "N/A",
    llmIcon: "cross",
  },
  {
    dim: "Safety",
    hmm: "0 unsafe",
    hmmIcon: "check",
    lstm: "No guarantee",
    lstmIcon: "cross",
    llm: "Hallucination risk",
    llmIcon: "cross",
  },
];

function Icon({ type }: { type: string }) {
  if (type === "check")
    return <span className="text-emerald-400 font-bold text-lg">&#x2713;</span>;
  if (type === "cross")
    return <span className="text-rose-400 font-bold text-lg">&#x2717;</span>;
  return <span className="text-amber-400 font-bold text-lg">&#x26A0;</span>;
}

export default function Slide05HMM() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Accent orb */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.6), transparent 70%)",
          top: "-10%",
          right: "5%",
        }}
        animate={{ y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 w-full py-[10vh] px-[10vw]">
        {/* Hero section */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-14 items-start">
          {/* Left column */}
          <div>
            {/* Label & Title */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-cyan-400 font-mono text-base tracking-[0.3em] uppercase mb-4"
            >
              Core Innovation
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-4xl md:text-5xl font-bold text-white mb-12"
            >
              Why <span className="text-cyan-400">HMM</span>, not neural nets.
            </motion.h2>

            {/* Comparison table -- no visible outer border, row bottom borders only */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="overflow-hidden rounded-3xl"
            >
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left text-zinc-500 font-mono text-xs uppercase tracking-wider px-6 py-4">
                      Dimension
                    </th>
                    <th className="text-left text-cyan-400 font-mono text-xs uppercase tracking-wider px-6 py-4">
                      HMM
                    </th>
                    <th className="text-left text-zinc-400 font-mono text-xs uppercase tracking-wider px-6 py-4">
                      LSTM
                    </th>
                    <th className="text-left text-zinc-400 font-mono text-xs uppercase tracking-wider px-6 py-4">
                      LLM
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row.dim}
                      className={`border-b border-white/[0.04] ${
                        i % 2 === 0
                          ? "bg-white/[0.02]"
                          : "bg-transparent"
                      }`}
                    >
                      <td className="px-6 py-4 text-zinc-300 font-medium text-sm">
                        {row.dim}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-3">
                          <Icon type={row.hmmIcon} />
                          <span className="text-zinc-200 text-sm">{row.hmm}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-3">
                          <Icon type={row.lstmIcon} />
                          <span className="text-zinc-400 text-sm">{row.lstm}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-3">
                          <Icon type={row.llmIcon} />
                          <span className="text-zinc-400 text-sm">{row.llm}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>

          {/* Right: Hero number */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col items-center text-center lg:pt-24"
          >
            <span
              className="font-mono text-[8rem] font-bold text-cyan-400 leading-none"
              style={{
                textShadow:
                  "0 0 60px rgba(34,211,238,0.4), 0 0 120px rgba(34,211,238,0.15), 0 0 200px rgba(34,211,238,0.08)",
              }}
            >
              12.7
            </span>
            <span className="text-cyan-400 font-mono text-2xl mt-3">ms</span>
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent my-5" />
            <p className="text-xl text-zinc-400 mt-1 max-w-[280px] leading-relaxed">
              Fast enough for real-time on a phone.
            </p>
          </motion.div>
        </div>

        {/* Bottom quote */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-center text-zinc-400 text-lg mt-12 italic"
        >
          &ldquo;Can you explain <span className="text-cyan-400 not-italic font-semibold">WHY</span> to a doctor, a patient, and a regulator?&rdquo;
        </motion.p>
      </div>
    </div>
  );
}
