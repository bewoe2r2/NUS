import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';

interface VoucherCardProps {
  value: number;
  streak: number;
  startFrame?: number;
}

export const VoucherCard: React.FC<VoucherCardProps> = ({
  value,
  streak,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const entrance = spring({ fps, frame: localFrame, config: SPRING.SNAPPY });

  const opacity = Math.min(entrance * 2, 1);
  const slideX = interpolate(entrance, [0, 1], [-60, 0]);
  const scaleVal = interpolate(entrance, [0, 1], [0.9, 1]);

  // Counter animation: spring-driven value count-up
  const counterProgress = spring({ fps, frame: Math.max(0, localFrame - 6), config: SPRING.BOUNCY });
  const displayValue = value * counterProgress;

  // Shimmer gradient position driven by frame
  const shimmerX = interpolate(localFrame, [0, 60], [-100, 200], {
    extrapolateRight: 'clamp',
  });

  const valueColor = value >= 4 ? COLORS.success : value >= 2 ? COLORS.warning : COLORS.error;

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${slideX}px) scale(${scaleVal})`,
        background: 'white',
        borderRadius: 20,
        padding: 18,
        border: `1px solid ${COLORS.neutral200}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: FONT.sans,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
      }}
    >
      {/* Shimmer overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(105deg, transparent ${shimmerX - 40}%, rgba(255,255,255,0.6) ${shimmerX}%, transparent ${shimmerX + 40}%)`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Decorative circle */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: COLORS.accent50,
          opacity: 0.5,
        }}
      />

      <div style={{ zIndex: 1 }}>
        <div style={{ fontSize: 11, color: COLORS.neutral500, fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>
          WEEKLY REWARD
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, color: valueColor }}>
          ${displayValue.toFixed(2)}
        </div>
        <div style={{ fontSize: 12, color: COLORS.neutral500, marginTop: 2 }}>
          Keep it up to redeem Sunday!
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, zIndex: 3 }}>
        <div
          style={{
            padding: '4px 12px',
            borderRadius: 20,
            background: COLORS.warningLight,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {'\uD83D\uDD25'} {streak} Day Streak
        </div>
        <div
          style={{
            padding: '6px 16px',
            borderRadius: 20,
            background: COLORS.accent500,
            color: 'white',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          Redeem
        </div>
      </div>
    </div>
  );
};
