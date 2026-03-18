"use client";

import { motion } from "framer-motion";

export default function Slide01Hook() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Radial cyan background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(34,211,238,0.06) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-8">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-cyan-400 font-mono text-sm tracking-[0.2em] uppercase mb-8"
        >
          Every 6 Minutes
        </motion.p>

        {/* Hero number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          className="flex items-baseline gap-6 mb-8"
        >
          <span
            className="font-mono text-[12rem] leading-none font-bold text-white"
            style={{
              textShadow:
                "0 0 80px rgba(34,211,238,0.4), 0 0 160px rgba(34,211,238,0.2), 0 0 240px rgba(34,211,238,0.1)",
            }}
          >
            6
          </span>
          <span className="text-4xl font-light text-zinc-400 tracking-tight">
            minutes
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-3xl font-semibold text-white mb-6"
        >
          One preventable admission.
        </motion.h1>

        {/* Supporting text */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col gap-2 max-w-2xl"
        >
          <p className="text-zinc-400 text-lg leading-relaxed">
            That is how often a diabetic ER admission happens in Singapore.
          </p>
          <p className="text-zinc-500 text-base">
            Most were predictable. None were predicted.
          </p>
        </motion.div>

        {/* Source */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="absolute bottom-[8vh] text-zinc-600 font-mono text-xs tracking-wide"
        >
          MOH Singapore &middot; Diabetic Emergency Admissions
        </motion.p>
      </div>
    </div>
  );
}
