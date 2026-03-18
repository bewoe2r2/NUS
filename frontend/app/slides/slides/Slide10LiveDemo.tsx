"use client";

import { motion } from "framer-motion";

export default function Slide10LiveDemo() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Animated gradient border effect */}
      <style>{`
        @keyframes borderGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>

      {/* Pure black -- dramatic pause */}
      <div className="absolute inset-0 bg-black" />

      {/* Animated border frame */}
      <div
        className="absolute inset-[3vh] rounded-2xl pointer-events-none"
        style={{
          border: "1px solid rgba(168,85,247,0.15)",
          animation: "borderGlow 4s ease-in-out infinite",
        }}
      />

      {/* Content -- centered, minimal */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-[10vw]">
        {/* Small pill */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-16"
        >
          <span className="inline-block text-[11px] font-mono uppercase tracking-[0.35em] text-purple-400/80 border border-purple-400/20 rounded-full px-5 py-2">
            Live Demo
          </span>
        </motion.div>

        {/* Hero text -- massive, light weight */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="text-6xl md:text-8xl font-extralight text-white text-center leading-tight mb-6"
        >
          Let&apos;s meet
        </motion.h1>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="text-6xl md:text-8xl font-black text-cyan-400 text-center leading-tight mb-20"
        >
          Mr. Tan.
        </motion.h1>

        {/* Three demo steps -- horizontal, minimal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex gap-16"
        >
          {[
            { num: "01", title: "Morning Check-in", color: "text-cyan-400", accent: "bg-cyan-400" },
            { num: "02", title: "Risk Spike Detected", color: "text-amber-400", accent: "bg-amber-400" },
            { num: "03", title: "Cascade Response", color: "text-emerald-400", accent: "bg-emerald-400" },
          ].map((step) => (
            <div key={step.num} className="flex items-center gap-3">
              <span className={`font-mono text-3xl font-bold ${step.color} opacity-30`}>
                {step.num}
              </span>
              <div>
                <div className={`w-6 h-px ${step.accent} opacity-40 mb-2`} />
                <span className="text-zinc-300 text-sm font-medium">{step.title}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Bottom URL */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="absolute bottom-[6vh]"
        >
          <span className="text-purple-400/60 font-mono text-sm">bewo.health</span>
        </motion.div>
      </div>
    </div>
  );
}
