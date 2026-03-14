import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';

type HealthState = 'STABLE' | 'WARNING' | 'CRISIS';

interface InsightCardProps {
  state: HealthState;
  message: string;
  greeting: string;
  startFrame?: number;
  riskPercent?: number;
  trend?: string;
}

const STATE_CONFIG: Record<HealthState, { bg: string; bgLight: string; icon: string; badgeColor: string; glowColor: string }> = {
  STABLE: {
    bg: COLORS.success,
    bgLight: COLORS.successLight,
    icon: '\u2713',
    badgeColor: COLORS.successDark,
    glowColor: COLORS.success,
  },
  WARNING: {
    bg: COLORS.warning,
    bgLight: COLORS.warningLight,
    icon: '\u26A0',
    badgeColor: COLORS.warningDark,
    glowColor: COLORS.warning,
  },
  CRISIS: {
    bg: COLORS.error,
    bgLight: COLORS.errorLight,
    icon: '\uD83D\uDEA8',
    badgeColor: COLORS.errorDark,
    glowColor: COLORS.error,
  },
};

export const InsightCard: React.FC<InsightCardProps> = ({
  state,
  message,
  greeting,
  startFrame = 0,
  riskPercent = 12,
  trend = 'Improving',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const config = STATE_CONFIG[state];

  const entrance = spring({ fps, frame: localFrame, config: SPRING.BOUNCY });

  const opacity = Math.min(entrance * 2, 1);
  const slideY = interpolate(entrance, [0, 1], [40, 0]);
  const scaleVal = interpolate(entrance, [0, 1], [0.92, 1]);

  // Pulsing glow based on frame — subtle sine wave
  const pulsePhase = Math.sin((frame * Math.PI * 2) / fps) * 0.5 + 0.5;
  const glowIntensity = interpolate(pulsePhase, [0, 1], [10, 25]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${slideY}px) scale(${scaleVal})`,
        background: `linear-gradient(135deg, ${config.bgLight}, white)`,
        borderRadius: 20,
        padding: 20,
        border: `1px solid ${config.bg}55`,
        fontFamily: FONT.sans,
        filter: `drop-shadow(0 0 ${glowIntensity}px ${config.glowColor}60)`,
        boxShadow: `0 0 ${glowIntensity}px ${config.glowColor}30, 0 8px 32px rgba(0,0,0,0.08)`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: config.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          {config.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.neutral900 }}>
            {greeting}
          </div>
        </div>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: 20,
            background: config.bg,
            color: 'white',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          {state}
        </div>
      </div>

      {/* Message */}
      <div style={{ fontSize: 14, color: COLORS.neutral700, lineHeight: 1.5, marginBottom: 14 }}>
        {message}
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { label: 'Risk', value: `${riskPercent}%` },
          { label: 'Trend (48h)', value: trend },
          { label: 'Volatility', value: 'Low' },
        ].map((metric, i) => {
          const metricDelay = 8 + i * 4;
          const metricSpring = spring({ fps, frame: Math.max(0, localFrame - metricDelay), config: SPRING.SNAPPY });

          return (
            <div
              key={i}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.7)',
                textAlign: 'center',
                opacity: metricSpring,
                transform: `translateY(${(1 - metricSpring) * 12}px)`,
              }}
            >
              <div style={{ fontSize: 10, color: COLORS.neutral500, fontWeight: 600, letterSpacing: 0.5 }}>
                {metric.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.neutral900, marginTop: 2 }}>
                {metric.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
