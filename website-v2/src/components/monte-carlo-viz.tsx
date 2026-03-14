"use client";

import { useRef, useState, useEffect } from "react";
import { useInView } from "framer-motion";

const NUM_PATHS = 30;
const STEPS = 40;
const CRISIS_COLOR = "oklch(0.52 0.16 25)";
const STABLE_COLOR = "oklch(0.52 0.14 160)";
const MEAN_COLOR = "oklch(0.62 0.14 80)";

function generatePath(startY: number): number[] {
  const path = [startY];
  for (let i = 1; i < STEPS; i++) {
    const drift = (Math.random() - 0.48) * 8;
    const prev = path[i - 1];
    path.push(Math.max(2, Math.min(16, prev + drift)));
  }
  return path;
}

export function MonteCarloViz() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [progress, setProgress] = useState(0);
  const [paths] = useState(() =>
    Array.from({ length: NUM_PATHS }, () => generatePath(7.5 + (Math.random() - 0.5) * 2))
  );

  useEffect(() => {
    if (!isInView) return;
    let frame: number;
    const start = performance.now();
    const duration = 2000;
    function animate(now: number) {
      const elapsed = now - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      if (p < 1) frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isInView]);

  const W = 640;
  const H = 200;
  const padX = 40;
  const padY = 20;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;
  const minV = 2;
  const maxV = 16;

  function toX(step: number) { return padX + (step / (STEPS - 1)) * chartW; }
  function toY(v: number) { return padY + (1 - (v - minV) / (maxV - minV)) * chartH; }

  const visibleSteps = Math.floor(progress * STEPS);
  const crisisPaths = paths.filter((p) => p.slice(0, visibleSteps).some((v) => v > 11));
  const crisisPercent = visibleSteps > 0 ? Math.round((crisisPaths.length / NUM_PATHS) * 100) : 0;

  const riskLevel = crisisPercent > 50 ? "CRITICAL" : crisisPercent > 30 ? "HIGH" : crisisPercent > 15 ? "MEDIUM" : "LOW";
  const riskColor = crisisPercent > 30 ? CRISIS_COLOR : crisisPercent > 15 ? MEAN_COLOR : STABLE_COLOR;

  return (
    <div ref={ref} className="bg-[oklch(0.10_0.03_260)] rounded-2xl border border-[oklch(0.22_0.04_260)] p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-[family-name:var(--font-mono)] text-[oklch(0.50_0.02_260)] uppercase tracking-widest">
            Monte Carlo Simulation
          </div>
          <div className="text-white font-bold text-lg font-[family-name:var(--font-mono)] mt-1">
            1,000 Future Trajectories (sample: {NUM_PATHS})
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-[family-name:var(--font-mono)] text-[oklch(0.50_0.02_260)]">Crisis Probability</div>
          <div className="text-2xl font-bold font-[family-name:var(--font-mono)]" style={{ color: riskColor }}>
            {crisisPercent}%
          </div>
          <div className="text-[10px] font-[family-name:var(--font-mono)] mt-0.5" style={{ color: riskColor }}>
            {riskLevel}
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 180 }}>
        <rect x={padX} y={toY(16)} width={chartW} height={toY(11) - toY(16)} fill={CRISIS_COLOR} opacity={0.06} rx={4} />
        <text x={padX + chartW - 4} y={toY(16) + 14} fill={CRISIS_COLOR} fontSize={9} fontFamily="var(--font-mono)" opacity={0.5} textAnchor="end">CRISIS ZONE (&gt;11 mmol/L)</text>
        <rect x={padX} y={toY(7)} width={chartW} height={toY(3.9) - toY(7)} fill={STABLE_COLOR} opacity={0.04} rx={4} />
        <text x={padX + chartW - 4} y={toY(3.9) - 4} fill={STABLE_COLOR} fontSize={9} fontFamily="var(--font-mono)" opacity={0.4} textAnchor="end">TARGET (4-7 mmol/L)</text>

        {[4, 7, 11, 14].map((v) => (
          <g key={v}>
            <line x1={padX} y1={toY(v)} x2={padX + chartW} y2={toY(v)} stroke="oklch(0.22 0.03 260)" strokeDasharray="2 4" />
            <text x={padX - 6} y={toY(v) + 3} fill="oklch(0.40 0.02 260)" fontSize={9} fontFamily="var(--font-mono)" textAnchor="end">{v}</text>
          </g>
        ))}

        <text x={padX} y={H - 2} fill="oklch(0.40 0.02 260)" fontSize={9} fontFamily="var(--font-mono)">Now</text>
        <text x={padX + chartW / 2} y={H - 2} fill="oklch(0.40 0.02 260)" fontSize={9} fontFamily="var(--font-mono)" textAnchor="middle">24h</text>
        <text x={padX + chartW} y={H - 2} fill="oklch(0.40 0.02 260)" fontSize={9} fontFamily="var(--font-mono)" textAnchor="end">48h</text>

        {paths.map((path, pi) => {
          const visible = path.slice(0, visibleSteps);
          if (visible.length < 2) return null;
          const isCrisis = visible.some((v) => v > 11);
          let d = `M ${toX(0)} ${toY(visible[0])}`;
          for (let i = 1; i < visible.length; i++) d += ` L ${toX(i)} ${toY(visible[i])}`;
          return <path key={pi} d={d} fill="none" stroke={isCrisis ? CRISIS_COLOR : STABLE_COLOR} strokeWidth={1} opacity={0.25} strokeLinecap="round" />;
        })}

        {visibleSteps > 1 && (() => {
          const meanPath: number[] = [];
          for (let s = 0; s < visibleSteps; s++) {
            const mean = paths.reduce((sum, p) => sum + p[s], 0) / paths.length;
            meanPath.push(mean);
          }
          let d = `M ${toX(0)} ${toY(meanPath[0])}`;
          for (let i = 1; i < meanPath.length; i++) d += ` L ${toX(i)} ${toY(meanPath[i])}`;
          return <path d={d} fill="none" stroke={MEAN_COLOR} strokeWidth={2.5} strokeLinecap="round" opacity={0.9} />;
        })()}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-5 text-[10px] font-[family-name:var(--font-mono)] text-[oklch(0.50_0.02_260)]">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 rounded-full" style={{ background: STABLE_COLOR }} /> Stable trajectory
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 rounded-full" style={{ background: CRISIS_COLOR }} /> Crisis trajectory
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-[2px] rounded-full" style={{ background: MEAN_COLOR }} /> Mean path
        </span>
        <span className="ml-auto">Risk: LOW &lt;15% | MEDIUM 15-30% | HIGH 30-50% | CRITICAL &gt;50%</span>
      </div>
    </div>
  );
}
