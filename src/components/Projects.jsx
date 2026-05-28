import React, { useState, useRef, useEffect } from 'react';
import { SectionIndex, Tag } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import { projectsData } from '../data/projects.js';
import { useBreakpoint } from '../hooks/useBreakpoint.js';

function ProjectCard({ p, onOpen }) {
  const { isMobile } = useBreakpoint();
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isMobile || !p.video) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.4 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [isMobile, p.video]);

  const t = useT();
  const [hover, setHover] = useState(false);
  const i18n = t(`projects.data.${p.id}`) || {};
  const metrics = p.metricKeys.map(k => ({ k, v: i18n.metrics?.[k] ?? '—' }));
  return (
    <article
      ref={cardRef}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: '1px solid var(--line)',
        background: 'var(--bg-1)',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
        transition: 'border-color 200ms, transform 200ms',
        borderColor: hover ? 'var(--accent-line)' : 'var(--line)',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px', borderBottom: '1px solid var(--line)',
        fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.1em',
      }}>
        <span style={{ color: 'var(--ink-3)' }}>{p.id}</span>
        <span style={{ color: 'var(--accent)' }}>{i18n.cat}</span>
      </div>

      <div style={{
        aspectRatio: '16/10',
        position: 'relative',
        background: `linear-gradient(135deg, ${p.color}55 0%, ${p.color}22 100%), var(--bg-2)`,
        borderBottom: '1px solid var(--line)',
        overflow: 'hidden',
      }}>
        {p.image ? (
          <>
            <img src={p.image} alt={i18n.title || p.id} loading="lazy" style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', filter: 'saturate(0.85) contrast(1.05)',
              transform: hover ? 'scale(1.03)' : 'scale(1)', transition: 'transform 500ms var(--ease)',
            }}/>
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 40%, rgba(6,9,12,0.55) 100%)' }}/>
          </>
        ) : (
          <>
            <svg aria-hidden="true" width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
              <defs>
                <pattern id={`grid-${p.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--line-2)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#grid-${p.id})`}/>
            </svg>
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 16,
              border: '1px dashed var(--line-hi)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 10,
            }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.15em' }}>
                [ PROJECT FIGURE · 640×400 ]
              </span>
              <span className="mono" style={{ fontSize: 9.5, color: 'var(--ink-3)' }}>{p.loc} · {p.year}</span>
            </div>
          </>
        )}
        {p.video && (
          <video
            aria-hidden="true"
            src={p.video}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isMobile ? (visible ? 1 : 0) : (hover ? 1 : 0),
              transition: 'opacity 350ms var(--ease)',
            }}
          />
        )}
        {[[8,8],[null,8],[8,null],[null,null]].map(([l,top],i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute',
            left: l !== null ? l : 'auto', right: l === null ? 8 : 'auto',
            top: top !== null ? top : 'auto', bottom: top === null ? 8 : 'auto',
            width: 8, height: 8,
            borderColor: 'var(--accent)', borderStyle: 'solid',
            borderWidth: `${top !== null ? 1 : 0}px ${l === null ? 1 : 0}px ${top === null ? 1 : 0}px ${l !== null ? 1 : 0}px`,
            transition: 'opacity 200ms',
            opacity: hover ? 1 : 0.5,
          }}/>
        ))}
      </div>

      <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          margin: '0 0 4px',
          fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em',
          fontFamily: 'var(--f-sans)',
        }}>{i18n.title}</h3>
        <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 12 }}>
          {i18n.subtitle}
        </div>
        <p style={{ margin: '0 0 16px', color: 'var(--ink-1)', fontSize: 13, lineHeight: 1.55, flex: 1 }}>
          {i18n.body}
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
          padding: '10px 0', marginBottom: 14,
        }}>
          {metrics.map((m, i) => (
            <div key={i} style={{ borderLeft: i > 0 ? '1px solid var(--line)' : 'none', paddingLeft: i > 0 ? 10 : 0 }}>
              <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>{m.k.toUpperCase()}</div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 14, color: 'var(--ink)' }}>{m.v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {p.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
          </div>
          <button
            onClick={() => onOpen && onOpen(p)}
            aria-label={`${t('projects.open')} ${i18n.title || p.id}`}
            style={{
              background: 'transparent', border: 'none',
              cursor: 'pointer', padding: '4px 0',
              fontFamily: 'var(--f-mono)', fontSize: 11,
              color: hover ? 'var(--accent)' : 'var(--ink-2)',
              transition: 'color 160ms',
            }}>
            {t('projects.open')}
          </button>
        </div>
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
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: 32, marginBottom: 48 }}>
        <SectionIndex n="02" kicker={t('projects.kicker')} title={t('projects.title')} />
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <h2 id="projects-title" style={{
            margin: 0, fontFamily: 'var(--f-mono)',
            fontSize: 'clamp(34px, 4.2vw, 56px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.05,
          }}>
            {t('projects.h2a')} <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', color: 'var(--ink-1)' }}>{t('projects.h2b')}</span>
          </h2>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{t('projects.count')} · {visible.length}/{projectsData.length}</span>
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
        padding: '12px 0', marginBottom: 32,
      }} role="tablist" aria-label="Filtros de categoría">
        <div style={{ display: 'flex', gap: 0 }}>
          {filters.map((f, i) => (
            <button key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              style={{
                background: 'transparent',
                border: 'none',
                borderLeft: i > 0 ? '1px solid var(--line)' : 'none',
                padding: '4px 18px',
                fontFamily: 'var(--f-mono)',
                fontSize: 11,
                letterSpacing: '0.1em',
                color: filter === f.id ? 'var(--accent)' : 'var(--ink-2)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              {filter === f.id && <span aria-hidden="true" style={{ width: 4, height: 4, background: 'var(--accent)', borderRadius: '50%' }}/>}
              {f.label}
              <span style={{ fontSize: 9, color: 'var(--ink-3)' }}>[{f.count}]</span>
            </button>
          ))}
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{t('projects.sort')}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
        {visible.map(p => <ProjectCard key={p.id} p={p} onOpen={onOpen} />)}
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 14 }}>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{t('projects.end')} · {visible.length} {t('projects.entries')}</span>
        <a href="#contacto" className="mono" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>
          {t('projects.cta')}
        </a>
      </div>
    </section>
  );
}
