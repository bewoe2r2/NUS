"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Auto-SBAR Reports",
    description:
      "Generated in 3 seconds. Manual takes 15 minutes.",
    borderColor: "border-l-teal-400",
  },
  {
    title: "Urgency-ranked Triage",
    description:
      "Patients sorted by risk. Highest urgency surfaces first.",
    borderColor: "border-l-amber-400",
  },
  {
    title: "Drug Interaction Engine",
    description:
      "16 interaction pairs, 39 drug classes. Checked before every suggestion.",
    borderColor: "border-l-rose-400",
  },
];

export default function Slide12Nurse() {
  return (
    <div className="flex items-center justify-center w-full h-full p-[8vh_8vw]">
      <div className="w-full max-w-6xl">
        {/* Label & Title */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-amber-400 font-mono text-sm tracking-[0.2em] uppercase mb-3"
        >
          For the Nurse
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-2xl font-bold text-white mb-10"
        >
          The system surfaces. The human decides.
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Left: Feature items */}
          <div className="flex flex-col gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                className={`bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 border-l-4 ${f.borderColor}`}
              >
                <h3 className="text-white font-semibold text-base mb-1.5">
                  {f.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Right: Hero number */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="flex flex-col items-center text-center"
          >
            <span
              className="font-mono text-9xl font-bold text-white leading-none"
              style={{
                textShadow:
                  "0 0 60px rgba(251,191,36,0.35), 0 0 120px rgba(251,191,36,0.15)",
              }}
            >
              1:100
            </span>
            <span className="text-amber-400 text-lg font-medium mt-4">
              nurse-to-patient ratio
            </span>
            <span className="text-zinc-500 text-sm mt-2">
              from 1:20 today
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
