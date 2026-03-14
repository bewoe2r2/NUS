import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from '../styles/colors';

interface PhoneFrameProps {
  children: React.ReactNode;
  startFrame?: number;
  x?: number;
  y?: number;
  scale?: number;
  scrollY?: number;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  startFrame = 0,
  x = 960,
  y = 540,
  scale = 1,
  scrollY = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const entrance = spring({ fps, frame: localFrame, config: SPRING.DRAMATIC });

  const rotateY = interpolate(entrance, [0, 1], [-12, 0]);
  const rotateX = interpolate(entrance, [0, 1], [5, 0]);
  const translateY = interpolate(entrance, [0, 1], [200, 0]);
  const opacity = Math.min(entrance * 2, 1);

  const phoneWidth = 375;
  const phoneHeight = 812;

  return (
    <div
      style={{
        position: 'absolute',
        left: x - (phoneWidth * scale) / 2,
        top: y - (phoneHeight * scale) / 2,
        width: phoneWidth,
        height: phoneHeight,
        perspective: 1200,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${scale}) rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateY(${translateY}px)`,
          opacity,
          borderRadius: 44,
          border: '3px solid rgba(255,255,255,0.15)',
          background: COLORS.neutral50,
          overflow: 'hidden',
          boxShadow: `0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Status bar */}
        <div
          style={{
            height: 48,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.neutral900,
            fontFamily: FONT.sans,
            borderBottom: `1px solid ${COLORS.neutral200}`,
          }}
        >
          9:41
        </div>
        {/* Content with parallax scrolling */}
        <div
          style={{
            height: phoneHeight - 48 - 34,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              transform: `translateY(${-scrollY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {children}
          </div>
        </div>
        {/* Home indicator */}
        <div
          style={{
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 134,
              height: 5,
              borderRadius: 3,
              background: COLORS.neutral300,
            }}
          />
        </div>
      </div>
    </div>
  );
};
