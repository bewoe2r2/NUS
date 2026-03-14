import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';

interface GlowTextProps {
  text: string;
  startFrame?: number;
  fontSize?: number;
  color?: string;
  glowColor?: string;
  glowRadius?: number;
  fontWeight?: number;
  springConfig?: { damping: number; stiffness: number; mass: number };
}

export const GlowText: React.FC<GlowTextProps> = ({
  text,
  startFrame = 0,
  fontSize = 48,
  color = COLORS.textWhite,
  glowColor = COLORS.accent400,
  glowRadius = 30,
  fontWeight = 700,
  springConfig = SPRING.SNAPPY,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const progress = spring({ fps, frame: localFrame, config: springConfig });
  const scale = 0.8 + progress * 0.2;
  const opacity = Math.min(progress * 1.5, 1);

  return (
    <span
      style={{
        fontSize,
        fontWeight,
        fontFamily: FONT.sans,
        color,
        opacity,
        transform: `scale(${scale})`,
        display: 'inline-block',
        filter: `drop-shadow(0 0 ${glowRadius * progress}px ${glowColor}90)`,
      }}
    >
      {text}
    </span>
  );
};

interface KineticTextProps {
  words: string[];
  startFrame?: number;
  stagger?: number;
  fontSize?: number;
  color?: string;
  emphasisIndices?: number[];
  emphasisColor?: string;
  emphasisGlow?: string;
  lineHeight?: number;
  textAlign?: 'left' | 'center' | 'right';
}

export const KineticText: React.FC<KineticTextProps> = ({
  words,
  startFrame = 0,
  stagger = 3,
  fontSize = 48,
  color = COLORS.textWhite,
  emphasisIndices = [],
  emphasisColor = COLORS.accent400,
  emphasisGlow = COLORS.accent400,
  lineHeight = 1.3,
  textAlign = 'center',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: `0 ${fontSize * 0.25}px`,
        justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        lineHeight,
      }}
    >
      {words.map((word, i) => {
        const wordStart = startFrame + i * stagger;
        const localFrame = frame - wordStart;

        if (localFrame < 0) {
          return (
            <span key={i} style={{ fontSize, opacity: 0, display: 'inline-block' }}>
              {word}
            </span>
          );
        }

        const isEmphasis = emphasisIndices.includes(i);
        const sp = spring({
          fps,
          frame: localFrame,
          config: isEmphasis ? SPRING.BOUNCY : SPRING.SNAPPY,
        });

        const wordColor = isEmphasis ? emphasisColor : color;
        const scale = isEmphasis ? 0.6 + sp * 0.4 : 0.85 + sp * 0.15;
        const y = (1 - sp) * 20;

        return (
          <span
            key={i}
            style={{
              fontSize,
              fontWeight: isEmphasis ? 800 : 600,
              fontFamily: FONT.sans,
              color: wordColor,
              opacity: Math.min(sp * 2, 1),
              transform: `scale(${scale}) translateY(${y}px)`,
              display: 'inline-block',
              filter: isEmphasis ? `drop-shadow(0 0 20px ${emphasisGlow}80)` : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
