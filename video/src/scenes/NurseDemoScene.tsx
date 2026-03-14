import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';
import { GradientBackground } from '../components/GradientBackground';
import { TimelineStrip } from '../components/TimelineStrip';
import { PieChart } from '../components/PieChart';
import { HeatmapGrid } from '../components/HeatmapGrid';
import { SurvivalCurve } from '../components/SurvivalCurve';
import { NarrBar } from '../components/NarrBar';

const TIMELINE_DATA = [
  { day: 1, month: 'JAN', state: 'STABLE' as const, confidence: 92 },
  { day: 2, month: 'JAN', state: 'STABLE' as const, confidence: 88 },
  { day: 3, month: 'JAN', state: 'STABLE' as const, confidence: 85 },
  { day: 4, month: 'JAN', state: 'STABLE' as const, confidence: 90 },
  { day: 5, month: 'JAN', state: 'STABLE' as const, confidence: 78 },
  { day: 6, month: 'JAN', state: 'WARNING' as const, confidence: 65 },
  { day: 7, month: 'JAN', state: 'WARNING' as const, confidence: 71 },
  { day: 8, month: 'JAN', state: 'STABLE' as const, confidence: 82 },
  { day: 9, month: 'JAN', state: 'STABLE' as const, confidence: 86 },
  { day: 10, month: 'JAN', state: 'WARNING' as const, confidence: 62 },
  { day: 11, month: 'JAN', state: 'WARNING' as const, confidence: 58 },
  { day: 12, month: 'JAN', state: 'CRISIS' as const, confidence: 74 },
  { day: 13, month: 'JAN', state: 'WARNING' as const, confidence: 68 },
  { day: 14, month: 'JAN', state: 'STABLE' as const, confidence: 80 },
];

export const NurseDemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Zoom-out: scale 2.5 -> 1 over first 40 frames
  const zoomSpring = spring({ fps, frame, config: SPRING.GENTLE });
  const zoomScale = interpolate(zoomSpring, [0, 1], [2.5, 1]);

  // Title entrance
  const titleEntrance = spring({ fps, frame, config: SPRING.SNAPPY });

  // Timeline highlight sweeps across
  const highlightIndex = Math.min(
    Math.floor(
      interpolate(frame, [30, 120], [0, 13], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    ),
    13
  );

  // Analytics row
  const analyticsOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Ratio caption
  const ratioEntrance = frame >= 255
    ? spring({ fps, frame: frame - 255, config: SPRING.SNAPPY })
    : 0;

  return (
    <AbsoluteFill style={{ fontFamily: FONT.sans }}>
      <GradientBackground />

      {/* Zoomable content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${zoomScale})`,
          transformOrigin: 'center center',
          padding: '40px 60px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: Math.min(titleEntrance * 2, 1),
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: COLORS.accent400,
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              NURSE DASHBOARD
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.textWhite }}>
                Tan Ah Kow
              </div>
              <div
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: COLORS.neutral700,
                  fontSize: 12,
                  color: COLORS.neutral300,
                  fontWeight: 600,
                }}
              >
                ID: P-0042 | Age 67 | Type 2 Diabetes
              </div>
              <div
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: COLORS.success,
                  fontSize: 12,
                  color: 'white',
                  fontWeight: 700,
                }}
              >
                STABLE
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <TimelineStrip
          days={TIMELINE_DATA}
          startFrame={30}
          highlightIndex={highlightIndex}
        />

        {/* Analytics */}
        <div
          style={{
            opacity: analyticsOpacity,
            display: 'flex',
            gap: 16,
            marginTop: 16,
            width: '100%',
          }}
        >
          <div style={{ flex: 1 }}>
            <PieChart startFrame={60} stable={72} warning={20} crisis={8} />
          </div>
          <div style={{ flex: 1 }}>
            <HeatmapGrid startFrame={80} />
          </div>
          <div style={{ flex: 2 }}>
            <SurvivalCurve startFrame={100} riskPercent={34} />
          </div>
        </div>
      </div>

      {/* Narrating text sequence */}
      <NarrBar
        text="Behind the scenes, nurses see everything."
        startFrame={5}
        endFrame={60}
        fontSize={22}
        color={COLORS.textWhite}
      />
      <NarrBar
        text="14-day HMM state timeline, classified by our Hidden Markov Model"
        startFrame={65}
        endFrame={130}
      />
      <NarrBar
        text="Risk distribution, vital heatmaps, and survival projections in real time"
        startFrame={135}
        endFrame={200}
      />
      <NarrBar
        text="SBAR clinical reports generated automatically for every patient"
        startFrame={205}
        endFrame={250}
      />

      {/* Ratio caption */}
      {frame >= 255 && (
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 60,
            right: 60,
            display: 'flex',
            justifyContent: 'center',
            opacity: Math.min(ratioEntrance * 1.5, 1),
            transform: `translateY(${(1 - ratioEntrance) * 15}px)`,
          }}
        >
          <div
            style={{
              padding: '16px 40px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ fontSize: 24, color: COLORS.textWhite, fontWeight: 700 }}>
              One nurse. One hundred patients.{' '}
            </span>
            <span style={{ fontSize: 24, fontWeight: 700 }}>
              <span style={{ color: COLORS.neutral500 }}>1:20</span>
              {' → '}
              <span style={{ color: COLORS.accent400, filter: `drop-shadow(0 0 12px ${COLORS.accent400}80)` }}>
                1:100
              </span>
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
