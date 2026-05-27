import React, { useEffect, useRef } from 'react';
import { Tag, useBodyScrollLock } from './primitives.jsx';
import { useT } from '../i18n.jsx';

export default function ProjectModal({ project, onClose }) {
  const t = useT();
  const closeRef = useRef(null);
  const lastFocusedRef = useRef(null);
  useBodyScrollLock(!!project);

  useEffect(() => {
    if (!project) return;
    lastFocusedRef.current = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      lastFocusedRef.current?.focus?.();
    };
  }, [project, onClose]);

  if (!project) return null;

  const i18n = t(`projects.data.${project.id}`) || {};
  const M = t('projects.modal');
  const metrics = project.metricKeys.map(k => ({ k, v: i18n.metrics?.[k] ?? '—' }));
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#proyectos`
    : '';

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-panel">
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--line-hi)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: 'var(--f-mono)', fontSize: 11,
        }}>
          <span style={{ color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
            {project.id} · <span style={{ color: 'var(--accent)' }}>{i18n.cat}</span>
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label={M.close}
            style={{
              background: 'transparent', border: '1px solid var(--line-2)',
              color: 'var(--ink-1)', cursor: 'pointer',
              padding: '6px 12px', fontFamily: 'inherit', fontSize: 11,
              letterSpacing: '0.08em',
            }}>
            {M.close} ✕
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {project.image && (
            <div style={{ position: 'relative', borderBottom: '1px solid var(--line)', background: 'var(--bg-2)' }}>
              <img src={project.image} alt={i18n.title || project.id}
                style={{ width: '100%', maxHeight: 380, objectFit: 'cover', display: 'block', filter: 'saturate(0.9) contrast(1.05)' }}/>
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, transparent 40%, rgba(6,9,12,0.6) 100%)' }}/>
            </div>
          )}

          <div style={{ padding: '28px 32px' }}>
            <h2 id="modal-title" style={{
              margin: '0 0 8px',
              fontFamily: 'var(--f-mono)', fontWeight: 500,
              fontSize: 'clamp(24px, 3vw, 34px)',
              letterSpacing: '-0.02em', lineHeight: 1.1,
            }}>{i18n.title}</h2>
            <div className="mono" style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 24 }}>
              {i18n.subtitle}
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
              padding: '14px 0', marginBottom: 24, gap: 16,
            }}>
              <div>
                <div className="label" style={{ marginBottom: 4 }}>{M.location}</div>
                <div className="mono" style={{ fontSize: 13, color: 'var(--ink)' }}>{project.loc}</div>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 4 }}>{M.period}</div>
                <div className="mono" style={{ fontSize: 13, color: 'var(--ink)' }}>{project.year}</div>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 4 }}>{M.category}</div>
                <div className="mono" style={{ fontSize: 13, color: 'var(--ink)' }}>{i18n.cat}</div>
              </div>
            </div>

            <div className="label-accent" style={{ marginBottom: 10 }}>— {M.overview}</div>
            <p style={{ margin: '0 0 28px', fontSize: 14.5, lineHeight: 1.7, color: 'var(--ink-1)', maxWidth: 760 }}>
              {i18n.body}
            </p>

            <div className="label-accent" style={{ marginBottom: 10 }}>— {M.specs}</div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              border: '1px solid var(--line)',
              marginBottom: 28,
            }}>
              {metrics.map((m, i) => (
                <div key={i} style={{
                  padding: 16,
                  borderLeft: i > 0 ? '1px solid var(--line)' : 'none',
                }}>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em', marginBottom: 6 }}>{m.k.toUpperCase()}</div>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{m.v}</div>
                </div>
              ))}
            </div>

            <div className="label-accent" style={{ marginBottom: 10 }}>— {M.techStack}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 28 }}>
              {project.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
            </div>

            <div style={{
              borderTop: '1px solid var(--line)', paddingTop: 18,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <a href="#contacto" onClick={onClose} className="btn primary">
                {t('hero.ctaContact')}
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(i18n.title || project.id)}&body=${encodeURIComponent(shareUrl)}`}
                className="mono"
                style={{ fontSize: 11, color: 'var(--ink-2)', textDecoration: 'none' }}>
                {M.share} ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
