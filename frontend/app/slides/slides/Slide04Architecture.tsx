"use client";

import { motion } from "framer-motion";

const layers = [
  {
    number: "L4",
    title: "Cultural Intelligence",
    description: "SEA-LION + MERaLiON for Singlish voice",
    partner: "IMDA",
    color: "border-l-purple-400",
    badgeColor: "bg-purple-400/10 text-purple-400",
    partnerColor: "text-purple-400 bg-purple-400/10",
  },
  {
    number: "L3",
    title: "Agentic Reasoning",
    description: "18 tools + ReAct planning loop",
    partner: "NUS",
    color: "border-l-cyan-400",
    badgeColor: "bg-cyan-400/10 text-cyan-400",
    partnerColor: "text-cyan-400 bg-cyan-400/10",
  },
  {
    number: "L2",
    title: "Statistical Engine",
    description: "HMM Viterbi + 2,000 Monte Carlo simulations",
    partner: "Core",
    color: "border-l-emerald-400",
    badgeColor: "bg-emerald-400/10 text-emerald-400",
    partnerColor: "text-emerald-400 bg-emerald-400/10",
  },
  {
    number: "L1",
    title: "Safety Foundation",
    description: "ADA 2024 hardcoded, drug interactions, PII de-identification",
    partner: "Synapxe",
    color: "border-l-rose-400",
    badgeColor: "bg-rose-400/10 text-rose-400",
    partnerColor: "text-rose-400 bg-rose-400/10",
  },
];

export default function Slide04Architecture() {
  return (
    <div className="flex items-center justify-center w-full h-full p-[8vh_8vw]">
      <div className="w-full max-w-4xl">
        {/* Label & Title */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-cyan-400 font-mono text-sm tracking-[0.2em] uppercase mb-3"
        >
          System Design
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-3xl font-bold text-white mb-12"
        >
          The Diamond Architecture.
        </motion.h2>

        {/* Layer stack */}
        <div className="relative flex flex-col gap-4">
          {/* Vertical connector line */}
          <div className="absolute left-[22px] top-6 bottom-6 w-px bg-white/[0.08]" />

          {layers.map((layer, i) => (
            <motion.div
              key={layer.number}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.12, duration: 0.5 }}
              className={`relative flex items-center gap-6 bg-white/[0.03] border border-white/[0.06] rounded-xl px-6 py-5 ${layer.color} border-l-4`}
            >
              {/* Layer number badge */}
              <span
                className={`font-mono text-xs font-semibold px-2.5 py-1 rounded-md ${layer.badgeColor} shrink-0`}
              >
                {layer.number}
              </span>

              {/* Title & description */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-base">
                  {layer.title}
                </h3>
                <p className="text-zinc-400 text-sm mt-0.5">
                  {layer.description}
                </p>
              </div>

              {/* Partner tag */}
              <span
                className={`font-mono text-xs px-3 py-1 rounded-full ${layer.partnerColor} shrink-0`}
              >
                {layer.partner}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Bottom tagline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center text-zinc-400 text-base mt-10 font-medium"
        >
          The math decides. The AI communicates.{" "}
          <span className="text-white">Safety never bends.</span>
        </motion.p>
      </div>
    </div>
  );
}
