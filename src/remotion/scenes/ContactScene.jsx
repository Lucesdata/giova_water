import React from 'react';
import { interpolate } from 'remotion';
import { C } from '../colors.js';

const START = 360;
const END = 479;
const CX = 720;
const CY = 430;
const GPS = 'LAT: 4.6097° N  ·  LON: 74.0817° W';
const RADII = [70, 145, 220, 295, 370];

function interp(frame, f0, f1, v0, v1) {
  return interpolate(frame, [f0, f1], [v0, v1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

export function ContactScene({ frame }) {
  if (frame < START || frame > END) return null;

  const lf = frame - START;
  const sceneOpacity = interpolate(
    frame, [START, START + 8, END - 8, END], [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const gpsWidth   = interp(lf, 40, 78, 0, 380);
  const pulseBase  = lf > 80 ? 0.4 + 0.3 * Math.sin((lf - 80) * 0.3) : 0;

  return (
    <g opacity={sceneOpacity}>
      {RADII.map((maxR, i) => {
        const r = interp(lf, i * 8, i * 8 + 38, 0, maxR);
        const ringOp = i >= 3 ? pulseBase : interp(lf, i * 8, i * 8 + 38, 0.7, 0.3);
        return (
          <circle key={i} cx={CX} cy={CY} r={r}
            fill="none" stroke={C.accentLine}
            strokeWidth={i === 0 ? 1.5 : 1}
            opacity={ringOp}
          />
        );
      })}
      <circle cx={CX} cy={CY} r="5" fill={C.accent} />
      <clipPath id="gps-reveal">
        <rect x={CX - gpsWidth / 2} y={CY + 58} width={gpsWidth} height={28} />
      </clipPath>
      <text x={CX} y={CY + 78}
        fontFamily={C.fMono} fontSize="12" fill={C.ink1} textAnchor="middle"
        clipPath="url(#gps-reveal)"
      >
        {GPS}
      </text>
    </g>
  );
}
