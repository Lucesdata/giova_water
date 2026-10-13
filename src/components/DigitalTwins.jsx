import React, { useState, useEffect, useReducer, useRef } from 'react';
import { useInView, useOnScreen, usePrefersReducedMotion, SectionIndex, Tag, Sparkline, Reveal } from './primitives.jsx';
import { SCENARIO_IDS, LIMITS, statusOf, simReducer, initialState } from '../lib/twinSim.js';
import { sectionNumber } from '../data/sections.js';
import { useT } from '../i18n.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';

function DashGauge({ label, value, unit, k, decimals, inView, statusLabels, dirLabels, showBorder = true }) {
  const { min, max } = LIMITS[k];
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const { status, dir } = statusOf(k, value);
  const color = status === 'alert' ? 'var(--alert)' : status === 'warn' ? 'var(--warn)' : 'var(--accent)';
  return (
    <div style={{ padding: 16, borderRight: showBorder ? '1px solid var(--line)' : 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <span className="label">{label}</span>
        <span className="mono" style={{ fontSize: 12, color, letterSpacing: '0.06em' }}>● {statusLabels[status]}{dir ? ` · ${dirLabels[dir]}` : ''}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 28, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          {value.toFixed(decimals)}
        </span>
        <span className="mono" style={{ fontSize: 13, color: 'var(--ink-1)' }}>{unit}</span>
      </div>
      <div role="progressbar" aria-valuenow={Number(value.toFixed(decimals))} aria-valuemin={min} aria-valuemax={max} aria-label={label}
           style={{ height: 3, background: 'var(--line)', position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: inView ? `${pct}%` : '0%',
          background: color,
          transition: 'width 250ms var(--ease)',
        }}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink-2)' }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function SparkTile({ label, series, unit, value, color = 'var(--accent)' }) {
  // Trend of the simulated window: last sample against the first.
  const delta = series.length > 1 && series[0] ? ((series[series.length - 1] - series[0]) / series[0]) * 100 : 0;
  return (
    <div style={{ padding: 16, borderRight: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="label">{label}</span>
        <span className="mono" style={{ fontSize: 12, color: delta >= 0 ? 'var(--accent)' : 'var(--alert)' }}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 22, color: 'var(--ink)' }}>{value}</span>
        <span className="mono" style={{ fontSize: 13, color: 'var(--ink-1)' }}>{unit}</span>
      </div>
      <Sparkline data={series} color={color} width={180} height={28} label={label} />
    </div>
  );
}

function LGHCanvas({ animate, label, slope = 0.02 }) {
  const ref = useRef();
  useEffect(() => {
    let raf, t = 0;
    const draw = () => {
      const canvas = ref.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo((w/10)*i, 0); ctx.lineTo((w/10)*i, h);
        ctx.stroke();
      }
      for (let i = 0; i <= 5; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (h/5)*i); ctx.lineTo(w, (h/5)*i);
        ctx.stroke();
      }

      const terrain = (x) => h * 0.75 - Math.sin(x * 0.012) * 18 - Math.sin(x * 0.003) * 40;
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) ctx.lineTo(x, terrain(x));
      ctx.lineTo(w, h); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = terrain(x);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const pipe = (x) => h * 0.82 - Math.sin(x * 0.012) * 18 - Math.sin(x * 0.003) * 40;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = pipe(x);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const lgh = (x) => {
        const base = h * 0.25 - x * slope;
        return base - Math.sin(t * 0.02 + x * 0.008) * 4;
      };
      ctx.strokeStyle = 'rgba(78, 232, 209, 0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = lgh(x);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = 'rgba(127, 179, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = lgh(x) - 10 - Math.sin(x * 0.015) * 2;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      for (let i = 0; i < 12; i++) {
        const x = ((t * 1.2 + i * 60) % (w + 40)) - 20;
        if (x < 0 || x > w) continue;
        const y = pipe(x);
        ctx.fillStyle = 'rgba(78, 232, 209, 0.95)';
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      const nodes = [0.15, 0.35, 0.55, 0.75, 0.92];
      nodes.forEach((p, i) => {
        const x = w * p;
        const yp = pipe(x);
        const yl = lgh(x);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(x, yp); ctx.lineTo(x, yl);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(78,232,209,1)';
        ctx.beginPath();
        ctx.arc(x, yl, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(78,232,209,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, yl, 6 + (Math.sin(t*0.08 + i) * 2), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(170,180,192,0.8)';
        ctx.font = '12px JetBrains Mono, monospace';
        ctx.fillText(`N${i+1}`, x - 8, yl - 10);
      });

      ctx.fillStyle = 'rgba(170,180,192,0.85)';
      ctx.font = '12px JetBrains Mono, monospace';
      ctx.fillText('z [m]', 8, 14);
      ctx.fillText('x [m]', w - 40, h - 6);

      t += 1;
      if (animate) raf = requestAnimationFrame(draw);
    };
    draw();
    // A still frame has to follow the container size when it is not animating.
    const onResize = () => { if (!animate) draw(); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [animate, slope]);
  return <canvas ref={ref} role="img" aria-label={label} style={{ width: '100%', height: '100%', display: 'block' }}/>;
}

// Illustrative slope of the hydraulic gradient line per scenario (more flow, steeper line).
const LGH_SLOPE = { normal: 0.02, alta: 0.045, reducido: 0.008 };
const TICK_MS = 1000;

export default function DigitalTwins() {
  const t = useT();
  const sectionRef = useRef(null);
  const onScreen = useOnScreen(sectionRef);
  const reduced = usePrefersReducedMotion();
  const [seenRef, inView] = useInView({ threshold: 0.15 });
  const { isMobile } = useBreakpoint();
  const [sim, dispatch] = useReducer(simReducer, undefined, initialState);
  // With reduced motion the simulation starts paused; the visitor can resume it.
  const [paused, setPaused] = useState(reduced);
  useEffect(() => { if (reduced) setPaused(true); }, [reduced]);

  // Samples are taken only while the panel is on screen and not paused.
  useEffect(() => {
    if (paused || !onScreen) return undefined;
    const id = setInterval(() => dispatch({ type: 'tick' }), TICK_MS);
    return () => clearInterval(id);
  }, [paused, onScreen]);

  const animateCanvas = onScreen && !reduced && !paused;
  const { q: caudal, p: presion, tu: turbidez, ph } = sim.readings;
  const D = t('twins.dashboard');
  const features = t('twins.features');
  const S = t('twins.scenarios');
  const current = S.items[sim.scenario];

  const reset = () => { dispatch({ type: 'reset' }); setPaused(reduced); };

  return (
    <section id="gemelos" className="section" ref={(el) => { sectionRef.current = el; seenRef.current = el; }} aria-labelledby="twins-title">
      <Reveal style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: isMobile ? 16 : 32, marginBottom: 24 }}>
        <SectionIndex n={sectionNumber('gemelos')} kicker={t('twins.kicker')} title={t('twins.title')} />
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <h2 id="twins-title" className="h2">
            {t('twins.h2a')} <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', color: 'var(--ink-1)' }}>{t('twins.h2b')}</span>
          </h2>
          <span className="chip accent">{t('twins.badge')}</span>
        </div>
      </Reveal>

      <p className="prose" style={{ maxWidth: 720, margin: '0 0 28px' }}>{t('twins.intro')}</p>

      <div style={{ border: '1px solid var(--line-hi)', background: 'var(--bg-1)' }}>
        <p className="mono" style={{
          margin: 0, padding: '10px 18px', borderBottom: '1px solid var(--line-hi)', fontSize: 14,
          color: 'var(--accent)', background: 'var(--accent-soft)',
        }}>
          {t('twins.disclaimer')}
        </p>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          padding: '12px 18px', borderBottom: '1px solid var(--line-hi)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 14, color: 'var(--ink)' }}>{D.title}</span>
            <span className="mono" style={{ fontSize: 13, color: 'var(--ink-1)' }}>{D.sensors}</span>
          </div>
          <span className="chip accent">{paused ? S.paused : t('twins.badge')}</span>
        </div>

        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div role="group" aria-label={S.label} className="seg">
              {SCENARIO_IDS.map((id) => (
                <button key={id} type="button" aria-pressed={sim.scenario === id} onClick={() => dispatch({ type: 'scenario', id })}>
                  {S.items[id].name}
                </button>
              ))}
            </div>
            <div className="seg">
              <button type="button" onClick={() => setPaused(p => !p)}>{paused ? S.resume : S.pause}</button>
              <button type="button" onClick={reset}>{S.reset}</button>
            </div>
          </div>
          <div role="status" aria-live="polite" style={{ display: 'grid', gap: 6, fontSize: 16, lineHeight: 1.55, color: 'var(--ink-1)' }}>
            <p style={{ margin: 0 }}><strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{S.changedLabel}</strong> {current.changed}</p>
            <p style={{ margin: 0 }}><strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{S.checkLabel}</strong> {current.check}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', borderBottom: '1px solid var(--line)' }}>
          {[
            { k: 'q',  label: D.gauges.caudal,   value: caudal,   unit: 'L/s', decimals: 1 },
            { k: 'p',  label: D.gauges.presion,  value: presion,  unit: 'bar', decimals: 2 },
            { k: 'tu', label: D.gauges.turbidez, value: turbidez, unit: 'NTU', decimals: 2 },
            { k: 'ph', label: D.gauges.ph,       value: ph,       unit: 'pH',  decimals: 2 },
          ].map((g, i) => (
            <DashGauge key={g.k} {...g} inView={inView} statusLabels={D.status} dirLabels={D.dir}
              showBorder={isMobile ? i % 2 === 0 : i < 3}
            />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 1fr', borderBottom: '1px solid var(--line)' }}>
          <div style={{ padding: 16, borderRight: isMobile ? 'none' : '1px solid var(--line)', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <span className="label">{D.lghLabel}</span>
              <span className="mono" style={{ fontSize: 13, color: 'var(--ink-1)' }}>{D.scale}</span>
            </div>
            <div style={{ height: isMobile ? 220 : 280, border: '1px solid var(--line)', background: 'var(--bg-2)' }}>
              <LGHCanvas animate={animateCanvas} label={D.canvasAlt} slope={LGH_SLOPE[sim.scenario]} />
            </div>
            {reduced && <p className="mono" style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ink-1)' }}>{D.paused}</p>}
          </div>
          <div style={{ padding: 16 }}>
            <div className="label" style={{ marginBottom: 12 }}>{D.stack}</div>
            {[[D.data, ['MQTT', 'InfluxDB', 'SCADA', 'Modbus']], [D.sim, ['EPANET-Python', 'WaterGEMS', 'HEC-RAS']], [D.viz, ['Three.js', 'Chart.js', 'React', 'D3']]].map(([lab, tags]) => (
              <div key={lab} style={{ marginBottom: 14 }}>
                <div className="mono" style={{ fontSize: 13, color: 'var(--ink-1)', marginBottom: 6 }}>{lab}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {tags.map(x => <Tag key={x}>{x}</Tag>)}
                </div>
              </div>
            ))}
            <p style={{ margin: '0 0 14px', color: 'var(--ink-1)', fontSize: 14, lineHeight: 1.5 }}>{D.stackNote}</p>
            <a href="#contacto" className="btn primary" style={{ width: '100%', justifyContent: 'center' }}>
              {D.openTwin}
            </a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))' }}>
          <SparkTile label={D.sparks.q} series={sim.series.q} value={caudal.toFixed(1)} unit="L/s" />
          <SparkTile label={D.sparks.p} series={sim.series.p} value={presion.toFixed(2)} unit="bar" />
          <SparkTile label={D.sparks.turb} series={sim.series.tu} value={turbidez.toFixed(2)} unit="NTU" color="var(--warn)" />
          <SparkTile label={D.sparks.ph} series={sim.series.ph} value={ph.toFixed(2)} unit="pH" color="var(--accent-2)" />
        </div>

        <div style={{ padding: '10px 18px', fontFamily: 'var(--f-mono)', fontSize: 13, color: 'var(--ink-1)' }}>
          <span style={{ color: 'var(--accent)' }}>{D.log.replace('{tick}', `#${sim.tick}`)}</span>
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <h3 className="label-accent" style={{ margin: '0 0 16px', fontWeight: 400 }}>{t('twins.utilityLabel')}</h3>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', border: '1px solid var(--line)' }}>
          {(Array.isArray(features) ? features : []).map((c, i) => (
            <li key={i} style={{ padding: 24, borderLeft: !isMobile && i > 0 ? '1px solid var(--line)' : 'none', borderTop: isMobile && i > 0 ? '1px solid var(--line)' : 'none' }}>
              <div className="mono" style={{ fontSize: 13, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 14 }}>{t('twins.featurePrefix')} · {c.k}</div>
              <h4 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 500 }}>{c.t}</h4>
              <p className="prose" style={{ margin: 0 }}>{c.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
