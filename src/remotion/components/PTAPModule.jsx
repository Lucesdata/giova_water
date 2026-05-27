import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

const ease = Easing.bezier(0.16, 1, 0.3, 1);

export function PTAPModule({ startFrame, durationFrames = 15, children }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  return <g style={{ opacity }}>{children}</g>;
}
