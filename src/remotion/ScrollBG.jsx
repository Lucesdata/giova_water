import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AboutScene } from './scenes/AboutScene.jsx';
import { ProjectsScene } from './scenes/ProjectsScene.jsx';
import { DigitalTwinsScene } from './scenes/DigitalTwinsScene.jsx';
import { ContactScene } from './scenes/ContactScene.jsx';

export function ScrollBG() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: 'transparent' }}>
      <svg
        width="100%" height="100%"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <AboutScene frame={frame} />
        <ProjectsScene frame={frame} />
        <DigitalTwinsScene frame={frame} />
        <ContactScene frame={frame} />
      </svg>
    </AbsoluteFill>
  );
}
