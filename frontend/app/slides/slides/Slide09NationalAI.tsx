"use client";

import { motion } from "framer-motion";

export default function Slide09NationalAI() {
  return (
    <div className="flex items-center justify-center w-full h-full p-[8vh_8vw]">
      <div className="w-full max-w-6xl">
        {/* Label & Title */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-purple-400 font-mono text-sm tracking-[0.2em] uppercase mb-3"
        >
          National AI Models
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-2xl font-bold text-white mb-10"
        >
          Built on Singapore&apos;s own AI.
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-8 items-start">
          {/* SEA-LION card */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7"
          >
            <div className="flex items-center gap-3 mb-5">
              <span className="font-mono text-sm font-semibold text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-md">
                SEA-LION
              </span>
              <span className="text-zinc-500 text-xs">
                AI Singapore &middot; 27B parameters
              </span>
            </div>

            {/* Before */}
            <div className="mb-4">
              <span className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-2 block">
                Before
              </span>
              <div className="bg-rose-500/[0.05] border border-rose-500/[0.10] rounded-lg px-4 py-3">
                <p className="text-zinc-300 text-sm leading-relaxed italic">
                  &ldquo;Your blood glucose level of 15.2 mmol/L is significantly
                  elevated...&rdquo;
                </p>
              </div>
            </div>

            {/* After */}
            <div>
              <span className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-2 block">
                After
              </span>
              <div className="bg-emerald-500/[0.05] border border-emerald-500/[0.10] rounded-lg px-4 py-3">
                <p className="text-zinc-300 text-sm leading-relaxed italic">
                  &ldquo;Uncle, your sugar a bit high lah. After makan, better
                  take your medicine first, ok?&rdquo;
                </p>
              </div>
            </div>
          </motion.div>

          {/* MERaLiON card */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7"
          >
            <div className="flex items-center gap-3 mb-5">
              <span className="font-mono text-sm font-semibold text-purple-400 bg-purple-400/10 px-3 py-1 rounded-md">
                MERaLiON
              </span>
              <span className="text-zinc-500 text-xs">
                I2R &middot; Paralinguistic Analysis
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <p className="text-zinc-300 text-sm">
                  Speech emotion recognition from voice
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <p className="text-zinc-300 text-sm">
                  Detects distress, fatigue, confusion
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <p className="text-zinc-400 text-sm italic">
                  Even when their words say &ldquo;I&apos;m fine&rdquo;
                </p>
              </div>
            </div>
          </motion.div>

          {/* Hero number + NMLP award */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="flex flex-col items-center text-center lg:min-w-[160px]"
          >
            <span
              className="font-mono text-8xl font-bold text-white"
              style={{
                textShadow:
                  "0 0 60px rgba(168,85,247,0.35), 0 0 120px rgba(168,85,247,0.15)",
              }}
            >
              2
            </span>
            <span className="text-purple-400 text-sm font-medium mt-2">
              national LLMs
            </span>
            <span className="text-zinc-500 text-xs mt-1">integrated</span>

            <div className="mt-6 px-4 py-2 bg-amber-400/10 border border-amber-400/20 rounded-lg">
              <span className="text-amber-400 font-mono text-xs font-semibold">
                NMLP Award
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
