"use client";

import { motion } from "framer-motion";

export default function Slide01Hook() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Pulsing glow keyframes */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.15); }
        }
      `}</style>

      {/* Animated gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 45%, rgba(6,182,212,0.08) 0%, rgba(6,182,212,0.02) 40%, transparent 70%)",
        }}
      />

      {/* Slow-moving accent orb */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.6), transparent 70%)",
          top: "20%",
          left: "55%",
        }}
        animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex flex-col items-center text-center py-[10vh] px-[10vw]">
        {/* Hero number with pulsing glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          className="relative flex items-baseline gap-6 mb-10"
        >
          {/* Pulsing glow behind the number */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(6,182,212,0.4), transparent 70%)",
              animation: "pulseGlow 4s ease-in-out infinite",
            }}
          />

          <span className="text-[4rem] font-light tracking-tight text-zinc-300">
            Every
          </span>
          <span
            className="font-mono text-[14rem] leading-none font-bold text-white relative z-10"
            style={{
              textShadow:
                "0 0 120px rgba(6,182,212,0.3), 0 0 240px rgba(6,182,212,0.15), 0 4px 60px rgba(0,0,0,0.5)",
            }}
          >
            6
          </span>
          <span className="text-[4rem] font-light tracking-tight text-zinc-300">
            minutes
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-4xl md:text-5xl font-semibold text-white mb-8"
        >
          One <span className="text-cyan-400">preventable</span> admission.
        </motion.h1>

        {/* Divider accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
          className="w-24 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent mb-8"
        />

        {/* Supporting text */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col gap-3"
        >
          <p className="text-xl text-zinc-400 max-w-lg mx-auto leading-relaxed">
            That is how often a diabetic ER admission happens in Singapore.
          </p>
          <p className="text-xl text-zinc-400 max-w-lg mx-auto">
            Most were predictable. <span className="text-rose-400 font-medium">None were predicted.</span>
          </p>
        </motion.div>

        {/* Source */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="absolute bottom-[8vh] text-xs text-zinc-600 italic"
        >
          MOH Singapore &middot; Diabetic Emergency Admissions
        </motion.p>
      </div>
    </div>
  );
}
