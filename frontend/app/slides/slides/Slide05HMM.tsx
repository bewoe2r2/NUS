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
    return <span className="text-emerald-400 font-bold">&#x2713;</span>;
  if (type === "cross")
    return <span className="text-rose-400 font-bold">&#x2717;</span>;
  return <span className="text-amber-400 font-bold">&#x26A0;</span>;
}

export default function Slide05HMM() {
  return (
    <div className="flex items-center justify-center w-full h-full p-[6vh_6vw]">
      <div className="w-full max-w-6xl">
        {/* Label & Title */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-cyan-400 font-mono text-sm tracking-[0.2em] uppercase mb-3"
        >
          Core Innovation
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-2xl font-bold text-white mb-10"
        >
          Why HMM, not neural nets.
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 items-center">
          {/* Left: Comparison table */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="overflow-hidden rounded-xl border border-white/[0.08]"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left text-zinc-500 font-mono text-xs uppercase tracking-wider px-5 py-3">
                    Dimension
                  </th>
                  <th className="text-left text-cyan-400 font-mono text-xs uppercase tracking-wider px-5 py-3">
                    HMM
                  </th>
                  <th className="text-left text-zinc-400 font-mono text-xs uppercase tracking-wider px-5 py-3">
                    LSTM
                  </th>
                  <th className="text-left text-zinc-400 font-mono text-xs uppercase tracking-wider px-5 py-3">
                    LLM
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.dim}
                    className={
                      i % 2 === 0
                        ? "bg-white/[0.02]"
                        : "bg-transparent"
                    }
                  >
                    <td className="px-5 py-3 text-zinc-300 font-medium">
                      {row.dim}
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2">
                        <Icon type={row.hmmIcon} />
                        <span className="text-zinc-200">{row.hmm}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2">
                        <Icon type={row.lstmIcon} />
                        <span className="text-zinc-400">{row.lstm}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2">
                        <Icon type={row.llmIcon} />
                        <span className="text-zinc-400">{row.llm}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Right: Hero number */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col items-center text-center"
          >
            <span
              className="font-mono text-8xl font-bold text-white"
              style={{
                textShadow:
                  "0 0 60px rgba(34,211,238,0.4), 0 0 120px rgba(34,211,238,0.15)",
              }}
            >
              12.7
            </span>
            <span className="text-cyan-400 font-mono text-lg mt-2">ms</span>
            <p className="text-zinc-500 text-sm mt-4 max-w-[200px]">
              HMM inference time on a phone. No GPU. No cloud.
            </p>
          </motion.div>
        </div>

        {/* Bottom quote */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-center text-zinc-400 text-base mt-10 italic"
        >
          &ldquo;Can you explain WHY to a doctor, a patient, and a
          regulator?&rdquo;
        </motion.p>
      </div>
    </div>
  );
}
