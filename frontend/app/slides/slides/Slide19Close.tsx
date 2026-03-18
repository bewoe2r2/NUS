"use client";

import { motion } from "framer-motion";

export default function Slide19Close() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Cinematic gradient mesh -- the finale */}
      <style>{`
        @keyframes meshShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 50% at 30% 40%, rgba(6,182,212,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 70% 60%, rgba(52,211,153,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 50% 80%, rgba(16,185,129,0.04) 0%, transparent 60%),
            linear-gradient(160deg, #000 0%, #020d10 40%, #031210 70%, #000 100%)
          `,
        }}
      />

      {/* Content -- centered, cinematic */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-[10vw]">
        {/* Opening line */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-xl font-light text-zinc-500 mb-8"
        >
          Bewo does not wait for crisis.
        </motion.p>

        {/* Hero tagline -- gradient text, massive, extralight */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-6xl md:text-8xl font-extralight text-center leading-[1.1] mb-12"
          style={{
            background: "linear-gradient(135deg, #22d3ee 0%, #34d399 50%, #10b981 100%)",
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

        {/* Thin accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="w-24 h-px bg-gradient-to-r from-cyan-400/30 via-emerald-400/50 to-cyan-400/30 mb-10"
        />

        {/* Expansion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex flex-col items-center gap-2 mb-14"
        >
          <p className="text-zinc-500 text-lg font-light">
            From diabetes to <span className="text-cyan-400 font-medium">all chronic disease.</span>
          </p>
          <p className="text-zinc-500 text-lg font-light">
            From Singapore to <span className="text-emerald-400 font-medium">ASEAN.</span>
          </p>
        </motion.div>

        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="flex flex-col items-center gap-3 mb-12"
        >
          <span className="text-3xl font-bold text-white tracking-tight">
            Bewo Health
          </span>
          <span className="text-zinc-600 text-sm font-mono tracking-wider">
            NUS-Synapxe-IMDA AI Innovation Challenge 2026
          </span>
        </motion.div>

        {/* References -- very subtle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-zinc-700 font-mono text-[10px] tracking-wide"
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
