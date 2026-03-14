import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';
import { GradientBackground } from '../components/GradientBackground';
import { KineticText } from '../components/GlowText';
import { ActionCard } from '../components/ActionCard';
import { EnergyLine } from '../components/EnergyLine';
import { NarrBar } from '../components/NarrBar';

const CARDS = [
  {
    icon: '\uD83D\uDCC5',
    title: 'Auto-Book Appointment',
    description: 'Books polyclinic appointment when HMM detects WARNING state',
    color: '#06b6d4',
    startFrame: 50,
    position: 'top-left' as const,
  },
  {
    icon: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC66',
    title: 'Alert Caregiver',
    description: 'Notifies family with context-rich health summary',
    color: '#f59e0b',
    startFrame: 100,
    position: 'top-right' as const,
  },
  {
    icon: '\uD83D\uDC69\u200D\u2695\uFE0F',
    title: 'Escalate to Nurse',
    description: 'Gemini generates SBAR clinical report with full context',
    color: '#f43f5e',
    startFrame: 150,
    position: 'bottom-left' as const,
  },
  {
    icon: '\uD83C\uDF81',
    title: 'Award Voucher',
    description: 'Loss-aversion vouchers: $5/week maintained through healthy behavior',
    color: '#10b981',
    startFrame: 200,
    position: 'bottom-right' as const,
  },
];

const POSITIONS: Record<string, { top?: number; bottom?: number; left?: number; right?: number }> = {
  'top-left': { top: 160, left: 80 },
  'top-right': { top: 160, right: 80 },
  'bottom-left': { bottom: 140, left: 80 },
  'bottom-right': { bottom: 140, right: 80 },
};

const CX = 960;
const CY = 540;

const CARD_CENTERS: Record<string, { x: number; y: number }> = {
  'top-left': { x: 270, y: 220 },
  'top-right': { x: 1650, y: 220 },
  'bottom-left': { x: 270, y: 860 },
  'bottom-right': { x: 1650, y: 860 },
};

export const AgenticScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hubEntrance = spring({ fps, frame: Math.max(0, frame - 5), config: SPRING.BOUNCY });

  const rings = [0, 1, 2].map((i) => {
    const ringFrame = frame - 10 - i * 8;
    const ringScale = ringFrame > 0 ? 1 + ringFrame * (0.02 + i * 0.008) : 0;
    const ringOpacity = ringFrame > 0
      ? interpolate(ringScale, [1, 2.5], [0.5, 0], { extrapolateRight: 'clamp' })
      : 0;
    return { scale: ringScale, opacity: ringOpacity };
  });

  return (
    <AbsoluteFill style={{ fontFamily: FONT.sans }}>
      <GradientBackground intensity={1.2} />

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 50,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: COLORS.accent400,
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          AUTONOMOUS ACTIONS
        </div>
        <KineticText
          words={['It', "doesn't", 'just', 'watch.']}
          startFrame={0}
          fontSize={36}
          stagger={4}
        />
        <KineticText
          words={['It', 'acts.']}
          startFrame={20}
          fontSize={36}
          stagger={4}
          emphasisIndices={[1]}
          emphasisColor={COLORS.accent400}
        />
      </div>

      {/* Center pulsing neural hub */}
      <div
        style={{
          position: 'absolute',
          left: CX - 40,
          top: CY - 40,
          width: 80,
          height: 80,
          zIndex: 10,
        }}
      >
        {rings.map((ring, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: `2px solid ${COLORS.accent400}`,
              opacity: ring.opacity,
              transform: `translate(-50%, -50%) scale(${ring.scale})`,
              pointerEvents: 'none',
            }}
          />
        ))}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${COLORS.accent400}, ${COLORS.gradBlue})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            boxShadow: `0 0 40px ${COLORS.accent500}60`,
            opacity: hubEntrance,
            transform: `scale(${0.5 + hubEntrance * 0.5})`,
          }}
        >
          {'\uD83E\uDD16'}
        </div>
      </div>

      {/* Energy lines */}
      {CARDS.map((card, i) => {
        const target = CARD_CENTERS[card.position];
        return (
          <EnergyLine
            key={i}
            x1={CX}
            y1={CY}
            x2={target.x}
            y2={target.y}
            color={card.color}
            startFrame={card.startFrame}
            pulseFrame={card.startFrame + 15}
          />
        );
      })}

      {/* Action cards */}
      {CARDS.map((card, i) => {
        const pos = POSITIONS[card.position];
        return (
          <div key={i} style={{ position: 'absolute', ...pos, width: 380 }}>
            <ActionCard
              icon={card.icon}
              title={card.title}
              description={card.description}
              startFrame={card.startFrame}
              color={card.color}
            />
          </div>
        );
      })}

      {/* Narrating text */}
      <NarrBar
        text="Gemini generates clinical reports. SeaLion translates to Singlish for elderly patients."
        startFrame={240}
        endFrame={310}
      />
      <NarrBar
        text="Merlion time-series forecasting predicts risk 48 hours before crisis"
        startFrame={320}
        endFrame={415}
      />
    </AbsoluteFill>
  );
};
