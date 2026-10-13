import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useOnScreen, usePrefersReducedMotion } from './primitives.jsx';
import { useT } from '../i18n.jsx';

// Fixed example readings. The diagram is illustrative: nothing here is measured.
const EXAMPLE = { caudal: '42.3', presion: '3.24', turbidez: '0.80', ph: '7.21' };

/* Below this width the diagram would shrink its text under ~9 px, so it switches
   to a compact form: numbered stages in the drawing and the legend and example
   readings as real text underneath. */
const COMPACT_BELOW = 560;

function useCompact(ref) {
  const [compact, setCompact] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => setCompact(el.getBoundingClientRect().width < COMPACT_BELOW);
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return compact;
}

function HydraulicSchematic({ animate, compact }) {
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

  const sensor = (x, y, lineFrom, lineTo, label, value, unit) => (
    <g key={label}>
      <line x1={x + 78} y1={lineFrom} x2={x + 78} y2={lineTo} stroke="var(--accent-line)" strokeDasharray="2 2"/>
      <rect x={x} y={y} width="156" height="60" fill="var(--bg-1)" stroke="var(--accent-line)"/>
      <text x={x + 10} y={y + 20} fill="var(--accent)" fontSize="15">{label}</text>
      <text x={x + 10} y={y + 47} fill="var(--ink)" fontSize="24">{value} <tspan fill="var(--ink-1)" fontSize="15">{unit}</tspan></text>
    </g>
  );
  // Stage names in the full drawing, numbers in the compact one (legend below).
  const name = (text, n) => (compact ? String(n) : text);
  const labelSize = compact ? 30 : 15;

  return (
    <div role="img" aria-label={tr('hero.schematicAlt')} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg viewBox={compact ? '20 140 760 190' : '0 0 800 440'} width="100%" height="100%" style={{ display: 'block' }}
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

        {!compact && <rect x="0.5" y="0.5" width="799" height="439" fill="none" stroke="var(--line)"/>}

        <g fontFamily="var(--f-mono)" fontSize={labelSize} fill="var(--ink-2)">
          <g transform="translate(80, 200)">
            <rect x="0" y="0" width="60" height="80" fill="none" stroke="var(--line-hi)" strokeWidth="1"/>
            <rect x="2" y="2" width="56" height="76" fill="url(#dotpat)"/>
            <rect x="2" y="36" width="56" height="42" fill="url(#tankfill)"/>
            <line x1="2" y1="36" x2="58" y2="36" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="2 2"/>
            <text x="30" y="-10" fill="var(--ink-1)" textAnchor="middle">{name(L.captacion, 1)}</text>
            {!compact && <text x="30" y="100" textAnchor="middle">T-101</text>}
          </g>

          <g transform="translate(180, 232)">
            <circle cx="16" cy="16" r="15" fill="var(--bg-2)" stroke="var(--line-hi)"/>
            <g transform={`rotate(${flow * 9} 16 16)`}>
              <line x1="16" y1="4" x2="16" y2="28" stroke="var(--accent)" strokeWidth="1.5"/>
              <line x1="4" y1="16" x2="28" y2="16" stroke="var(--accent)" strokeWidth="1.5"/>
            </g>
            {!compact && <text x="16" y="-8" fill="var(--ink-1)" textAnchor="middle">P-201</text>}
          </g>

          <g transform="translate(260, 200)">
            <path d="M0,0 L70,0 L60,80 L10,80 Z" fill="var(--bg-2)" stroke="var(--line-hi)"/>
            <path d="M0,0 L70,0 L62,40 L8,40 Z" fill="var(--accent-soft)" stroke="none"/>
            <text x="35" y="-10" fill="var(--ink-1)" textAnchor="middle">{name(L.coagFloc, 2)}</text>
            {!compact && <text x="35" y="100" textAnchor="middle">M-301</text>}
          </g>

          <g transform="translate(370, 180)">
            <rect x="0" y="0" width="120" height="120" fill="var(--bg-2)" stroke="var(--line-hi)"/>
            <rect x="3" y="40" width="114" height="77" fill="var(--accent-soft)"/>
            {[0,1,2,3,4,5].map(i => (
              <line key={i} x1={10 + i*18} y1="50" x2={20 + i*18} y2="110" stroke="var(--accent-line)" strokeWidth="0.7"/>
            ))}
            <text x="60" y="-10" fill="var(--ink-1)" textAnchor="middle">{name(L.sedimentacion, 3)}</text>
            {!compact && <text x="60" y="142" textAnchor="middle">{L.lamelar}</text>}
          </g>

          <g transform="translate(520, 200)">
            <rect x="0" y="0" width="70" height="80" fill="var(--bg-2)" stroke="var(--line-hi)"/>
            <rect x="3" y="6" width="64" height="14" fill="var(--line-2)" opacity="0.6"/>
            <rect x="3" y="22" width="64" height="24" fill="var(--line-2)" opacity="0.4"/>
            <rect x="3" y="48" width="64" height="28" fill="var(--line-2)" opacity="0.25"/>
            <text x="35" y="-10" fill="var(--ink-1)" textAnchor="middle">{name(L.filtracion, 4)}</text>
            {!compact && <text x="35" y="100" textAnchor="middle">F-501</text>}
          </g>

          <g transform="translate(630, 200)">
            <circle cx="30" cy="40" r="28" fill="var(--bg-2)" stroke="var(--line-hi)"/>
            <circle cx="30" cy="40" r="20" fill="none" stroke="var(--accent-line)" strokeDasharray="2 3"/>
            {!compact && <text x="30" y="45" fontSize="14" fill="var(--accent)" textAnchor="middle">Cl₂</text>}
            <text x="30" y={compact ? -10 : -34} fill="var(--ink-1)" textAnchor="middle">{name(L.desinfeccion, 5)}</text>
          </g>

          <g transform="translate(720, 210)">
            <rect x="0" y="0" width="40" height="60" fill="none" stroke="var(--line-hi)"/>
            <rect x="2" y="18" width="36" height="40" fill="url(#tankfill)"/>
            <text x="20" y="-10" fill="var(--ink-1)" textAnchor="middle" fontSize={compact ? 30 : 14}>{name(L.reserva, 6)}</text>
            {!compact && <text x="20" y="82" textAnchor="middle">R-601</text>}
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

        {!compact && (
          <>
            <g fontFamily="var(--f-mono)">
              {sensor(144, 334, 248, 334, L.sensors.caudal, EXAMPLE.caudal, 'L/s')}
              {sensor(369, 60, 180, 120, L.sensors.presion, EXAMPLE.presion, 'bar')}
              {sensor(489, 340, 280, 340, L.sensors.turb, EXAMPLE.turbidez, 'NTU')}
              {sensor(594, 60, 220, 120, L.sensors.ph, EXAMPLE.ph, '')}
            </g>

            <g transform="translate(20, 412)" stroke="var(--ink-2)" fontFamily="var(--f-mono)" fontSize="14" fill="var(--ink-2)">
              <line x1="0" y1="0" x2="80" y2="0"/>
              <line x1="0" y1="-3" x2="0" y2="3"/>
              <line x1="80" y1="-3" x2="80" y2="3"/>
              <text x="0" y="18" stroke="none">0 m</text>
              <text x="60" y="18" stroke="none">20 m</text>
            </g>
          </>
        )}
      </svg>
    </div>
  );
}

export default function Hero() {
  const t = useT();
  const figRef = useRef(null);
  const frameRef = useRef(null);
  const onScreen = useOnScreen(figRef);
  const reduced = usePrefersReducedMotion();
  const compact = useCompact(frameRef);
  const stats = t('hero.stats');
  const L = t('hero.schematicLabels');
  const legend = [L.captacion, L.coagFloc, L.sedimentacion, L.filtracion, L.desinfeccion, L.reserva];
  const readings = [
    [L.sensors.caudal, EXAMPLE.caudal, 'L/s'], [L.sensors.presion, EXAMPLE.presion, 'bar'],
    [L.sensors.turb, EXAMPLE.turbidez, 'NTU'], [L.sensors.ph, EXAMPLE.ph, ''],
  ];
  // The closing phrase of the headline takes the accent colour; if a language
  // does not provide it the headline is shown as plain text.
  const h1 = t('hero.h1');
  const accent = t('hero.h1Accent');
  const split = typeof accent === 'string' && typeof h1 === 'string' && h1.endsWith(accent) && accent !== h1;

  // No entry animation here: the first screen reads immediately.
  return (
    <div>
      <div className="hero">
        <div className="hero-photo">
          <img src="/assets/giovanni-field.jpg" alt="" width="1600" height="1066" fetchpriority="high" />
          <span className="chip hero-photo-note">{t('hero.imageNote')}</span>
        </div>
        <div className="hero-copy">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <span className="label-accent">{t('hero.kicker')}</span>
            <span aria-hidden="true" style={{ flex: 1, height: 1, background: 'var(--accent-line)', minWidth: 24 }}/>
            <span className="label" style={{ color: 'var(--ink-1)' }}>{t('hero.role')}</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--f-mono)',
            fontSize: 'clamp(32px, 4.2vw, 62px)',
            lineHeight: 1.06,
            letterSpacing: '-0.03em',
            fontWeight: 600,
            margin: '0 0 20px',
            textWrap: 'balance',
          }}>
            {split ? <>{h1.slice(0, h1.length - accent.length)}<span style={{ color: 'var(--accent)', whiteSpace: 'nowrap' }}>{accent}</span></> : h1}
          </h1>
          <p className="prose" style={{ maxWidth: 520, fontSize: 18, margin: '0 0 28px', color: 'var(--ink)' }}>
            {t('hero.intro')}
          </p>
          <div className="hero-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#proyectos" className="btn primary">{t('hero.ctaProjects')} <span aria-hidden="true">→</span></a>
            <a href="#contacto" className="btn hero-secondary">{t('hero.ctaContact')} <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </div>

      <div className="hero-below">
        <dl className="hero-stats">
          {(Array.isArray(stats) ? stats : []).map((s, i) => (
            <div key={i}>
              <dt style={{ fontFamily: 'var(--f-mono)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{s.v}</dt>
              <dd className="label" style={{ margin: '4px 0 0' }}>{s.l}</dd>
            </div>
          ))}
        </dl>

        <figure ref={figRef} style={{ margin: 0, minWidth: 0 }}>
          <figcaption style={{
            display: 'flex', justifyContent: 'space-between', gap: 4, flexWrap: 'wrap', marginBottom: 12,
            fontFamily: 'var(--f-mono)', fontSize: 13, color: 'var(--ink-1)',
          }}>
            <span>{t('hero.fig')}</span>
            <span style={{ color: 'var(--accent)' }}>{t('hero.figNote')}</span>
          </figcaption>
          <div ref={frameRef} style={{
            border: '1px solid var(--line-hi)', background: 'var(--bg-1)',
            padding: compact ? '28px 8px 8px' : 12, aspectRatio: compact ? undefined : '800/440', width: '100%', position: 'relative',
          }}>
            <div style={{ aspectRatio: compact ? '760/190' : undefined, width: '100%', height: compact ? undefined : '100%' }}>
              <HydraulicSchematic animate={onScreen && !reduced} compact={compact} />
            </div>
            <span className="chip" style={{ position: 'absolute', top: 8, right: 8 }}>{t('hero.badge')}</span>
          </div>
          {compact && (
            <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
              <ol aria-label={t('hero.legendLabel')} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '4px 12px', fontFamily: 'var(--f-mono)', fontSize: 13, color: 'var(--ink-1)' }}>
                {legend.map((name, i) => (
                  <li key={name} style={{ display: 'flex', gap: 8, minWidth: 0 }}>
                    <span style={{ color: 'var(--accent)' }}>{i + 1}</span><span style={{ overflowWrap: 'anywhere' }}>{name}</span>
                  </li>
                ))}
              </ol>
              <dl aria-label={t('hero.examplesLabel')} className="cells two" style={{ margin: 0 }}>
                {readings.map(([label, value, unit]) => (
                  <div key={label} style={{ padding: '10px 12px' }}>
                    <dt className="mono" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{label}</dt>
                    <dd style={{ margin: 0, fontFamily: 'var(--f-mono)', fontSize: 18, color: 'var(--ink)' }}>{value} <span style={{ fontSize: 13, color: 'var(--ink-1)' }}>{unit}</span></dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </figure>
      </div>
    </div>
  );
}
