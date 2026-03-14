import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface EnergyLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  startFrame?: number;
  pulseFrame?: number;
  width?: number;
  height?: number;
}

export const EnergyLine: React.FC<EnergyLineProps> = ({
  x1, y1, x2, y2,
  color = '#06b6d4',
  startFrame = 0,
  pulseFrame,
  width = 1920,
  height = 1080,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  // Line draws on
  const drawProgress = interpolate(localFrame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const dashOffset = lineLength * (1 - drawProgress);

  // Energy pulse traveling along the line
  const hasPulse = pulseFrame !== undefined && frame >= pulseFrame;
  const pulseProgress = hasPulse
    ? interpolate(frame - pulseFrame!, [0, 20], [0, 1], { extrapolateRight: 'clamp' })
    : 0;

  const pulseX = x1 + (x2 - x1) * pulseProgress;
  const pulseY = y1 + (y2 - y1) * pulseProgress;

  const opacity = interpolate(localFrame, [0, 10], [0, 0.6], {
    extrapolateRight: 'clamp',
  });

  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      {/* Main dashed line */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={2}
        strokeDasharray="8,6"
        strokeDashoffset={dashOffset}
        opacity={opacity}
      />
      {/* Glow duplicate */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={6}
        strokeDasharray="8,6"
        strokeDashoffset={dashOffset}
        opacity={opacity * 0.3}
        filter="blur(4px)"
      />
      {/* Energy pulse dot */}
      {hasPulse && pulseProgress < 1 && (
        <>
          <circle cx={pulseX} cy={pulseY} r={6} fill={color} opacity={0.9} />
          <circle cx={pulseX} cy={pulseY} r={14} fill={color} opacity={0.3} filter="blur(4px)" />
        </>
      )}
    </svg>
  );
};
