import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { COLORS } from '../styles/colors';

interface GradientBackgroundProps {
  speed?: number;
  intensity?: number;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  speed = 1,
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const t = (frame * speed) / 30;

  const blobs = [
    {
      cx: 50 + Math.sin(t * 0.4) * 25,
      cy: 40 + Math.cos(t * 0.3) * 20,
      color: COLORS.gradPurple,
      size: 600,
      opacity: 0.15 * intensity,
    },
    {
      cx: 60 + Math.cos(t * 0.5) * 30,
      cy: 60 + Math.sin(t * 0.35) * 25,
      color: COLORS.gradBlue,
      size: 500,
      opacity: 0.12 * intensity,
    },
    {
      cx: 35 + Math.sin(t * 0.6 + 2) * 20,
      cy: 50 + Math.cos(t * 0.45 + 1) * 15,
      color: COLORS.gradCyan,
      size: 450,
      opacity: 0.1 * intensity,
    },
  ];

  return (
    <AbsoluteFill style={{ background: COLORS.bgDarker }}>
      {blobs.map((blob, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${blob.cx}%`,
            top: `${blob.cy}%`,
            width: blob.size,
            height: blob.size,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${blob.color} 0%, transparent 70%)`,
            opacity: blob.opacity,
          }}
        />
      ))}
      {/* Subtle top vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.02) 0%, transparent 60%)',
        }}
      />
    </AbsoluteFill>
  );
};
