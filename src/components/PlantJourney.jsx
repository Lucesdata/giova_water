import React, { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n.jsx';
import { SectionIndex, Reveal, usePrefersReducedMotion } from './primitives.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';
import { STAGES, cameraAt, progressToF, activeStage, cameraTransform } from '../lib/camera.js';

const VH_PER_STAGE = 70;
const OVERVIEW = cameraTransform(cameraAt(0));

/* Illustrative treatment plant. Coordinates match lib/camera.js. */
function Scene({ gRef, flowRef, active, labels }) {
  const dim = (i) => `pj-stage${active !== 0 && active !== i ? ' pj-dim' : ''}`;
  const lab = (x, y, text, small) => (
    <text x={x} y={y} textAnchor="middle" fontFamily="var(--f-mono)" fontSize={small ? 11 : 14} fill={small ? 'var(--ink-2)' : 'var(--ink-1)'}>{text}</text>
  );
  return (
    <svg viewBox="0 0 800 440" width="100%" height="100%" aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <pattern id="pj-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill="var(--line-2)"/></pattern>
        <linearGradient id="pj-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.06"/><stop offset="100%" stopColor="var(--accent)" stopOpacity="0.28"/>
        </linearGradient>
      </defs>
      <g ref={gRef} transform={OVERVIEW}>
        <rect x="-700" y="-500" width="2200" height="1400" fill="url(#pj-dots)" opacity="0.8"/>
        <path d="M-700 330 L1500 330" stroke="var(--line-hi)" strokeWidth="1"/>

        <path d="M20 240 L140 240 M212 248 L260 240 M330 240 L370 240 M490 240 L520 240 M590 240 L632 240 M688 240 L720 240 M760 240 L790 240"
              fill="none" stroke="var(--accent)" strokeWidth="1.4" opacity="0.6"/>
        <line ref={flowRef} x1="20" y1="240" x2="790" y2="240" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.1 18"/>

        <g className={dim(1)}>
          <rect x="80" y="200" width="60" height="80" fill="var(--bg-2)" stroke="var(--line-hi)"/>
          <rect x="82" y="236" width="56" height="42" fill="url(#pj-fill)"/>
          <line x1="82" y1="236" x2="138" y2="236" stroke="var(--accent)" strokeDasharray="3 2"/>
          {lab(110, 188, labels.captacion)}{lab(110, 302, 'T-101', true)}
        </g>
        <g>
          <circle cx="196" cy="248" r="15" fill="var(--bg-2)" stroke="var(--line-hi)"/>
          <path d="M188 248 L204 248 M196 240 L196 256" stroke="var(--accent)" strokeWidth="1.5"/>
        </g>
        <g className={dim(2)}>
          <path d="M260 200 L330 200 L322 280 L270 280 Z" fill="var(--bg-2)" stroke="var(--line-hi)"/>
          <path d="M260 200 L330 200 L324 240 L268 240 Z" fill="var(--accent-soft)"/>
          {lab(295, 188, labels.coagFloc)}{lab(295, 300, 'M-301', true)}
        </g>
        <g className={dim(3)}>
          <rect x="370" y="180" width="120" height="120" fill="var(--bg-2)" stroke="var(--line-hi)"/>
          <rect x="373" y="220" width="114" height="77" fill="var(--accent-soft)"/>
          {[0, 1, 2, 3, 4, 5].map(i => <line key={i} x1={380 + i * 18} y1="230" x2={390 + i * 18} y2="290" stroke="var(--accent-line)" strokeWidth="0.9"/>)}
          {lab(430, 168, labels.sedimentacion)}{lab(430, 322, labels.lamelar, true)}
        </g>
        <g className={dim(4)}>
          <rect x="520" y="200" width="70" height="80" fill="var(--bg-2)" stroke="var(--line-hi)"/>
          <rect x="523" y="206" width="64" height="14" fill="var(--line-2)" opacity="0.7"/>
          <rect x="523" y="222" width="64" height="24" fill="var(--line-2)" opacity="0.45"/>
          <rect x="523" y="248" width="64" height="28" fill="var(--line-2)" opacity="0.28"/>
          {lab(555, 188, labels.filtracion)}{lab(555, 300, 'F-501', true)}
        </g>
        <g className={dim(5)}>
          <circle cx="660" cy="240" r="28" fill="var(--bg-2)" stroke="var(--line-hi)"/>
          <circle cx="660" cy="240" r="20" fill="none" stroke="var(--accent-line)" strokeDasharray="2 3"/>
          <text x="660" y="245" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="13" fill="var(--accent)">Cl₂</text>
          {lab(660, 190, labels.desinfeccion)}
        </g>
        <g className={dim(6)}>
          <rect x="720" y="210" width="40" height="60" fill="none" stroke="var(--line-hi)"/>
          <rect x="722" y="228" width="36" height="40" fill="url(#pj-fill)"/>
          {lab(740, 290, labels.reserva)}{lab(740, 306, 'R-601', true)}
        </g>
      </g>
    </svg>
  );
}

function StageCard({ n, total, s, defines, stageOf }) {
  return (
    <>
      <div className="mono" style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 8 }}>{stageOf.replace('{n}', n).replace('{total}', total)}</div>
      <h3 style={{ margin: '0 0 10px', fontFamily: 'var(--f-mono)', fontSize: 'clamp(22px, 2.6vw, 34px)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.1, textWrap: 'balance' }}>{s.t}</h3>
      <p style={{ margin: '0 0 16px', color: 'var(--ink-1)', fontSize: 15, lineHeight: 1.6, maxWidth: 460 }}>{s.d}</p>
      <div className="label" style={{ marginBottom: 4 }}>{defines}</div>
      <p style={{ margin: 0, color: 'var(--ink)', fontSize: 14, lineHeight: 1.55, maxWidth: 460 }}>{s.k}</p>
    </>
  );
}

/* A pinned scene: the camera travels through the plant as the page scrolls.
   Continuous (scrubbed) while the section is on screen, via one rAF-throttled
   scroll listener that only exists while the section is visible and writes
   straight to the SVG (no React re-render per frame). Reduced motion and
   missing IntersectionObserver get a static diagram plus the stage list. */
export default function PlantJourney() {
  const t = useT();
  const { isMobile } = useBreakpoint();
  const reduced = usePrefersReducedMotion();
  const labels = t('hero.schematicLabels');
  const J = t('journey');
  const stages = Array.isArray(J.stages) ? J.stages : [];
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const gRef = useRef(null);
  const flowRef = useRef(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const live = !reduced && typeof IntersectionObserver !== 'undefined';

  useEffect(() => {
    if (!live) return undefined;
    let raf = 0;
    let listening = false;
    const update = () => {
      raf = 0;
      const wrap = wrapRef.current; const stage = stageRef.current;
      if (!wrap || !stage) return;
      const r = wrap.getBoundingClientRect();
      const stick = parseFloat(getComputedStyle(stage).top) || 0;
      const travel = r.height - stage.offsetHeight;
      const p = travel > 0 ? (stick - r.top) / travel : 0;
      const f = progressToF(p);
      gRef.current?.setAttribute('transform', cameraTransform(cameraAt(f)));
      flowRef.current?.setAttribute('stroke-dashoffset', String(-f * 90));
      const a = activeStage(f);
      if (a !== activeRef.current) { activeRef.current = a; setActive(a); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    const start = () => {
      if (listening) return; listening = true;
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      update();
    };
    const stop = () => {
      if (!listening) return; listening = false;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: '200px 0px' });
    if (wrapRef.current) io.observe(wrapRef.current);
    return () => { io.disconnect(); stop(); if (raf) cancelAnimationFrame(raf); };
  }, [live]);

  const header = (
    <Reveal style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: 32, marginBottom: 32 }}>
      <SectionIndex n="PTAP" kicker={t('journey.kicker')} title={t('journey.title')} />
      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <h2 id="journey-title" className="h2">
          {J.h2a} <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', color: 'var(--ink-1)' }}>{J.h2b}</span>
        </h2>
      </div>
    </Reveal>
  );
  const note = <p style={{ margin: '16px 0 0', color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.55, maxWidth: 620 }}>{J.note}</p>;
  const sceneBox = (
    <div className="pj-scene" role="img" aria-label={J.alt}>
      <Scene gRef={gRef} flowRef={flowRef} active={live ? active : 0} labels={labels} />
    </div>
  );

  if (!live) {
    return (
      <section id="recorrido" className="section" aria-labelledby="journey-title">
        {header}
        <p style={{ margin: '0 0 24px', color: 'var(--ink-1)', fontSize: 15, lineHeight: 1.6, maxWidth: 640 }}>{J.overview.d}</p>
        {sceneBox}
        <ol aria-label={J.listLabel} style={{ listStyle: 'none', margin: '24px 0 0', padding: 0, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}>
          {stages.map((s, i) => (
            <Reveal as="li" key={i} delay={(i % 3) * 90} style={{ border: '1px solid var(--line)', background: 'var(--bg-1)', padding: 20 }}>
              <StageCard n={i + 1} total={stages.length} s={s} defines={J.defines} stageOf={J.stageOf} />
            </Reveal>
          ))}
        </ol>
        {note}
      </section>
    );
  }

  const cur = active === 0 ? null : stages[active - 1];
  return (
    <section id="recorrido" className="section" aria-labelledby="journey-title">
      {header}
      <p className="sr-only">{J.overview.d}</p>
      <ol className="sr-only" aria-label={J.listLabel}>
        {stages.map((s, i) => <li key={i}>{s.t}. {s.d} {J.defines}: {s.k}</li>)}
      </ol>
      <div ref={wrapRef} style={{ position: 'relative', height: `${(STAGES + 1) * VH_PER_STAGE}vh` }}>
        <div ref={stageRef} className="pj-stage-box">
          {sceneBox}
          <div className="pj-panel" aria-hidden="true">
            <div key={active} className="pj-text">
              {cur ? (
                <StageCard n={active} total={stages.length} s={cur} defines={J.defines} stageOf={J.stageOf} />
              ) : (
                <>
                  <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--f-mono)', fontSize: 'clamp(22px, 2.6vw, 34px)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{J.overview.t}</h3>
                  <p style={{ margin: '0 0 20px', color: 'var(--ink-1)', fontSize: 15, lineHeight: 1.6, maxWidth: 460 }}>{J.overview.d}</p>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>{J.hint} ↓</span>
                </>
              )}
            </div>
            <div className="pj-dots" style={{ display: 'flex', gap: 6, marginTop: 20 }}>
              {Array.from({ length: STAGES + 1 }, (_, i) => (
                <span key={i} style={{ width: i === active ? 24 : 8, height: 4, background: i <= active ? 'var(--accent)' : 'var(--line-2)', transition: 'width 500ms var(--ease-heavy), background 500ms var(--ease-heavy)' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      {note}
    </section>
  );
}
