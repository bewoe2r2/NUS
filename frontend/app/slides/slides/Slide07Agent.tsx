"use client";

import { motion } from "framer-motion";

const agents = [
  {
    name: "Planning Agent",
    description: "Orchestrates the daily care plan",
    color: "bg-cyan-400",
    iconBg: "bg-cyan-400/15",
    icon: "\u{1F4CB}",
  },
  {
    name: "Check-in Agent",
    description: "Proactive outreach, mood sensing",
    color: "bg-emerald-400",
    iconBg: "bg-emerald-400/15",
    icon: "\u{1F4DE}",
  },
  {
    name: "Caregiver Agent",
    description: "Family alerts, burden management",
    color: "bg-purple-400",
    iconBg: "bg-purple-400/15",
    icon: "\u{1F91D}",
  },
  {
    name: "Clinician Agent",
    description: "SBAR reports, drug interaction checks",
    color: "bg-rose-400",
    iconBg: "bg-rose-400/15",
    icon: "\u{1FA7A}",
  },
  {
    name: "Behavior Coach",
    description: "Nudges, challenges, loss-aversion streaks",
    color: "bg-amber-400",
    iconBg: "bg-amber-400/15",
    icon: "\u{1F3AF}",
  },
  {
    name: "Cultural Agent",
    description: "Singlish translation, local dietary context",
    color: "bg-pink-400",
    iconBg: "bg-pink-400/15",
    icon: "\u{1F30F}",
  },
];

export default function Slide07Agent() {
  return (
    <div className="flex items-center justify-center w-full h-full p-[8vh_8vw]">
      <div className="w-full max-w-5xl">
        {/* Label & Title */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-cyan-400 font-mono text-sm tracking-[0.2em] uppercase mb-3"
        >
          Agentic AI
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-2xl font-bold text-white mb-10"
        >
          Not a chatbot. A background agent.
        </motion.h2>

        {/* 2x3 Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
              className="group bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 transition-colors hover:bg-white/[0.06] hover:border-white/[0.12]"
            >
              {/* Icon circle */}
              <div
                className={`w-9 h-9 rounded-full ${agent.iconBg} flex items-center justify-center text-base mb-4`}
              >
                {agent.icon}
              </div>
              <h3 className="text-white font-semibold text-sm mb-1.5">
                {agent.name}
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {agent.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom line */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-center text-zinc-400 text-sm mt-10 font-mono tracking-wide"
        >
          18 tools. ReAct reasoning. Cross-session memory.
        </motion.p>
      </div>
    </div>
  );
}
