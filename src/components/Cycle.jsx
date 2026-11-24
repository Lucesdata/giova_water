import React from 'react';
import { Reveal } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import { PROJECT_HASH_PREFIX } from '../data/projects.js';

const href = (slug) => `${PROJECT_HASH_PREFIX}${slug}`;

/* Four figures from past work, each one linked to the project sheet that
   explains it. Static: no counters or expanding tiles. */
export function KeyFigures() {
  const t = useT();
  const scope = t('hero.scope');
  if (!scope || !Array.isArray(scope.items)) return null;
  return (
    <section className="figures" aria-labelledby="figures-title">
      <h2 id="figures-title" className="eyebrow" style={{ margin: '0 0 14px' }}>{scope.title}</h2>
      <ul className="figures-grid">
        {scope.items.map((it) => (
          <li key={it.slug + it.v} className="figure">
            <span className="figure-v">{it.v}</span>
            <span className="figure-l">{it.l}</span>
            <span className="figure-meta">{it.role} · {it.year}</span>
            <a className="figure-link" href={href(it.slug)} aria-label={`${scope.open}: ${it.v} ${it.l}`}>
              {scope.open} <span aria-hidden="true">→</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* How a project goes from need to operation: five stages, each with one piece
   of evidence that opens the project behind it. */
export default function Method() {
  const t = useT();
  const c = t('hero.cycle');
  if (!c || !Array.isArray(c.stages)) return null;
  return (
    <section id="metodo" className="cycle" aria-labelledby="cycle-title">
      <Reveal className="cycle-head">
        <p className="eyebrow">{c.kicker}</p>
        <h2 id="cycle-title" className="h2">{c.title}</h2>
        <p className="prose section-lead">{c.lead}</p>
      </Reveal>
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
    </section>
  );
}
