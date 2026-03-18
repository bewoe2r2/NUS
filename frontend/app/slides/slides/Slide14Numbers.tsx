"use client";

import { motion } from "framer-motion";

const metrics = [
  {
    number: "$0.40",
    label: "per patient per month",
    context: "Cheaper than a single blood test",
    color: "text-teal-400",
  },
  {
    number: "$8,800",
    label: "saved per prevented ER visit",
    context: "One save funds the system for years",
    color: "text-emerald-400",
  },
  {
    number: "22,000",
    label: "patient-months funded",
    context: "By a single ER save",
    color: "text-amber-400",
  },
  {
    number: "186ms",
    label: "total core pipeline",
    context: "Real-time on a phone, no server",
    color: "text-cyan-400",
  },
  {
    number: "230/230",
    label: "tests, 76/76 gates",
    context: "Every validation gate green",
    color: "text-emerald-400",
  },
  {
    number: "32,400",
    label: "lines of production code",
    context: "This is not a prototype",
    color: "text-teal-400",
  },
];

export default function Slide14Numbers() {
  return (
    <div className="flex items-center justify-center w-full h-full p-[8vh_8vw]">
      <div className="w-full max-w-5xl">
        {/* Label & Title */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-teal-400 font-mono text-sm tracking-[0.2em] uppercase mb-3"
        >
          The Numbers
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-2xl font-bold text-white mb-10"
        >
          Built to deploy, not to demo.
        </motion.h2>

        {/* 2x3 metric grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {metrics.map((m, i) => (
            <motion.div
              key={m.number}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 flex flex-col"
            >
              <span className={`font-mono text-3xl font-bold ${m.color} mb-2`}>
                {m.number}
              </span>
              <span className="text-zinc-300 text-sm font-medium mb-1">
                {m.label}
              </span>
              <span className="text-zinc-500 text-xs mt-auto">
                {m.context}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
