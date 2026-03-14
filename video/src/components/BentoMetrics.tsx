import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';

interface BentoMetricsProps {
  startFrame?: number;
  glucose?: number;
  steps?: number;
  heartRate?: number;
}

export const BentoMetrics: React.FC<BentoMetricsProps> = ({
  startFrame = 0,
  glucose = 5.8,
  steps = 6432,
  heartRate = 72,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  // Staggered entrance springs for each card
  const glucoseEntrance = spring({ fps, frame: localFrame, config: SPRING.BOUNCY });
  const stepsEntrance = spring({ fps, frame: Math.max(0, localFrame - 6), config: SPRING.BOUNCY });
  const hrEntrance = spring({ fps, frame: Math.max(0, localFrame - 12), config: SPRING.BOUNCY });

  const glucoseColor = glucose < 4 ? COLORS.error : glucose > 10 ? COLORS.error : glucose > 7.8 ? COLORS.warning : COLORS.success;

  // Simple glucose chart points
  const chartPoints = [5.2, 5.5, 6.1, 5.8, 5.4, 5.9, 6.3, 5.8, 5.6, 5.3, 5.7, glucose];
  const chartWidth = 310;
  const chartHeight = 40;
  const minV = 4;
  const maxV = 8;

  const pathD = chartPoints
    .map((v, i) => {
      const x = (i / (chartPoints.length - 1)) * chartWidth;
      const y = chartHeight - ((v - minV) / (maxV - minV)) * chartHeight;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  const areaD = `${pathD} L${chartWidth},${chartHeight} L0,${chartHeight} Z`;

  // SVG draw-on effect: strokeDasharray / strokeDashoffset
  const totalPathLength = 400; // approximate
  const drawOnProgress = spring({ fps, frame: Math.max(0, localFrame - 8), config: SPRING.GENTLE });
  const dashOffset = totalPathLength * (1 - drawOnProgress);

  // Step progress bar spring
  const stepBarProgress = spring({ fps, frame: Math.max(0, localFrame - 10), config: SPRING.SNAPPY });
  const stepPercent = Math.min((steps / 10000) * 100, 100);

  // Heart rate bar heights with individual stagger
  const hrBars = [16, 24, 20, 28, 18];

  return (
    <div style={{ opacity: Math.min(glucoseEntrance * 2, 1), fontFamily: FONT.sans }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.neutral800, marginBottom: 10 }}>
        Overview
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Glucose Card - Full Width */}
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            padding: 16,
            border: `1px solid ${COLORS.neutral200}`,
            opacity: Math.min(glucoseEntrance * 2, 1),
            transform: `translateY(${(1 - glucoseEntrance) * 30}px) scale(${interpolate(glucoseEntrance, [0, 1], [0.95, 1])})`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 10, color: COLORS.neutral500, fontWeight: 600, letterSpacing: 0.5 }}>GLUCOSE</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: glucoseColor }}>{glucose.toFixed(1)}</span>
                <span style={{ fontSize: 12, color: COLORS.neutral500 }}>mmol/L</span>
              </div>
            </div>
            <div style={{ fontSize: 20, opacity: 0.3 }}>{'\uD83D\uDCC8'}</div>
          </div>
          {/* Mini Chart with draw-on effect */}
          <svg width={chartWidth} height={chartHeight} style={{ marginTop: 8 }}>
            <defs>
              <linearGradient id="glucoseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={glucoseColor} stopOpacity={0.3 * drawOnProgress} />
                <stop offset="100%" stopColor={glucoseColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#glucoseGrad)" opacity={drawOnProgress} />
            <path
              d={pathD}
              fill="none"
              stroke={glucoseColor}
              strokeWidth={2}
              strokeDasharray={totalPathLength}
              strokeDashoffset={dashOffset}
            />
          </svg>
        </div>

        {/* Steps + Heart Rate Row */}
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Steps */}
          <div
            style={{
              flex: 1,
              background: 'white',
              borderRadius: 16,
              padding: 14,
              border: `1px solid ${COLORS.neutral200}`,
              opacity: Math.min(stepsEntrance * 2, 1),
              transform: `translateY(${(1 - stepsEntrance) * 30}px) scale(${interpolate(stepsEntrance, [0, 1], [0.95, 1])})`,
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>{'\uD83D\uDC5F'}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.neutral900 }}>
              {steps.toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: COLORS.neutral500, fontWeight: 600, letterSpacing: 0.5 }}>STEPS</div>
            {/* Animated progress bar */}
            <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: COLORS.neutral100 }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: 2,
                  background: COLORS.accent500,
                  width: `${stepPercent * stepBarProgress}%`,
                }}
              />
            </div>
          </div>

          {/* Heart Rate */}
          <div
            style={{
              flex: 1,
              background: 'white',
              borderRadius: 16,
              padding: 14,
              border: `1px solid ${COLORS.neutral200}`,
              opacity: Math.min(hrEntrance * 2, 1),
              transform: `translateY(${(1 - hrEntrance) * 30}px) scale(${interpolate(hrEntrance, [0, 1], [0.95, 1])})`,
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>{'\u2764\uFE0F'}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.neutral900 }}>{heartRate}</span>
              <span style={{ fontSize: 10, color: COLORS.neutral500 }}>BPM</span>
            </div>
            {/* HR bars with staggered spring heights */}
            <div style={{ display: 'flex', gap: 3, marginTop: 8, alignItems: 'flex-end' }}>
              {hrBars.map((h, i) => {
                const barSpring = spring({
                  fps,
                  frame: Math.max(0, localFrame - 14 - i * 3),
                  config: SPRING.SNAPPY,
                });
                return (
                  <div
                    key={i}
                    style={{
                      width: 6,
                      height: h * barSpring,
                      borderRadius: 3,
                      background: i < 3 ? COLORS.error : COLORS.neutral200,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
