import React from 'react';
import { interpolate } from 'remotion';
import { C } from '../colors.js';

const START = 120;
const END = 239;
const CURVE = 'M 200,650 L 380,520 L 560,440 L 740,470 L 920,380 L 1100,300 L 1280,310';
const CURVE_LEN = 1210;

function interp(frame, f0, f1, v0, v1) {
  return interpolate(frame, [f0, f1], [v0, v1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

const MARKERS = [
  { x: 380,  y: 520, label: 'PTAP LLANO GRANDE' },
  { x: 740,  y: 470, label: 'RED URBANA'         },
  { x: 1100, y: 300, label: 'GEMELO EAAB'         },
];

export function ProjectsScene({ frame }) {
  if (frame < START || frame > END) return null;

  const lf = frame - START;
  const sceneOpacity = interpolate(
    frame, [START, START + 8, END - 8, END], [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const axisXLen       = interp(lf, 0, 28, 0, 1080);
  const axisYLen       = interp(lf, 5, 28, 0, 600);
  const curveDashOffset = interp(lf, 28, 90, CURVE_LEN, 0);
  const markerOpacity  = interp(lf, 88, 100, 0, 1);

  return (
    <g opacity={sceneOpacity} fontFamily={C.fMono}>
      <line x1="200" y1="750" x2={200 + axisXLen} y2="750"
        stroke={C.lineHi} strokeWidth="1.5" />
      <line x1="200" y1="750" x2="200" y2={750 - axisYLen}
        stroke={C.lineHi} strokeWidth="1.5" />
      <text x="740" y="790"  fontSize="10" fill={C.ink3} textAnchor="middle">TIEMPO (años)</text>
      <text x="158" y="450" fontSize="10" fill={C.ink3} textAnchor="middle"
        transform="rotate(-90 158 450)">CAUDAL (L/s)</text>
      <path d={CURVE}
        fill="none" stroke={C.accent} strokeWidth="2"
        strokeDasharray={CURVE_LEN} strokeDashoffset={curveDashOffset}
        strokeLinecap="round"
      />
      <g opacity={markerOpacity}>
        {MARKERS.map(m => (
          <g key={m.label}>
            <circle cx={m.x} cy={m.y} r="6"
              fill={C.bg2} stroke={C.accent} strokeWidth="1.5" />
            <text x={m.x} y={m.y - 14} fontSize="9" fill={C.ink1} textAnchor="middle">
              {m.label}
            </text>
          </g>
        ))}
      </g>
    </g>
  );
}
