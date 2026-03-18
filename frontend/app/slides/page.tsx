"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Slide01Hook from "./slides/Slide01Hook";
import Slide02Problem from "./slides/Slide02Problem";
import Slide03Insight from "./slides/Slide03Insight";
import Slide04Architecture from "./slides/Slide04Architecture";
import Slide05HMM from "./slides/Slide05HMM";
import Slide06Prediction from "./slides/Slide06Prediction";
import Slide07Agent from "./slides/Slide07Agent";
import Slide08Validation from "./slides/Slide08Validation";
import Slide09NationalAI from "./slides/Slide09NationalAI";
import Slide10Patient from "./slides/Slide10Patient";
import Slide11Caregiver from "./slides/Slide11Caregiver";
import Slide12Nurse from "./slides/Slide12Nurse";
import Slide13Safety from "./slides/Slide13Safety";
import Slide14Numbers from "./slides/Slide14Numbers";
import Slide15Close from "./slides/Slide15Close";

const SLIDES = [
  Slide01Hook,
  Slide02Problem,
  Slide03Insight,
  Slide04Architecture,
  Slide05HMM,
  Slide06Prediction,
  Slide07Agent,
  Slide08Validation,
  Slide09NationalAI,
  Slide10Patient,
  Slide11Caregiver,
  Slide12Nurse,
  Slide13Safety,
  Slide14Numbers,
  Slide15Close,
];

const TOTAL = SLIDES.length;

export default function SlidesPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

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
  }, [next, prev, goTo]);

  const handleClick = (e: React.MouseEvent) => {
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
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
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
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-white/[0.06]">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Slide counter */}
      <div className="fixed bottom-6 right-8 z-50 font-mono text-xs text-zinc-500 tracking-wider">
        {String(currentSlide + 1).padStart(2, "0")} / {TOTAL}
      </div>

      {/* Slide area */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          initial={{ opacity: 0, y: direction * 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: direction * -12 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0"
        >
          <SlideComponent />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
