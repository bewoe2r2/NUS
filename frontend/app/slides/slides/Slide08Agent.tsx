"use client";

import { motion } from "framer-motion";

const agents = [
  { name: "Planning", desc: "Daily care plan", color: "#06b6d4" },
  { name: "Check-in", desc: "Proactive outreach", color: "#10b981" },
  { name: "Caregiver", desc: "Family alerts", color: "#a855f7" },
  { name: "Clinician", desc: "SBAR reports", color: "#f43f5e" },
  { name: "Behavior", desc: "Nudges & streaks", color: "#f59e0b" },
  { name: "Cultural", desc: "Singlish translation", color: "#ec4899" },
];

export default function Slide08Agent() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Dark zinc background -- neutral, different from other slides */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #09090b 0%, #0f0f12 50%, #09090b 100%)",
        }}
      />

      <div className="relative z-10 w-full h-full flex">
        {/* LEFT content area */}
        <div className="w-[55%] h-full flex flex-col justify-center py-[8vh] pl-[8vw] pr-[4vw]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-10"
          >
            <span className="text-cyan-400 font-mono text-[11px] uppercase tracking-[0.4em] block mb-4">
              Agentic AI
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-3">
              Not a chatbot.
            </h2>
            <h2 className="text-4xl md:text-5xl font-extralight text-cyan-400 leading-tight">
              A background agent.
            </h2>
          </motion.div>

          {/* Agent grid -- 2x3, minimal pills */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06, duration: 0.4 }}
                className="flex items-center gap-3 py-3 px-4 rounded-lg border border-white/[0.05] bg-white/[0.02]"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: agent.color }}
                />
                <div>
                  <span className="text-zinc-200 text-sm font-medium block leading-tight">{agent.name}</span>
                  <span className="text-zinc-600 text-[11px]">{agent.desc}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Capabilities */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex gap-6"
          >
            {[
              { label: "ReAct reasoning", detail: "up to 5 turns" },
              { label: "Cross-session memory", detail: "episodic + semantic" },
              { label: "Autonomous escalation", detail: "6 trigger conditions" },
            ].map((item) => (
              <div key={item.label} className="border-l border-cyan-400/20 pl-4">
                <span className="text-zinc-300 text-sm block">{item.label}</span>
                <span className="text-zinc-600 text-xs">{item.detail}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT -- the "18" bleeds off the right edge */}
        <div className="w-[45%] h-full flex items-center justify-end overflow-hidden relative">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative"
          >
            <span
              className="font-mono text-[28rem] font-bold text-white/[0.03] leading-none select-none block"
              style={{ marginRight: "-8rem" }}
            >
              18
            </span>
            {/* Overlaid accent */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ marginRight: "-8rem" }}>
              <div className="text-center">
                <span className="font-mono text-8xl font-bold text-cyan-400 block">18</span>
                <span className="text-cyan-400/60 font-mono text-xl mt-2 block">tools</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
