import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { HeroPTAP } from './HeroPTAP.jsx';

const RemotionRoot = () => {
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

registerRoot(RemotionRoot);
