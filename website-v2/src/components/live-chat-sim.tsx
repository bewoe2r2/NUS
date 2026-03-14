"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Heart } from "lucide-react";

const MESSAGES = [
  { from: "bewo" as const, text: "Good morning, Mdm. Tan! I noticed your glucose was 9.8 mmol/L yesterday evening. How are you feeling today?", delay: 800 },
  { from: "patient" as const, text: "aiya still tired lah, forgot my medicine last night", delay: 2200 },
  { from: "action" as const, text: "detect_mood: frustrated (0.7) | run_hmm: WARNING 72% | counterfactual: risk 35% \u2192 12%", delay: 1200 },
  { from: "bewo" as const, text: "I understand. Taking Metformin now would reduce your crisis risk from 35% to 12% \u2014 that\u2019s a big difference! Reminder set for 7 PM tonight.", delay: 1800 },
  { from: "patient" as const, text: "ok ok i take now. what should i eat?", delay: 2000 },
  { from: "action" as const, text: "recommend_food: congee + fish (GI: 4.2) | award_voucher: +S$0.50 | celebrate_streak: 6 days", delay: 1000 },
  { from: "bewo" as const, text: "Great choice! Try congee with fish \u2014 low glycemic impact. Your 6-day medication streak stays alive!", delay: 1500 },
];

export function LiveChatSim() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [visibleCount, setVisibleCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!isInView) return;
    let totalDelay = 500;
    const timers: ReturnType<typeof setTimeout>[] = [];

    MESSAGES.forEach((msg, i) => {
      timers.push(setTimeout(() => setIsTyping(true), totalDelay));
      totalDelay += msg.from === "action" ? 400 : 800;
      timers.push(setTimeout(() => {
        setIsTyping(false);
        setVisibleCount(i + 1);
      }, totalDelay));
      totalDelay += msg.delay;
    });

    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  return (
    <div ref={ref} className="relative mx-auto max-w-[360px]">
      {/* Phone glow */}
      <div className="absolute -inset-4 bg-gradient-to-b from-primary/10 via-stable/5 to-transparent rounded-[44px] blur-2xl" />

      {/* Phone shell */}
      <div className="relative bg-[oklch(0.08_0.02_260)] rounded-[40px] p-[10px] shadow-2xl border border-[oklch(0.20_0.03_260)]">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-[oklch(0.08_0.02_260)] rounded-b-2xl z-20" />

        <div className="bg-[oklch(0.12_0.03_260)] rounded-[32px] overflow-hidden">
          {/* Phone header */}
          <div className="bg-gradient-to-r from-[oklch(0.38_0.12_185)] to-[oklch(0.45_0.12_185)] px-5 pt-10 pb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <Heart size={16} className="text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">Bewo Health</div>
              <div className="text-white/50 text-[10px] font-[family-name:var(--font-mono)]">AI Health Companion</div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-stable animate-pulse-slow" />
              <span className="text-white/40 text-[10px] font-[family-name:var(--font-mono)]">LIVE</span>
            </div>
          </div>

          {/* Chat area */}
          <div className="p-4 min-h-[420px] flex flex-col justify-end space-y-3 bg-[oklch(0.10_0.03_260)]">
            <AnimatePresence>
              {MESSAGES.slice(0, visibleCount).map((msg, i) => {
                if (msg.from === "action") {
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="mx-auto max-w-[90%]"
                    >
                      <div className="px-3 py-2 rounded-lg bg-[oklch(0.16_0.04_260)] border border-[oklch(0.25_0.04_260)] text-[10px] font-[family-name:var(--font-mono)] text-[oklch(0.55_0.06_185)] leading-relaxed">
                        <span className="text-primary font-semibold">AGENT</span> {msg.text}
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex flex-col ${msg.from === "patient" ? "items-end" : "items-start"}`}
                  >
                    {msg.from === "bewo" && (
                      <span className="text-[9px] font-[family-name:var(--font-mono)] font-semibold text-primary mb-1 ml-1">BEWO AI</span>
                    )}
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                        msg.from === "patient"
                          ? "bg-primary text-white rounded-[16px_16px_4px_16px]"
                          : "bg-[oklch(0.18_0.03_260)] text-[oklch(0.85_0.01_260)] rounded-[16px_16px_16px_4px] border border-[oklch(0.25_0.03_260)]"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Typing indicator */}
            {isTyping && visibleCount < MESSAGES.length && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 ml-1"
              >
                <span className="text-[9px] font-[family-name:var(--font-mono)] text-primary mr-1">BEWO AI</span>
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 rounded-full bg-[oklch(0.45_0.08_185)]"
                    style={{
                      animation: `pulse-slow 1.2s ease-in-out ${d * 0.2}s infinite`,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
