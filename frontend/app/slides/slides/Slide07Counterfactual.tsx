"use client";

import { motion } from "framer-motion";

export default function Slide07Counterfactual() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Split background -- rose left half, emerald right half */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(90deg, rgba(244,63,94,0.04) 0%, transparent 50%),
            linear-gradient(270deg, rgba(52,211,153,0.04) 0%, transparent 50%),
            #000
          `,
        }}
      />

      {/* Center divider line */}
      <div className="absolute left-1/2 top-[10%] bottom-[10%] w-px bg-gradient-to-b from-transparent via-zinc-800 to-transparent" />

      <div className="relative z-10 w-full h-full flex">
        {/* LEFT half -- "Without meds" */}
        <div className="w-1/2 h-full flex flex-col items-center justify-center px-[6vw]">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col items-center text-center"
          >
            <span className="text-rose-400/50 font-mono text-[10px] uppercase tracking-[0.4em] mb-8">
              Without meds
            </span>
            <span className="font-mono text-[10rem] md:text-[12rem] font-extralight text-rose-400 leading-none tabular-nums">
              35%
            </span>
            <span className="text-rose-400/60 text-lg font-light mt-4">crisis risk</span>
          </motion.div>
        </div>

        {/* RIGHT half -- "With adherence" */}
        <div className="w-1/2 h-full flex flex-col items-center justify-center px-[6vw]">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col items-center text-center"
          >
            <span className="text-emerald-400/50 font-mono text-[10px] uppercase tracking-[0.4em] mb-8">
              With adherence
            </span>
            <span className="font-mono text-[10rem] md:text-[12rem] font-extralight text-emerald-400 leading-none tabular-nums">
              12%
            </span>
            <span className="text-emerald-400/60 text-lg font-light mt-4">crisis risk</span>
          </motion.div>
        </div>

        {/* Center overlay -- the arrow and delta */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20"
        >
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
            <span className="text-emerald-400 font-mono text-sm font-bold">-66%</span>
          </div>
        </motion.div>

        {/* Top-left label */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="absolute top-[6vh] left-[6vw]"
        >
          <span className="inline-block text-[11px] font-mono uppercase tracking-[0.35em] text-emerald-400/80 border border-emerald-400/20 rounded-full px-4 py-1.5">
            Counterfactual Reasoning
          </span>
        </motion.div>

        {/* Top title */}
        <motion.h2
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="absolute top-[12vh] left-[6vw] text-3xl md:text-4xl font-bold text-white"
        >
          &ldquo;What if you take your meds?&rdquo;
        </motion.h2>

        {/* Bottom bar -- three stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="absolute bottom-[6vh] left-[6vw] right-[6vw] flex justify-between"
        >
          <div>
            <span className="text-cyan-400 font-mono text-xl font-bold">2,000</span>
            <p className="text-zinc-600 text-xs mt-1">simulated paths compared</p>
          </div>
          <div>
            <span className="text-amber-400 font-mono text-xl font-bold">Causal</span>
            <p className="text-zinc-600 text-xs mt-1">actual intervention modeling</p>
          </div>
          <div>
            <span className="text-emerald-400 font-mono text-xl font-bold">Visual</span>
            <p className="text-zinc-600 text-xs mt-1">patient sees risk drop live</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
