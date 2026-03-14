import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';

type HealthState = 'STABLE' | 'WARNING' | 'CRISIS';

interface DayData {
  day: number;
  month: string;
  state: HealthState;
  confidence: number;
}

interface TimelineStripProps {
  days: DayData[];
  startFrame?: number;
  highlightIndex?: number;
}

const stateColor: Record<HealthState, string> = {
  STABLE: COLORS.success,
  WARNING: COLORS.warning,
  CRISIS: COLORS.error,
};

const stateIcon: Record<HealthState, string> = {
  STABLE: '\u2713',
  WARNING: '\u26A0',
  CRISIS: '!',
};

export const TimelineStrip: React.FC<TimelineStripProps> = ({
  days,
  startFrame = 0,
  highlightIndex,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  // Container entrance
  const containerEntrance = spring({ fps, frame: localFrame, config: SPRING.GENTLE });

  // 3D perspective tilt on the whole strip
  const tiltX = interpolate(containerEntrance, [0, 1], [4, 0]);

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        padding: 20,
        border: `1px solid ${COLORS.neutral200}`,
        fontFamily: FONT.sans,
        perspective: 800,
        opacity: Math.min(containerEntrance * 2, 1),
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.neutral800, marginBottom: 14 }}>
        {'\uD83D\uDCC5'} 14-Day Health Timeline
      </div>
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflow: 'hidden',
          transform: `rotateX(${tiltX}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {days.map((day, i) => {
          // Domino cascade: each pill enters with spring + ~40ms stagger
          // 40ms at 30fps = ~1.2 frames per pill
          const staggerFrames = Math.round((40 / 1000) * fps);
          const pillSpring = spring({
            fps,
            frame: Math.max(0, localFrame - i * staggerFrames),
            config: SPRING.BOUNCY,
          });

          const isHighlighted = highlightIndex === i;
          const color = stateColor[day.state];

          // Pulsing glow ring for selected day
          const pulsePhase = Math.sin((frame * Math.PI * 2) / (fps * 0.8)) * 0.5 + 0.5;
          const glowRadius = isHighlighted ? interpolate(pulsePhase, [0, 1], [4, 10]) : 0;

          const pillScale = interpolate(pillSpring, [0, 1], [0.3, 1]);
          const pillRotateZ = interpolate(pillSpring, [0, 1], [-15, 0]);
          const pillTranslateY = interpolate(pillSpring, [0, 1], [30, 0]);

          return (
            <div
              key={i}
              style={{
                opacity: pillSpring,
                width: 56,
                height: 72,
                borderRadius: 12,
                background: isHighlighted ? color : `${color}18`,
                border: `2px solid ${isHighlighted ? color : 'transparent'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                flexShrink: 0,
                transform: `scale(${isHighlighted ? 1.08 * pillScale : pillScale}) rotateZ(${pillRotateZ}deg) translateY(${pillTranslateY}px)`,
                boxShadow: isHighlighted
                  ? `0 0 ${glowRadius}px ${color}80, 0 0 ${glowRadius * 2}px ${color}40`
                  : 'none',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: isHighlighted ? 'white' : COLORS.neutral500,
                  letterSpacing: 0.5,
                }}
              >
                {day.month}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: isHighlighted ? 'white' : COLORS.neutral900,
                }}
              >
                {day.day}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: isHighlighted ? 'white' : color,
                }}
              >
                {stateIcon[day.state]}
              </div>
              <div
                style={{
                  fontSize: 8,
                  color: isHighlighted ? 'rgba(255,255,255,0.8)' : COLORS.neutral500,
                  fontWeight: 600,
                }}
              >
                {day.confidence}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
