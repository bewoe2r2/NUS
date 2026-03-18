"use client";

import { motion } from "framer-motion";

export default function Slide03Insight() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Pure black -- the quote IS the design */}
      <div className="absolute inset-0 bg-black" />

      {/* Content fills the entire screen edge to edge */}
      <div className="relative z-10 w-full h-full flex flex-col justify-center px-[8vw]">
        {/* The quote -- massive, fills the screen */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 1.0 }}
        >
          <h1 className="text-[4rem] md:text-[5.5rem] lg:text-[6.5rem] font-light text-white leading-[1.05] tracking-tight">
            LLMs hallucinate.
          </h1>
          <h1 className="text-[4rem] md:text-[5.5rem] lg:text-[6.5rem] font-light leading-[1.05] tracking-tight mt-2">
            <span className="text-zinc-600">In healthcare, </span>
            <span className="font-black text-rose-400">
              hallucination kills.
            </span>
          </h1>
        </motion.div>

        {/* Thin rose line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
          className="w-32 h-px bg-rose-400/40 origin-left mt-12 mb-12"
        />

        {/* Two columns below -- problem vs answer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
          >
            <span className="text-rose-400 font-mono text-[11px] uppercase tracking-[0.4em] block mb-6">
              The problem
            </span>
            {["LLMs are black boxes", "Cannot explain why", "Cannot guarantee safety"].map((item, i) => (
              <div key={i} className="flex items-center gap-4 mb-4">
                <span className="text-rose-400/60 text-lg">&times;</span>
                <span className="text-zinc-500 text-lg font-light">{item}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <span className="text-cyan-400 font-mono text-[11px] uppercase tracking-[0.4em] block mb-6">
              Our answer
            </span>
            {["The math decides", "The AI communicates", "Safety is deterministic"].map((item, i) => (
              <div key={i} className="flex items-center gap-4 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                <span className="text-zinc-200 text-lg font-light">{item}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
