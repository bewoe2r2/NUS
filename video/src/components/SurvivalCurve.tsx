import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';

interface SurvivalCurveProps {
  startFrame?: number;
  riskPercent?: number;
}

export const SurvivalCurve: React.FC<SurvivalCurveProps> = ({
  startFrame = 0,
  riskPercent = 34,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const entrance = spring({ fps, frame: localFrame, config: SPRING.GENTLE });
  const opacity = Math.min(entrance * 2, 1);

  const chartWidth = 400;
  const chartHeight = 140;

  // Monte Carlo survival curve - probability of crisis over 48h
  const dataPoints = [
    0, 2, 5, 8, 12, 16, 20, 24, 27, 30, 32, 33, riskPercent,
  ];

  // Spring-controlled draw progress
  const drawProgress = spring({
    fps,
    frame: Math.max(0, localFrame - 10),
    config: SPRING.GENTLE,
  });

  const visiblePoints = Math.ceil(drawProgress * dataPoints.length);

  // Build path for main line
  const buildPath = (points: number[], maxPoints: number): string => {
    return points
      .slice(0, maxPoints)
      .map((v, i) => {
        const px = 40 + (i / (points.length - 1)) * (chartWidth - 60);
        const py = chartHeight - 20 - (v / 100) * (chartHeight - 40);
        return `${i === 0 ? 'M' : 'L'}${px},${py}`;
      })
      .join(' ');
  };

  const pathD = buildPath(dataPoints, visiblePoints);

  // Trail glow: a blurred duplicate 8 frames behind
  const trailProgress = spring({
    fps,
    frame: Math.max(0, localFrame - 18), // 8 frames behind the main (10 + 8)
    config: SPRING.GENTLE,
  });
  const trailVisiblePoints = Math.ceil(trailProgress * dataPoints.length);
  const trailPathD = buildPath(dataPoints, trailVisiblePoints);

  const lastX = visiblePoints > 0
    ? 40 + ((visiblePoints - 1) / (dataPoints.length - 1)) * (chartWidth - 60)
    : 40;
  const areaD = visiblePoints > 0
    ? `${pathD} L${lastX},${chartHeight - 20} L40,${chartHeight - 20} Z`
    : '';

  // Risk badge pulsing glow when risk > 30%
  const isHighRisk = riskPercent > 30;
  const pulsePhase = Math.sin((frame * Math.PI * 2) / (fps * 0.6)) * 0.5 + 0.5;
  const badgeGlow = isHighRisk ? interpolate(pulsePhase, [0, 1], [4, 14]) : 0;

  const badgeBg = riskPercent > 50 ? COLORS.errorLight : riskPercent > 25 ? COLORS.warningLight : COLORS.successLight;
  const badgeColor = riskPercent > 50 ? COLORS.error : riskPercent > 25 ? COLORS.warning : COLORS.success;

  return (
    <div
      style={{
        opacity,
        transform: `scale(${interpolate(entrance, [0, 1], [0.95, 1])})`,
        background: 'white',
        borderRadius: 16,
        padding: 16,
        border: `1px solid ${COLORS.neutral200}`,
        fontFamily: FONT.sans,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.neutral800 }}>
          Monte Carlo Forecast (48h)
        </div>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: 12,
            background: badgeBg,
            fontSize: 14,
            fontWeight: 800,
            color: badgeColor,
            boxShadow: isHighRisk
              ? `0 0 ${badgeGlow}px ${badgeColor}60, 0 0 ${badgeGlow * 2}px ${badgeColor}30`
              : 'none',
          }}
        >
          {riskPercent}%
        </div>
      </div>

      <svg width={chartWidth} height={chartHeight}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((v) => {
          const gridY = chartHeight - 20 - (v / 100) * (chartHeight - 40);
          return (
            <g key={v}>
              <line
                x1={40}
                y1={gridY}
                x2={chartWidth - 20}
                y2={gridY}
                stroke={COLORS.neutral200}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <text x={2} y={gridY + 4} fontSize={9} fill={COLORS.neutral500}>
                {v}%
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {['0h', '12h', '24h', '36h', '48h'].map((label, i) => {
          const labelX = 40 + (i / 4) * (chartWidth - 60);
          return (
            <text key={label} x={labelX} y={chartHeight - 4} fontSize={9} fill={COLORS.neutral500} textAnchor="middle">
              {label}
            </text>
          );
        })}

        {/* Area fill */}
        <defs>
          <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.error} stopOpacity={0.3} />
            <stop offset="100%" stopColor={COLORS.error} stopOpacity={0.02} />
          </linearGradient>
          <filter id="trailBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
        </defs>

        {areaD && <path d={areaD} fill="url(#riskGrad)" />}

        {/* Trail glow line (blurred duplicate trailing behind) */}
        {trailPathD && (
          <path
            d={trailPathD}
            fill="none"
            stroke={COLORS.error}
            strokeWidth={4}
            filter="url(#trailBlur)"
            opacity={0.4}
          />
        )}

        {/* Main line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={COLORS.error}
            strokeWidth={2.5}
          />
        )}
      </svg>
    </div>
  );
};
