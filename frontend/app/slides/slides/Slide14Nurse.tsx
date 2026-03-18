"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Auto-SBAR Reports",
    description: "Generated in 3 seconds. Manual takes 15 minutes.",
    num: "01",
    color: "text-teal-400",
  },
  {
    title: "Urgency-ranked Triage",
    description: "Patients sorted by risk. Highest urgency surfaces first.",
    num: "02",
    color: "text-amber-400",
  },
  {
    title: "Drug Interaction Engine",
    description: "16 interaction pairs, 39 drug classes. Checked before every suggestion.",
    num: "03",
    color: "text-rose-400",
  },
];

export default function Slide14Nurse() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Amber-tinted dark background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 40% at 10% 50%, rgba(251,191,36,0.04) 0%, transparent 60%),
            linear-gradient(180deg, #0a0800 0%, #000 100%)
          `,
        }}
      />

      <div className="relative z-10 w-full h-full flex items-center">
        {/* LEFT -- the hero ratio */}
        <div className="w-[40%] h-full flex flex-col items-center justify-center relative">
          {/* Vertical accent line on right */}
          <div className="absolute right-0 top-[20%] bottom-[20%] w-px bg-gradient-to-b from-transparent via-amber-400/15 to-transparent" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="flex flex-col items-center text-center px-[4vw]"
          >
            <span className="font-mono text-[8rem] md:text-[10rem] font-extralight text-amber-400 leading-none tabular-nums">
              1:100
            </span>
            <div className="w-16 h-px bg-amber-400/20 my-5" />
            <span className="text-zinc-300 text-base font-light">nurse-to-patient ratio</span>
            <span className="text-zinc-600 text-sm mt-1">from 1:20 today</span>
            <p className="text-zinc-600 text-xs mt-6 max-w-[200px] leading-relaxed italic">
              AI handles the monitoring. Nurses handle the humans.
            </p>
          </motion.div>
        </div>

        {/* RIGHT -- features */}
        <div className="w-[60%] h-full flex flex-col justify-center py-[8vh] pr-[8vw] pl-[6vw]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-10"
          >
            <span className="text-amber-400 font-mono text-[11px] uppercase tracking-[0.4em] block mb-4">
              For the Nurse
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-2">
              The system surfaces.
            </h2>
            <h2 className="text-4xl md:text-5xl font-extralight text-amber-400 leading-tight">
              The human decides.
            </h2>
          </motion.div>

          {/* Feature list -- numbered, no cards */}
          <div className="flex flex-col gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                className="flex items-start gap-5"
              >
                <span className={`font-mono text-5xl font-bold ${f.color} leading-none mt-1 opacity-20`}>
                  {f.num}
                </span>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1.5">{f.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
