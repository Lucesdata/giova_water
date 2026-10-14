import React, { useEffect, useId, useRef, useState } from 'react';
import { useOnScreen, usePrefersReducedMotion } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import { PROJECT_HASH_PREFIX, SCOPE_MARKS } from '../data/projects.js';

const href = (slug) => `${PROJECT_HASH_PREFIX}${slug}`;

/* Counts every number in a figure from 0 up to its value, keeping the
   language's own thousands separator ("9 097", "9,097", "16 / 16"). */
const NUM = /\d+(?:[ ,]\d{3})*/g;
export function figureAt(v, progress) {
  if (progress >= 1) return v;
  return v.replace(NUM, (m) => {
    const sep = m.includes(',') ? ',' : m.includes(' ') ? ' ' : '';
    const n = Math.round(parseInt(m.replace(/[ ,]/g, ''), 10) * progress);
    return sep ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep) : String(n);
  });
}

/* Runs once, the first time the tile is on screen; with reduced motion the
   final figure is there from the start. */
function useCountUp(ref, v, ms = 700) {
  const reduced = usePrefersReducedMotion();
  const onScreen = useOnScreen(ref, '0px');
  const [progress, setProgress] = useState(reduced ? 1 : 0);
  const done = useRef(reduced);
  useEffect(() => {
    if (reduced) { setProgress(1); done.current = true; return undefined; }
    if (!onScreen || done.current) return undefined;
    let raf; const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      setProgress(1 - Math.pow(1 - k, 3));
      if (k < 1) raf = requestAnimationFrame(step); else done.current = true;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [onScreen, reduced, ms]);
  return figureAt(v, progress);
}

/* One small drawing per tile: one dot per unit counted, or a segmented line for
   metres of network. Decorative: the figure and its label already say it. */
function Mark({ kind, n }) {
  if (kind === 'line') {
    return <span className="scope-line" aria-hidden="true"><i /></span>;
  }
  return (
    <span className="scope-dots" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => <i key={i} style={{ '--i': i }} />)}
    </span>
  );
}

function ScopeTile({ it, mark, scope }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const figure = useCountUp(ref, it.v);
  const id = useId();
  return (
    <li ref={ref} className="scope-tile" data-open={open ? 'true' : 'false'}>
      <button type="button" className="scope-toggle" aria-expanded={open} aria-controls={id}
              aria-label={`${it.v} ${it.l}. ${open ? scope.collapse : scope.expand}`}
              onClick={() => setOpen((o) => !o)}>
        <span className="scope-meta">
          <span className="scope-role">{it.role}</span>
          <span className="scope-year">{it.year}</span>
        </span>
        <span className="scope-v" aria-hidden="true">{figure}</span>
        <span className="scope-l" aria-hidden="true">{it.l}</span>
        <Mark kind={mark.kind} n={mark.n} />
        <span className="scope-go" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      <div id={id} className="scope-panel" hidden={!open}>
        <p>{it.detail}</p>
        <a className="scope-link" href={href(it.slug)}>{scope.open} <span aria-hidden="true">→</span></a>
      </div>
    </li>
  );
}

/* "Escala de lo que he llevado": four figures, each backed by a project sheet.
   The tile opens in place to say what the figure is and what my part was. */
export function Scope() {
  const t = useT();
  const scope = t('hero.scope');
  if (!scope || !Array.isArray(scope.items)) return null;
  return (
    <section className="scope" aria-label={scope.title}>
      <h2 className="label-accent" style={{ margin: '0 0 14px' }}>{scope.title}</h2>
      <ul className="scope-grid">
        {scope.items.map((it, i) => (
          <ScopeTile key={it.slug + it.v} it={it} mark={SCOPE_MARKS[i] || { kind: 'dots', n: 0 }} scope={scope} />
        ))}
      </ul>
      <p className="scope-note">{scope.note}</p>
    </section>
  );
}

export default function Cycle() {
  const t = useT();
  const c = t('hero.cycle');
  if (!c || !Array.isArray(c.stages)) return null;
  return (
    <section className="cycle" aria-labelledby="cycle-title">
      <div className="cycle-head">
        <p className="label-accent" style={{ margin: '0 0 10px' }}>{c.kicker}</p>
        <h2 id="cycle-title" className="cycle-title">{c.title}</h2>
        <p className="prose cycle-lead">{c.lead}</p>
      </div>
      <ol className="cycle-steps">
        {c.stages.map((s) => (
          <li key={s.n} className="cycle-step">
            <span className="cycle-node" aria-hidden="true">{s.n}</span>
            <h3 className="cycle-name">{s.name}</h3>
            <p className="cycle-does">{s.does}</p>
            <a className="cycle-proof" href={href(s.slug)}>
              <span className="label">{c.proofLabel}</span>
              <span>{s.proof} <span aria-hidden="true">→</span></span>
            </a>
          </li>
        ))}
      </ol>
      <div className="cycle-cta">
        <p>{c.ctaLead}</p>
        <a href="#contacto" className="btn primary">{c.cta} <span aria-hidden="true">→</span></a>
      </div>
    </section>
  );
}
