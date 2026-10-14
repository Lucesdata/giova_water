import React, { useState } from 'react';
import { SectionIndex, Reveal } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import { projectsData, projectHash } from '../data/projects.js';
import { sectionNumber } from '../data/sections.js';
import { useBreakpoint } from '../hooks/useBreakpoint.js';
import ProjectScheme from './ProjectScheme.jsx';

export function tagLabel(t, tag) {
  return typeof tag === 'string' ? tag : t(`projects.tagLabels.${tag.k}`);
}

// A plain click opens the project in place; modified clicks (new tab, copy link)
// keep the real address from the href.
const isPlainClick = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/* The card says who the project is, what I was responsible for, the main result
   and where the detail is. Metrics, tags and evidence live in the detail. */
function ProjectCard({ p, onOpen }) {
  const t = useT();
  const i18n = t(`projects.data.${p.id}`) || {};
  const title = i18n.title || p.id;
  return (
    <Reveal as="article" className="project-card">
      <div style={{ aspectRatio: '16/7', position: 'relative', background: 'var(--bg-2)', borderBottom: '1px solid var(--line)', overflow: 'hidden' }}>
        {p.cover ? (
          <>
            <img src={p.cover} alt={i18n.photos?.[0]?.alt || title} width={922} height={518} loading="lazy"
                 style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <span className="chip" style={{ position: 'absolute', left: 8, bottom: 8 }}>{t(p.coverKind === 'capture' ? 'projects.modal.captureBadge' : 'projects.modal.photoBadge')}</span>
          </>
        ) : (
          <>
            <ProjectScheme type={p.scheme} label={`${t('projects.schemeBadge')}: ${title}`} />
            <span className="chip" style={{ position: 'absolute', left: 8, bottom: 8 }}>{t('projects.schemeBadge')}</span>
          </>
        )}
      </div>

      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="mono" style={{ fontSize: 12, letterSpacing: '0.08em', color: 'var(--accent)' }}>
          {i18n.cat} <span style={{ color: 'var(--ink-2)' }}>· {p.year}</span>
        </div>
        <h3 style={{ margin: 0, fontSize: 19, fontWeight: 500, letterSpacing: '-0.01em', fontFamily: 'var(--f-sans)', lineHeight: 1.3, textWrap: 'balance' }}>{title}</h3>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>{t('projects.cardRole')}</div>
          <p className="prose" style={{ margin: 0, fontSize: 16 }}>{i18n.role}</p>
        </div>
        <div style={{ flex: 1 }}>
          <div className="label" style={{ marginBottom: 4 }}>{t('projects.cardResult')}</div>
          <p className="prose" style={{ margin: 0, fontSize: 16, color: 'var(--ink)' }}>{i18n.result}</p>
        </div>
        <a href={projectHash(p)} className="btn card-open"
           onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); onOpen?.(p); } }}
           aria-label={`${t('projects.open')}: ${title}`}>
          {t('projects.open')} <span aria-hidden="true">→</span>
        </a>
      </div>
    </Reveal>
  );
}

export default function Projects({ onOpen }) {
  const { isMobile } = useBreakpoint();
  const t = useT();
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(false);
  const total = projectsData.length;
  const filters = [
    { id: 'all', label: t('projects.filters.all'), count: total },
    { id: 'agua', label: t('projects.filters.agua'), count: projectsData.filter(p => p.filters.includes('agua')).length },
    { id: 'digital', label: t('projects.filters.digital'), count: projectsData.filter(p => p.filters.includes('digital')).length },
  ];
  // The selection shows the featured projects only while no category is chosen
  // and "see all" has not been used; choosing a category always lists all of it.
  const showAll = expanded || filter !== 'all';
  const pool = filter === 'all' ? projectsData : projectsData.filter(p => p.filters.includes(filter));
  const visible = showAll ? pool : pool.filter(p => p.featured);
  const canCollapse = expanded && filter === 'all';
  const showToggle = !showAll || canCollapse;

  const pick = (id) => { setFilter(id); if (id === 'all') setExpanded(true); };

  return (
    <section id="proyectos" className="section" aria-labelledby="projects-title">
      <Reveal style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: isMobile ? 16 : 32, marginBottom: 24 }}>
        <SectionIndex n={sectionNumber('proyectos')} kicker={t('projects.kicker')} title={t('projects.title')} />
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <h2 id="projects-title" className="h2">
            {t('projects.h2a')} <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', color: 'var(--ink-1)' }}>{t('projects.h2b')}</span>
          </h2>
        </div>
      </Reveal>
      <p className="prose" style={{ margin: '0 0 24px', maxWidth: 680 }}>{t('projects.intro')}</p>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
        padding: '10px 0', marginBottom: 24,
      }}>
        <div role="group" aria-label={t('projects.filtersLabel')} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {filters.map(f => (
            <button key={f.id} type="button" className="filter-btn" aria-pressed={filter === f.id && (f.id !== 'all' || showAll)} onClick={() => pick(f.id)}>
              {f.label}
              <span style={{ fontSize: 13, color: 'inherit', opacity: 0.85 }}>[{f.count}]</span>
            </button>
          ))}
        </div>
        <div className="mono" role="status" aria-live="polite" style={{ fontSize: 13, color: 'var(--ink-2)' }}>
          {t(showAll ? 'projects.status' : 'projects.statusFeatured', { n: visible.length, total })}
        </div>
      </div>

      <div className="projects-grid" id="lista-proyectos">
        {visible.map(p => <ProjectCard key={p.id} p={p} onOpen={onOpen} />)}
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderTop: '1px solid var(--line)', paddingTop: 20 }}>
        {showToggle ? (
          <button type="button" className="btn primary" aria-controls="lista-proyectos" aria-expanded={showAll}
                  onClick={() => setExpanded(e => !e)}>
            {showAll ? t('projects.showFeatured') : t('projects.seeAll', { total })}
          </button>
        ) : <span />}
        <a href="#contacto" className="mono text-link">{t('projects.cta')}</a>
      </div>
    </section>
  );
}
