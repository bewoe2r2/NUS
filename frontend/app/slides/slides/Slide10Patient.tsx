"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Singlish Chat",
    description:
      "Talks like a friend, not a doctor. SEA-LION translates clinical language.",
  },
  {
    title: "Voice Check-ins",
    description:
      "MERaLiON detects emotional state from tone. No typing required.",
  },
  {
    title: "Glucose OCR",
    description:
      "Point camera at meter. Reading captured automatically.",
  },
  {
    title: "Loss-aversion Vouchers",
    description:
      "Losses motivate 2x more than gains (Kahneman's Prospect Theory).",
  },
];

export default function Slide10Patient() {
  return (
    <div className="flex items-center justify-center w-full h-full p-[8vh_8vw]">
      <div className="w-full max-w-6xl">
        {/* Label & Title */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-teal-400 font-mono text-sm tracking-[0.2em] uppercase mb-3"
        >
          For the Patient
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-2xl font-bold text-white mb-10"
        >
          Zero effort. The system does the work.
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Feature items */}
          <div className="flex flex-col gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                className="flex items-start gap-4"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <div>
                  <h3 className="text-white font-semibold text-base mb-1">
                    {f.title}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right: Callout card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-10 border-l-4 border-l-teal-400"
          >
            <p className="text-xl font-semibold text-white leading-relaxed mb-6">
              Works for Mr. Tan who can barely use a phone.
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-zinc-400 text-sm">
                Voice-first. Proactive outreach.
              </p>
              <p className="text-zinc-500 text-sm italic">
                The patient never has to initiate.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
