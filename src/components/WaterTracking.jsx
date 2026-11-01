import React, { useState, useEffect, useMemo } from 'react';
import { SectionIndex, Reveal } from './primitives.jsx';
import { sectionNumber } from '../data/sections.js';
import { useT } from '../i18n.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';
import {
  STAGE_IDS, STAGE_SPEC, LIMITS, TURB_TARGET, CT_MIN,
  defaultPlant, sanitizePlant, evaluatePlant,
} from '../lib/plantModel.js';

const STORAGE = 'giova_water:watertracking';
const fmt = (v, d = 1) => (v == null ? '—' : v >= 100 ? v.toFixed(0) : v.toFixed(d));
const colorOf = (s) => (s === 'warn' ? 'var(--warn)' : s === 'ok' ? 'var(--accent)' : 'var(--ink-2)');

function loadPlant() {
  try { return sanitizePlant(JSON.parse(window.localStorage?.getItem(STORAGE))); } catch { return defaultPlant(); }
}

function Slider({ id, label, unit, value, min, max, onChange }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label htmlFor={id} className="label" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span>{label}</span>
        <span className="mono" style={{ color: 'var(--ink)' }}>{value} {unit}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step="1" value={value}
             onChange={(e) => onChange(Number(e.target.value))}
             style={{ padding: 0, accentColor: 'var(--accent)' }} />
    </div>
  );
}

function StageCard({ i, spec, row, cfg, copy, W, onChange }) {
  const id = row.id;
  const nameId = `wt-${id}`;
  const sizeKey = spec.size?.key;
  return (
    <li style={{ border: '1px solid var(--line)', borderLeft: `3px solid ${colorOf(row.status)}`, padding: 16, display: 'grid', gap: 10, opacity: cfg.enabled ? 1 : 0.65 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label htmlFor={nameId} style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', minHeight: 44 }}>
          <input id={nameId} type="checkbox" checked={cfg.enabled} style={{ width: 20, minHeight: 0, padding: 0 }}
                 onChange={(e) => onChange({ enabled: e.target.checked })} />
          <span className="mono" style={{ fontSize: 13, color: 'var(--accent)' }}>{String(i + 1).padStart(2, '0')}</span>
          <span style={{ fontSize: 16, fontWeight: 500 }}>{copy.name}</span>
        </label>
        <span className="mono" style={{ fontSize: 12, color: colorOf(row.status), letterSpacing: '0.06em' }}>
          ● {W.status[row.status]}{row.side ? ` · ${W.side[row.side]}` : ''}
        </span>
      </div>
      <p className="prose" style={{ margin: 0, fontSize: 14 }}>{copy.desc}</p>

      {cfg.enabled && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'end' }}>
          {spec.size && (
            <div style={{ display: 'grid', gap: 4, width: 140 }}>
              <label htmlFor={`${nameId}-size`} className="label">{copy.sizeLabel} ({spec.size.unit})</label>
              <input id={`${nameId}-size`} type="number" inputMode="decimal" min={spec.size.min} max={spec.size.max} value={cfg[sizeKey]}
                     onChange={(e) => onChange({ [sizeKey]: e.target.value })} />
            </div>
          )}
          {spec.dose && (
            <div style={{ display: 'grid', gap: 4, width: 140 }}>
              <label htmlFor={`${nameId}-dose`} className="label">{copy.doseLabel} (mg/L)</label>
              <input id={`${nameId}-dose`} type="number" inputMode="decimal" step="0.1" min={spec.dose.min} max={spec.dose.max} value={cfg.dose}
                     onChange={(e) => onChange({ dose: e.target.value })} />
            </div>
          )}
          {spec.metric && (
            <div>
              <div className="label">{copy.metricLabel}</div>
              <div className="mono" style={{ fontSize: 20, color: 'var(--ink)' }}>
                {fmt(row.metric)} <span style={{ fontSize: 12, color: 'var(--ink-1)' }}>{spec.unit}</span>
              </div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                {W.typical}: {spec.range[1] === Infinity ? `≥ ${spec.range[0]}` : `${spec.range[0]}–${spec.range[1]}`}
              </div>
            </div>
          )}
          {id !== 'disinfection' && (
            <div>
              <div className="label">{W.turbidity}</div>
              <div className="mono" style={{ fontSize: 14, color: 'var(--ink-1)' }}>{fmt(row.turbIn)} → {fmt(row.turbOut)} NTU</div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export default function WaterTracking() {
  const t = useT();
  const { isMobile } = useBreakpoint();
  const W = t('watertracking');
  const [plant, setPlant] = useState(loadPlant);
  const result = useMemo(() => evaluatePlant(plant), [plant]);

  useEffect(() => {
    try { window.localStorage?.setItem(STORAGE, JSON.stringify(plant)); } catch {}
  }, [plant]);

  const setTop = (k) => (v) => setPlant((p) => ({ ...p, [k]: v }));
  const setStage = (id) => (patch) => setPlant((p) => ({ ...p, stages: { ...p.stages, [id]: { ...p.stages[id], ...patch } } }));
  const reset = () => setPlant(defaultPlant());

  // Typing "" or "-" must not blow up the model: evaluate a clamped copy, keep what was typed.
  const safe = result.plant;
  const verdictColor = result.verdict === 'ok' ? 'var(--accent)' : result.verdict === 'warn' ? 'var(--warn)' : 'var(--alert)';

  return (
    <section id="watertracking" className="section" aria-labelledby="watertracking-title">
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: isMobile ? 16 : 32, marginBottom: 32 }}>
        <SectionIndex n={sectionNumber('watertracking')} kicker={W.kicker} title={W.title} />
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <h2 id="watertracking-title" className="h2">
            {W.h2a} <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', color: 'var(--ink-1)' }}>{W.h2b}</span>
          </h2>
        </div>
      </div>

      <p className="prose" style={{ maxWidth: 760, margin: '0 0 8px' }}>{W.intro}</p>
      <p style={{ margin: '0 0 28px' }}>
        <span className="chip">{W.badge}</span>{' '}
        <span className="mono" style={{ fontSize: 13, color: 'var(--ink-1)' }}>{W.disclaimer}</span>
      </p>

      <Reveal style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 20, minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 20, border: '1px solid var(--line)', padding: 16 }}>
            <Slider id="wt-q" label={W.flow} unit="L/s" value={safe.q} min={LIMITS.q.min} max={LIMITS.q.max} onChange={setTop('q')} />
            <Slider id="wt-turb" label={W.inletTurbidity} unit="NTU" value={safe.turb} min={LIMITS.turb.min} max={LIMITS.turb.max} onChange={setTop('turb')} />
          </div>
          <ol aria-label={W.trainLabel} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
            {STAGE_IDS.map((id, i) => (
              <StageCard key={id} i={i} spec={STAGE_SPEC[id]} row={result.stages[i]} cfg={plant.stages[id]}
                         copy={W.stages[id]} W={W} onChange={setStage(id)} />
            ))}
          </ol>
        </div>

        <aside role="status" aria-label={W.results.title}
               style={{ border: '1px solid var(--line-hi)', padding: 20, display: 'grid', gap: 16, position: isMobile ? 'static' : 'sticky', top: 'calc(var(--nav-h, 96px) + 16px)', minWidth: 0 }}>
          <div className="label-accent">{W.results.title}</div>
          <div className="mono" style={{ fontSize: 13, color: verdictColor, letterSpacing: '0.06em' }}>● {W.results.verdict[result.verdict]}</div>
          <dl style={{ display: 'flex', gap: 24, flexWrap: 'wrap', margin: 0 }}>
            <div>
              <dd style={{ margin: 0, fontFamily: 'var(--f-mono)', fontSize: 28, color: 'var(--ink)' }}>{fmt(result.turbOut, 2)} <span style={{ fontSize: 13, color: 'var(--ink-1)' }}>NTU</span></dd>
              <dt className="label">{W.results.outTurbidity}</dt>
            </div>
            <div>
              <dd style={{ margin: 0, fontFamily: 'var(--f-mono)', fontSize: 28, color: 'var(--ink)' }}>{fmt(result.ct)} <span style={{ fontSize: 13, color: 'var(--ink-1)' }}>mg·min/L</span></dd>
              <dt className="label">CT</dt>
            </div>
          </dl>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {result.checks.map((c) => (
              <li key={c.id} className="prose" style={{ fontSize: 14, display: 'flex', gap: 8 }}>
                <span aria-hidden="true" style={{ color: c.ok ? 'var(--accent)' : 'var(--warn)' }}>{c.ok ? '✓' : '!'}</span>
                <span>{W.results.checks[c.id].replace('{turb}', TURB_TARGET).replace('{ct}', CT_MIN)}{' '}
                  <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>[{c.ok ? W.results.pass : W.results.review}]</span>
                </span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn" onClick={reset}>{W.reset}</button>
            <a href="#contacto" className="btn primary">{W.cta}</a>
          </div>
          <p className="mono" style={{ margin: 0, fontSize: 12, color: 'var(--ink-2)' }}>{W.storageNote}</p>
        </aside>
      </Reveal>
    </section>
  );
}
