"use client";

import { motion } from "framer-motion";

const layers = [
  {
    id: "L1",
    title: "Safety Foundation",
    subtitle: "Always fires first. Always overrides AI.",
    bullets: [
      "Deterministic clinical rules, ADA 2024 guidelines hardcoded",
      "Drug interaction engine (16 pairs, 39 classes)",
      "PII de-identification, PDPA compliance",
    ],
    color: "text-rose-400",
    border: "border-rose-400/30",
    bg: "bg-rose-400/[0.04]",
    accent: "#f43f5e",
  },
  {
    id: "L2",
    title: "Statistical Engine",
    subtitle: "The math that makes the clinical decision.",
    bullets: [
      "HMM Viterbi decoding (9 orthogonal biomarkers)",
      "Monte Carlo simulation (2,000 paths, 48h horizon)",
      "Merlion ARIMA glucose forecasting (45-min lookahead)",
      "Baum-Welch personalization per patient",
    ],
    color: "text-amber-400",
    border: "border-amber-400/30",
    bg: "bg-amber-400/[0.04]",
    accent: "#f59e0b",
  },
  {
    id: "L3",
    title: "Agentic Reasoning",
    subtitle: "Decides what to do and when \u2014 without being asked.",
    bullets: [
      "Gemini 2.5 Flash with 18 tools",
      "Multi-turn ReAct loop (up to 5 reasoning turns)",
      "Cross-session memory (episodic + semantic + preferences)",
      "Proactive triggers (6 conditions for autonomous outreach)",
    ],
    color: "text-cyan-400",
    border: "border-cyan-400/30",
    bg: "bg-cyan-400/[0.04]",
    accent: "#06b6d4",
  },
  {
    id: "L4",
    title: "Safety Classifier",
    subtitle: "Every response checked before the patient sees it.",
    bullets: [
      "6-dimension response filter",
      "Medical accuracy, emotional tone, hallucination, cultural fit, scope, danger",
      "Fail-closed: crash = safe fallback, never unvetted response",
    ],
    color: "text-rose-300",
    border: "border-rose-300/30",
    bg: "bg-rose-300/[0.04]",
    accent: "#fda4af",
  },
  {
    id: "L5",
    title: "Cultural Intelligence",
    subtitle: "Speaks like family, not a hospital.",
    bullets: [
      "SEA-LION v4 27B (Singlish cultural translation)",
      "MERaLiON SER (speech emotion recognition from voice)",
      "Semiotic translation (function-based, not literal)",
    ],
    color: "text-emerald-400",
    border: "border-emerald-400/30",
    bg: "bg-emerald-400/[0.04]",
    accent: "#10b981",
  },
];

export default function Slide04Architecture() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Dark teal-tinted background for tech slide */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #000000 0%, #021015 40%, #031a22 100%)",
        }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full py-[5vh] px-[5vw] flex flex-col h-full">
        {/* Top label + title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-6"
        >
          <span className="inline-block text-[11px] font-mono uppercase tracking-[0.35em] text-cyan-400/80 border border-cyan-400/20 rounded-full px-4 py-1.5 mb-4">
            System Design
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            The Diamond Architecture
          </h2>
        </motion.div>

        {/* HORIZONTAL PIPELINE -- 5 columns flowing left to right */}
        <div className="flex-1 flex items-center">
          <div className="w-full flex items-stretch gap-0">
            {/* Input label */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center justify-center pr-4 shrink-0"
            >
              <div className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center mb-2">
                <span className="text-zinc-500 text-xs font-mono">IN</span>
              </div>
              <span className="text-zinc-600 text-[10px] font-mono uppercase tracking-wider text-center leading-tight">
                Patient<br />Data
              </span>
            </motion.div>

            {/* The 5 layer columns */}
            {layers.map((layer, i) => (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                className="flex items-stretch flex-1 min-w-0"
              >
                {/* Arrow connector (except first) */}
                {i > 0 && (
                  <div className="flex items-center shrink-0 px-1">
                    <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className="opacity-30">
                      <path d="M0 8H16M16 8L10 2M16 8L10 14" stroke={layers[i - 1].accent} strokeWidth="1.5" />
                    </svg>
                  </div>
                )}

                {/* Layer card */}
                <div
                  className={`${layer.bg} border ${layer.border} rounded-xl p-4 flex flex-col flex-1 min-w-0`}
                >
                  {/* Layer number + title */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-mono text-[10px] font-bold ${layer.color} opacity-60`}>
                      {layer.id}
                    </span>
                    <span className={`text-sm font-bold ${layer.color}`}>
                      {layer.title}
                    </span>
                  </div>

                  {/* Thin accent line */}
                  <div
                    className="w-full h-px mb-3 opacity-20"
                    style={{ background: layer.accent }}
                  />

                  {/* Bullets */}
                  <div className="flex flex-col gap-1.5 flex-1">
                    {layer.bullets.map((bullet, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <span
                          className="w-1 h-1 rounded-full shrink-0 mt-1.5 opacity-50"
                          style={{ background: layer.accent }}
                        />
                        <span className="text-zinc-400 text-[11px] leading-snug">
                          {bullet}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Subtitle at bottom */}
                  <p className="text-zinc-600 text-[10px] italic mt-3 leading-snug">
                    {layer.subtitle}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Output label */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex items-stretch shrink-0 pl-2"
            >
              {/* Arrow */}
              <div className="flex items-center pr-2">
                <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className="opacity-30">
                  <path d="M0 8H16M16 8L10 2M16 8L10 14" stroke="#10b981" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full border border-emerald-400/30 flex items-center justify-center mb-2">
                  <span className="text-emerald-400 text-xs font-mono">OUT</span>
                </div>
                <span className="text-zinc-600 text-[10px] font-mono uppercase tracking-wider text-center leading-tight">
                  Patient<br />Nurse<br />Caregiver
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom tagline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="text-center text-sm text-zinc-500 mt-4 font-light"
        >
          Data flows through 5 layers. The math decides. The AI communicates.{" "}
          <span className="text-zinc-300 font-medium">Safety bookends everything.</span>
        </motion.p>
      </div>
    </div>
  );
}
