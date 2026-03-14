import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';
import { GradientBackground } from '../components/GradientBackground';
import { ParticleField } from '../components/ParticleField';
import { KineticText } from '../components/GlowText';
import { GlowText } from '../components/GlowText';

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Counter: "00:00" -> "00:06" over frames 0-90 (each second = 15 frames)
  const counterSeconds = Math.min(Math.floor(frame / 15), 6);
  const counterStr = `00:0${counterSeconds}`;

  const counterOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Counter glow intensifies as it approaches 6
  const counterGlow = interpolate(frame, [0, 90], [10, 40], {
    extrapolateRight: 'clamp',
  });

  // White flash at frame 90
  const flashOpacity = frame >= 90
    ? interpolate(frame, [90, 93, 105], [0, 0.8, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  // Text block fade-out before logo section
  const textBlockOpacity = interpolate(frame, [150, 165], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Logo breathing glow (frames 160+)
  const breathingGlow = frame >= 160
    ? 15 + Math.sin((frame - 160) * 0.15) * 8
    : 0;

  // Logo mark entrance
  const logoEntrance = frame >= 160
    ? spring({ fps, frame: frame - 160, config: SPRING.BOUNCY })
    : 0;

  const logoScale = 0.6 + logoEntrance * 0.4;
  const logoOpacity = Math.min(logoEntrance * 2, 1);

  return (
    <AbsoluteFill style={{ fontFamily: FONT.sans }}>
      <GradientBackground />
      <ParticleField direction="up" />

      {/* Giant counter */}
      {frame < 105 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: counterOpacity * interpolate(frame, [90, 105], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          <div
            style={{
              fontSize: 140,
              fontWeight: 800,
              fontFamily: FONT.mono,
              color: COLORS.accent400,
              filter: `drop-shadow(0 0 ${counterGlow}px ${COLORS.accent400}90)`,
              letterSpacing: -2,
            }}
          >
            {counterStr}
          </div>
        </div>
      )}

      {/* White flash overlay */}
      {flashOpacity > 0 && (
        <AbsoluteFill
          style={{
            background: 'white',
            opacity: flashOpacity,
            zIndex: 5,
          }}
        />
      )}

      {/* Text sequence — staggered reveals */}
      {frame >= 100 && frame < 170 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            padding: '0 120px',
            opacity: textBlockOpacity,
          }}
        >
          <KineticText
            words={['Every', '6', 'minutes,', 'someone', 'in', 'Singapore']}
            startFrame={100}
            fontSize={42}
            stagger={2}
            emphasisIndices={[1]}
            emphasisColor={COLORS.accent400}
          />
          <KineticText
            words={['is', 'rushed', 'to', 'the', 'ER.']}
            startFrame={114}
            fontSize={42}
            stagger={2}
            emphasisIndices={[1, 4]}
          />

          {/* "What if we could see it coming?" */}
          {frame >= 130 && (
            <KineticText
              words={['What', 'if', 'we', 'could', 'see', 'it', 'coming?']}
              startFrame={130}
              fontSize={44}
              stagger={2}
              emphasisIndices={[4, 5, 6]}
              emphasisColor={COLORS.accent400}
            />
          )}
        </div>
      )}

      {/* Bewo intro — fades in as text fades out */}
      {frame >= 160 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              opacity: logoOpacity,
              transform: `scale(${logoScale})`,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: `linear-gradient(135deg, ${COLORS.accent400}, ${COLORS.gradBlue})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                color: 'white',
                fontWeight: 900,
                filter: `drop-shadow(0 0 ${breathingGlow}px ${COLORS.accent400}80)`,
              }}
            >
              B
            </div>
            <GlowText
              text="Bewo"
              startFrame={160}
              fontSize={48}
              glowColor={COLORS.accent400}
              glowRadius={20}
              springConfig={SPRING.BOUNCY}
            />
          </div>
          <KineticText
            words={['AI-powered', 'chronic', 'disease', 'management', 'for', 'Singapore']}
            startFrame={170}
            fontSize={24}
            stagger={3}
            emphasisIndices={[0]}
            emphasisColor={COLORS.accent300}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
