"use client";

import { motion } from "framer-motion";

const agents = [
  {
    name: "Planning Agent",
    description: "Orchestrates the daily care plan",
    color: "bg-cyan-400",
    iconBg: "bg-cyan-400/15",
    borderColor: "border-cyan-400/20",
  },
  {
    name: "Check-in Agent",
    description: "Proactive outreach, mood sensing",
    color: "bg-emerald-400",
    iconBg: "bg-emerald-400/15",
    borderColor: "border-emerald-400/20",
  },
  {
    name: "Caregiver Agent",
    description: "Family alerts, burden management",
    color: "bg-purple-400",
    iconBg: "bg-purple-400/15",
    borderColor: "border-purple-400/20",
  },
  {
    name: "Clinician Agent",
    description: "SBAR reports, drug interaction checks",
    color: "bg-rose-400",
    iconBg: "bg-rose-400/15",
    borderColor: "border-rose-400/20",
  },
  {
    name: "Behavior Coach",
    description: "Nudges, challenges, loss-aversion streaks",
    color: "bg-amber-400",
    iconBg: "bg-amber-400/15",
    borderColor: "border-amber-400/20",
  },
  {
    name: "Cultural Agent",
    description: "Singlish translation, local dietary context",
    color: "bg-pink-400",
    iconBg: "bg-pink-400/15",
    borderColor: "border-pink-400/20",
  },
];

export default function Slide08Agent() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Rotating accent orb */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.03]"
        style={{
          background: "conic-gradient(from 0deg, rgba(6,182,212,0.5), rgba(168,85,247,0.5), rgba(244,63,94,0.5), rgba(251,191,36,0.5), rgba(6,182,212,0.5))",
          bottom: "-10%",
          left: "10%",
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 w-full py-[10vh] px-[10vw]">
        {/* Content LEFT, hero RIGHT -- asymmetric layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.7fr] gap-14 items-start">
          {/* Left */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-cyan-400 font-mono text-base tracking-[0.3em] uppercase mb-4"
            >
              Agentic AI
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-4xl md:text-5xl font-bold text-white mb-12"
            >
              Not a chatbot.<br /><span className="text-cyan-400">A background agent.</span>
            </motion.h2>

            {/* 2x3 Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {agents.map((agent, i) => (
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
                  className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] ${agent.borderColor} rounded-2xl p-6 transition-colors hover:bg-white/[0.06]`}
                >
                  {/* Accent dot */}
                  <div className={`w-3 h-3 rounded-full ${agent.color} mb-4`} />
                  <h3 className="text-white font-semibold text-sm mb-2">
                    {agent.name}
                  </h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    {agent.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right -- hero stats */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col items-center justify-center lg:pt-20"
          >
            <span
              className="font-mono text-[7rem] md:text-[9rem] font-bold text-white leading-none"
              style={{
                textShadow: "0 0 100px rgba(6,182,212,0.3), 0 0 200px rgba(6,182,212,0.1)",
              }}
            >
              18
            </span>
            <span className="text-cyan-400 font-mono text-2xl mt-3">tools</span>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent my-6" />

            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 text-center">
              <p className="text-zinc-300 text-base mb-2">ReAct reasoning loop</p>
              <p className="text-zinc-500 text-sm">Cross-session memory</p>
              <p className="text-zinc-500 text-sm mt-1">Autonomous escalation</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
