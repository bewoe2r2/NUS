import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { BewoVideo } from './Video';
import { FPS, TOTAL_FRAMES } from './styles/colors';

const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="BewoVideo"
      component={BewoVideo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={3840}
      height={2160}
      defaultProps={{}}
    />
  );
};

registerRoot(RemotionRoot);
