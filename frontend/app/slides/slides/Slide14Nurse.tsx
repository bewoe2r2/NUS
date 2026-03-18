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
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Amber orb */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, rgba(251,191,36,0.5), transparent 70%)",
          top: "30%",
          left: "-10%",
        }}
        animate={{ x: [0, 25, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 w-full py-[10vh] px-[10vw]">
        {/* Layout: hero LEFT, content RIGHT -- reverse of previous slide */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-16 items-center">
          {/* Left: Hero number */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col items-center text-center"
          >
            <span
              className="font-mono text-[7rem] md:text-[9rem] font-bold text-white leading-none"
              style={{
                textShadow:
                  "0 0 80px rgba(251,191,36,0.35), 0 0 160px rgba(251,191,36,0.15)",
              }}
            >
              1:100
            </span>
            <span className="text-amber-400 text-xl font-medium mt-4">
              nurse-to-patient ratio
            </span>
            <span className="text-zinc-500 text-base mt-2">
              from 1:20 today
            </span>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent my-6" />
            <p className="text-zinc-500 text-sm max-w-[250px]">
              AI handles the monitoring. Nurses handle the humans.
            </p>
          </motion.div>

          {/* Right column */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-amber-400 font-mono text-base tracking-[0.3em] uppercase mb-4"
            >
              For the Nurse
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-4xl md:text-5xl font-bold text-white mb-12"
            >
              The system surfaces.<br /><span className="text-amber-400">The human decides.</span>
            </motion.h2>

            {/* Feature cards with large accent numbers */}
            <div className="flex flex-col gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.1, duration: 0.5 }}
                  className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-7 flex items-start gap-6"
                >
                  <span className={`font-mono text-4xl font-bold ${f.color} leading-none mt-1`}>
                    {f.num}
                  </span>
                  <div>
                    <h3 className="text-white font-semibold text-xl mb-2">
                      {f.title}
                    </h3>
                    <p className="text-zinc-400 text-base leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
