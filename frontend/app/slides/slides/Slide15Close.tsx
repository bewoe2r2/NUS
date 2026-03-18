"use client";

import { motion } from "framer-motion";

export default function Slide15Close() {
  return (
    <div className="relative flex items-center justify-center w-full h-full p-[8vh_8vw]">
      {/* Teal-green radial background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(34,211,238,0.05) 0%, rgba(52,211,153,0.03) 40%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl">
        {/* Opening line */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-2xl font-semibold text-white mb-6"
        >
          Bewo does not wait for crisis.
        </motion.p>

        {/* Hero tagline with gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="text-5xl md:text-6xl font-bold leading-tight mb-8"
          style={{
            background: "linear-gradient(135deg, #22d3ee, #34d399)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          It predicts.
          <br />
          It prevents.
          <br />
          It protects.
        </motion.h1>

        {/* Expansion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex flex-col gap-1 mb-10"
        >
          <p className="text-zinc-400 text-base">
            From diabetes to all chronic disease.
          </p>
          <p className="text-zinc-400 text-base">
            From Singapore to ASEAN.
          </p>
        </motion.div>

        {/* Logo / brand */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex flex-col items-center gap-3 mb-12"
        >
          <span className="text-3xl font-bold text-white tracking-tight">
            Bewo Health
          </span>
          <span className="text-zinc-500 text-sm font-mono tracking-wider">
            NUS-Synapxe-IMDA AI Innovation Challenge 2026
          </span>
        </motion.div>

        {/* References */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-zinc-600 font-mono text-[10px] tracking-wide"
        >
          <span>ADA 2024 Guidelines</span>
          <span>SEA-LION v4 (AI Singapore)</span>
          <span>MERaLiON (I2R)</span>
          <span>MOH Singapore</span>
          <span>Kahneman &amp; Tversky, 1979</span>
        </motion.div>
      </div>
    </div>
  );
}
