import React from 'react';
import { useInView, SectionIndex, Tag, Copyable, usePrefersReducedMotion } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';
import { projectById } from '../data/projects.js';
import { CONTACT } from '../lib/contact.js';

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

// Each competence points at the projects where it was applied (ids only; the
// text lives in i18n under about.skills.items.<key>).
const COMPETENCIAS = [
  { key: 'hidraulica', projects: ['P-006', 'P-002', 'P-001'] },
  { key: 'procesos', projects: ['P-001', 'P-005'] },
  { key: 'presupuestos', projects: ['P-007'] },
  { key: 'scada', projects: ['P-007', 'P-004', 'P-002'] },
  { key: 'datos', projects: ['P-002'] },
  { key: 'gemelos', projects: ['P-003'] },
];

const TIMELINE_TAGS = [
  ['EPA-SWMM', 'P&IDs', 'CVC'],
  ['P&IDs', 'SCADA', 'Industrial'],
  ['EPANET', 'Python', 'Power BI', 'SCADA'],
  ['EPA-SWMM', 'PSMV', 'Manning', 'Res.330/2017'],
  ['UPEC', 'M.Eng.', 'CPQCOL'],
];

function Competencia({ skill, projects, onOpenProject, label }) {
  const t = useT();
  const I = t(`about.skills.items.${skill}`);
  return (
    <li style={{ border: '1px solid var(--line)', background: 'var(--bg-1)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h4 style={{ margin: 0, fontFamily: 'var(--f-mono)', fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{I.name}</h4>
      <p style={{ margin: 0, color: 'var(--ink-1)', fontSize: 14, lineHeight: 1.6, flex: 1 }}>{I.uses}</p>
      <div>
        <div className="label" style={{ marginBottom: 8 }}>{label}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {projects.map(id => {
            const p = projectById(id);
            if (!p) return null;
            const title = t(`projects.data.${id}.title`);
            return (
              <button key={id} type="button" className="chip-btn" onClick={() => onOpenProject?.(p)} aria-label={`${id} · ${title}`}>
                {id}
              </button>
            );
          })}
        </div>
      </div>
    </li>
  );
}

function TimelineRow({ year, role, org, body, location, tags }) {
  const { isMobile } = useBreakpoint();
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView({ threshold: 0.2 });
  const shown = inView || reduced;
  return (
    <div ref={ref} style={{
      display: 'grid', gridTemplateColumns: isMobile ? '88px 1fr' : '140px 1fr',
      gap: isMobile ? 16 : 32, padding: '28px 0',
      borderTop: '1px solid var(--line)',
      opacity: shown ? 1 : 0,
      transform: shown ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 700ms var(--ease), transform 700ms var(--ease)',
    }}>
      <div>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 13, color: 'var(--accent)', letterSpacing: '0.04em' }}>{year}</div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 6 }}>{location}</div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
          <h4 style={{ margin: 0, fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em' }}>{role}</h4>
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>/ {org}</span>
        </div>
        <p style={{ margin: '0 0 14px', color: 'var(--ink-1)', fontSize: 14, lineHeight: 1.65, maxWidth: 680 }}>{body}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
        </div>
      </div>
    </div>
  );
}

export default function About({ onOpenProject }) {
  const { isMobile } = useBreakpoint();
  const t = useT();
  const rows = t('about.timeline.rows');
  const card = t('about.card');
  const cycle = t('about.cycle');
  const budgets = t('about.budgets');
  const bold = (txt) => <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{txt}</strong>;

  return (
    <section id="sobre" className="section" aria-labelledby="about-title">
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: 32, marginBottom: 48 }}>
        <SectionIndex n="01" kicker={t('about.kicker')} title={t('about.title')} />
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <h2 id="about-title" className="h2">
            {t('about.h2a')} <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', color: 'var(--ink-1)' }}>{t('about.h2b')}</span> {t('about.h2c')}
          </h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '340px minmax(0, 1fr)', gap: isMobile ? 32 : 48 }}>
        <div>
          <div style={{ border: '1px solid var(--line-hi)', background: 'var(--bg-1)' }}>
            <div style={{ aspectRatio: '3/4', position: 'relative', borderBottom: '1px solid var(--line)', overflow: 'hidden', background: 'var(--bg-2)' }}>
              <img src="/assets/giovanni-portrait.jpg" alt={card.photoAlt}
                loading="lazy"
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  objectPosition: 'center 22%',
                  filter: 'saturate(0.85) contrast(1.05)',
                }}/>
              {[[8,8],[null,8],[8,null],[null,null]].map(([l,top],i) => (
                <div key={i} aria-hidden="true" style={{
                  position: 'absolute', width: 12, height: 12,
                  left: l !== null ? l : undefined, right: l === null ? 8 : undefined,
                  top: top !== null ? top : undefined, bottom: top === null ? 8 : undefined,
                  borderColor: 'var(--accent)', borderStyle: 'solid',
                  borderWidth: `${top !== null ? 1.5 : 0}px ${l === null ? 1.5 : 0}px ${top === null ? 1.5 : 0}px ${l !== null ? 1.5 : 0}px`,
                }}/>
              ))}
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 16, fontWeight: 500, color: 'var(--ink)', marginBottom: 6 }}>
                Giovanni X. Guevara Duque
              </div>
              <div className="label-accent" style={{ marginBottom: 16 }}>{card.role}</div>

              <dl style={{ display: 'grid', gap: 12, margin: '0 0 16px', padding: '14px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <dt className="label">{card.exp}</dt>
                  <dd className="mono" style={{ margin: '2px 0 0', fontSize: 15, color: 'var(--ink)' }}>{card.years}</dd>
                </div>
                <div>
                  <dt className="label">{card.langs}</dt>
                  <dd className="mono" style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--ink-1)', lineHeight: 1.5 }}>{card.langsValue}</dd>
                </div>
              </dl>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div className="mono" style={{ fontSize: 13, color: 'var(--ink-1)', padding: '8px 0' }}>{card.location}</div>
                <Copyable value={CONTACT.phone} ariaLabel={t('common.copyPhone')}>
                  <span className="mono" style={{ fontSize: 13, color: 'var(--ink-1)' }}>{CONTACT.phone}</span>
                </Copyable>
                <Copyable value={CONTACT.email} ariaLabel={t('common.copyEmail')}>
                  <span className="mono" style={{ fontSize: 13, color: 'var(--ink-1)' }}>{CONTACT.email}</span>
                </Copyable>
              </div>
            </div>
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <p className="dropcap" style={{ fontSize: 18, lineHeight: 1.65, color: 'var(--ink)', margin: '0 0 20px', maxWidth: 680, textWrap: 'pretty' }}>
            {interpolate(t('about.bio1'), { years: bold(t('about.bio1Years')) })}
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ink-1)', margin: '0 0 18px', maxWidth: 680, textWrap: 'pretty' }}>
            {t('about.bio2')}
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ink-1)', margin: '0 0 40px', maxWidth: 680, textWrap: 'pretty' }}>
            {interpolate(t('about.bio3'), { iotio: bold(t('about.bio3Iotio')) })}
          </p>

          <h3 className="label-accent" style={{ margin: '0 0 8px', fontWeight: 400 }}>{cycle.label}</h3>
          <p style={{ margin: '0 0 20px', fontFamily: 'var(--f-mono)', fontSize: 18, color: 'var(--ink)', maxWidth: 560 }}>{cycle.title}</p>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}>
            {(Array.isArray(cycle.steps) ? cycle.steps : []).map((s, i) => (
              <li key={i} style={{ border: '1px solid var(--line)', background: 'var(--bg-1)', padding: 16 }}>
                <div className="mono" style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 8 }}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 14, color: 'var(--ink)', marginBottom: 6 }}>{s.t}</div>
                <p style={{ margin: 0, color: 'var(--ink-1)', fontSize: 13, lineHeight: 1.55 }}>{s.d}</p>
              </li>
            ))}
          </ol>
          <p style={{ margin: '16px 0 0', color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.55, maxWidth: 620 }}>{cycle.note}</p>
        </div>
      </div>

      <div style={{ marginTop: 72 }}>
        <h3 className="label-accent" style={{ margin: '0 0 20px', fontWeight: 400 }}>{t('about.skills.label')}</h3>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))' }}>
          {COMPETENCIAS.map(c => (
            <Competencia key={c.key} skill={c.key} projects={c.projects} onOpenProject={onOpenProject} label={t('about.skills.appliedIn')} />
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 72 }} aria-labelledby="budgets-title" role="region">
        <h3 id="budgets-title" className="label-accent" style={{ margin: '0 0 8px', fontWeight: 400 }}>{budgets.label}</h3>
        <p style={{ margin: '0 0 8px', fontFamily: 'var(--f-mono)', fontSize: 18, color: 'var(--ink)' }}>{budgets.title}</p>
        <p style={{ margin: '0 0 20px', color: 'var(--ink-1)', fontSize: 14, lineHeight: 1.6, maxWidth: 720 }}>{budgets.intro}</p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))' }}>
          {(Array.isArray(budgets.items) ? budgets.items : []).map((b, i) => (
            <li key={i} style={{ border: '1px solid var(--line-hi)', background: 'var(--bg-1)', padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="label-accent">{b.tag}</span>
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 'clamp(17px, 1.6vw, 20px)', color: 'var(--ink)', letterSpacing: '-0.01em', overflowWrap: 'anywhere' }}>{b.v}</span>
              <span style={{ color: 'var(--ink-1)', fontSize: 13, lineHeight: 1.55 }}>{b.d}</span>
            </li>
          ))}
        </ul>
        <p style={{ margin: '16px 0 0', color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.55, maxWidth: 720 }}>{budgets.note}</p>
      </div>

      <div style={{ marginTop: 80 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 24 }}>
          <h3 className="label-accent" style={{ margin: 0, fontWeight: 400 }}>{t('about.timeline.label')}</h3>
          <div aria-hidden="true" style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('about.timeline.summary')}</span>
        </div>
        {(Array.isArray(rows) ? rows : []).map((r, i) => (
          <TimelineRow key={i} {...r} tags={TIMELINE_TAGS[i] || []} />
        ))}
      </div>
    </section>
  );
}
