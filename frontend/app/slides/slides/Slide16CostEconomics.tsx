"use client";

import { motion } from "framer-motion";

export default function Slide16CostEconomics() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Gradient mesh -- teal + emerald layered */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 70% 60%, rgba(45,212,191,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 40% 50% at 20% 30%, rgba(52,211,153,0.04) 0%, transparent 60%),
            #000
          `,
        }}
      />

      <div className="relative z-10 w-full h-full flex items-center px-[8vw]">
        <div className="w-full">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-14"
          >
            <span className="text-teal-400 font-mono text-[11px] uppercase tracking-[0.4em] block mb-4">
              Cost Economics
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              One ER save funds{" "}
              <span className="font-extralight text-teal-400">years</span> of operation.
            </h2>
          </motion.div>

          {/* Three hero metrics -- large, side by side, no cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-14">
            {[
              {
                number: "$0.40",
                label: "per patient per month",
                context: "Cheaper than a single blood test",
                color: "text-teal-400",
              },
              {
                number: "$8,800",
                label: "saved per prevented ER visit",
                context: "The cost society pays for each failure",
                color: "text-emerald-400",
              },
              {
                number: "22,000",
                label: "patient-months funded by one save",
                context: "1,833 patient-years of monitoring",
                color: "text-amber-400",
              },
            ].map((m, i) => (
              <motion.div
                key={m.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.12, duration: 0.5 }}
                className="border-t border-white/[0.06] pt-6"
              >
                <span className={`font-mono text-5xl md:text-6xl font-bold ${m.color} block tabular-nums`}>
                  {m.number}
                </span>
                <span className="text-zinc-200 text-base font-medium block mt-3">{m.label}</span>
                <span className="text-zinc-600 text-sm block mt-1">{m.context}</span>
              </motion.div>
            ))}
          </div>

          {/* ROI bar visualization -- minimal */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            className="max-w-2xl"
          >
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-zinc-500">Cost per patient/month</span>
                <span className="text-teal-400 font-mono font-bold">$0.40</span>
              </div>
              <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "2%" }}
                  transition={{ delay: 0.9, duration: 0.8 }}
                  className="h-full bg-teal-400 rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-zinc-500">One ER save</span>
                <span className="text-emerald-400 font-mono font-bold">$8,800</span>
              </div>
              <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 1.1, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                />
              </div>
            </div>

            <div className="flex items-baseline gap-3 mt-6">
              <span className="text-emerald-400 font-mono text-3xl font-bold">22,000x</span>
              <span className="text-zinc-600 text-sm">return on a single save</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
