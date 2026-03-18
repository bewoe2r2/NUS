"use client";

import { motion } from "framer-motion";

export default function Slide09Validation() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Rich emerald-tinged atmosphere */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 60% 40%, rgba(16,185,129,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 20% 70%, rgba(16,185,129,0.04) 0%, transparent 60%),
            linear-gradient(160deg, #000 0%, #020d08 50%, #000 100%)
          `,
        }}
      />

      <div className="relative z-10 w-full h-full flex">
        {/* LEFT side -- the giant "0" bleeds off left edge */}
        <div className="w-[50%] h-full flex items-center justify-center relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <span
              className="font-mono text-[24rem] font-black text-emerald-400 leading-none select-none block"
              style={{
                marginLeft: "-6rem",
                textShadow:
                  "0 0 120px rgba(16,185,129,0.3), 0 0 240px rgba(16,185,129,0.1)",
              }}
            >
              0
            </span>
          </motion.div>
        </div>

        {/* RIGHT side -- content, top-aligned with breathing room at bottom */}
        <div className="w-[50%] h-full flex flex-col justify-center py-[10vh] pr-[8vw] pl-[2vw]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <span className="text-emerald-400 font-mono text-[11px] uppercase tracking-[0.4em] block mb-6">
              Validation
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3">
              unsafe
            </h2>
            <h2 className="text-4xl md:text-5xl font-extralight text-zinc-400 leading-tight mb-8">
              misclassifications
            </h2>
          </motion.div>

          {/* Thin emerald line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="w-20 h-px bg-emerald-400/40 origin-left mb-8"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-zinc-500 text-base font-light leading-relaxed mb-10 max-w-sm"
          >
            No patient in danger was ever told they were safe.
            <br />
            <span className="text-zinc-600 text-sm">5,000 hardened patients. 32 archetypes. 230 tests.</span>
          </motion.p>

          {/* Three metrics -- stacked vertically, no cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.5 }}
            className="flex flex-col gap-6"
          >
            {[
              { value: "99.3%", label: "accuracy on clean clinical data", color: "text-emerald-400" },
              { value: "100%", label: "crisis recall \u2014 every true crisis detected", color: "text-emerald-300" },
              { value: "82.1%", label: "accuracy on hardened validation", color: "text-cyan-400" },
            ].map((m) => (
              <div key={m.value} className="flex items-baseline gap-4">
                <span className={`font-mono text-4xl font-bold ${m.color} tabular-nums min-w-[120px]`}>
                  {m.value}
                </span>
                <span className="text-zinc-500 text-sm">{m.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
