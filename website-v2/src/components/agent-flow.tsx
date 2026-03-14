"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const STEPS = [
  { id: "bio", label: "Biomarkers", sub: "9 Weighted Inputs", color: "oklch(0.45 0.12 185)" },
  { id: "hmm", label: "HMM Engine", sub: "Viterbi + Monte Carlo", color: "oklch(0.52 0.14 160)" },
  { id: "ctx", label: "Context Build", sub: "Mood + Streaks + History", color: "oklch(0.62 0.14 80)" },
  { id: "ai", label: "Gemini AI", sub: "Reason + Select Tools", color: "oklch(0.50 0.12 280)" },
  { id: "exec", label: "Execute", sub: "16 Agentic Tools", color: "oklch(0.52 0.14 160)" },
  { id: "audit", label: "Audit Log", sub: "SBAR + Governance", color: "oklch(0.50 0.02 260)" },
];

export function AgentFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [activeStep, setActiveStep] = useState(-1);
  const [particles, setParticles] = useState<{ id: number; fromIdx: number; progress: number }[]>([]);

  useEffect(() => {
    if (!isInView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setActiveStep(i), 300 + i * 400));
    });
    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  useEffect(() => {
    if (!isInView) return;
    let id = 0;
    const interval = setInterval(() => {
      setParticles((prev) => {
        const next = prev
          .map((p) => ({ ...p, progress: p.progress + 0.02 }))
          .filter((p) => p.progress < 1);
        if (next.length < 6) {
          const fromIdx = Math.floor(Math.random() * (STEPS.length - 1));
          next.push({ id: id++, fromIdx, progress: 0 });
        }
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [isInView]);

  const W = 760;
  const H = 120;
  const nodeW = 100;
  const nodeH = 56;
  const gap = (W - nodeW * STEPS.length) / (STEPS.length - 1);

  function nodeX(i: number) { return i * (nodeW + gap); }
  function nodeCenter(i: number) { return { x: nodeX(i) + nodeW / 2, y: H / 2 }; }

  return (
    <div ref={ref} className="bg-[oklch(0.10_0.03_260)] rounded-2xl border border-[oklch(0.22_0.04_260)] p-6 overflow-hidden">
      <div className="text-xs font-[family-name:var(--font-mono)] text-[oklch(0.50_0.02_260)] uppercase tracking-widest mb-4">
        Agent Decision Pipeline
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 100 }}>
        {/* Connection lines */}
        {STEPS.slice(0, -1).map((_, i) => {
          const from = nodeCenter(i);
          const to = nodeCenter(i + 1);
          return (
            <line
              key={i}
              x1={from.x + nodeW / 2 - 4}
              y1={from.y}
              x2={to.x - nodeW / 2 + 4}
              y2={to.y}
              stroke={activeStep >= i + 1 ? STEPS[i].color : "oklch(0.25 0.03 260)"}
              strokeWidth={2}
              strokeDasharray={activeStep >= i + 1 ? "none" : "4 4"}
              opacity={activeStep >= i + 1 ? 0.6 : 0.3}
              style={{ transition: "all 0.5s ease" }}
            />
          );
        })}

        {/* Particles */}
        {particles.map((p) => {
          const from = nodeCenter(p.fromIdx);
          const to = nodeCenter(p.fromIdx + 1);
          const lineStartX = from.x + nodeW / 2 - 4;
          const lineEndX = to.x - nodeW / 2 + 4;
          const cx = lineStartX + (lineEndX - lineStartX) * p.progress;
          const cy = from.y + (to.y - from.y) * p.progress;
          return (
            <circle
              key={p.id}
              cx={cx}
              cy={cy}
              r={2.5}
              fill={STEPS[p.fromIdx].color}
              opacity={0.8 - p.progress * 0.5}
            />
          );
        })}

        {/* Nodes */}
        {STEPS.map((step, i) => {
          const x = nodeX(i);
          const y = H / 2 - nodeH / 2;
          const isActive = activeStep >= i;

          return (
            <motion.g
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.12 }}
            >
              <rect
                x={x}
                y={y}
                width={nodeW}
                height={nodeH}
                rx={12}
                fill={isActive ? "oklch(0.18 0.04 260)" : "oklch(0.16 0.03 260)"}
                stroke={isActive ? step.color : "oklch(0.28 0.04 260)"}
                strokeWidth={isActive ? 2 : 1}
                style={{ transition: "all 0.4s ease" }}
              />
              <text
                x={x + nodeW / 2}
                y={y + 22}
                textAnchor="middle"
                fill={isActive ? "white" : "oklch(0.55 0.02 260)"}
                fontSize={11}
                fontWeight={700}
                fontFamily="var(--font-mono)"
                style={{ transition: "fill 0.4s ease" }}
              >
                {step.label}
              </text>
              <text
                x={x + nodeW / 2}
                y={y + 38}
                textAnchor="middle"
                fill={isActive ? "oklch(0.72 0.02 260)" : "oklch(0.42 0.02 260)"}
                fontSize={8}
                fontFamily="var(--font-mono)"
                style={{ transition: "fill 0.4s ease" }}
              >
                {step.sub}
              </text>

              {isActive && (
                <circle
                  cx={x + nodeW / 2}
                  cy={y - 6}
                  r={3}
                  fill={step.color}
                  opacity={0.9}
                >
                  <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
            </motion.g>
          );
        })}

        {/* Arrow heads */}
        {STEPS.slice(0, -1).map((_, i) => {
          const to = nodeCenter(i + 1);
          const arrowX = to.x - nodeW / 2 + 4;
          const arrowY = to.y;
          return (
            <polygon
              key={`arrow-${i}`}
              points={`${arrowX - 6},${arrowY - 4} ${arrowX},${arrowY} ${arrowX - 6},${arrowY + 4}`}
              fill={activeStep >= i + 1 ? STEPS[i].color : "oklch(0.30 0.03 260)"}
              opacity={activeStep >= i + 1 ? 0.8 : 0.3}
              style={{ transition: "all 0.5s ease" }}
            />
          );
        })}
      </svg>
    </div>
  );
}
