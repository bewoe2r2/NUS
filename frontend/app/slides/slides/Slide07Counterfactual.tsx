"use client";

import { motion } from "framer-motion";

export default function Slide07Counterfactual() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Split gradient -- rose left, emerald right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 40% 50% at 25% 50%, rgba(244,63,94,0.05) 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 75% 50%, rgba(52,211,153,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full flex flex-col items-center py-[10vh] px-[10vw]">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-emerald-400 font-mono text-base tracking-[0.3em] uppercase mb-4 self-start"
        >
          Counterfactual Reasoning
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-4xl md:text-5xl font-bold text-white mb-6 self-start"
        >
          &ldquo;What if you take your meds?&rdquo;
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="text-zinc-400 text-lg max-w-3xl mb-16 self-start"
        >
          The patient sees the math behind the nudge. Not guilt -- evidence.
        </motion.p>

        {/* Central hero -- risk reduction */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="flex items-center gap-12 md:gap-20 mb-16"
        >
          {/* Before */}
          <div className="flex flex-col items-center">
            <span className="text-zinc-500 font-mono text-xs uppercase tracking-wider mb-4">Without meds</span>
            <span
              className="font-mono text-[7rem] md:text-[9rem] font-bold text-rose-400 leading-none"
              style={{ textShadow: "0 0 120px rgba(244,63,94,0.3)" }}
            >
              35%
            </span>
            <span className="text-rose-400 text-lg font-medium mt-3">crisis risk</span>
          </div>

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-5xl text-zinc-600">&#8594;</span>
            <span className="text-emerald-400 font-mono text-sm font-bold">-66%</span>
          </motion.div>

          {/* After */}
          <div className="flex flex-col items-center">
            <span className="text-zinc-500 font-mono text-xs uppercase tracking-wider mb-4">With adherence</span>
            <span
              className="font-mono text-[7rem] md:text-[9rem] font-bold text-emerald-400 leading-none"
              style={{ textShadow: "0 0 120px rgba(52,211,153,0.3)" }}
            >
              12%
            </span>
            <span className="text-emerald-400 text-lg font-medium mt-3">crisis risk</span>
          </div>
        </motion.div>

        {/* Bottom explanatory glass panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 w-full max-w-4xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <span className="text-cyan-400 font-mono text-3xl font-bold">2,000</span>
              <p className="text-zinc-400 text-sm mt-2">simulated paths compared</p>
            </div>
            <div className="text-center">
              <span className="text-amber-400 font-mono text-3xl font-bold">Causal</span>
              <p className="text-zinc-400 text-sm mt-2">not correlation -- actual intervention modeling</p>
            </div>
            <div className="text-center">
              <span className="text-emerald-400 font-mono text-3xl font-bold">Visual</span>
              <p className="text-zinc-400 text-sm mt-2">patient sees risk drop in real-time</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
