"use client";

import { motion } from "framer-motion";

const features = [
  {
    color: "bg-cyan-400",
    label: "Monte Carlo Simulation",
    description:
      "2,000 paths over a 48-hour horizon. A probability distribution of futures — not a single guess.",
  },
  {
    color: "bg-emerald-400",
    label: "Counterfactual Reasoning",
    description:
      '"What if you take your meds?" Risk drops 35% to 12%. The patient sees the math behind the nudge.',
  },
  {
    color: "bg-amber-400",
    label: "Merlion Time Series",
    description:
      "ARIMA glucose velocity forecasting. 45-minute hypo/hyperglycemia lookahead.",
  },
];

export default function Slide06Prediction() {
  return (
    <div className="flex items-center justify-center w-full h-full p-[8vh_8vw]">
      <div className="w-full max-w-6xl">
        {/* Label & Title */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-amber-400 font-mono text-sm tracking-[0.2em] uppercase mb-3"
        >
          Prediction Engine
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-2xl font-bold text-white mb-10"
        >
          See the crisis before it happens.
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-14 items-center">
          {/* Left: Feature blocks */}
          <div className="flex flex-col gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.12, duration: 0.5 }}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6"
              >
                {/* Colored top accent line */}
                <div className={`w-12 h-1 ${f.color} rounded-full mb-4`} />
                <h3 className="text-white font-semibold text-base mb-2">
                  {f.label}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Right: Hero + Risk viz */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col items-center text-center"
          >
            <span
              className="font-mono text-9xl font-bold text-white leading-none"
              style={{
                textShadow:
                  "0 0 60px rgba(251,191,36,0.35), 0 0 120px rgba(251,191,36,0.15)",
              }}
            >
              48
            </span>
            <span className="text-amber-400 font-mono text-xl mt-2">
              hours
            </span>
            <p className="text-zinc-500 text-sm mt-3 max-w-[200px]">
              prediction window
            </p>

            {/* Risk reduction visualization */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-10 flex items-center gap-4"
            >
              <div className="flex flex-col items-center">
                <span className="font-mono text-3xl font-bold text-rose-400">
                  35%
                </span>
                <span className="text-zinc-500 text-xs mt-1">risk</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-500">
                <span className="text-2xl">&#8594;</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-mono text-3xl font-bold text-emerald-400">
                  12%
                </span>
                <span className="text-zinc-500 text-xs mt-1">
                  with adherence
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
