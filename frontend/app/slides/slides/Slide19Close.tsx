"use client";

import { motion } from "framer-motion";

export default function Slide19Close() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Dual gradient orbs -- premium close */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full opacity-[0.05]"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.5), transparent 70%)",
          top: "10%",
          left: "20%",
        }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, rgba(52,211,153,0.5), transparent 70%)",
          bottom: "10%",
          right: "15%",
        }}
        animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex flex-col items-center text-center py-[10vh] px-[10vw] max-w-4xl">
        {/* Opening line */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-3xl font-semibold text-white mb-10"
        >
          Bewo does not wait for crisis.
        </motion.p>

        {/* Hero tagline with gradient -- big and cinematic */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="text-6xl md:text-8xl font-bold leading-[1.1] mb-10"
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

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-32 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent mb-10"
        />

        {/* Expansion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex flex-col gap-2 mb-12"
        >
          <p className="text-zinc-400 text-xl">
            From diabetes to <span className="text-cyan-400 font-medium">all chronic disease.</span>
          </p>
          <p className="text-zinc-400 text-xl">
            From Singapore to <span className="text-emerald-400 font-medium">ASEAN.</span>
          </p>
        </motion.div>

        {/* Logo / brand */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex flex-col items-center gap-4 mb-14"
        >
          <span
            className="text-4xl font-bold text-white tracking-tight"
            style={{ textShadow: "0 0 60px rgba(6,182,212,0.2)" }}
          >
            Bewo Health
          </span>
          <span className="text-zinc-500 text-base font-mono tracking-wider">
            NUS-Synapxe-IMDA AI Innovation Challenge 2026
          </span>
        </motion.div>

        {/* References */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-zinc-600 font-mono text-xs tracking-wide"
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
