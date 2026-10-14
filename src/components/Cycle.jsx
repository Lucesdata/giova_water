import React from 'react';
import { useT } from '../i18n.jsx';
import { PROJECT_HASH_PREFIX } from '../data/projects.js';

const href = (slug) => `${PROJECT_HASH_PREFIX}${slug}`;

/* "Lo que mejor sé hacer": the full chain from need to operation, one stage per
   step, each backed by a real project of the portfolio. Nothing here is a new
   claim: every figure repeats what the project sheets already say. */
export function Scope() {
  const t = useT();
  const scope = t('hero.scope');
  if (!scope || !Array.isArray(scope.items)) return null;
  return (
    <section className="scope" aria-label={scope.title}>
      <h2 className="label-accent" style={{ margin: '0 0 14px' }}>{scope.title}</h2>
      <ul className="scope-grid">
        {scope.items.map((it) => (
          <li key={it.slug + it.v}>
            <a className="scope-tile" href={href(it.slug)} aria-label={`${it.v} ${it.l}. ${scope.open}`}>
              <span className="scope-v">{it.v}</span>
              <span className="scope-l">{it.l}</span>
              <span className="scope-go" aria-hidden="true">→</span>
            </a>
          </li>
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
