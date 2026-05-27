import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C } from '../colors.js';

const PIPES = [120, 200, 280];

export function AguaCardVideo({ color, id }) {
  const frame = useCurrentFrame();
  const lf = frame % 90;

  const particles = Array.from({ length: 12 }, (_, i) => ({
    cx: (lf * 5 + i * 53) % 640,
    cy: PIPES[Math.floor(i / 4)],
    opacity: 0.5 + 0.4 * Math.sin(lf * 0.1 + i),
  }));

  const sensors = [
    { label: 'CAUDAL', value: (38 + 8 * Math.sin(lf * 0.07)).toFixed(1), unit: 'L/s', y: 308 },
    { label: 'PRESIÓN', value: (3.2 + 0.4 * Math.sin(lf * 0.07 + 2)).toFixed(2), unit: 'bar', y: 324 },
    { label: 'TURBIDEZ', value: (0.85 + 0.35 * Math.sin(lf * 0.07 + 4)).toFixed(2), unit: 'NTU', y: 340 },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <svg width="640" height="400" viewBox="0 0 640 400">
        <defs>
          <pattern id="agua-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={C.lineHi} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="640" height="400" fill="url(#agua-grid)" opacity={0.15} />

        {PIPES.map((y, i) => (
          <line key={i} x1={0} y1={y} x2={640} y2={y}
            stroke={C.lineHi} strokeWidth={1.5} />
        ))}

        {particles.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={3} fill={color} opacity={p.opacity} />
        ))}

        {sensors.map((s, i) => (
          <text key={i} x={480} y={s.y}
            fontFamily={C.fMono} fontSize={9} fill={C.ink1} textAnchor="start">
            {`${s.label}  ${s.value} ${s.unit}`}
          </text>
        ))}

        <text x={12} y={20} fontFamily={C.fMono} fontSize={9} fill={C.ink3}>{id}</text>
      </svg>
    </AbsoluteFill>
  );
}
