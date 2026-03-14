import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';

interface ActionCardProps {
  icon: string;
  title: string;
  description: string;
  startFrame?: number;
  color?: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  description,
  startFrame = 0,
  color = COLORS.accent500,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const entrance = spring({ fps, frame: localFrame, config: SPRING.DRAMATIC });

  // 3D entrance: rotateY from 25deg to 0
  const rotateY = interpolate(entrance, [0, 1], [25, 0]);
  const translateX = interpolate(entrance, [0, 1], [80, 0]);
  const scaleVal = interpolate(entrance, [0, 1], [0.85, 1]);
  const opacity = Math.min(entrance * 2, 1);

  // Glow halo behind card
  const glowPulse = Math.sin((frame * Math.PI * 2) / (fps * 1.2)) * 0.5 + 0.5;
  const haloSize = interpolate(glowPulse, [0, 1], [20, 35]);

  return (
    <div
      style={{
        perspective: 1000,
        position: 'relative',
      }}
    >
      {/* Glow halo behind card */}
      <div
        style={{
          position: 'absolute',
          top: -10,
          left: -10,
          right: -10,
          bottom: -10,
          borderRadius: 26,
          background: `radial-gradient(ellipse at center, ${color}25 0%, transparent 70%)`,
          filter: `blur(${haloSize}px)`,
          opacity: entrance,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          opacity,
          transform: `rotateY(${rotateY}deg) translateX(${translateX}px) scale(${scaleVal})`,
          transformStyle: 'preserve-3d',
          background: 'white',
          borderRadius: 16,
          padding: 20,
          border: `1px solid ${COLORS.neutral200}`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontFamily: FONT.sans,
          boxShadow: `0 8px 32px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.05)`,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.neutral900 }}>{title}</div>
          <div style={{ fontSize: 12, color: COLORS.neutral500, marginTop: 2, lineHeight: 1.4 }}>
            {description}
          </div>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
            boxShadow: `0 0 12px ${color}80, 0 0 4px ${color}`,
          }}
        />
      </div>
    </div>
  );
};
