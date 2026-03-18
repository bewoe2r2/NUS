"use client";

import { motion } from "framer-motion";

export default function Slide01Hook() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Dramatic gradient sweep -- diagonal from bottom-left to top-right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #000000 0%, #0a0a0a 30%, #0c1a24 60%, #0d2030 100%)",
        }}
      />

      {/* Single thin accent line running diagonally */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, transparent 49.5%, rgba(6,182,212,0.08) 49.5%, rgba(6,182,212,0.08) 50.5%, transparent 50.5%)",
        }}
      />

      {/* Content pinned to BOTTOM of screen */}
      <div className="relative z-10 w-full flex flex-col justify-end pb-[12vh] px-[10vw]">
        {/* The number -- massive, extralight, positioned top-right as texture */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 1.2 }}
          className="absolute top-[8vh] right-[8vw]"
        >
          <span
            className="font-mono text-[20rem] font-extralight text-white/[0.04] leading-none select-none"
          >
            6
          </span>
        </motion.div>

        {/* Small pill label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-10"
        >
          <span className="inline-block text-[11px] font-mono uppercase tracking-[0.35em] text-cyan-400/80 border border-cyan-400/20 rounded-full px-4 py-1.5">
            Singapore &middot; Diabetic Emergency Data
          </span>
        </motion.div>

        {/* Hero line -- mixed weights for contrast */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mb-6"
        >
          <h1 className="text-[5.5rem] md:text-[7rem] leading-[0.9] tracking-tight">
            <span className="font-extralight text-zinc-300">Every</span>
            <span className="font-mono font-bold text-white mx-6">6</span>
            <span className="font-extralight text-zinc-300">minutes</span>
          </h1>
        </motion.div>

        {/* Thin 1px accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
          className="w-40 h-px bg-cyan-400/50 origin-left mb-8"
        />

        {/* Subtitle -- stacked, asymmetric */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="max-w-xl"
        >
          <p className="text-2xl font-light text-zinc-400 leading-relaxed mb-3">
            One preventable diabetic admission.
          </p>
          <p className="text-lg text-zinc-500">
            Most were predictable.{" "}
            <span className="text-rose-400 font-medium">None were predicted.</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
