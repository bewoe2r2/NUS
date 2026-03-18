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
    return <span className="text-emerald-400 text-sm">&#x2713;</span>;
  if (type === "cross")
    return <span className="text-rose-400 text-sm">&#x2717;</span>;
  return <span className="text-amber-400 text-sm">&#x26A0;</span>;
}

export default function Slide05HMM() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Deep black with no effects -- content is the star */}
      <div className="absolute inset-0 bg-black" />

      <div className="relative z-10 w-full h-full flex">
        {/* LEFT 60% -- table */}
        <div className="w-[60%] h-full flex flex-col justify-center py-[8vh] pl-[8vw] pr-[4vw]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-10"
          >
            <span className="text-cyan-400 font-mono text-[11px] uppercase tracking-[0.4em] block mb-4">
              Core Innovation
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Why <span className="text-cyan-400 font-mono">HMM</span>,
              <br />
              <span className="font-light text-zinc-400">not neural nets.</span>
            </h2>
          </motion.div>

          {/* Comparison table -- minimal, no cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-zinc-600 font-mono text-[10px] uppercase tracking-widest pb-4 pr-6">
                    Dimension
                  </th>
                  <th className="text-left text-cyan-400 font-mono text-[10px] uppercase tracking-widest pb-4 pr-6">
                    HMM
                  </th>
                  <th className="text-left text-zinc-600 font-mono text-[10px] uppercase tracking-widest pb-4 pr-6">
                    LSTM
                  </th>
                  <th className="text-left text-zinc-600 font-mono text-[10px] uppercase tracking-widest pb-4">
                    LLM
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <motion.tr
                    key={row.dim}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
                    className="border-t border-white/[0.04]"
                  >
                    <td className="py-3.5 pr-6 text-zinc-400 text-sm font-medium">
                      {row.dim}
                    </td>
                    <td className="py-3.5 pr-6">
                      <span className="flex items-center gap-2">
                        <Icon type={row.hmmIcon} />
                        <span className="text-zinc-200 text-sm">{row.hmm}</span>
                      </span>
                    </td>
                    <td className="py-3.5 pr-6">
                      <span className="flex items-center gap-2">
                        <Icon type={row.lstmIcon} />
                        <span className="text-zinc-500 text-sm">{row.lstm}</span>
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="flex items-center gap-2">
                        <Icon type={row.llmIcon} />
                        <span className="text-zinc-500 text-sm">{row.llm}</span>
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Bottom quote */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-zinc-600 text-sm mt-10 font-light italic"
          >
            &ldquo;Can you explain <span className="text-cyan-400 not-italic font-medium">WHY</span> to a doctor, a patient, and a regulator?&rdquo;
          </motion.p>
        </div>

        {/* RIGHT 40% -- hero number on dark teal field */}
        <div
          className="w-[40%] h-full flex flex-col items-center justify-center relative"
          style={{
            background: "linear-gradient(180deg, #031a22 0%, #06262f 50%, #031a22 100%)",
          }}
        >
          {/* Vertical accent line */}
          <div className="absolute left-0 top-[15%] bottom-[15%] w-px bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="flex flex-col items-center"
          >
            <span className="font-mono text-[10rem] font-extralight text-cyan-400 leading-none tabular-nums">
              12.7
            </span>
            <span className="text-cyan-400/60 font-mono text-3xl font-light mt-2">ms</span>
            <div className="w-16 h-px bg-cyan-400/20 my-6" />
            <p className="text-zinc-500 text-base font-light text-center max-w-[220px] leading-relaxed">
              Fast enough for real-time on a phone.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
