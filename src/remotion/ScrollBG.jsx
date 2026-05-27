import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export function ScrollBG() {
  useCurrentFrame();
  return <AbsoluteFill style={{ background: 'transparent' }} />;
}
