import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';

interface HeatmapGridProps {
  startFrame?: number;
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({ startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const containerEntrance = spring({ fps, frame: localFrame, config: SPRING.GENTLE });

  // Transition matrix values (rows = from, cols = to)
  const matrix = [
    [0.85, 0.12, 0.03],
    [0.25, 0.60, 0.15],
    [0.10, 0.30, 0.60],
  ];

  const labels = ['STABLE', 'WARNING', 'CRISIS'];
  const stateColors = [COLORS.success, COLORS.warning, COLORS.error];

  return (
    <div
      style={{
        opacity: Math.min(containerEntrance * 2, 1),
        transform: `scale(${interpolate(containerEntrance, [0, 1], [0.95, 1])})`,
        background: 'white',
        borderRadius: 16,
        padding: 16,
        border: `1px solid ${COLORS.neutral200}`,
        fontFamily: FONT.sans,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.neutral800, marginBottom: 12 }}>
        Transition Dynamics
      </div>

      {/* Column headers */}
      <div style={{ display: 'flex', gap: 4, marginLeft: 60, marginBottom: 4 }}>
        {labels.map((label, i) => (
          <div
            key={i}
            style={{
              width: 70,
              textAlign: 'center',
              fontSize: 8,
              fontWeight: 700,
              color: stateColors[i],
              letterSpacing: 0.5,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Rows */}
      {matrix.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
          <div
            style={{
              width: 56,
              fontSize: 8,
              fontWeight: 700,
              color: stateColors[i],
              textAlign: 'right',
              letterSpacing: 0.5,
            }}
          >
            {labels[i]}
          </div>
          {row.map((val, j) => {
            // Diagonal wave: delay based on i + j (top-left to bottom-right)
            const waveDiagonal = i + j;
            const waveDelay = waveDiagonal * 4;

            const cellSpring = spring({
              fps,
              frame: Math.max(0, localFrame - waveDelay),
              config: SPRING.BOUNCY,
            });

            const cellScale = interpolate(cellSpring, [0, 1], [0.4, 1]);
            const isHighValue = val > 0.5;

            // Glow on cells with high values (>50%)
            const pulsePhase = Math.sin((frame * Math.PI * 2) / fps) * 0.5 + 0.5;
            const glowAmount = isHighValue ? interpolate(pulsePhase, [0, 1], [4, 10]) : 0;

            return (
              <div
                key={j}
                style={{
                  opacity: cellSpring,
                  transform: `scale(${cellScale})`,
                  width: 70,
                  height: 36,
                  borderRadius: 8,
                  background: `${stateColors[j]}${Math.round(val * 255).toString(16).padStart(2, '0')}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: val > 0.4 ? 'white' : COLORS.neutral700,
                  boxShadow: isHighValue
                    ? `0 0 ${glowAmount}px ${stateColors[j]}60`
                    : 'none',
                }}
              >
                {(val * 100).toFixed(0)}%
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
