import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';

interface TypewriterTextProps {
  text: string;
  startFrame?: number;
  fontSize?: number;
  color?: string;
  charsPerFrame?: number;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  startFrame = 0,
  fontSize = 24,
  color = COLORS.textWhite,
  charsPerFrame = 0.8,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const charsToShow = Math.min(Math.floor(localFrame * charsPerFrame), text.length);

  return (
    <span style={{ fontSize, color, fontFamily: FONT.mono, fontWeight: 500 }}>
      {text.slice(0, charsToShow)}
      {charsToShow < text.length && (
        <span style={{ opacity: frame % 16 < 8 ? 1 : 0, color: COLORS.accent400 }}>|</span>
      )}
    </span>
  );
};

interface SpringTextProps {
  text: string;
  startFrame?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
}

export const SpringText: React.FC<SpringTextProps> = ({
  text,
  startFrame = 0,
  fontSize = 48,
  color = COLORS.textWhite,
  fontWeight = 600,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const sp = spring({ fps, frame: localFrame, config: SPRING.SNAPPY });

  return (
    <span
      style={{
        fontSize,
        fontWeight,
        color,
        fontFamily: FONT.sans,
        opacity: Math.min(sp * 1.5, 1),
        transform: `translateY(${(1 - sp) * 30}px) scale(${0.9 + sp * 0.1})`,
        display: 'inline-block',
      }}
    >
      {text}
    </span>
  );
};
