import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { C } from './colors.js';
import { PTAPModule } from './components/PTAPModule.jsx';
import { SensorBox } from './components/SensorBox.jsx';
import { FlowPipes } from './components/FlowPipes.jsx';

const ease = Easing.bezier(0.16, 1, 0.3, 1);

function interp(frame, f0, f1, v0, v1) {
  return interpolate(frame, [f0, f1], [v0, v1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
}

export function HeroPTAP() {
  const frame = useCurrentFrame();

  const globalOpacity = interp(frame, 175, 180, 1, 0);
  const gridOpacity   = interp(frame, 0, 15, 0, 1);

  const waterHeight = interp(frame, 25, 35, 0, 42);
  const waterY      = 80 - waterHeight;

  const pumpDeg = frame > 35 ? (frame - 35) * 9 : 0;

  const desR      = interp(frame, 100, 115, 0, 28);
  const desInnerR = interp(frame, 105, 115, 0, 20);

  const fil1 = interp(frame, 85,  97,  0, 1);
  const fil2 = interp(frame, 89, 101,  0, 1);
  const fil3 = interp(frame, 93, 105,  0, 1);

  const liveOpacity = frame >= 165
    ? (Math.floor((frame - 165) / 8) % 2 === 0 ? 1 : 0.3)
    : 0;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <svg viewBox="0 0 800 440" width="100%" height="100%" style={{ display: 'block' }}>
        <g opacity={globalOpacity}>

          {/* ── Border + coordinate grid ── */}
          <g opacity={gridOpacity}>
            <rect x="0.5" y="0.5" width="799" height="439" fill="none" stroke={C.lineHi} />
            {[[0,0],[800,0],[0,440],[800,440]].map(([x,y],i) => (
              <g key={i} stroke={C.lineHi} strokeWidth="1">
                <line x1={x-6} y1={y} x2={x+6} y2={y} />
                <line x1={x} y1={y-6} x2={x} y2={y+6} />
              </g>
            ))}
            <g fontFamily={C.fMono} fontSize="8" fill={C.ink3}>
              {[0,1,2,3,4,5,6,7,8].map(i => (
                <text key={'gx'+i} x={i*100+4} y="12">{String(i*100).padStart(3,'0')}</text>
              ))}
              {[0,1,2,3,4].map(i => (
                <text key={'gy'+i} x="4" y={i*100+20} transform={`rotate(-90 4 ${i*100+20})`}>{String(i*100).padStart(3,'0')}</text>
              ))}
            </g>
          </g>

          {/* ── T-101 Captación — frames 15-30, water rises 25-35 ── */}
          <PTAPModule startFrame={15} durationFrames={15}>
            <g transform="translate(80, 200)">
              <rect x="0" y="0" width="60" height="80" fill="none" stroke={C.lineHi} strokeWidth="1" />
              <rect x="2" y={waterY} width="56" height={waterHeight} fill={C.accentSoft} />
              <text x="30" y="-8" fontFamily={C.fMono} fontSize="9" fill={C.ink1} textAnchor="middle">Captación</text>
              <text x="30" y="95" fontFamily={C.fMono} fontSize="8" fill={C.ink3} textAnchor="middle">T-101</text>
            </g>
          </PTAPModule>

          {/* ── P-201 Bomba — frames 35-50 ── */}
          <PTAPModule startFrame={35} durationFrames={15}>
            <g transform="translate(180, 232)">
              <circle cx="16" cy="16" r="15" fill={C.bg2} stroke={C.lineHi} />
              <g transform={`rotate(${pumpDeg} 16 16)`}>
                <line x1="16" y1="4" x2="16" y2="28" stroke={C.accent} strokeWidth="1.5" />
                <line x1="4" y1="16" x2="28" y2="16" stroke={C.accent} strokeWidth="1.5" />
              </g>
              <text x="16" y="-6" fontFamily={C.fMono} fontSize="9" fill={C.ink1} textAnchor="middle">P-201</text>
            </g>
          </PTAPModule>

          {/* ── M-301 Coag/Floc — frames 50-65 ── */}
          <PTAPModule startFrame={50} durationFrames={15}>
            <g transform="translate(260, 200)">
              <path d="M0,0 L70,0 L60,80 L10,80 Z" fill={C.bg2} stroke={C.lineHi} />
              <path d="M0,0 L70,0 L62,40 L8,40 Z" fill={C.accentSoft} stroke="none" />
              <text x="35" y="-8" fontFamily={C.fMono} fontSize="9" fill={C.ink1} textAnchor="middle">Coag/Floc</text>
              <text x="35" y="95" fontFamily={C.fMono} fontSize="8" fill={C.ink3} textAnchor="middle">M-301</text>
            </g>
          </PTAPModule>

          {/* ── Sedimentación — frames 65-80 ── */}
          <PTAPModule startFrame={65} durationFrames={15}>
            <g transform="translate(370, 180)">
              <rect x="0" y="0" width="120" height="120" fill={C.bg2} stroke={C.lineHi} />
              <rect x="3" y="40" width="114" height="77" fill={C.accentSoft} />
              {[0,1,2,3,4,5].map(i => (
                <line key={i} x1={10+i*18} y1="50" x2={20+i*18} y2="110" stroke={C.accentLine} strokeWidth="0.7" />
              ))}
              <text x="60" y="-8"  fontFamily={C.fMono} fontSize="9" fill={C.ink1} textAnchor="middle">Sedimentación</text>
              <text x="60" y="135" fontFamily={C.fMono} fontSize="8" fill={C.ink3} textAnchor="middle">Lamelar</text>
            </g>
          </PTAPModule>

          {/* ── F-501 Filtración — frames 85-105, capas escalonadas ── */}
          <g transform="translate(520, 200)">
            <PTAPModule startFrame={85} durationFrames={15}>
              <rect x="0" y="0" width="70" height="80" fill={C.bg2} stroke={C.lineHi} />
              <text x="35" y="-8" fontFamily={C.fMono} fontSize="9" fill={C.ink1} textAnchor="middle">Filtración</text>
              <text x="35" y="95" fontFamily={C.fMono} fontSize="8" fill={C.ink3} textAnchor="middle">F-501</text>
            </PTAPModule>
            <g opacity={fil1}><rect x="3" y="6"  width="64" height="14" fill={C.lineHi} opacity="0.6" /></g>
            <g opacity={fil2}><rect x="3" y="22" width="64" height="24" fill={C.lineHi} opacity="0.4" /></g>
            <g opacity={fil3}><rect x="3" y="48" width="64" height="28" fill={C.lineHi} opacity="0.25" /></g>
          </g>

          {/* ── Desinfección — frames 100-115, círculo se expande ── */}
          <PTAPModule startFrame={100} durationFrames={15}>
            <g transform="translate(630, 200)">
              <circle cx="30" cy="40" r={desR}      fill={C.bg2}   stroke={C.lineHi} />
              <circle cx="30" cy="40" r={desInnerR} fill="none"    stroke={C.accentLine} strokeDasharray="2 3" />
              <text x="30" y="44"  fontFamily={C.fMono} fontSize="10" fill={C.accent} textAnchor="middle">Cl₂</text>
              <text x="30" y="-8"  fontFamily={C.fMono} fontSize="9"  fill={C.ink1}  textAnchor="middle">Desinfección</text>
            </g>
          </PTAPModule>

          {/* ── R-601 Reserva — frames 115-130 ── */}
          <PTAPModule startFrame={115} durationFrames={15}>
            <g transform="translate(720, 210)">
              <rect x="0" y="0" width="40" height="60" fill="none" stroke={C.lineHi} />
              <rect x="2" y="18" width="36" height="40" fill={C.accentSoft} />
              <text x="20" y="-8"  fontFamily={C.fMono} fontSize="9" fill={C.ink1} textAnchor="middle">Reserva</text>
              <text x="20" y="75"  fontFamily={C.fMono} fontSize="8" fill={C.ink3} textAnchor="middle">R-601</text>
            </g>
          </PTAPModule>

          {/* ── Tuberías + partículas — frames 130-150 ── */}
          <FlowPipes startFrame={130} />

          {/* ── Sensor readouts — frames 150-174, stagger 4fr ── */}
          <SensorBox startFrame={150} lineX={210} lineY1={248} lineY2={330}
            x={168} y={332} id="FIT-01" label="Caudal"   value="42.3" unit="L/s" />
          <SensorBox startFrame={154} lineX={435} lineY1={180} lineY2={110}
            x={393} y={72}  id="PIT-02" label="Presión"  value="3.24" unit="bar" />
          <SensorBox startFrame={158} lineX={555} lineY1={280} lineY2={350}
            x={513} y={352} id="TIT-03" label="Turbidez" value="0.80" unit="NTU" />
          <SensorBox startFrame={162} lineX={660} lineY1={220} lineY2={110}
            x={618} y={72}  id="AIT-04" label="pH"       value="7.21" unit="—" />

          {/* ── LIVE badge — frames 165-180 ── */}
          <g transform="translate(610, 20)" opacity={liveOpacity}>
            <rect x="0" y="0" width="170" height="24" fill={C.bg1} stroke={C.lineHi} />
            <circle cx="10" cy="12" r="3" fill={C.accent} />
            <text x="20" y="16" fontFamily={C.fMono} fontSize="9" fill={C.ink1}>SISTEMA ACTIVO · EN VIVO</text>
          </g>

          {/* ── Scale bar ── */}
          <g transform="translate(20, 415)" stroke={C.ink3} fontFamily={C.fMono} fontSize="8" fill={C.ink3} opacity={gridOpacity}>
            <line x1="0" y1="0" x2="80" y2="0" />
            <line x1="0" y1="-3" x2="0" y2="3" />
            <line x1="40" y1="-2" x2="40" y2="2" />
            <line x1="80" y1="-3" x2="80" y2="3" />
            <text x="0" y="14">0m</text>
            <text x="70" y="14">20m</text>
          </g>

        </g>
      </svg>
    </AbsoluteFill>
  );
}
