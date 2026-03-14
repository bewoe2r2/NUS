import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { FONT } from '../styles/colors';

interface CounterNumberProps {
  value: number;
  startFrame?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  fontSize?: number;
  color?: string;
  decimals?: number;
  fontWeight?: number;
  separator?: boolean;
}

export const CounterNumber: React.FC<CounterNumberProps> = ({
  value,
  startFrame = 0,
  duration = 40,
  prefix = '',
  suffix = '',
  fontSize = 120,
  color = '#ffffff',
  decimals = 0,
  fontWeight = 800,
  separator = true,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  // Ease-out cubic for satisfying deceleration
  const progress = interpolate(localFrame, [0, duration], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const eased = 1 - Math.pow(1 - progress, 3);

  const current = eased * value;
  const formatted = separator
    ? current.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    : current.toFixed(decimals);

  // Glow intensifies as number approaches final value
  const glowIntensity = interpolate(localFrame, [0, duration], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <span
      style={{
        fontSize,
        fontWeight,
        fontFamily: FONT.sans,
        color,
        opacity,
        letterSpacing: -3,
        filter: `drop-shadow(0 0 ${20 * glowIntensity}px ${color}60)`,
        display: 'inline-block',
      }}
    >
      {prefix}{formatted}{suffix}
    </span>
  );
};
