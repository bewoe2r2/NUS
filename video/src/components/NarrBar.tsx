import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';

interface NarrBarProps {
  text: string;
  startFrame: number;
  endFrame: number;
  fontSize?: number;
  color?: string;
  y?: number;
}

export const NarrBar: React.FC<NarrBarProps> = ({
  text,
  startFrame,
  endFrame,
  fontSize = 20,
  color = COLORS.accent300,
  y = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < startFrame || frame > endFrame) return null;

  const localFrame = frame - startFrame;
  const entrance = spring({ fps, frame: localFrame, config: SPRING.SNAPPY });
  const fadeOut = interpolate(frame, [endFrame - 20, endFrame], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 60 + y,
        left: 60,
        right: 60,
        display: 'flex',
        justifyContent: 'center',
        opacity: Math.min(entrance * 1.5, 1) * fadeOut,
        transform: `translateY(${(1 - entrance) * 12}px)`,
      }}
    >
      <div
        style={{
          padding: '12px 28px',
          borderRadius: 14,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <span
          style={{
            fontSize,
            color,
            fontWeight: 600,
            fontFamily: FONT.sans,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
