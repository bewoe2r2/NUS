"use client";

import { motion } from "framer-motion";

export default function Slide03Insight() {
  return (
    <div className="relative flex items-center justify-center w-full h-full p-[8vh_8vw]">
      {/* Red radial background glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 40% 40%, rgba(244,63,94,0.05) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-rose-400 font-mono text-sm tracking-[0.2em] uppercase mb-6"
        >
          The Insight
        </motion.p>

        {/* Hero quote */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-5xl font-bold text-white text-center leading-tight mb-14 max-w-4xl"
        >
          LLMs hallucinate.
          <br />
          <span className="text-rose-400">In healthcare, that kills.</span>
        </motion.h1>

        {/* Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mb-12">
          {/* Left: The Problem */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-rose-500/[0.05] border border-rose-500/[0.12] rounded-2xl p-8"
          >
            <h3 className="text-rose-400 font-semibold text-lg mb-5">
              The Problem
            </h3>
            <ul className="flex flex-col gap-3">
              <li className="text-zinc-300 text-sm flex items-start gap-2">
                <span className="text-rose-400 mt-0.5">&#x2717;</span>
                LLMs are black boxes
              </li>
              <li className="text-zinc-300 text-sm flex items-start gap-2">
                <span className="text-rose-400 mt-0.5">&#x2717;</span>
                Cannot explain why
              </li>
              <li className="text-zinc-300 text-sm flex items-start gap-2">
                <span className="text-rose-400 mt-0.5">&#x2717;</span>
                Cannot guarantee safety
              </li>
            </ul>
          </motion.div>

          {/* Right: Our Answer */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-cyan-500/[0.05] border border-cyan-500/[0.12] rounded-2xl p-8"
          >
            <h3 className="text-cyan-400 font-semibold text-lg mb-5">
              Our Answer
            </h3>
            <ul className="flex flex-col gap-3">
              <li className="text-zinc-300 text-sm flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">&#x2713;</span>
                The math decides
              </li>
              <li className="text-zinc-300 text-sm flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">&#x2713;</span>
                The AI communicates
              </li>
              <li className="text-zinc-300 text-sm flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">&#x2713;</span>
                Safety is deterministic
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom line */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-zinc-500 text-base text-center max-w-2xl italic"
        >
          You cannot wrap GPT around a chatbot and deploy it for clinical
          decisions.
        </motion.p>
      </div>
    </div>
  );
}
