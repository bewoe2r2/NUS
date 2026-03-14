import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';
import { GradientBackground } from '../components/GradientBackground';
import { ParticleField } from '../components/ParticleField';
import { PhoneFrame } from '../components/PhoneFrame';
import { InsightCard } from '../components/InsightCard';
import { VoucherCard } from '../components/VoucherCard';
import { BentoMetrics } from '../components/BentoMetrics';
import { SpringText } from '../components/AnimatedText';
import { TypewriterText } from '../components/AnimatedText';
import { NarrBar } from '../components/NarrBar';

const FEATURES = [
  {
    icon: '\uD83E\uDDE0',
    title: '9 Health Signals',
    desc: 'Glucose, meds, sleep, activity, HRV, diet, social, screen, gait',
    startFrame: 60,
  },
  {
    icon: '\uD83D\uDDE3\uFE0F',
    title: 'Singlish Nudges',
    desc: 'Culturally-appropriate messages your uncle actually listens to',
    startFrame: 120,
  },
  {
    icon: '\uD83D\uDCB0',
    title: 'Loss-Aversion Voucher',
    desc: '$5/week maintained through consistent healthy habits',
    startFrame: 180,
  },
  {
    icon: '\uD83D\uDCCA',
    title: 'Pattern Learning',
    desc: 'Detects personal food-to-glucose correlations over weeks',
    startFrame: 240,
  },
];

export const PatientDemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // State transition at frame 220
  const isWarning = frame > 220;

  // Section label entrance
  const labelEntrance = spring({ fps, frame, config: SPRING.SNAPPY });

  // Singlish bubble entrance
  const singlishEntrance = frame >= 270
    ? spring({ fps, frame: frame - 270, config: SPRING.SNAPPY })
    : 0;

  return (
    <AbsoluteFill style={{ fontFamily: FONT.sans }}>
      <GradientBackground intensity={0.7} />
      <ParticleField count={30} />

      {/* Left side: Section label */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 80,
          opacity: Math.min(labelEntrance * 2, 1),
          transform: `translateY(${(1 - labelEntrance) * 20}px)`,
          maxWidth: 300,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: COLORS.accent400,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          PATIENT EXPERIENCE
        </div>
        <SpringText
          text="Your AI Health Companion"
          startFrame={5}
          fontSize={36}
          fontWeight={700}
        />
      </div>

      {/* Center: PhoneFrame — no scroll */}
      <PhoneFrame startFrame={15} x={500} y={540} scale={0.82} scrollY={0}>
        {/* App header bar */}
        <div
          style={{
            height: 48,
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            borderBottom: `1px solid ${COLORS.neutral200}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                background: `linear-gradient(135deg, ${COLORS.accent400}, ${COLORS.gradBlue})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: 'white',
                fontWeight: 900,
              }}
            >
              B
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.neutral900 }}>Bewo</span>
          </div>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: COLORS.accent100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.accent600,
            }}
          >
            T
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <InsightCard
            state={isWarning ? 'WARNING' : 'STABLE'}
            greeting={isWarning ? 'Heads up, Uncle Tan' : 'Good morning, Uncle Tan!'}
            message={
              isWarning
                ? 'Glucose trend rising. Skip the teh tarik today, ok?'
                : 'Sugar pattern steady this week — keep it up lah!'
            }
            riskPercent={isWarning ? 38 : 12}
            trend={isWarning ? 'Rising' : 'Improving'}
            startFrame={30}
          />

          <VoucherCard value={4.0} streak={5} startFrame={60} />

          <BentoMetrics
            startFrame={90}
            glucose={isWarning ? 8.2 : 5.8}
            steps={6432}
            heartRate={72}
          />
        </div>
      </PhoneFrame>

      {/* Right side: Feature callouts — spread vertically across full height */}
      <div
        style={{
          position: 'absolute',
          right: 60,
          top: 120,
          bottom: 120,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          maxWidth: 440,
        }}
      >
        {FEATURES.map((item, i) => {
          const featureEntrance = frame >= item.startFrame
            ? spring({ fps, frame: frame - item.startFrame, config: SPRING.SNAPPY })
            : 0;

          return (
            <div
              key={i}
              style={{
                opacity: Math.min(featureEntrance * 2, 1),
                transform: `translateX(${(1 - featureEntrance) * 40}px)`,
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.textWhite, marginBottom: 4 }}>
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: COLORS.neutral300,
                    lineHeight: 1.5,
                  }}
                >
                  {item.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom: Singlish message bubble */}
      {frame >= 270 && (
        <div
          style={{
            position: 'absolute',
            bottom: 70,
            left: 280,
            maxWidth: 420,
            opacity: Math.min(singlishEntrance * 1.5, 1),
            transform: `translateY(${(1 - singlishEntrance) * 15}px) scale(${0.95 + singlishEntrance * 0.05})`,
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 20,
              padding: '16px 24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: COLORS.accent500,
                fontWeight: 700,
                marginBottom: 6,
                letterSpacing: 0.5,
              }}
            >
              AI MESSAGE
            </div>
            <div style={{ fontSize: 15, color: COLORS.neutral900, lineHeight: 1.5 }}>
              <TypewriterText
                text="Uncle, sugar dropping fast! Eat bread or juice now can, ok?"
                startFrame={270}
                fontSize={15}
                color={COLORS.neutral900}
                charsPerFrame={0.7}
              />
            </div>
          </div>
        </div>
      )}

      {/* Narrating text */}
      <NarrBar
        text="Hidden Markov Model classifies patient state in real time from vitals"
        startFrame={5}
        endFrame={55}
        fontSize={18}
      />
      <NarrBar
        text="State transitions trigger personalized interventions automatically"
        startFrame={150}
        endFrame={220}
        fontSize={18}
      />
    </AbsoluteFill>
  );
};
