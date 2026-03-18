"use client";

import { motion } from "framer-motion";

export default function Slide11NationalAI() {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* Purple-tinted atmosphere */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 30% 30%, rgba(168,85,247,0.06) 0%, transparent 60%),
            linear-gradient(180deg, #05020a 0%, #0a0510 50%, #000 100%)
          `,
        }}
      />

      <div className="relative z-10 w-full py-[8vh] px-[8vw]">
        {/* Top -- label and title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-12"
        >
          <span className="inline-block text-[11px] font-mono uppercase tracking-[0.35em] text-purple-400/80 border border-purple-400/20 rounded-full px-4 py-1.5 mb-4">
            National AI Models
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Built on Singapore&apos;s{" "}
            <span className="font-extralight text-purple-400">own AI.</span>
          </h2>
        </motion.div>

        {/* Two columns -- SEA-LION and MERaLiON side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* SEA-LION */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-full">
                SEA-LION
              </span>
              <span className="text-zinc-600 text-xs">AI Singapore &middot; 27B parameters</span>
            </div>

            {/* Before/After -- contrast cards */}
            <div className="mb-4">
              <span className="text-zinc-600 text-[10px] font-mono uppercase tracking-wider block mb-2">
                Before
              </span>
              <div className="border-l-2 border-rose-400/30 pl-4 py-2">
                <p className="text-zinc-500 text-sm italic leading-relaxed">
                  &ldquo;Your blood glucose level of 15.2 mmol/L is significantly elevated...&rdquo;
                </p>
              </div>
            </div>
            <div>
              <span className="text-zinc-600 text-[10px] font-mono uppercase tracking-wider block mb-2">
                After
              </span>
              <div className="border-l-2 border-emerald-400/30 pl-4 py-2">
                <p className="text-zinc-200 text-sm italic leading-relaxed">
                  &ldquo;Uncle, your sugar a bit high lah. After makan, better take your medicine first, ok?&rdquo;
                </p>
              </div>
            </div>
          </motion.div>

          {/* MERaLiON */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-sm font-bold text-purple-400 bg-purple-400/10 px-3 py-1.5 rounded-full">
                MERaLiON
              </span>
              <span className="text-zinc-600 text-xs">I2R &middot; Paralinguistic</span>
            </div>

            <div className="flex flex-col gap-4">
              {[
                "Speech emotion recognition from voice",
                "Detects distress, fatigue, confusion",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                  <p className="text-zinc-300 text-base leading-relaxed">{item}</p>
                </div>
              ))}
              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400/40 mt-2 shrink-0" />
                <p className="text-zinc-500 text-base italic leading-relaxed">
                  Even when their words say &ldquo;I&apos;m fine&rdquo;
                </p>
              </div>
            </div>

            <div className="w-full h-px bg-purple-400/10 my-6" />

            <p className="text-zinc-600 text-sm">
              Voice-first design for patients who{" "}
              <span className="text-purple-400 font-medium">cannot type</span>
            </p>
          </motion.div>
        </div>

        {/* Bottom bar -- award + stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex items-center gap-10"
        >
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-6xl font-bold text-white">2</span>
            <div>
              <span className="text-purple-400 text-sm font-medium block">national LLMs</span>
              <span className="text-zinc-600 text-xs">integrated</span>
            </div>
          </div>

          <div className="w-px h-10 bg-zinc-800" />

          <div className="bg-amber-400/[0.08] border border-amber-400/20 rounded-full px-5 py-2">
            <span className="text-amber-400 font-mono text-sm font-bold">NMLP Award</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
