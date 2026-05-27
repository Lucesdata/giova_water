import React from 'react';
import { Composition } from 'remotion';
import { AguaCardVideo } from './AguaCardVideo.jsx';
import { DigitalCardVideo } from './DigitalCardVideo.jsx';

export function RootCards() {
  return (
    <>
      <Composition
        id="AguaCardVideo"
        component={AguaCardVideo}
        durationInFrames={90}
        fps={30}
        width={640}
        height={400}
        defaultProps={{ color: '#1e3a5f', id: 'P-001' }}
      />
      <Composition
        id="DigitalCardVideo"
        component={DigitalCardVideo}
        durationInFrames={90}
        fps={30}
        width={640}
        height={400}
        defaultProps={{ color: '#3a2660', id: 'P-003' }}
      />
    </>
  );
}
