"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import Slide01Hook from "./slides/Slide01Hook";
import Slide02Problem from "./slides/Slide02Problem";
import Slide03Insight from "./slides/Slide03Insight";
import Slide04Architecture from "./slides/Slide04Architecture";
import Slide05HMM from "./slides/Slide05HMM";
import Slide06MonteCarlo from "./slides/Slide06MonteCarlo";
import Slide07Counterfactual from "./slides/Slide07Counterfactual";
import Slide08Agent from "./slides/Slide08Agent";
import Slide09Validation from "./slides/Slide09Validation";
import Slide10LiveDemo from "./slides/Slide10LiveDemo";
import Slide11NationalAI from "./slides/Slide11NationalAI";
import Slide12Patient from "./slides/Slide12Patient";
import Slide13Caregiver from "./slides/Slide13Caregiver";
import Slide14Nurse from "./slides/Slide14Nurse";
import Slide15Safety from "./slides/Slide15Safety";
import Slide16CostEconomics from "./slides/Slide16CostEconomics";
import Slide17EngineeringScale from "./slides/Slide17EngineeringScale";
import Slide18Team from "./slides/Slide18Team";
import Slide19Close from "./slides/Slide19Close";

const SLIDES = [
  Slide01Hook,
  Slide02Problem,
  Slide03Insight,
  Slide04Architecture,
  Slide05HMM,
  Slide06MonteCarlo,
  Slide07Counterfactual,
  Slide08Agent,
  Slide09Validation,
  Slide10LiveDemo,
  Slide11NationalAI,
  Slide12Patient,
  Slide13Caregiver,
  Slide14Nurse,
  Slide15Safety,
  Slide16CostEconomics,
  Slide17EngineeringScale,
  Slide18Team,
  Slide19Close,
];

const PRESENTER_NOTES: Record<number, string> = {
  0: "Opening hook — pause for effect, let the number land before advancing.",
  1: "Problem framing — emphasise the scale: 440K diabetics, $8.8K per ER visit.",
  2: "Insight — this is the 'aha' moment. Slow down. Let the danger land.",
  3: "Architecture overview — explain WHAT each layer does and WHY it matters.",
  4: "HMM deep-dive — keep it high-level unless audience asks for math.",
  5: "Monte Carlo — emphasise 2,000 simulations, not a single guess.",
  6: "Counterfactual — the patient sees evidence, not guilt. Pause on the 35% to 12%.",
  7: "Agent system — stress that it augments clinicians, never replaces.",
  8: "Validation results — let the zero speak. Pause after the headline stat.",
  9: "Live demo — transition to the actual system. Build anticipation.",
  10: "National AI strategy — connect SEA-LION and MERaLiON to Singapore's AI strategy.",
  11: "Patient journey — tell Mr. Tan's story. Make it personal.",
  12: "Caregiver perspective — mention reduced burnout metrics.",
  13: "Nurse workflow — show the 1:100 ratio. AI handles monitoring, humans handle humans.",
  14: "Safety & compliance — PDPA, ADA 2024. Tick the boxes quickly.",
  15: "Cost economics — let the 22,000x ROI land. One save funds years.",
  16: "Engineering scale — repeat the top 3 metrics. This is not a prototype.",
  17: "Team & timeline — 8 weeks, full stack. Show the velocity.",
  18: "Close — call to action. End with confidence, not a question.",
};

const TOTAL = SLIDES.length;

export default function SlidesPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showPresenter, setShowPresenter] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  const animDuration = prefersReducedMotion ? 0 : 0.4;

  const slideVariants = useMemo(
    () => ({
      initial: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
    }),
    [prefersReducedMotion]
  );

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(TOTAL - 1, index));
      if (clamped === currentSlide) return;
      setDirection(clamped > currentSlide ? 1 : -1);
      setCurrentSlide(clamped);
    },
    [currentSlide]
  );

  const next = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo]);
  const prev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setShowPresenter((v) => !v);
        return;
      }
      if (e.key === "o" || e.key === "O") {
        e.preventDefault();
        setShowOverview((v) => !v);
        return;
      }
      if (showOverview) return;
      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prev();
          break;
        case "Home":
          e.preventDefault();
          goTo(0);
          break;
        case "End":
          e.preventDefault();
          goTo(TOTAL - 1);
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, prev, goTo, showOverview]);

  const handleClick = (e: React.MouseEvent) => {
    if (showOverview) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const threshold = rect.width * 0.3;
    if (x < threshold) {
      prev();
    } else {
      next();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (showOverview) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
  };

  const handleOverviewSelect = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
    setShowOverview(false);
  };

  const SlideComponent = SLIDES[currentSlide];
  const progress = ((currentSlide + 1) / TOTAL) * 100;

  return (
    <div
      className="relative w-screen h-screen overflow-hidden cursor-default select-none"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Logo */}
      <div className="fixed top-5 left-8 z-50 text-zinc-600 font-bold text-sm tracking-tight">
        Bewo
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-white/[0.06]">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
          style={{
            width: `${progress}%`,
            transition: prefersReducedMotion
              ? "none"
              : "width 0.4s ease-out",
          }}
        />
      </div>

      {/* Slide counter */}
      <div className="fixed bottom-6 right-8 z-50 font-mono text-xs text-zinc-500 tracking-wider">
        {String(currentSlide + 1).padStart(2, "0")} &mdash; {String(TOTAL).padStart(2, "0")}
      </div>

      {/* Slide area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={slideVariants.initial}
          animate={slideVariants.animate}
          exit={slideVariants.exit}
          transition={{ duration: animDuration, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <SlideComponent />
        </motion.div>
      </AnimatePresence>

      {/* Presenter notes bar — toggle with P */}
      <AnimatePresence>
        {showPresenter && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-zinc-900/95 border-t border-zinc-800 backdrop-blur-sm px-10 py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-mono text-zinc-500 mb-1 uppercase tracking-widest">
              Presenter Notes
            </p>
            <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl">
              {PRESENTER_NOTES[currentSlide] ?? "No notes for this slide."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide overview grid — toggle with O */}
      <AnimatePresence>
        {showOverview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-[70] bg-zinc-950/95 backdrop-blur-md overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-10 py-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-zinc-400 text-sm font-mono uppercase tracking-widest">
                  Slide Overview
                </h2>
                <button
                  onClick={() => setShowOverview(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-xs font-mono transition-colors"
                >
                  ESC or O to close
                </button>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {SLIDES.map((Slide, i) => (
                  <button
                    key={i}
                    onClick={() => handleOverviewSelect(i)}
                    className={`
                      relative aspect-video rounded-lg overflow-hidden border-2 transition-all
                      ${
                        i === currentSlide
                          ? "border-cyan-400 ring-2 ring-cyan-400/20"
                          : "border-zinc-800 hover:border-zinc-600"
                      }
                    `}
                  >
                    <div className="absolute inset-0 bg-zinc-900 scale-[1] pointer-events-none overflow-hidden">
                      <div className="w-full h-full transform scale-[0.2] origin-top-left" style={{ width: "500%", height: "500%" }}>
                        <Slide />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-950 to-transparent px-2 py-1.5">
                      <span className="text-[10px] font-mono text-zinc-400">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
