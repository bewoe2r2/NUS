"use client";

import { motion } from "framer-motion";

const metrics = [
  {
    number: "186",
    unit: "ms",
    label: "total core pipeline",
    context: "Real-time on a phone, no server",
    color: "text-cyan-400",
    glow: "rgba(6,182,212,0.25)",
  },
  {
    number: "230",
    unit: "/230",
    label: "tests passing",
    context: "76/76 safety gates green",
    color: "text-emerald-400",
    glow: "rgba(52,211,153,0.25)",
  },
  {
    number: "32.4K",
    unit: "",
    label: "lines of production code",
    context: "This is not a prototype",
    color: "text-amber-400",
    glow: "rgba(251,191,36,0.25)",
  },
];

export default function Slide17EngineeringScale() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Cyan gradient */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.5), transparent 70%)",
          bottom: "5%",
          left: "20%",
        }}
        animate={{ y: [0, -25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 w-full flex flex-col items-center py-[10vh] px-[10vw]">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-cyan-400 font-mono text-base tracking-[0.3em] uppercase mb-4 self-start"
        >
          Engineering Scale
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-4xl md:text-5xl font-bold text-white mb-16 self-start"
        >
          Built to <span className="text-cyan-400">deploy</span>, not to demo.
        </motion.h2>

        {/* Three large metric cards -- centered */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {metrics.map((m, i) => (
            <motion.div
              key={m.number}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.12, duration: 0.5 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-10 flex flex-col items-center text-center"
            >
              <div className="flex items-baseline gap-1">
                <span
                  className={`font-mono text-6xl md:text-7xl font-bold ${m.color}`}
                  style={{ textShadow: `0 0 80px ${m.glow}` }}
                >
                  {m.number}
                </span>
                {m.unit && (
                  <span className={`font-mono text-2xl font-bold ${m.color}`}>
                    {m.unit}
                  </span>
                )}
              </div>
              <span className="text-zinc-200 text-lg font-medium mt-4 mb-2">
                {m.label}
              </span>
              <div className="w-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-3" />
              <span className="text-zinc-500 text-sm">
                {m.context}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Bottom line */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-14 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl px-10 py-6 max-w-3xl w-full"
        >
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <span className="text-rose-400 font-mono text-2xl font-bold">0</span>
              <p className="text-zinc-400 text-sm mt-1">unsafe outputs</p>
            </div>
            <div>
              <span className="text-emerald-400 font-mono text-2xl font-bold">100%</span>
              <p className="text-zinc-400 text-sm mt-1">crisis recall</p>
            </div>
            <div>
              <span className="text-cyan-400 font-mono text-2xl font-bold">&lt;1ms</span>
              <p className="text-zinc-400 text-sm mt-1">HMM inference</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
