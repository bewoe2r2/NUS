import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';

interface PieChartProps {
  startFrame?: number;
  stable?: number;
  warning?: number;
  crisis?: number;
}

export const PieChart: React.FC<PieChartProps> = ({
  startFrame = 0,
  stable = 72,
  warning = 20,
  crisis = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const entrance = spring({ fps, frame: localFrame, config: SPRING.GENTLE });
  const opacity = Math.min(entrance * 2, 1);

  // Spring-based draw progress with overshoot (BOUNCY)
  const drawProgress = spring({ fps, frame: Math.max(0, localFrame - 5), config: SPRING.BOUNCY });

  // Subtle rotation during draw: -10deg to 0
  const chartRotation = interpolate(drawProgress, [0, 1], [-10, 0]);

  // Center text fades in after segments are mostly drawn
  const centerTextOpacity = spring({ fps, frame: Math.max(0, localFrame - 20), config: SPRING.GENTLE });

  const total = stable + warning + crisis;
  const segments = [
    { value: stable, color: COLORS.success, label: 'STABLE' },
    { value: warning, color: COLORS.warning, label: 'WARNING' },
    { value: crisis, color: COLORS.error, label: 'CRISIS' },
  ];

  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 45;
  const innerRadius = 28;

  let cumulativeAngle = -90;

  const arcs = segments.map((seg) => {
    const angle = (seg.value / total) * 360 * drawProgress;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    const endAngle = cumulativeAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const ix1 = cx + innerRadius * Math.cos(endRad);
    const iy1 = cy + innerRadius * Math.sin(endRad);
    const ix2 = cx + innerRadius * Math.cos(startRad);
    const iy2 = cy + innerRadius * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;

    const d = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');

    return { ...seg, d };
  });

  return (
    <div
      style={{
        opacity,
        background: 'white',
        borderRadius: 16,
        padding: 16,
        border: `1px solid ${COLORS.neutral200}`,
        fontFamily: FONT.sans,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transform: `scale(${interpolate(entrance, [0, 1], [0.9, 1])})`,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.neutral800, marginBottom: 8, alignSelf: 'flex-start' }}>
        Current State
      </div>

      <svg
        width={size}
        height={size}
        style={{ transform: `rotate(${chartRotation}deg)` }}
      >
        {arcs.map((arc, i) => (
          <path key={i} d={arc.d} fill={arc.color} />
        ))}
        {/* Center text with delayed fade-in */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize={14}
          fontWeight={800}
          fill={COLORS.neutral900}
          opacity={centerTextOpacity}
          style={{ transform: `rotate(${-chartRotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
        >
          {stable}%
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fontSize={8}
          fill={COLORS.neutral500}
          fontWeight={600}
          opacity={centerTextOpacity}
          style={{ transform: `rotate(${-chartRotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
        >
          STABLE
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: seg.color }} />
            <span style={{ fontSize: 9, color: COLORS.neutral500, fontWeight: 600 }}>
              {seg.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
