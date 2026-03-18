"use client";

import { motion } from "framer-motion";

export default function Slide03Insight() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Dual gradient orbs */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 30% 35%, rgba(244,63,94,0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 70% 65%, rgba(6,182,212,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full flex flex-col items-center py-[10vh] px-[10vw]">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-rose-400 font-mono text-base tracking-[0.3em] uppercase mb-10"
        >
          The Insight
        </motion.p>

        {/* Hero quote */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-[3.5rem] font-bold text-white text-center leading-tight mb-16 max-w-5xl"
        >
          LLMs hallucinate.
          <br />
          In healthcare,{" "}
          <span
            className="text-rose-400"
            style={{ textShadow: "0 0 120px rgba(244,63,94,0.3)" }}
          >
            hallucination kills.
          </span>
        </motion.h1>

        {/* Accent divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          className="w-32 h-px bg-gradient-to-r from-transparent via-rose-400/50 to-transparent mb-16"
        />

        {/* Two panels side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mb-12">
          {/* Left: The Problem */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-rose-500/[0.05] backdrop-blur-xl border border-rose-500/[0.1] rounded-3xl p-8"
          >
            <h3 className="text-sm uppercase tracking-widest text-rose-400 font-semibold mb-6">
              The Problem
            </h3>
            <div className="flex flex-col gap-4">
              {["LLMs are black boxes", "Cannot explain why", "Cannot guarantee safety"].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-rose-400 text-2xl font-bold">&#x2717;</span>
                  <span className="text-lg leading-relaxed text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Our Answer */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="bg-cyan-500/[0.05] backdrop-blur-xl border border-cyan-500/[0.1] rounded-3xl p-8"
          >
            <h3 className="text-sm uppercase tracking-widest text-cyan-400 font-semibold mb-6">
              Our Answer
            </h3>
            <div className="flex flex-col gap-4">
              {["The math decides", "The AI communicates", "Safety is deterministic"].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-cyan-400 text-2xl font-bold">&#x2713;</span>
                  <span className="text-lg leading-relaxed text-zinc-200">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom line */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-zinc-500 text-lg text-center max-w-2xl"
        >
          You cannot wrap GPT around a chatbot and deploy it for clinical decisions.
        </motion.p>
      </div>
    </div>
  );
}
