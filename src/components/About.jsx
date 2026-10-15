import React from 'react';
import { SectionIndex, Reveal } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';
import { sectionNumber } from '../data/sections.js';

function interpolate(template, replacements) {
  if (typeof template !== 'string') return template;
  const parts = template.split(/(\{\w+\})/);
  return parts.map((part, i) => {
    const m = part.match(/^\{(\w+)\}$/);
    if (m && replacements[m[1]] !== undefined) {
      return <React.Fragment key={i}>{replacements[m[1]]}</React.Fragment>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/* Chronology, most recent first: when, role and where in the summary; a line
   about what I did in the disclosure (native <details>, no scripting). The
   results of each job live in the projects, not here. The first one starts open
   so it is clear the rest open too. */
function Timeline({ rows, label, summary }) {
  return (
    <div className="profile-timeline">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
        <h3 className="label-accent" style={{ margin: 0, fontWeight: 400 }}>{label}</h3>
        <div aria-hidden="true" style={{ flex: 1, height: 1, background: 'var(--line)', minWidth: 24 }}/>
        <span className="mono" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{summary}</span>
      </div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {(Array.isArray(rows) ? rows : []).map((r, i) => (
          <li key={i} className="timeline-row">
            <details open={i === 0}>
              <summary>
                <span className="timeline-when">
                  <span className="mono" style={{ fontSize: 14, color: 'var(--accent)' }}>{r.year}</span>
                  <span className="mono" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{r.location}</span>
                </span>
                <span style={{ minWidth: 0 }}>
                  <h4 style={{ margin: 0, fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.35 }}>{r.role}</h4>
                  <span className="mono" style={{ display: 'block', fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>{r.org}</span>
                </span>
              </summary>
              <p className="prose timeline-body">{r.body}</p>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function About() {
  const { isMobile } = useBreakpoint();
  const t = useT();
  const rows = t('about.timeline.rows');
  const card = t('about.card');
  const bold = (txt) => <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{txt}</strong>;

  return (
    <section id="sobre" className="section" aria-labelledby="about-title">
      <Reveal style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: isMobile ? 16 : 32, marginBottom: 32 }}>
        <SectionIndex n={sectionNumber('sobre')} kicker={t('about.kicker')} title={t('about.title')} />
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <h2 id="about-title" className="h2">
            {t('about.h2a')} <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', color: 'var(--ink-1)' }}>{t('about.h2b')}</span> {t('about.h2c')}
          </h2>
        </div>
      </Reveal>

      <div className="profile-grid">
        <div className="profile-card" style={{ border: '1px solid var(--line-hi)', background: 'var(--bg-1)' }}>
          <div className="portrait">
            <img src="/assets/giovanni-portrait.jpg" alt={card.photoAlt} loading="lazy" width="933" height="1400"/>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 17, fontWeight: 500, color: 'var(--ink)', marginBottom: 6 }}>
              Giovanni X. Guevara Duque
            </div>
            <div className="label-accent" style={{ marginBottom: 14 }}>{card.role}</div>
            <dl style={{ display: 'grid', gap: 10, margin: 0, padding: '14px 0 0', borderTop: '1px solid var(--line)' }}>
              <div>
                <dt className="label">{card.formation}</dt>
                <dd className="mono" style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>{card.formationValue}</dd>
              </div>
              <div>
                <dt className="label">{card.license}</dt>
                <dd className="mono" style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>{card.licenseValue}</dd>
              </div>
              <div>
                <dt className="label">{card.locationLabel}</dt>
                <dd className="mono" style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--ink-1)', lineHeight: 1.5 }}>{card.location}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="profile-text" style={{ minWidth: 0 }}>
          <p className="prose" style={{ fontSize: 18, color: 'var(--ink)', margin: '0 0 16px', maxWidth: 700 }}>
            {interpolate(t('about.bio1'), { years: bold(t('about.bio1Years')) })}
          </p>
          <p className="prose" style={{ margin: '0 0 16px', maxWidth: 700 }}>{t('about.bio2')}</p>
          <p className="prose" style={{ margin: '0 0 16px', maxWidth: 700 }}>
            {interpolate(t('about.bio3'), { iotio: bold(t('about.bio3Iotio')) })}
          </p>
          <p className="prose" style={{ margin: 0, maxWidth: 700, fontSize: 15, color: 'var(--ink-2)' }}>
            {t('about.note')} <a href="#inicio" className="text-link">{t('about.methodLink')}</a>
          </p>
        </div>

        <Timeline rows={rows} label={t('about.timeline.label')} summary={t('about.timeline.summary')} />
      </div>
    </section>
  );
}
