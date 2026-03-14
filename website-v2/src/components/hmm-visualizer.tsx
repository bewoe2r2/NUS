"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const STATES = [
  { id: "stable", label: "STABLE", color: "oklch(0.52 0.14 160)", x: 120, y: 100, desc: "Well-controlled. Target ranges met." },
  { id: "warning", label: "WARNING", color: "oklch(0.62 0.14 80)", x: 340, y: 100, desc: "Early deterioration. Intervention window." },
  { id: "crisis", label: "CRISIS", color: "oklch(0.52 0.16 25)", x: 560, y: 100, desc: "Acute decompensation. Urgent review." },
];

/* Exact transition matrix from hmm_engine.py (4-hour window) */
const TRANSITIONS = [
  { from: 0, to: 0, prob: 0.920, label: "92.0%" },
  { from: 0, to: 1, prob: 0.075, label: "7.5%" },
  { from: 0, to: 2, prob: 0.005, label: "0.5%" },
  { from: 1, to: 0, prob: 0.250, label: "25.0%" },
  { from: 1, to: 1, prob: 0.650, label: "65.0%" },
  { from: 1, to: 2, prob: 0.100, label: "10.0%" },
  { from: 2, to: 0, prob: 0.010, label: "1.0%" },
  { from: 2, to: 1, prob: 0.150, label: "15.0%" },
  { from: 2, to: 2, prob: 0.840, label: "84.0%" },
];

/* 9 clinically-weighted biomarkers from hmm_engine.py */
const BIOMARKERS = [
  { label: "Glucose Avg", weight: 0.25, ref: "ADA 2024" },
  { label: "Med Adherence", weight: 0.18, ref: "UKPDS" },
  { label: "Glucose Variability", weight: 0.10, ref: "Danne 2017" },
  { label: "Sleep Quality", weight: 0.10, ref: "DiaBeatIt" },
  { label: "Social Engagement", weight: 0.10, ref: "Lancet 2020" },
  { label: "Steps Daily", weight: 0.08, ref: "WHO / Lancet 2022" },
  { label: "HRV RMSSD", weight: 0.07, ref: "ARIC Study" },
  { label: "Carb Intake", weight: 0.07, ref: "ADA" },
  { label: "Resting HR", weight: 0.05, ref: "Clinical" },
];

export function HMMVisualizer() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [activeState, setActiveState] = useState(0);
  const [particles, setParticles] = useState<{ id: number; from: number; to: number; progress: number }[]>([]);

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => setActiveState((s) => (s + 1) % 3), 3000);
    return () => clearInterval(interval);
  }, [isInView]);

  useEffect(() => {
    if (!isInView) return;
    let id = 0;
    const interval = setInterval(() => {
      setParticles((prev) => {
        const next = prev.map((p) => ({ ...p, progress: p.progress + 0.025 })).filter((p) => p.progress < 1);
        if (next.length < 5) {
          const crossTransitions = TRANSITIONS.filter((t) => t.from !== t.to && t.prob > 0.01);
          const t = crossTransitions[Math.floor(Math.random() * crossTransitions.length)];
          next.push({ id: id++, from: t.from, to: t.to, progress: 0 });
        }
        return next;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isInView]);

  const W = 680;
  const H = 200;
  const R = 40;

  const activeTransitions = TRANSITIONS.filter((t) => t.from === activeState && t.from !== t.to);

  return (
    <div ref={ref} className="bg-[oklch(0.10_0.03_260)] rounded-2xl border border-[oklch(0.22_0.04_260)] p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-xs font-[family-name:var(--font-mono)] text-[oklch(0.50_0.02_260)] uppercase tracking-widest">
            Hidden Markov Model — 3 Clinical States
          </div>
          <div className="text-white font-bold text-lg font-[family-name:var(--font-mono)] mt-1">
            {STATES[activeState].label} — {STATES[activeState].desc}
          </div>
        </div>
        <div className="text-xs font-[family-name:var(--font-mono)] text-[oklch(0.45_0.02_260)]">
          4-hour observation window
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 160 }}>
        <defs>
          {STATES.map((s) => (
            <radialGradient key={s.id} id={`glow-${s.id}`}>
              <stop offset="0%" stopColor={s.color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>

        {/* Transition arrows */}
        {TRANSITIONS.filter((t) => t.from !== t.to && t.prob > 0.01).map((t, i) => {
          const from = STATES[t.from];
          const to = STATES[t.to];
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const nx = dx / dist;
          const ny = dy / dist;
          const offset = t.from < t.to ? -12 : 12;
          const x1 = from.x + nx * (R + 4);
          const y1 = from.y + ny * (R + 4) + offset;
          const x2 = to.x - nx * (R + 4);
          const y2 = to.y - ny * (R + 4) + offset;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2 + offset * 0.8;
          const isHighlighted = t.from === activeState;

          return (
            <g key={i}>
              <path
                d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
                fill="none"
                stroke={isHighlighted ? STATES[t.from].color : "oklch(0.30 0.03 260)"}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeDasharray={isHighlighted ? "none" : "4 4"}
                opacity={isHighlighted ? 0.8 : 0.3}
                style={{ transition: "all 0.5s ease" }}
              />
              <circle cx={x2} cy={y2} r={3} fill={isHighlighted ? STATES[t.from].color : "oklch(0.30 0.03 260)"} opacity={isHighlighted ? 0.8 : 0.3} />
              <text x={midX} y={midY - 4} textAnchor="middle" fill={isHighlighted ? "white" : "oklch(0.45 0.02 260)"} fontSize={9} fontFamily="var(--font-mono)" fontWeight={isHighlighted ? 700 : 400} style={{ transition: "all 0.5s ease" }}>
                {t.label}
              </text>
            </g>
          );
        })}

        {/* Particles */}
        {particles.map((p) => {
          const from = STATES[p.from];
          const to = STATES[p.to];
          const offset = p.from < p.to ? -12 : 12;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const nx = dx / dist;
          const ny = dy / dist;
          const x1 = from.x + nx * (R + 4);
          const y1 = from.y + ny * (R + 4) + offset;
          const x2 = to.x - nx * (R + 4);
          const y2 = to.y - ny * (R + 4) + offset;
          const t = p.progress;
          const cx = x1 + (x2 - x1) * t;
          const cy = y1 + (y2 - y1) * t + offset * 0.8 * Math.sin(Math.PI * t);
          return <circle key={p.id} cx={cx} cy={cy} r={2.5} fill={STATES[p.from].color} opacity={0.8 - p.progress * 0.5} />;
        })}

        {/* State nodes */}
        {STATES.map((state, i) => {
          const isActive = activeState === i;
          return (
            <g key={state.id} onClick={() => setActiveState(i)} style={{ cursor: "pointer" }}>
              {isActive && (
                <circle cx={state.x} cy={state.y} r={R + 12} fill={`url(#glow-${state.id})`}>
                  <animate attributeName="r" values={`${R + 10};${R + 18};${R + 10}`} dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={state.x} cy={state.y} r={R} fill={isActive ? `${state.color}30` : "oklch(0.16 0.03 260)"} stroke={state.color} strokeWidth={isActive ? 3 : 1.5} style={{ transition: "all 0.4s ease" }} />
              <text x={state.x} y={state.y + 1} textAnchor="middle" dominantBaseline="middle" fill={isActive ? "white" : "oklch(0.65 0.02 260)"} fontSize={13} fontWeight={700} fontFamily="var(--font-mono)" style={{ transition: "fill 0.4s" }}>
                {state.label}
              </text>
              <text x={state.x} y={state.y + R + 18} textAnchor="middle" fill="oklch(0.45 0.02 260)" fontSize={9} fontFamily="var(--font-mono)">
                self: {TRANSITIONS.find((t) => t.from === i && t.to === i)?.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Active transitions */}
      <div className="mt-3 flex items-center gap-4 text-xs font-[family-name:var(--font-mono)]">
        <span className="text-[oklch(0.50_0.02_260)]">From {STATES[activeState].label}:</span>
        {activeTransitions.map((t) => (
          <span key={`${t.from}-${t.to}`} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: STATES[t.to].color }} />
            <span style={{ color: STATES[t.to].color }}>{STATES[t.to].label} {t.label}</span>
          </span>
        ))}
      </div>

      {/* 9 Biomarker weights */}
      <div className="mt-6 border-t border-[oklch(0.22_0.03_260)] pt-4">
        <div className="text-xs font-[family-name:var(--font-mono)] text-[oklch(0.50_0.02_260)] uppercase tracking-widest mb-3">
          9 Clinically-Weighted Input Features
        </div>
        <div className="space-y-1.5">
          {BIOMARKERS.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="text-xs text-[oklch(0.70_0.01_260)] w-[130px] shrink-0 truncate">{b.label}</span>
              <div className="flex-1 h-2.5 bg-[oklch(0.18_0.03_260)] rounded overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${b.weight * 400}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded"
                  style={{ background: `oklch(0.45 0.12 185 / ${0.4 + b.weight * 2})` }}
                />
              </div>
              <span className="text-[10px] font-[family-name:var(--font-mono)] text-[oklch(0.65_0.01_260)] w-[28px] text-right font-semibold">
                {(b.weight * 100).toFixed(0)}%
              </span>
              <span className="text-[9px] text-[oklch(0.40_0.01_260)] w-[60px] truncate">{b.ref}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
