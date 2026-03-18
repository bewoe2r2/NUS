"use client";

import { motion } from "framer-motion";

const features = [
  {
    num: "01",
    title: "Singlish Chat",
    description:
      "Talks like a friend, not a doctor. SEA-LION translates clinical language.",
    color: "text-cyan-400",
  },
  {
    num: "02",
    title: "Voice Check-ins",
    description:
      "MERaLiON detects emotional state from tone. No typing required.",
    color: "text-emerald-400",
  },
  {
    num: "03",
    title: "Glucose OCR",
    description:
      "Point camera at meter. Reading captured automatically.",
    color: "text-amber-400",
  },
  {
    num: "04",
    title: "Loss-aversion Vouchers",
    description:
      "Losses motivate 2x more than gains (Kahneman\u2019s Prospect Theory).",
    color: "text-rose-400",
  },
];

export default function Slide12Patient() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Teal gradient orb */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, rgba(45,212,191,0.6), transparent 70%)",
          bottom: "10%",
          right: "10%",
        }}
        animate={{ x: [0, -20, 0], y: [0, -15, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 w-full py-[10vh] px-[10vw]">
        {/* Layout: content LEFT, callout RIGHT -- 60/40 split */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-14 items-start">
          {/* Left column */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-teal-400 font-mono text-base tracking-[0.3em] uppercase mb-4"
            >
              For the Patient
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-4xl md:text-5xl font-bold text-white mb-12"
            >
              Zero effort. <span className="text-teal-400">The system does the work.</span>
            </motion.h2>

            {/* Numbered feature list -- large accent numbers */}
            <div className="flex flex-col gap-8">
              {features.map((f, i) => (
                <motion.div
                  key={f.num}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-6"
                >
                  <span className={`font-mono text-4xl font-bold ${f.color} leading-none mt-1`}>
                    {f.num}
                  </span>
                  <div>
                    <h3 className="text-white font-semibold text-xl mb-2">
                      {f.title}
                    </h3>
                    <p className="text-zinc-400 text-base leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Callout card -- glass panel */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-10 border-l-4 border-l-teal-400 lg:mt-20"
          >
            <p className="text-2xl font-semibold text-white leading-relaxed mb-8">
              Works for Mr. Tan who can <span className="text-teal-400">barely use a phone.</span>
            </p>

            <div className="w-full h-px bg-gradient-to-r from-teal-400/30 via-white/[0.06] to-transparent mb-8" />

            <div className="flex flex-col gap-3">
              <p className="text-zinc-300 text-lg">
                Voice-first. Proactive outreach.
              </p>
              <p className="text-zinc-500 text-base italic">
                The patient never has to initiate.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
