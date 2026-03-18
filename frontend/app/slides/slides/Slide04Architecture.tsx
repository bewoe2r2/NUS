"use client";

import { motion } from "framer-motion";

const layers = [
  {
    number: "L4",
    title: "Cultural Intelligence",
    description: "Translates clinical language into Singlish the patient actually understands",
    borderColor: "border-l-emerald-400",
    numBg: "bg-emerald-400/10",
    numText: "text-emerald-400",
  },
  {
    number: "L3",
    title: "Agentic Reasoning",
    description: "18 specialized tools with ReAct planning -- orchestrates care across patient, caregiver, clinician",
    borderColor: "border-l-cyan-400",
    numBg: "bg-cyan-400/10",
    numText: "text-cyan-400",
  },
  {
    number: "L2",
    title: "Statistical Engine",
    description: "HMM Viterbi decoding + 2,000 Monte Carlo simulations predict crises 48 hours ahead",
    borderColor: "border-l-amber-400",
    numBg: "bg-amber-400/10",
    numText: "text-amber-400",
  },
  {
    number: "L1",
    title: "Safety Foundation",
    description: "ADA 2024 guidelines hardcoded, drug interaction checks, PII de-identification",
    borderColor: "border-l-rose-400",
    numBg: "bg-rose-400/10",
    numText: "text-rose-400",
  },
];

export default function Slide04Architecture() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Subtle multi-color gradient */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full opacity-[0.03]"
        style={{
          background: "conic-gradient(from 0deg, rgba(52,211,153,0.5), rgba(6,182,212,0.5), rgba(251,191,36,0.5), rgba(244,63,94,0.5), rgba(52,211,153,0.5))",
          top: "10%",
          right: "-15%",
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 w-full py-[10vh] px-[10vw]">
        {/* Label & Title */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-cyan-400 font-mono text-base tracking-[0.3em] uppercase mb-4"
        >
          System Design
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-4xl md:text-5xl font-bold text-white mb-14"
        >
          The Diamond Architecture.
        </motion.h2>

        {/* Layer stack */}
        <div className="flex flex-col">
          {layers.map((layer, i) => (
            <div key={layer.number}>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.12, duration: 0.5 }}
                className={`relative w-full ${layer.borderColor} border-l-4 pl-8 pr-8 py-6 flex items-center gap-6`}
              >
                {/* Layer number in a circle */}
                <span
                  className={`w-10 h-10 rounded-full ${layer.numBg} ${layer.numText} font-mono text-sm font-bold flex items-center justify-center shrink-0`}
                >
                  {layer.number}
                </span>

                {/* Title + description */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg">
                    {layer.title}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mt-1">
                    {layer.description}
                  </p>
                </div>
              </motion.div>

              {/* Connector line between layers */}
              {i < layers.length - 1 && (
                <div className="ml-[2px] h-4 border-l border-white/10" />
              )}
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center text-lg text-zinc-400 mt-12 font-medium"
        >
          The math decides. The AI communicates.{" "}
          <span className="text-white font-semibold">Safety never bends.</span>
        </motion.p>
      </div>
    </div>
  );
}
