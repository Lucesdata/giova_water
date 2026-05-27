import React from 'react';
import { Composition } from 'remotion';
import { HeroPTAP } from './HeroPTAP.jsx';

export const RemotionRoot = () => {
  return (
    <Composition
      id="PTAPIntro"
      component={HeroPTAP}
      durationInFrames={180}
      fps={30}
      width={800}
      height={440}
    />
  );
};
