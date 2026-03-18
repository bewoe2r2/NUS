"use client";

import { motion } from "framer-motion";

export default function Slide06MonteCarlo() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Warm gradient orb */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.05]"
        style={{
          background: "radial-gradient(circle, rgba(251,191,36,0.6), transparent 70%)",
          top: "15%",
          left: "60%",
        }}
        animate={{ x: [0, -40, 0], y: [0, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 w-full py-[10vh] px-[10vw]">
        {/* Hero TOP layout -- big number centered, details below */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-amber-400 font-mono text-base tracking-[0.3em] uppercase mb-4"
        >
          Monte Carlo Simulation
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-4xl md:text-5xl font-bold text-white mb-6"
        >
          2,000 futures. <span className="text-amber-400">One patient.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="text-zinc-400 text-lg max-w-3xl mb-14"
        >
          Instead of a single guess, we simulate 2,000 possible trajectories across a 48-hour horizon.
          The result is a probability distribution of futures -- not a prediction, a landscape.
        </motion.p>

        {/* 3-column bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 -- Hero number */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 flex flex-col items-center justify-center text-center"
          >
            <span
              className="font-mono text-[7rem] md:text-[8rem] font-bold text-white leading-none"
              style={{
                textShadow: "0 0 120px rgba(251,191,36,0.3), 0 0 60px rgba(251,191,36,0.15)",
              }}
            >
              48
            </span>
            <span className="text-amber-400 font-mono text-2xl mt-2">hours</span>
            <p className="text-zinc-500 text-sm mt-4">prediction window</p>
          </motion.div>

          {/* Card 2 -- How it works */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8"
          >
            <h3 className="text-amber-400 font-semibold text-xl mb-6">How It Works</h3>
            <div className="flex flex-col gap-5">
              {[
                { num: "01", text: "Sample transition probabilities from the trained HMM" },
                { num: "02", text: "Run 2,000 forward simulations across glucose, medication, activity states" },
                { num: "03", text: "Aggregate into crisis probability with confidence intervals" },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-4">
                  <span className="text-amber-400 font-mono text-2xl font-bold leading-none mt-0.5">{step.num}</span>
                  <span className="text-zinc-300 text-sm leading-relaxed">{step.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card 3 -- ARIMA */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8"
          >
            <h3 className="text-emerald-400 font-semibold text-xl mb-6">Merlion Time Series</h3>
            <p className="text-zinc-300 text-base leading-relaxed mb-6">
              ARIMA glucose velocity forecasting gives a <span className="text-emerald-400 font-semibold">45-minute</span> hypo/hyperglycemia lookahead.
            </p>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-2">Real-time signal</p>
              <p className="text-zinc-300 text-sm">
                Glucose trending up at <span className="text-rose-400 font-semibold">+2.1 mmol/L per hour</span>
              </p>
              <p className="text-amber-400 text-sm mt-2 font-medium">
                Hyperglycemia predicted in 38 minutes
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
