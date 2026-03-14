import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { COLORS } from '../styles/colors';

interface Particle {
  x: number;
  baseY: number;
  speed: number;
  size: number;
  opacity: number;
  delay: number;
}

interface ParticleFieldProps {
  count?: number;
  color?: string;
  direction?: 'up' | 'down';
}

export const ParticleField: React.FC<ParticleFieldProps> = ({
  count = 50,
  color = COLORS.accent400,
  direction = 'up',
}) => {
  const frame = useCurrentFrame();

  // Deterministic pseudo-random using seed
  const particles = useMemo<Particle[]>(() => {
    const pts: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const seed = i * 7919 + 13;
      const rand = (n: number) => ((Math.sin(seed * n) + 1) / 2);
      pts.push({
        x: rand(1) * 100,
        baseY: rand(2) * 120 - 10,
        speed: 0.3 + rand(3) * 0.7,
        size: 1 + rand(4) * 3,
        opacity: 0.1 + rand(5) * 0.5,
        delay: rand(6) * 200,
      });
    }
    return pts;
  }, [count]);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {particles.map((p, i) => {
        const localFrame = frame - p.delay;
        if (localFrame < 0) return null;

        const drift = direction === 'up' ? -p.speed * localFrame * 0.5 : p.speed * localFrame * 0.5;
        const y = ((p.baseY + drift) % 130 + 130) % 130 - 10;

        const fadeIn = interpolate(localFrame, [0, 30], [0, 1], {
          extrapolateRight: 'clamp',
        });

        // Gentle horizontal sway
        const sway = Math.sin(localFrame * 0.03 + i) * 1.5;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x + sway}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: color,
              opacity: p.opacity * fadeIn,
              boxShadow: `0 0 ${p.size * 3}px ${color}80`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
