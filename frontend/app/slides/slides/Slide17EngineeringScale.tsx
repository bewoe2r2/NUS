"use client";

import { motion } from "framer-motion";

export default function Slide17EngineeringScale() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Dark cyan-tinted background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #010d12 0%, #000 50%, #010d12 100%)",
        }}
      />

      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 w-full h-full flex flex-col justify-center py-[8vh] px-[8vw]">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-14"
        >
          <span className="text-cyan-400 font-mono text-[11px] uppercase tracking-[0.4em] block mb-4">
            Engineering Scale
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Built to <span className="font-extralight text-cyan-400">deploy</span>, not to demo.
          </h2>
        </motion.div>

        {/* Three metrics -- massive numbers, horizontal layout */}
        <div className="grid grid-cols-3 gap-0 mb-14">
          {[
            { number: "186", unit: "ms", label: "total core pipeline", context: "Real-time on a phone", color: "text-cyan-400" },
            { number: "230", unit: "/230", label: "tests passing", context: "76/76 safety gates green", color: "text-emerald-400" },
            { number: "32.4K", unit: "", label: "lines of production code", context: "This is not a prototype", color: "text-amber-400" },
          ].map((m, i) => (
            <motion.div
              key={m.number}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.12, duration: 0.5 }}
              className={`py-6 ${i > 0 ? "pl-8 border-l border-white/[0.04]" : "pr-8"}`}
            >
              <div className="flex items-baseline gap-1">
                <span className={`font-mono text-6xl md:text-7xl font-bold ${m.color} tabular-nums`}>
                  {m.number}
                </span>
                {m.unit && (
                  <span className={`font-mono text-xl ${m.color} opacity-60`}>{m.unit}</span>
                )}
              </div>
              <span className="text-zinc-300 text-base font-medium block mt-3">{m.label}</span>
              <span className="text-zinc-600 text-sm block mt-1">{m.context}</span>
            </motion.div>
          ))}
        </div>

        {/* Bottom stats row -- three small metrics */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex gap-12 border-t border-white/[0.04] pt-8"
        >
          <div>
            <span className="text-rose-400 font-mono text-2xl font-bold">0</span>
            <p className="text-zinc-600 text-xs mt-1">unsafe outputs</p>
          </div>
          <div>
            <span className="text-emerald-400 font-mono text-2xl font-bold">100%</span>
            <p className="text-zinc-600 text-xs mt-1">crisis recall</p>
          </div>
          <div>
            <span className="text-cyan-400 font-mono text-2xl font-bold">&lt;1ms</span>
            <p className="text-zinc-600 text-xs mt-1">HMM inference</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
