"use client";

import { motion } from "framer-motion";

const features = [
  {
    num: "01",
    title: "Singlish Chat",
    description:
      "Talks like a friend, not a doctor. SEA-LION translates clinical language.",
    color: "text-cyan-400",
    accent: "#06b6d4",
  },
  {
    num: "02",
    title: "Voice Check-ins",
    description:
      "MERaLiON detects emotional state from tone. No typing required.",
    color: "text-emerald-400",
    accent: "#10b981",
  },
  {
    num: "03",
    title: "Glucose OCR",
    description:
      "Point camera at meter. Reading captured automatically.",
    color: "text-amber-400",
    accent: "#f59e0b",
  },
  {
    num: "04",
    title: "Loss-aversion Vouchers",
    description:
      "Losses motivate 2x more than gains (Kahneman\u2019s Prospect Theory).",
    color: "text-rose-400",
    accent: "#f43f5e",
  },
];

export default function Slide12Patient() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Dark teal section background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #000 0%, #021210 50%, #031a15 100%)",
        }}
      />

      {/* Subtle dot texture */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 w-full py-[8vh] px-[8vw]">
        {/* Label + title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-12"
        >
          <span className="text-teal-400 font-mono text-[11px] uppercase tracking-[0.4em] block mb-4">
            For the Patient
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2">
            Zero effort.
          </h2>
          <h2 className="text-4xl md:text-5xl font-extralight text-teal-400 leading-tight">
            The system does the work.
          </h2>
        </motion.div>

        {/* Feature list -- large accent numbers, left-aligned */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10 mb-14">
          {features.map((f, i) => (
            <motion.div
              key={f.num}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.1, duration: 0.5 }}
              className="flex items-start gap-5"
            >
              <span
                className="font-mono text-5xl font-bold leading-none mt-1 opacity-20"
                style={{ color: f.accent }}
              >
                {f.num}
              </span>
              <div>
                <h3 className="text-white font-semibold text-lg mb-1.5">
                  {f.title}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom callout -- asymmetric, pinned left */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="border-l-2 border-teal-400/30 pl-6 max-w-lg"
        >
          <p className="text-xl font-light text-zinc-200 leading-relaxed mb-2">
            Works for Mr. Tan who can <span className="text-teal-400 font-medium">barely use a phone.</span>
          </p>
          <p className="text-zinc-600 text-sm">
            Voice-first. Proactive outreach. The patient never has to initiate.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
