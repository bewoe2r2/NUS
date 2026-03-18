"use client";

import { motion } from "framer-motion";

export default function Slide10LiveDemo() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Animated gradient sweep */}
      <motion.div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          background: "linear-gradient(135deg, rgba(6,182,212,0.4) 0%, rgba(168,85,247,0.4) 50%, rgba(52,211,153,0.4) 100%)",
        }}
        animate={{ opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 w-full flex flex-col items-center text-center py-[10vh] px-[10vw]">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-purple-400 font-mono text-base tracking-[0.3em] uppercase mb-10"
        >
          Live Demo
        </motion.p>

        {/* Hero text -- big centered */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-5xl md:text-7xl font-bold text-white mb-10 leading-tight max-w-4xl"
        >
          Let&apos;s meet
          <br />
          <span
            className="text-cyan-400"
            style={{ textShadow: "0 0 100px rgba(6,182,212,0.3)" }}
          >
            Mr. Tan.
          </span>
        </motion.h1>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-24 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent mb-12"
        />

        {/* Three demo flow steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mb-14"
        >
          {[
            {
              step: "01",
              title: "Morning Check-in",
              desc: "Bewo calls Mr. Tan in Singlish. MERaLiON detects slight fatigue in his voice.",
              color: "text-cyan-400",
              borderColor: "border-t-cyan-400",
            },
            {
              step: "02",
              title: "Risk Spike Detected",
              desc: "HMM transitions to elevated state. Monte Carlo shows 31% crisis probability in 24 hours.",
              color: "text-amber-400",
              borderColor: "border-t-amber-400",
            },
            {
              step: "03",
              title: "Cascade Response",
              desc: "Patient gets nudge. Daughter gets dashboard alert. Nurse gets auto-SBAR. All within 90 seconds.",
              color: "text-emerald-400",
              borderColor: "border-t-emerald-400",
            },
          ].map((item) => (
            <div
              key={item.step}
              className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 border-t-4 ${item.borderColor}`}
            >
              <span className={`font-mono text-4xl font-bold ${item.color} block mb-4`}>
                {item.step}
              </span>
              <h3 className="text-white font-semibold text-xl mb-3">
                {item.title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Bottom prompt */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl px-10 py-5 inline-block"
        >
          <p className="text-zinc-300 text-lg">
            <span className="text-purple-400 font-mono font-bold">bewo.health</span>
            <span className="text-zinc-500 mx-4">&middot;</span>
            <span className="text-zinc-400">Switching to live system now</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
