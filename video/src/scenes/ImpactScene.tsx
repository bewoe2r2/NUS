import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';
import { GradientBackground } from '../components/GradientBackground';
import { ParticleField } from '../components/ParticleField';
import { CounterNumber } from '../components/CounterNumber';
import { GlowText } from '../components/GlowText';
import { TypewriterText } from '../components/AnimatedText';
import { SpringText } from '../components/AnimatedText';

interface StatCardProps {
  children: React.ReactNode;
  label: string;
  startFrame: number;
}

const StatCard: React.FC<StatCardProps> = ({ children, label, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const entrance = spring({ fps, frame: localFrame, config: SPRING.SNAPPY });
  const scale = interpolate(entrance, [0, 1], [0.8, 1]);
  const opacity = Math.min(entrance * 2, 1);

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        textAlign: 'center',
        padding: '32px 40px',
        borderRadius: 24,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        flex: 1,
      }}
    >
      <div style={{ marginBottom: 12 }}>{children}</div>
      <div style={{ fontSize: 16, color: COLORS.neutral300, fontWeight: 500, lineHeight: 1.4 }}>
        {label}
      </div>
    </div>
  );
};

export const ImpactScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Impact label entrance
  const labelEntrance = spring({ fps, frame, config: SPRING.SNAPPY });

  // Logo entrance: frames 120-170 (earlier, more breathing room)
  const logoEntrance = frame >= 120
    ? spring({ fps, frame: frame - 120, config: SPRING.BOUNCY })
    : 0;
  const logoScale = 0.6 + logoEntrance * 0.4;
  const logoOpacity = Math.min(logoEntrance * 2, 1);

  // Tagline: frames 160+
  const taglineVisible = frame >= 160;

  // Subtitle: frames 200+
  const subtitleEntrance = frame >= 200
    ? spring({ fps, frame: frame - 200, config: SPRING.SNAPPY })
    : 0;

  // Breathing glow on logo
  const breathingGlow = frame >= 120
    ? 12 + Math.sin((frame - 120) * 0.12) * 6
    : 0;

  return (
    <AbsoluteFill style={{ fontFamily: FONT.sans }}>
      <GradientBackground intensity={0.8} />
      <ParticleField count={40} />

      {/* Content wrapper */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 80,
        }}
      >
        {/* IMPACT label */}
        <div
          style={{
            opacity: Math.min(labelEntrance * 2, 1),
            fontSize: 14,
            fontWeight: 700,
            color: COLORS.accent400,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 48,
          }}
        >
          IMPACT
        </div>

        {/* 3 stat cards */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            width: '100%',
            maxWidth: 1100,
            marginBottom: 60,
          }}
        >
          <StatCard label="saved per patient per year in prevented ER visits" startFrame={10}>
            <CounterNumber
              value={8000}
              prefix="$"
              suffix="-$12K"
              color={COLORS.success}
              fontSize={52}
              startFrame={15}
              duration={50}
            />
          </StatCard>

          <StatCard label="better early detection, zero false alarm increase" startFrame={35}>
            <CounterNumber
              value={5.2}
              suffix="%"
              color={COLORS.accent400}
              fontSize={52}
              decimals={1}
              startFrame={40}
              duration={40}
            />
          </StatCard>

          <StatCard label="nurse-to-patient ratio (from 1:20)" startFrame={60}>
            <GlowText
              text="1:100"
              fontSize={52}
              color={COLORS.warning}
              glowColor={COLORS.warning}
              startFrame={65}
            />
          </StatCard>
        </div>

        {/* Bewo logo */}
        {frame >= 120 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              opacity: logoOpacity,
              transform: `scale(${logoScale})`,
              marginBottom: 24,
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
              fontSize={44}
              glowColor={COLORS.accent400}
              startFrame={120}
              springConfig={SPRING.BOUNCY}
            />
          </div>
        )}

        {/* Tagline */}
        {taglineVisible && (
          <div style={{ marginBottom: 16 }}>
            <TypewriterText
              text="The future of healthcare is predictive."
              startFrame={160}
              fontSize={24}
              color={COLORS.accent400}
              charsPerFrame={0.5}
            />
          </div>
        )}

        {/* Subtitle */}
        {frame >= 200 && (
          <div
            style={{
              opacity: Math.min(subtitleEntrance * 1.5, 1),
              transform: `translateY(${(1 - subtitleEntrance) * 10}px)`,
            }}
          >
            <span style={{ fontSize: 18, color: COLORS.neutral300, fontWeight: 500 }}>
              Built for Singapore's aging population
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
