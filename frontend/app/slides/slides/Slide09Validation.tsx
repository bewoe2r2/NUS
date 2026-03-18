"use client";

import { motion } from "framer-motion";

const metrics = [
  {
    value: "99.3%",
    label: "accuracy on clean clinical data",
    color: "text-emerald-400",
  },
  {
    value: "100%",
    label: "crisis recall -- every true crisis detected",
    color: "text-emerald-300",
  },
  {
    value: "82.1%",
    label: "accuracy on hardened validation",
    color: "text-cyan-400",
  },
];

export default function Slide09Validation() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Green radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(52,211,153,0.08) 0%, transparent 65%)",
        }}
      />

      {/* Slow animated orb */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, rgba(52,211,153,0.6), transparent 70%)",
          top: "20%",
          left: "40%",
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.04, 0.06, 0.04] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 w-full flex flex-col items-center text-center py-[10vh] px-[10vw]">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-emerald-400 font-mono text-base tracking-[0.3em] uppercase mb-8"
        >
          Validation
        </motion.p>

        {/* Giant "0" -- full-screen centered */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
        >
          <span
            className="font-mono text-[12rem] md:text-[16rem] leading-none font-bold text-emerald-400"
            style={{
              textShadow:
                "0 0 120px rgba(52,211,153,0.5), 0 0 240px rgba(52,211,153,0.2), 0 0 360px rgba(52,211,153,0.1)",
            }}
          >
            0
          </span>
        </motion.div>

        {/* Subtitle */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold text-white mt-4 mb-3"
        >
          unsafe misclassifications
        </motion.h2>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="w-24 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent mb-6"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="text-zinc-400 text-lg mb-14 max-w-2xl leading-relaxed"
        >
          No patient in danger was ever told they were safe.
          <br />
          <span className="text-zinc-500">5,000 hardened patients. 32 clinical archetypes. 230 tests passing.</span>
        </motion.p>

        {/* Three metric columns -- glass panels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          className="grid grid-cols-3 gap-8 w-full max-w-3xl"
        >
          {metrics.map((m) => (
            <div
              key={m.value}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 flex flex-col items-center"
            >
              <span
                className={`font-mono text-5xl md:text-6xl font-bold ${m.color}`}
                style={{ textShadow: "0 0 60px rgba(52,211,153,0.2)" }}
              >
                {m.value}
              </span>
              <span className="text-zinc-400 text-sm mt-3 leading-snug max-w-[200px]">
                {m.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
