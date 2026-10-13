import React, { useState, useEffect, useRef } from 'react';
import { useOnScreen, usePrefersReducedMotion, Reveal } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';

// Fixed example readings. The diagram is illustrative: nothing here is measured.
const EXAMPLE = { caudal: '42.3', presion: '3.24', turbidez: '0.80', ph: '7.21' };

function HydraulicSchematic({ animate }) {
  const tr = useT();
  const [flow, setFlow] = useState(0);
  const L = tr('hero.schematicLabels');

  // Only advance the flow animation while it is visible and motion is allowed.
  useEffect(() => {
    if (!animate) return undefined;
    let raf;
    const loop = () => {
      setFlow(f => (f + 0.6) % 40);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [animate]);

  const sensor = (x, y, lineFrom, lineTo, tag, label, value, unit) => (
    <g key={tag}>
      <line x1={x + 66} y1={lineFrom} x2={x + 66} y2={lineTo} stroke="var(--accent-line)" strokeDasharray="2 2"/>
      <rect x={x} y={y} width="132" height="52" fill="var(--bg-1)" stroke="var(--accent-line)"/>
      <text x={x + 8} y={y + 17} fill="var(--accent)" fontSize="12.5">{tag} · {label}</text>
      <text x={x + 8} y={y + 42} fill="var(--ink)" fontSize="22">{value} <tspan fill="var(--ink-2)" fontSize="13">{unit}</tspan></text>
    </g>
  );

  return (
    <div role="img" aria-label={tr('hero.schematicAlt')} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg viewBox="0 0 800 440" width="100%" height="100%" style={{ display: 'block' }}
           preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <pattern id="dotpat" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.6" fill="var(--line-2)"/>
          </pattern>
          <linearGradient id="tankfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.05"/>
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.25"/>
          </linearGradient>
        </defs>

        <rect x="0.5" y="0.5" width="799" height="439" fill="none" stroke="var(--line)"/>

        <g fontFamily="var(--f-mono)" fontSize="14" fill="var(--ink-2)">
          <g transform="translate(80, 200)">
            <rect x="0" y="0" width="60" height="80" fill="none" stroke="var(--line-hi)" strokeWidth="1"/>
            <rect x="2" y="2" width="56" height="76" fill="url(#dotpat)"/>
            <rect x="2" y="36" width="56" height="42" fill="url(#tankfill)"/>
            <line x1="2" y1="36" x2="58" y2="36" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="2 2"/>
            <text x="30" y="-10" fill="var(--ink-1)" textAnchor="middle">{L.captacion}</text>
            <text x="30" y="100" textAnchor="middle">T-101</text>
          </g>

          <g transform="translate(180, 232)">
            <circle cx="16" cy="16" r="15" fill="var(--bg-2)" stroke="var(--line-hi)"/>
            <g transform={`rotate(${flow * 9} 16 16)`}>
              <line x1="16" y1="4" x2="16" y2="28" stroke="var(--accent)" strokeWidth="1.5"/>
              <line x1="4" y1="16" x2="28" y2="16" stroke="var(--accent)" strokeWidth="1.5"/>
            </g>
            <text x="16" y="-8" fill="var(--ink-1)" textAnchor="middle">P-201</text>
          </g>

          <g transform="translate(260, 200)">
            <path d="M0,0 L70,0 L60,80 L10,80 Z" fill="var(--bg-2)" stroke="var(--line-hi)"/>
            <path d="M0,0 L70,0 L62,40 L8,40 Z" fill="var(--accent-soft)" stroke="none"/>
            <text x="35" y="-10" fill="var(--ink-1)" textAnchor="middle">{L.coagFloc}</text>
            <text x="35" y="100" textAnchor="middle">M-301</text>
          </g>

          <g transform="translate(370, 180)">
            <rect x="0" y="0" width="120" height="120" fill="var(--bg-2)" stroke="var(--line-hi)"/>
            <rect x="3" y="40" width="114" height="77" fill="var(--accent-soft)"/>
            {[0,1,2,3,4,5].map(i => (
              <line key={i} x1={10 + i*18} y1="50" x2={20 + i*18} y2="110" stroke="var(--accent-line)" strokeWidth="0.7"/>
            ))}
            <text x="60" y="-10" fill="var(--ink-1)" textAnchor="middle">{L.sedimentacion}</text>
            <text x="60" y="142" textAnchor="middle">{L.lamelar}</text>
          </g>

          <g transform="translate(520, 200)">
            <rect x="0" y="0" width="70" height="80" fill="var(--bg-2)" stroke="var(--line-hi)"/>
            <rect x="3" y="6" width="64" height="14" fill="var(--line-2)" opacity="0.6"/>
            <rect x="3" y="22" width="64" height="24" fill="var(--line-2)" opacity="0.4"/>
            <rect x="3" y="48" width="64" height="28" fill="var(--line-2)" opacity="0.25"/>
            <text x="35" y="-10" fill="var(--ink-1)" textAnchor="middle">{L.filtracion}</text>
            <text x="35" y="100" textAnchor="middle">F-501</text>
          </g>

          <g transform="translate(630, 200)">
            <circle cx="30" cy="40" r="28" fill="var(--bg-2)" stroke="var(--line-hi)"/>
            <circle cx="30" cy="40" r="20" fill="none" stroke="var(--accent-line)" strokeDasharray="2 3"/>
            <text x="30" y="45" fontSize="13" fill="var(--accent)" textAnchor="middle">Cl₂</text>
            <text x="30" y="-10" fill="var(--ink-1)" textAnchor="middle">{L.desinfeccion}</text>
          </g>

          <g transform="translate(720, 210)">
            <rect x="0" y="0" width="40" height="60" fill="none" stroke="var(--line-hi)"/>
            <rect x="2" y="18" width="36" height="40" fill="url(#tankfill)"/>
            <text x="20" y="-10" fill="var(--ink-1)" textAnchor="middle" fontSize="13">{L.reserva}</text>
            <text x="20" y="82" textAnchor="middle">R-601</text>
          </g>
        </g>

        <g fill="none" stroke="var(--accent)" strokeWidth="1.3" opacity="0.7">
          <line x1="140" y1="240" x2="180" y2="248"/>
          <line x1="212" y1="248" x2="260" y2="240"/>
          <line x1="320" y1="240" x2="370" y2="240"/>
          <line x1="490" y1="240" x2="520" y2="240"/>
          <line x1="590" y1="240" x2="630" y2="240"/>
          <line x1="660" y1="240" x2="720" y2="240"/>
        </g>
        <g fill="var(--accent)">
          {[0,1,2,3,4,5,6,7,8,9].map(i => {
            const x = 140 + ((flow + i * 60) % 600);
            return <circle key={i} cx={x} cy="240" r="2" opacity="0.9"/>;
          })}
        </g>

        <g fontFamily="var(--f-mono)">
          {sensor(144, 334, 248, 334, 'FIT-01', L.sensors.caudal, EXAMPLE.caudal, 'L/s')}
          {sensor(369, 66, 180, 118, 'PIT-02', L.sensors.presion, EXAMPLE.presion, 'bar')}
          {sensor(489, 352, 280, 352, 'TIT-03', L.sensors.turb, EXAMPLE.turbidez, 'NTU')}
          {sensor(594, 66, 220, 118, 'AIT-04', L.sensors.ph, EXAMPLE.ph, '')}
        </g>

        <g transform="translate(20, 412)" stroke="var(--ink-2)" fontFamily="var(--f-mono)" fontSize="13" fill="var(--ink-2)">
          <line x1="0" y1="0" x2="80" y2="0"/>
          <line x1="0" y1="-3" x2="0" y2="3"/>
          <line x1="80" y1="-3" x2="80" y2="3"/>
          <text x="0" y="16" stroke="none">0 m</text>
          <text x="62" y="16" stroke="none">20 m</text>
        </g>
      </svg>
    </div>
  );
}

export default function Hero() {
  const { isMobile } = useBreakpoint();
  const t = useT();
  const figRef = useRef(null);
  const onScreen = useOnScreen(figRef);
  const reduced = usePrefersReducedMotion();
  const stats = t('hero.stats');
  const focus = t('hero.focus');

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.05fr) minmax(0, 1fr)',
      gap: isMobile ? 32 : 48, alignItems: 'center',
      minHeight: isMobile ? undefined : 'calc(100vh - 140px)',
      padding: isMobile ? '24px 0 48px' : '48px 0',
    }}>
      <div>
        <Reveal style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <span className="label-accent">{t('hero.kicker')}</span>
          <span aria-hidden="true" style={{ flex: 1, height: 1, background: 'var(--accent-line)', minWidth: 24 }}/>
          <span className="label">{t('hero.role')}</span>
        </Reveal>
        <Reveal as="h1" delay={90} style={{
          fontFamily: 'var(--f-mono)',
          fontSize: 'clamp(30px, 3.7vw, 54px)',
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
          fontWeight: 500,
          margin: '0 0 24px',
          textWrap: 'balance',
        }}>
          {t('hero.h1')}
        </Reveal>
        <Reveal as="p" delay={180} style={{ maxWidth: 560, color: 'var(--ink-1)', fontSize: 16, lineHeight: 1.65, margin: '0 0 32px', textWrap: 'pretty' }}>
          {t('hero.intro')}
        </Reveal>
        <Reveal delay={270} style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          <a href="#proyectos" className="btn primary">{t('hero.ctaProjects')}</a>
          <a href="#contacto" className="btn">{t('hero.ctaContact')}</a>
        </Reveal>

        <Reveal as="ul" delay={360} aria-label={t('hero.focusLabel')} style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(Array.isArray(focus) ? focus : []).map(f => <li key={f}><span className="chip accent">{f}</span></li>)}
        </Reveal>

        <Reveal as="dl" delay={450} style={{
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 16 : 0,
          borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
          padding: '16px 0', margin: 0,
        }}>
          {(Array.isArray(stats) ? stats : []).map((s, i) => (
            <div key={i} style={isMobile ? undefined : { borderLeft: i > 0 ? '1px solid var(--line)' : 'none', paddingLeft: i > 0 ? 20 : 0 }}>
              <dt style={{ fontFamily: 'var(--f-mono)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{s.v}</dt>
              <dd className="label" style={{ margin: '4px 0 0' }}>{s.l}</dd>
            </div>
          ))}
        </Reveal>
      </div>

      <Reveal delay={200} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <figure ref={figRef} style={{ margin: 0 }}>
          <figcaption style={{
            display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12,
            fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink-2)',
          }}>
            <span>{t('hero.fig')}</span>
            <span style={{ color: 'var(--accent)' }}>{t('hero.figNote')}</span>
          </figcaption>
          <div style={{
            border: '1px solid var(--line-hi)', background: 'var(--bg-1)',
            padding: 12, aspectRatio: '800/440', width: '100%', position: 'relative',
          }}>
            <HydraulicSchematic animate={onScreen && !reduced} />
            <span className="chip" style={{ position: 'absolute', top: 8, right: 8 }}>{t('hero.badge')}</span>
          </div>
        </figure>
        <div style={{ position: 'relative', border: '1px solid var(--line-hi)', overflow: 'hidden', aspectRatio: '3/1.4' }}>
          <img src="/assets/giovanni-field.jpg" alt={t('hero.fieldAlt')}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(0.9) contrast(1.05)' }}/>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'rgba(6,9,12,0.28)', pointerEvents: 'none' }}/>
          <div style={{
            position: 'absolute', left: 12, bottom: 10,
            fontFamily: 'var(--f-mono)', fontSize: 12, letterSpacing: '0.08em',
            color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          }}>
            {t('hero.fieldCaption')}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
