"use client";

import { motion } from "framer-motion";

export default function Slide11NationalAI() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Purple gradient orb */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, rgba(168,85,247,0.6), transparent 70%)",
          top: "5%",
          left: "-5%",
        }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 w-full py-[10vh] px-[10vw]">
        {/* Label & Title */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-purple-400 font-mono text-base tracking-[0.3em] uppercase mb-4"
        >
          National AI Models
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-4xl md:text-5xl font-bold text-white mb-14"
        >
          Built on Singapore&apos;s <span className="text-purple-400">own AI.</span>
        </motion.h2>

        {/* Asymmetric layout: two cards left, hero right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-8 items-start">
          {/* SEA-LION card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-lg">
                SEA-LION
              </span>
              <span className="text-zinc-500 text-xs">
                AI Singapore &middot; 27B
              </span>
            </div>

            {/* Before/After */}
            <div className="mb-5">
              <span className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-2 block">
                Before
              </span>
              <div className="bg-rose-500/[0.05] border border-rose-500/[0.10] rounded-xl px-5 py-4">
                <p className="text-zinc-300 text-sm leading-relaxed italic">
                  &ldquo;Your blood glucose level of 15.2 mmol/L is significantly
                  elevated...&rdquo;
                </p>
              </div>
            </div>
            <div>
              <span className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-2 block">
                After
              </span>
              <div className="bg-emerald-500/[0.05] border border-emerald-500/[0.10] rounded-xl px-5 py-4">
                <p className="text-zinc-300 text-sm leading-relaxed italic">
                  &ldquo;Uncle, your sugar a bit high lah. After makan, better
                  take your medicine first, ok?&rdquo;
                </p>
              </div>
            </div>
          </motion.div>

          {/* MERaLiON card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-sm font-bold text-purple-400 bg-purple-400/10 px-3 py-1.5 rounded-lg">
                MERaLiON
              </span>
              <span className="text-zinc-500 text-xs">
                I2R &middot; Paralinguistic
              </span>
            </div>

            <div className="flex flex-col gap-5">
              {[
                "Speech emotion recognition from voice",
                "Detects distress, fatigue, confusion",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <p className="text-zinc-300 text-base">{item}</p>
                </div>
              ))}
              <div className="flex items-start gap-4">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400/50 mt-1.5 shrink-0" />
                <p className="text-zinc-400 text-base italic">
                  Even when their words say &ldquo;I&apos;m fine&rdquo;
                </p>
              </div>
            </div>

            {/* Accent divider */}
            <div className="w-full h-px bg-gradient-to-r from-purple-400/20 via-white/[0.06] to-transparent my-6" />

            <p className="text-zinc-500 text-sm">
              Voice-first design for patients who <span className="text-purple-400 font-medium">cannot type</span>
            </p>
          </motion.div>

          {/* Hero number + Award */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="flex flex-col items-center text-center lg:min-w-[180px] lg:pt-8"
          >
            <span
              className="font-mono text-[8rem] md:text-[10rem] font-bold text-white leading-none"
              style={{
                textShadow:
                  "0 0 80px rgba(168,85,247,0.35), 0 0 160px rgba(168,85,247,0.15)",
              }}
            >
              2
            </span>
            <span className="text-purple-400 text-xl font-medium mt-3">
              national LLMs
            </span>
            <span className="text-zinc-500 text-sm mt-1">integrated</span>

            <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent my-6" />

            <div className="bg-amber-400/[0.08] border border-amber-400/20 rounded-2xl px-6 py-3">
              <span className="text-amber-400 font-mono text-sm font-bold">
                NMLP Award
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
