import React, { useState } from 'react';
import { SectionIndex, Tag } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import { projectsData } from '../data/projects.js';
import { useBreakpoint } from '../hooks/useBreakpoint.js';
import ProjectScheme from './ProjectScheme.jsx';

export function tagLabel(t, tag) {
  return typeof tag === 'string' ? tag : t(`projects.tagLabels.${tag.k}`);
}

function ProjectCard({ p, onOpen }) {
  const t = useT();
  const i18n = t(`projects.data.${p.id}`) || {};
  const metrics = Array.isArray(i18n.metrics) ? i18n.metrics.slice(0, 3) : [];
  const title = i18n.title || p.id;
  return (
    <article className="project-card">
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
        padding: '10px 16px', borderBottom: '1px solid var(--line)',
        fontFamily: 'var(--f-mono)', fontSize: 12, letterSpacing: '0.08em',
      }}>
        <span style={{ color: 'var(--ink-2)' }}>{p.id} · {p.year}</span>
        <span style={{ color: 'var(--accent)', textAlign: 'right' }}>{i18n.cat}</span>
      </div>

      <div style={{ aspectRatio: '16/10', position: 'relative', background: 'var(--bg-2)', borderBottom: '1px solid var(--line)', overflow: 'hidden' }}>
        <ProjectScheme type={p.scheme} label={`${t('projects.schemeBadge')}: ${title}`} />
        <span className="chip" style={{ position: 'absolute', left: 8, bottom: 8 }}>{t('projects.schemeBadge')}</span>
      </div>

      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em', fontFamily: 'var(--f-sans)', lineHeight: 1.3, textWrap: 'balance' }}>{title}</h3>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>{t('projects.cardRole')}</div>
          <p style={{ margin: 0, color: 'var(--ink-1)', fontSize: 14, lineHeight: 1.55 }}>{i18n.role}</p>
        </div>
        <div style={{ flex: 1 }}>
          <div className="label" style={{ marginBottom: 4 }}>{t('projects.cardResult')}</div>
          <p style={{ margin: 0, color: 'var(--ink)', fontSize: 14, lineHeight: 1.55 }}>{i18n.result}</p>
        </div>

        <dl style={{
          display: 'grid', gridTemplateColumns: `repeat(${Math.max(metrics.length, 1)}, minmax(0, 1fr))`, margin: 0,
          borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '12px 0',
        }}>
          {metrics.map((m, i) => (
            <div key={i} style={{ borderLeft: i > 0 ? '1px solid var(--line)' : 'none', paddingLeft: i > 0 ? 10 : 0, paddingRight: 6, minWidth: 0 }}>
              <dt className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', letterSpacing: '0.04em' }}>{m.l}</dt>
              <dd style={{ margin: '2px 0 0', fontFamily: 'var(--f-mono)', fontSize: 14, color: 'var(--ink)', overflowWrap: 'anywhere' }}>{m.v}</dd>
            </div>
          ))}
        </dl>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {p.tags.slice(0, 4).map(tag => <Tag key={tagLabel(t, tag)}>{tagLabel(t, tag)}</Tag>)}
        </div>
        <button type="button" className="btn card-open" onClick={() => onOpen && onOpen(p)} aria-label={`${t('projects.open')}: ${title}`}>
          {t('projects.open')} <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}

export default function Projects({ onOpen }) {
  const { isMobile } = useBreakpoint();
  const t = useT();
  const [filter, setFilter] = useState('all');
  const filters = [
    { id: 'all', label: t('projects.filters.all'), count: projectsData.length },
    { id: 'agua', label: t('projects.filters.agua'), count: projectsData.filter(p => p.filters.includes('agua')).length },
    { id: 'digital', label: t('projects.filters.digital'), count: projectsData.filter(p => p.filters.includes('digital')).length },
  ];
  const visible = filter === 'all' ? projectsData : projectsData.filter(p => p.filters.includes(filter));

  return (
    <section id="proyectos" className="section" aria-labelledby="projects-title">
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: 32, marginBottom: 32 }}>
        <SectionIndex n="02" kicker={t('projects.kicker')} title={t('projects.title')} />
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <h2 id="projects-title" className="h2">
            {t('projects.h2a')} <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', color: 'var(--ink-1)' }}>{t('projects.h2b')}</span>
          </h2>
        </div>
      </div>
      <p style={{ margin: '0 0 24px', color: 'var(--ink-1)', fontSize: 15, lineHeight: 1.6, maxWidth: 680, textWrap: 'pretty' }}>{t('projects.intro')}</p>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
        padding: '8px 0', marginBottom: 32,
      }}>
        <div role="group" aria-label={t('projects.filtersLabel')} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {filters.map(f => (
            <button key={f.id} type="button" className="filter-btn" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
              <span style={{ fontSize: 12, color: 'inherit', opacity: 0.8 }}>[{f.count}]</span>
            </button>
          ))}
        </div>
        <div className="mono" role="status" aria-live="polite" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
          {t('projects.count')} {visible.length}/{projectsData.length}
        </div>
      </div>

      <div className="projects-grid">
        {visible.map(p => <ProjectCard key={p.id} p={p} onOpen={onOpen} />)}
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: 16 }}>
        <a href="#contacto" className="mono text-link">{t('projects.cta')}</a>
      </div>
    </section>
  );
}
