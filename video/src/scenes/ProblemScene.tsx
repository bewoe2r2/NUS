import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';
import { GradientBackground } from '../components/GradientBackground';
import { CounterNumber } from '../components/CounterNumber';
import { SpringText } from '../components/AnimatedText';

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Stat 1: frames 0-85 (440,000 diabetics) — 2.8s
  const stat1Opacity = interpolate(frame, [0, 12, 72, 85], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Stat 2: frames 85-165 (70% chronic) — 2.7s
  const stat2Opacity = interpolate(frame, [85, 97, 152, 165], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Stat 3: frames 165-225 (30-50% non-compliance) — 2s
  const stat3Opacity = interpolate(frame, [165, 177, 212, 225], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle shake for stat 3
  const shakeX = frame >= 165 && frame <= 225
    ? Math.sin(frame * 0.8) * 2
    : 0;

  // ---- Closing: Record → Predict (frames 210-270, 60 frames = 2s) ----
  const closingStart = 210;
  const closingEntrance = frame >= closingStart
    ? spring({ fps, frame: frame - closingStart, config: SPRING.SNAPPY })
    : 0;

  // "Record" slides in from left
  const recordSlide = frame >= closingStart
    ? interpolate(frame, [closingStart, closingStart + 18], [60, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 60;
  const recordFade = interpolate(frame, [closingStart + 20, closingStart + 40], [0.7, 0.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const recordScale = interpolate(frame, [closingStart + 20, closingStart + 40], [1, 0.85], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Strikethrough on "Record"
  const strikeWidth = interpolate(frame, [closingStart + 25, closingStart + 40], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // "Predict" enters with BOUNCY spring
  const predictEntrance = frame >= closingStart + 18
    ? spring({ fps, frame: frame - (closingStart + 18), config: SPRING.BOUNCY })
    : 0;

  const predictGlow = interpolate(frame, [closingStart + 18, closingStart + 50], [0, 30], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Divider grows
  const dividerHeight = frame >= closingStart + 10
    ? spring({ fps, frame: frame - (closingStart + 10), config: SPRING.SNAPPY })
    : 0;

  // Subtitle
  const subtitleEntrance = frame >= closingStart + 35
    ? spring({ fps, frame: frame - (closingStart + 35), config: SPRING.SNAPPY })
    : 0;

  return (
    <AbsoluteFill style={{ fontFamily: FONT.sans }}>
      <GradientBackground />

      {/* Stat 1: 440,000 diabetics */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: stat1Opacity,
        }}
      >
        <CounterNumber
          value={440000}
          fontSize={130}
          color={COLORS.accent400}
          startFrame={5}
          duration={50}
        />
        <div style={{ marginTop: 16 }}>
          <SpringText
            text="diabetics in Singapore"
            startFrame={10}
            fontSize={28}
            color={COLORS.neutral300}
          />
        </div>
      </div>

      {/* Stat 2: 70% chronic */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: stat2Opacity,
        }}
      >
        <CounterNumber
          value={70}
          fontSize={160}
          suffix="%"
          color={COLORS.warning}
          startFrame={90}
          duration={40}
        />
        <div style={{ marginTop: 16 }}>
          <SpringText
            text="of disease burden is chronic conditions"
            startFrame={95}
            fontSize={28}
            color={COLORS.neutral300}
          />
        </div>
      </div>

      {/* Stat 3: 30-50% non-compliance */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: stat3Opacity,
          transform: `translateX(${shakeX}px)`,
        }}
      >
        <SpringText
          text="30–50%"
          startFrame={170}
          fontSize={130}
          color={COLORS.error}
          fontWeight={800}
        />
        <div style={{ marginTop: 16 }}>
          <SpringText
            text="medication non-compliance among elderly"
            startFrame={175}
            fontSize={28}
            color={COLORS.neutral300}
          />
        </div>
      </div>

      {/* Closing: Record | Predict */}
      {frame >= closingStart && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: closingEntrance,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 50 }}>
            {/* Record — fades and shrinks */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <span
                style={{
                  fontSize: 72,
                  fontWeight: 700,
                  color: COLORS.neutral500,
                  opacity: recordFade,
                  transform: `translateX(${-recordSlide}px) scale(${recordScale})`,
                  display: 'inline-block',
                }}
              >
                Record
              </span>
              <div
                style={{
                  position: 'absolute',
                  top: '52%',
                  left: 0,
                  width: `${strikeWidth}%`,
                  height: 3,
                  background: COLORS.error,
                  borderRadius: 2,
                }}
              />
            </div>

            {/* Divider */}
            <div
              style={{
                width: 2,
                height: 80 * dividerHeight,
                background: `linear-gradient(to bottom, transparent, ${COLORS.accent400}, transparent)`,
                boxShadow: `0 0 15px ${COLORS.accent400}40`,
              }}
            />

            {/* Predict */}
            <span
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: COLORS.accent400,
                opacity: predictEntrance,
                transform: `scale(${0.5 + predictEntrance * 0.5})`,
                display: 'inline-block',
                filter: `drop-shadow(0 0 ${predictGlow}px ${COLORS.accent400}90)`,
                letterSpacing: -1,
              }}
            >
              Predict
            </span>
          </div>

          {/* Subtitle */}
          <div
            style={{
              marginTop: 24,
              opacity: subtitleEntrance,
              transform: `translateY(${(1 - subtitleEntrance) * 12}px)`,
            }}
          >
            <span
              style={{
                fontSize: 22,
                color: COLORS.neutral300,
                fontWeight: 500,
              }}
            >
              Healthcare shouldn't wait for the crisis.
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
