import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C } from '../colors.js';

const HUBS = [{ x: 280, y: 180 }, { x: 380, y: 240 }];
const PERIPHERALS = [
  { x: 160, y: 120 },
  { x: 500, y: 120 },
  { x: 140, y: 300 },
  { x: 520, y: 300 },
];
const NODES = [...HUBS, ...PERIPHERALS];
const EDGES = [
  [HUBS[0], HUBS[1]],
  [HUBS[0], PERIPHERALS[0]],
  [HUBS[0], PERIPHERALS[2]],
  [HUBS[1], PERIPHERALS[1]],
  [HUBS[1], PERIPHERALS[3]],
  [PERIPHERALS[0], PERIPHERALS[1]],
];

export function DigitalCardVideo({ color, id }) {
  const frame = useCurrentFrame();
  const lf = frame % 90;

  const counter = String((lf * 3) % 999).padStart(3, '0');

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <svg width="640" height="400" viewBox="0 0 640 400">
        {EDGES.map(([a, b], i) => (
          <line key={i}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={C.accentLine} strokeWidth={1}
            strokeDasharray="8 4"
            strokeDashoffset={(lf * 2 + i * 15) % 60}
          />
        ))}

        {NODES.map((n, i) => {
          const baseR = i < 2 ? 14 : 8;
          const r = baseR + 3 * Math.sin(lf * 0.12 + i * 0.8);
          return (
            <circle key={i} cx={n.x} cy={n.y} r={r} fill={color} opacity={0.85} />
          );
        })}

        <text x={628} y={20} fontFamily={C.fMono} fontSize={20} fill={C.accent}
          textAnchor="end">{counter}</text>
        <text x={628} y={32} fontFamily={C.fMono} fontSize={8} fill={C.ink3}
          textAnchor="end">NODES ACTIVE</text>

        <text x={12} y={20} fontFamily={C.fMono} fontSize={9} fill={C.ink3}>{id}</text>
      </svg>
    </AbsoluteFill>
  );
}
