import React from 'react';
import { Sequence } from 'remotion';
import { SCENES } from './styles/colors';
import { HookScene } from './scenes/HookScene';
import { ProblemScene } from './scenes/ProblemScene';
import { PatientDemoScene } from './scenes/PatientDemoScene';
import { NurseDemoScene } from './scenes/NurseDemoScene';
import { AgenticScene } from './scenes/AgenticScene';
import { ImpactScene } from './scenes/ImpactScene';

export const BewoVideo: React.FC = () => {
  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        transform: 'scale(2)',
        transformOrigin: 'top left',
      }}
    >
      <Sequence from={SCENES.hook.start} durationInFrames={SCENES.hook.duration}>
        <HookScene />
      </Sequence>

      <Sequence from={SCENES.problem.start} durationInFrames={SCENES.problem.duration}>
        <ProblemScene />
      </Sequence>

      <Sequence from={SCENES.patientDemo.start} durationInFrames={SCENES.patientDemo.duration}>
        <PatientDemoScene />
      </Sequence>

      <Sequence from={SCENES.nurseDemo.start} durationInFrames={SCENES.nurseDemo.duration}>
        <NurseDemoScene />
      </Sequence>

      <Sequence from={SCENES.agentic.start} durationInFrames={SCENES.agentic.duration}>
        <AgenticScene />
      </Sequence>

      <Sequence from={SCENES.impact.start} durationInFrames={SCENES.impact.duration}>
        <ImpactScene />
      </Sequence>
    </div>
  );
};
