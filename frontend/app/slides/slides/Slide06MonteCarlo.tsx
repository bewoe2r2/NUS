"use client";

import { motion } from "framer-motion";

export default function Slide06MonteCarlo() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Warm gradient mesh -- multiple layered radials */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 40% at 20% 80%, rgba(251,191,36,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 40% 50% at 80% 30%, rgba(251,191,36,0.05) 0%, transparent 70%),
            linear-gradient(180deg, #000000 0%, #0d0a00 100%)
          `,
        }}
      />

      <div className="relative z-10 w-full h-full flex flex-col py-[8vh] px-[8vw]">
        {/* Top -- label + title left-aligned */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-10"
        >
          <span className="inline-block text-[11px] font-mono uppercase tracking-[0.35em] text-amber-400/80 border border-amber-400/20 rounded-full px-4 py-1.5 mb-4">
            Monte Carlo Simulation
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
            2,000 futures.
            <br />
            <span className="font-extralight text-amber-400">One patient.</span>
          </h2>
        </motion.div>

        {/* Middle -- hero number LEFT, process RIGHT */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-16 items-center">
          {/* Left -- the big 48 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="flex flex-col"
          >
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-[12rem] font-extralight text-amber-400 leading-none tabular-nums">
                48
              </span>
              <div className="flex flex-col">
                <span className="text-amber-400/60 font-mono text-2xl">hours</span>
                <span className="text-zinc-600 text-sm mt-1">prediction window</span>
              </div>
            </div>

            <p className="text-zinc-500 text-base font-light mt-6 max-w-md leading-relaxed">
              Instead of a single guess, we simulate 2,000 possible trajectories.
              The result is a probability distribution of futures.
            </p>
          </motion.div>

          {/* Right -- numbered process, vertical with large numbers */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col gap-8"
          >
            {[
              { num: "01", text: "Sample transition probabilities from the trained HMM" },
              { num: "02", text: "Run 2,000 forward simulations across glucose, medication, activity states" },
              { num: "03", text: "Aggregate into crisis probability with confidence intervals" },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.12, duration: 0.4 }}
                className="flex items-start gap-6"
              >
                <span className="text-amber-400/30 font-mono text-6xl font-bold leading-none shrink-0">
                  {step.num}
                </span>
                <p className="text-zinc-300 text-base leading-relaxed pt-3">
                  {step.text}
                </p>
              </motion.div>
            ))}

            {/* ARIMA callout -- small, precise */}
            <div className="mt-4 border-l-2 border-emerald-400/30 pl-6">
              <span className="text-emerald-400 font-mono text-[11px] uppercase tracking-[0.3em] block mb-2">
                Merlion ARIMA
              </span>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Glucose velocity forecasting gives a{" "}
                <span className="text-emerald-400 font-semibold">45-minute</span> hypo/hyperglycemia lookahead.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
