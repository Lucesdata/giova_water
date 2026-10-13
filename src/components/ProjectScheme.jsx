import React, { useId } from 'react';

/* Conceptual diagrams, one per project. They contain no text on purpose (so
   they work in every language) and read the theme tokens, so they follow the
   palette. They are schematics, not plans or screenshots. */

const S = 'var(--line-hi)';       // outlines
const A = 'var(--accent)';        // flow / emphasis
const AS = 'var(--accent-soft)';  // water fill
const F1 = 'var(--bg-1)';
const F2 = 'var(--bg-2)';

function Tank({ x, y, w, h, level = 0.55, lamellae = false, bubbles = false }) {
  const ly = y + h * (1 - level);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={F2} stroke={S}/>
      <rect x={x + 1} y={ly} width={w - 2} height={y + h - ly - 1} fill={AS}/>
      <line x1={x + 1} y1={ly} x2={x + w - 1} y2={ly} stroke={A} strokeWidth="1" strokeDasharray="3 2"/>
      {lamellae && [0, 1, 2, 3].map((i) => (
        <line key={i} x1={x + 8 + i * (w - 20) / 3} y1={ly + 4} x2={x + 16 + i * (w - 20) / 3} y2={y + h - 4} stroke={A} strokeWidth="0.8" opacity="0.7"/>
      ))}
      {bubbles && [[0.25, 0.7], [0.5, 0.45], [0.7, 0.75], [0.8, 0.5]].map(([px, py], i) => (
        <circle key={i} cx={x + w * px} cy={y + h * (1 - level) + (h * level) * (py - 0.2)} r="1.8" fill="none" stroke={A} strokeWidth="0.8"/>
      ))}
    </g>
  );
}

function Pipe({ d, w = 1.6, dash }) {
  return <path d={d} fill="none" stroke={A} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round" strokeLinejoin="round"/>;
}

function Manhole({ x, y, on = false }) {
  return (
    <g>
      <circle cx={x} cy={y} r="5" fill={F1} stroke={on ? A : S}/>
      <circle cx={x} cy={y} r="1.6" fill={on ? A : S}/>
    </g>
  );
}

function Frame({ label, children }) {
  const pid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 320 200" width="100%" height="100%" role="img" aria-label={label}
         preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
      <defs>
        <pattern id={`sch-dots-${pid}`} width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.6" fill="var(--line-2)"/>
        </pattern>
      </defs>
      <rect width="320" height="200" fill={`url(#sch-dots-${pid})`} opacity="0.7"/>
      {children}
    </svg>
  );
}

const SCHEMES = {
  // Collection network -> treatment tanks -> receiving stream
  ptar: () => (
    <>
      <Pipe d="M14 70 L52 70 L52 100 L96 100" dash="4 3"/>
      <Pipe d="M14 130 L52 130 L52 100" dash="4 3"/>
      <Pipe d="M30 40 L52 70" dash="4 3"/>
      {[[14, 70], [14, 130], [30, 40], [52, 100]].map(([x, y], i) => <Manhole key={i} x={x} y={y} on={i === 3}/>)}
      <Tank x={96} y={72} w={50} h={56} level={0.5} bubbles/>
      <Tank x={160} y={60} w={58} h={68} level={0.6} lamellae/>
      <Tank x={232} y={80} w={40} h={48} level={0.45}/>
      <Pipe d="M146 100 L160 100"/><Pipe d="M218 100 L232 100"/>
      <Pipe d="M272 110 L296 110 L296 150"/>
      <path d="M180 168 C204 156 220 180 244 168 S284 160 306 168" fill="none" stroke={A} strokeWidth="1.2" opacity="0.75"/>
      <path d="M180 180 C204 168 220 192 244 180 S284 172 306 180" fill="none" stroke={S} strokeWidth="1"/>
    </>
  ),
  // Intake on a hill -> plant -> distribution tank -> houses
  rural: () => (
    <>
      <path d="M0 150 C40 100 70 96 110 126 S190 150 230 120 S290 90 320 110 L320 200 L0 200 Z" fill={F2} stroke={S}/>
      <circle cx="40" cy="104" r="8" fill={AS} stroke={A}/>
      <Pipe d="M46 112 L84 128"/>
      <rect x="84" y="112" width="44" height="30" fill={F1} stroke={S}/>
      <Tank x={90} y={116} w={12} h={22} level={0.6}/>
      <Tank x={110} y={116} w={12} h={22} level={0.4}/>
      <Pipe d="M128 128 L168 128 L196 98"/>
      <Tank x={188} y={60} w={32} h={38} level={0.6}/>
      <Pipe d="M204 98 L204 138 L170 150 M204 138 L250 150 M204 138 L286 128"/>
      {[[160, 150], [244, 154], [280, 132]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 8} y={y - 6} width="16" height="12" fill={F1} stroke={S}/>
          <path d={`M${x - 10} ${y - 6} L${x} ${y - 14} L${x + 10} ${y - 6}`} fill="none" stroke={S}/>
        </g>
      ))}
    </>
  ),
  // 11 water systems feeding one front-end screen
  automation: () => {
    const nodes = [];
    for (let i = 0; i < 6; i++) nodes.push([24 + i * 40, 30]);
    for (let i = 0; i < 5; i++) nodes.push([44 + i * 40, 66]);
    return (
      <>
        {nodes.map(([x, y], i) => (
          <g key={i}>
            <rect x={x - 9} y={y - 9} width="18" height="18" fill={F2} stroke={S}/>
            <rect x={x - 8} y={y + 1} width="16" height="7" fill={AS}/>
            <path d={`M${x - 4} ${y - 14} a6 6 0 0 1 8 0`} fill="none" stroke={A} strokeWidth="1"/>
            <Pipe d={`M${x} ${y + 9} L${x} ${y < 40 ? 50 : 84}`} w={1}/>
          </g>
        ))}
        <Pipe d="M24 50 L224 50" w={1}/>
        <Pipe d="M44 84 L204 84" w={1}/>
        <Pipe d="M124 50 L124 100 M124 84 L124 100" w={1.4}/>
        <Pipe d="M124 100 L124 118" w={1.6}/>
        <rect x="64" y="118" width="120" height="70" fill={F1} stroke={S}/>
        <rect x="64" y="118" width="120" height="10" fill={F2} stroke={S}/>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={76 + i * 20} y={176 - (14 + ((i * 7) % 5) * 7)} width="12" height={14 + ((i * 7) % 5) * 7} fill={AS} stroke={A} strokeWidth="0.8"/>
        ))}
        <circle cx="76" cy="123" r="1.8" fill={A}/><circle cx="84" cy="123" r="1.8" fill={S}/>
        <rect x="224" y="128" width="72" height="50" fill="none" stroke={S} strokeDasharray="3 3"/>
        {[0, 1, 2].map((i) => <line key={i} x1="234" y1={142 + i * 12} x2={286 - i * 14} y2={142 + i * 12} stroke={S}/>)}
      </>
    );
  },
  // Pipeline profile with hydraulic grade line and a 3D cube
  twin: () => (
    <>
      <path d="M0 150 C40 130 70 140 110 124 S180 150 220 126 S290 118 320 128 L320 200 L0 200 Z" fill={F2} stroke={S}/>
      <path d="M0 166 C40 146 70 156 110 140 S180 166 220 142 S290 134 320 144" fill="none" stroke="var(--ink-1)" strokeWidth="2.4" opacity="0.7"/>
      <path d="M0 46 L320 98" fill="none" stroke={A} strokeWidth="1.6" strokeDasharray="6 4"/>
      <path d="M0 34 L320 86" fill="none" stroke="var(--accent-2)" strokeWidth="1" opacity="0.6"/>
      {[48, 112, 176, 240, 296].map((x, i) => {
        const y = 46 + (x / 320) * 52;
        return (
          <g key={i}>
            <line x1={x} y1={y} x2={x} y2={140 + (i % 2) * 6} stroke={S} strokeDasharray="2 3"/>
            <circle cx={x} cy={y} r="4" fill={A}/>
            <circle cx={x} cy={y} r="8" fill="none" stroke="var(--accent-line)"/>
          </g>
        );
      })}
      <g transform="translate(246 12)" fill="none" stroke={S}>
        <path d="M20 4 L38 14 L38 34 L20 44 L2 34 L2 14 Z"/>
        <path d="M2 14 L20 24 L38 14 M20 24 L20 44" stroke={A}/>
      </g>
    </>
  ),
  // Sensors -> gateway -> broker -> dashboard
  iot: () => (
    <>
      {[34, 80, 126].map((y, i) => (
        <g key={i}>
          <circle cx="30" cy={y} r="11" fill={F2} stroke={S}/>
          <circle cx="30" cy={y} r="3.5" fill={A}/>
          <path d={`M44 ${y - 6} a9 9 0 0 1 0 12`} fill="none" stroke={A} strokeWidth="1"/>
          <Pipe d={`M52 ${y} L92 ${y < 80 ? 70 : y > 80 ? 90 : 80}`} w={1} dash="3 3"/>
        </g>
      ))}
      <rect x="92" y="62" width="40" height="36" fill={F1} stroke={S}/>
      {[0, 1, 2].map((i) => <rect key={i} x={98 + i * 12} y="74" width="8" height="12" fill={i === 1 ? A : AS} stroke={S} strokeWidth="0.6"/>)}
      <Pipe d="M132 80 L172 80"/>
      <path d="M190 56 L214 56 L226 80 L214 104 L190 104 L178 80 Z" fill={F2} stroke={S}/>
      <circle cx="202" cy="80" r="8" fill={AS} stroke={A}/>
      <Pipe d="M226 80 L252 80"/>
      <rect x="252" y="50" width="56" height="60" fill={F1} stroke={S}/>
      <rect x="252" y="50" width="56" height="8" fill={F2} stroke={S}/>
      <path d="M258 98 L270 86 L280 92 L292 72 L302 78" fill="none" stroke={A} strokeWidth="1.4"/>
      <rect x="92" y="130" width="216" height="50" fill="none" stroke={S} strokeDasharray="3 3"/>
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M${108 + i * 52} 164 L${116 + i * 52} 150 L${124 + i * 52} 158 L${134 + i * 52} 142`} fill="none" stroke={A} strokeWidth="1" opacity="0.8"/>)}
    </>
  ),
  // Landfill -> three treatment units of different size -> discharge
  industrial: () => (
    <>
      <path d="M0 150 C16 112 44 82 76 82 S118 116 124 150 L124 200 L0 200 Z" fill={F2} stroke={S}/>
      {[24, 46, 68, 90].map((x, i) => <path key={i} d={`M${x} ${142 - i * 4} q6 -8 12 0`} fill="none" stroke={S}/>)}
      <Pipe d="M110 148 L140 148 L140 120 L152 120"/>
      <Tank x={152} y={96} w={34} h={48} level={0.55}/>
      <Pipe d="M186 120 L198 120"/>
      <Tank x={198} y={64} w={52} h={80} level={0.6} bubbles/>
      <Pipe d="M250 120 L262 120"/>
      <Tank x={262} y={96} w={34} h={48} level={0.5} lamellae/>
      <Pipe d="M279 144 L279 170 L228 170" dash="4 3"/>
      <rect x="140" y="160" width="88" height="22" fill={F1} stroke={S}/>
      <circle cx="152" cy="171" r="3" fill={A}/><circle cx="164" cy="171" r="3" fill={S}/>
      <line x1="176" y1="171" x2="216" y2="171" stroke={S}/>
    </>
  ),
  // Surveyed manhole network with flow direction
  network: () => {
    const N = { a: [40, 40], b: [120, 54], c: [200, 40], d: [280, 64], e: [60, 110], f: [140, 120], g: [220, 108], h: [100, 168], i: [190, 170], j: [270, 150] };
    const E = [['a', 'b'], ['b', 'c'], ['c', 'd'], ['a', 'e'], ['b', 'f'], ['c', 'g'], ['d', 'g'], ['e', 'f'], ['f', 'g'], ['e', 'h'], ['f', 'i'], ['g', 'j'], ['h', 'i'], ['i', 'j']];
    return (
      <>
        <path d="M14 20 L150 14 L304 28 L306 120 L296 186 L120 190 L16 176 Z" fill="none" stroke={S} strokeDasharray="5 4"/>
        {E.map(([p, q], i) => {
          const [x1, y1] = N[p]; const [x2, y2] = N[q];
          const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
          const ang = Math.atan2(y2 - y1, x2 - x1);
          const ax = Math.cos(ang) * 4; const ay = Math.sin(ang) * 4;
          const nx = -Math.sin(ang) * 3; const ny = Math.cos(ang) * 3;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={A} strokeWidth="1.3" opacity="0.8"/>
              <path d={`M${mx + ax} ${my + ay} L${mx - ax + nx} ${my - ay + ny} L${mx - ax - nx} ${my - ay - ny} Z`} fill={A}/>
            </g>
          );
        })}
        {Object.entries(N).map(([k, [x, y]]) => <Manhole key={k} x={x} y={y} on={k === 'j'}/>)}
      </>
    );
  },
};

export default function ProjectScheme({ type, label }) {
  const Body = SCHEMES[type] || SCHEMES.network;
  return <Frame label={label}><Body/></Frame>;
}
