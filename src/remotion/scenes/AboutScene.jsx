import React from 'react';
import { interpolate } from 'remotion';
import { C } from '../colors.js';

const START = 0;
const END = 119;

function interp(frame, f0, f1, v0, v1) {
  return interpolate(frame, [f0, f1], [v0, v1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

const NODES = [
  { id: 'CAP',  x: 180,  y: 450, label: 'CAPTACIÓN',  val: '42 L/s'   },
  { id: 'BOMB', x: 390,  y: 450, label: 'BOMBEO',      val: '3.2 bar'  },
  { id: 'PTAP', x: 620,  y: 450, label: 'PTAP',        val: '0.8 NTU'  },
  { id: 'RES1', x: 870,  y: 250, label: 'RESERVA N',   val: '1 200 m³' },
  { id: 'RES2', x: 870,  y: 650, label: 'RESERVA S',   val: '800 m³'   },
  { id: 'USR',  x: 1150, y: 450, label: 'RED URBANA',  val: '98 %'     },
];

const PIPES = [
  [0, 1], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5],
];

export function AboutScene({ frame }) {
  if (frame < START || frame > END) return null;

  const lf = frame - START;
  const sceneOpacity = interpolate(
    frame, [START, START + 8, END - 8, END], [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const labelOpacity = interp(lf, 78, 95, 0, 1);

  return (
    <g opacity={sceneOpacity}>
      {PIPES.map(([a, b], i) => {
        const na = NODES[a], nb = NODES[b];
        const len = Math.hypot(nb.x - na.x, nb.y - na.y);
        const offset = interp(lf, 28 + i * 7, 75 + i * 4, len, 0);
        return (
          <line key={i}
            x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
            stroke={C.accentLine} strokeWidth="1.5"
            strokeDasharray={len} strokeDashoffset={offset}
          />
        );
      })}
      {NODES.map((n, i) => {
        const op = interp(lf, i * 5, i * 5 + 10, 0, 1);
        return (
          <g key={n.id} opacity={op}>
            <circle cx={n.x} cy={n.y} r="20" fill={C.bg2} stroke={C.lineHi} strokeWidth="1" />
            <circle cx={n.x} cy={n.y} r="6"  fill={C.accent} />
          </g>
        );
      })}
      <g opacity={labelOpacity} fontFamily={C.fMono} textAnchor="middle">
        {NODES.map(n => (
          <React.Fragment key={n.id + '-l'}>
            <text x={n.x} y={n.y + 40} fontSize="10" fill={C.ink1}>{n.label}</text>
            <text x={n.x} y={n.y + 54} fontSize="9"  fill={C.ink3}>{n.val}</text>
          </React.Fragment>
        ))}
      </g>
    </g>
  );
}
