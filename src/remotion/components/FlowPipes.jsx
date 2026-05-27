import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { C } from '../colors.js';

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const PIPES = [
  { x1: 140, y1: 240, x2: 180, y2: 248 },
  { x1: 212, y1: 248, x2: 260, y2: 240 },
  { x1: 320, y1: 240, x2: 370, y2: 240 },
  { x1: 490, y1: 240, x2: 520, y2: 240 },
  { x1: 590, y1: 240, x2: 630, y2: 240 },
  { x1: 660, y1: 240, x2: 720, y2: 240 },
];

export function FlowPipes({ startFrame }) {
  const frame = useCurrentFrame();
  if (frame < startFrame) return null;

  const progress = interpolate(frame, [startFrame, startFrame + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

  const flow = ((frame - startFrame) * 0.6) % 40;

  return (
    <g>
      <g fill="none" stroke={C.accent} strokeWidth="1.3" opacity={progress * 0.7}>
        {PIPES.map((p, i) => (
          <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />
        ))}
      </g>
      <g fill={C.accent} opacity={progress}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => {
          const x = 140 + ((flow + i * 60) % 600);
          return <circle key={i} cx={x} cy="240" r="1.6" opacity="0.9" />;
        })}
      </g>
    </g>
  );
}
