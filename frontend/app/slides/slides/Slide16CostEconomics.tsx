"use client";

import { motion } from "framer-motion";

export default function Slide16CostEconomics() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Teal orb */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, rgba(45,212,191,0.6), transparent 70%)",
          top: "20%",
          right: "15%",
        }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 w-full py-[10vh] px-[10vw]">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-teal-400 font-mono text-base tracking-[0.3em] uppercase mb-4"
        >
          Cost Economics
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-4xl md:text-5xl font-bold text-white mb-16"
        >
          One ER save funds <span className="text-teal-400">years</span> of operation.
        </motion.h2>

        {/* Asymmetric 60/40 -- hero LEFT, breakdown RIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
          {/* Left: Three hero metrics stacked */}
          <div className="flex flex-col gap-12">
            {[
              {
                number: "$0.40",
                label: "per patient per month",
                context: "Cheaper than a single blood test",
                color: "text-teal-400",
                glow: "rgba(45,212,191,0.3)",
              },
              {
                number: "$8,800",
                label: "saved per prevented ER visit",
                context: "The cost society pays for each failure",
                color: "text-emerald-400",
                glow: "rgba(52,211,153,0.3)",
              },
              {
                number: "22,000",
                label: "patient-months funded by one ER save",
                context: "That is 1,833 patient-years of monitoring",
                color: "text-amber-400",
                glow: "rgba(251,191,36,0.3)",
              },
            ].map((m, i) => (
              <motion.div
                key={m.number}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.12, duration: 0.5 }}
                className="flex items-baseline gap-8"
              >
                <span
                  className={`font-mono text-6xl md:text-7xl font-bold ${m.color} min-w-[200px]`}
                  style={{ textShadow: `0 0 80px ${m.glow}` }}
                >
                  {m.number}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-200 text-lg font-medium">{m.label}</span>
                  <span className="text-zinc-500 text-sm">{m.context}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right: ROI visualization -- glass panel */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-10"
          >
            <h3 className="text-white font-semibold text-2xl mb-8">ROI Multiplier</h3>

            <div className="flex flex-col gap-8">
              {/* Bar visualization */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">Cost per patient</span>
                  <span className="text-teal-400 font-mono font-bold">$0.40/mo</span>
                </div>
                <div className="w-full h-3 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "2%" }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                    className="h-full bg-teal-400 rounded-full"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">One ER save</span>
                  <span className="text-emerald-400 font-mono font-bold">$8,800</span>
                </div>
                <div className="w-full h-3 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.9, duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                  />
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-teal-400/20 via-white/[0.06] to-transparent my-8" />

            <p className="text-zinc-300 text-lg">
              <span className="text-emerald-400 font-mono font-bold text-3xl">22,000x</span>
              <span className="text-zinc-400 ml-3">return on a single save</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
