import React from 'react';
import { interpolate } from 'remotion';
import { C } from '../colors.js';

const START = 240;
const END = 359;

function interp(frame, f0, f1, v0, v1) {
  return interpolate(frame, [f0, f1], [v0, v1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

const PHYS = [
  { x: 200, label: 'CAPTACIÓN'   },
  { x: 420, label: 'TRATAMIENTO' },
  { x: 640, label: 'RESERVA'     },
];
const DIGI = [
  { x: 800,  label: 'CAPTACIÓN'   },
  { x: 1020, label: 'TRATAMIENTO' },
  { x: 1240, label: 'RESERVA'     },
];
const N_PARTICLES = 8;

export function DigitalTwinsScene({ frame }) {
  if (frame < START || frame > END) return null;

  const lf = frame - START;
  const sceneOpacity = interpolate(
    frame, [START, START + 8, END - 8, END], [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const physOpacity     = interp(lf, 0,  25, 0, 1);
  const digiOpacity     = interp(lf, 28, 55, 0, 1);
  const particlesOpacity = interp(lf, 55, 70, 0, 1);

  return (
    <g opacity={sceneOpacity} fontFamily={C.fMono} textAnchor="middle">
      <line x1="720" y1="200" x2="720" y2="700"
        stroke={C.lineHi} strokeWidth="1" strokeDasharray="6 4" />
      <text x="360"  y="360" fontSize="10" fill={C.accent}>SISTEMA FÍSICO</text>
      <text x="1020" y="360" fontSize="10" fill={C.accent}>GEMELO DIGITAL</text>

      <g opacity={physOpacity}>
        {PHYS.map((b, i) => (
          <g key={b.label + 'p'}>
            <rect x={b.x - 65} y="390" width="130" height="50"
              fill={C.bg2} stroke={C.lineHi} strokeWidth="1" />
            <text x={b.x} y="420" fontSize="9" fill={C.ink1}>{b.label}</text>
            {i < PHYS.length - 1 && (
              <line x1={b.x + 65} y1="415" x2={PHYS[i + 1].x - 65} y2="415"
                stroke={C.accentLine} strokeWidth="1.5" />
            )}
          </g>
        ))}
      </g>

      <g opacity={digiOpacity}>
        {DIGI.map((b, i) => (
          <g key={b.label + 'd'}>
            <rect x={b.x - 65} y="390" width="130" height="50"
              fill={C.bg1} stroke={C.accent} strokeWidth="1" strokeDasharray="3 2" />
            <text x={b.x} y="420" fontSize="9" fill={C.accent}>{b.label}</text>
            {i < DIGI.length - 1 && (
              <line x1={b.x + 65} y1="415" x2={DIGI[i + 1].x - 65} y2="415"
                stroke={C.accentLine} strokeWidth="1.5" />
            )}
          </g>
        ))}
      </g>

      <g opacity={particlesOpacity}>
        {Array.from({ length: N_PARTICLES }, (_, i) => {
          const localProgress = Math.max(0, lf - 55);
          const progress = ((localProgress + i * 10) % 60) / 60;
          return (
            <circle key={i}
              cx={660 + progress * 80}
              cy={390 + (i % 4) * 20}
              r="3" fill={C.accent} opacity="0.7"
            />
          );
        })}
      </g>
    </g>
  );
}
