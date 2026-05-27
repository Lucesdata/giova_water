import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { C } from '../colors.js';

const ease = Easing.bezier(0.16, 1, 0.3, 1);

export function SensorBox({ startFrame, lineX, lineY1, lineY2, x, y, id, label, value, unit }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  return (
    <g opacity={opacity}>
      <line x1={lineX} y1={lineY1} x2={lineX} y2={lineY2} stroke={C.accentLine} strokeDasharray="2 2" />
      <rect x={x} y={y} width="84" height="38" fill={C.bg1} stroke={C.accentLine} />
      <text x={x + 6} y={y + 12} fontFamily={C.fMono} fontSize="8" fill={C.accent}>{id} · {label}</text>
      <text x={x + 6} y={y + 30} fontFamily={C.fMono} fontSize="13" fill={C.ink}>
        {value} <tspan fill={C.ink3} fontSize="8">{unit}</tspan>
      </text>
    </g>
  );
}
