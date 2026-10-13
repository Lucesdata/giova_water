import React, { useEffect, useRef } from 'react';
import { Tag, useBodyScrollLock } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import ProjectScheme from './ProjectScheme.jsx';
import { tagLabel } from './Projects.jsx';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function ProjectModal({ project, onClose }) {
  const t = useT();
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useBodyScrollLock(!!project);

  // Keyed on the project id only: App re-renders on scroll and hands us a new
  // onClose each time, which used to reset focus and fire the cleanup early.
  const projectId = project?.id;
  useEffect(() => {
    if (!projectId) return undefined;
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const f = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0]; const last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !panelRef.current.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !panelRef.current.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener?.focus?.({ preventScroll: true });
    };
  }, [projectId]);

  if (!project) return null;

  const i18n = t(`projects.data.${project.id}`) || {};
  const M = t('projects.modal');
  const metrics = Array.isArray(i18n.metrics) ? i18n.metrics : [];
  const evidence = Array.isArray(i18n.evidence) ? i18n.evidence : [];
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/#proyectos` : '';

  const sections = [
    ['challenge', M.challenge, <p key="c" className="modal-text">{i18n.challenge}</p>],
    ['responsibility', M.responsibility, <p key="r" className="modal-text">{i18n.responsibility}</p>],
    ['solution', M.solution, <p key="s" className="modal-text">{i18n.solution}</p>],
    ['result', M.result, <p key="x" className="modal-text">{i18n.resultFull}</p>],
    ['evidence', M.evidence, (
      <ul key="e" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
        {evidence.map((ev, i) => <li key={i} className="modal-text" style={{ margin: 0 }}>{ev}</li>)}
      </ul>
    )],
  ];

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-panel" ref={panelRef}>
        <div style={{
          padding: '8px 8px 8px 20px',
          borderBottom: '1px solid var(--line-hi)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
          fontFamily: 'var(--f-mono)', fontSize: 12,
        }}>
          <span style={{ color: 'var(--ink-2)', letterSpacing: '0.08em' }}>
            {project.id} · <span style={{ color: 'var(--accent)' }}>{i18n.cat}</span>
          </span>
          <button ref={closeRef} type="button" onClick={onClose} className="btn" style={{ padding: '8px 14px' }}>
            {M.close} <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ position: 'relative', borderBottom: '1px solid var(--line)', background: 'var(--bg-2)', height: 'clamp(160px, 28vw, 300px)' }}>
            <ProjectScheme type={project.scheme} label={`${t('projects.schemeBadge')}: ${i18n.title}`} />
            <span className="chip" style={{ position: 'absolute', left: 12, bottom: 12 }}>{t('projects.schemeNote')}</span>
          </div>

          <div className="modal-body">
            <h2 id="modal-title" style={{
              margin: '0 0 8px', fontFamily: 'var(--f-mono)', fontWeight: 500,
              fontSize: 'clamp(22px, 3vw, 32px)', letterSpacing: '-0.02em', lineHeight: 1.15, textWrap: 'balance',
            }}>{i18n.title}</h2>
            <p className="mono" style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--accent)', lineHeight: 1.5 }}>{i18n.role}</p>

            <dl style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 16, margin: '0 0 24px',
              borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '14px 0',
            }}>
              {[[M.location, i18n.loc], [M.period, project.year], [M.category, i18n.cat]].map(([k, v]) => (
                <div key={k}>
                  <dt className="label" style={{ marginBottom: 4 }}>{k}</dt>
                  <dd className="mono" style={{ margin: 0, fontSize: 14, color: 'var(--ink)' }}>{v}</dd>
                </div>
              ))}
            </dl>

            <h3 className="label-accent" style={{ margin: '0 0 10px', fontWeight: 400 }}>{M.specs}</h3>
            <dl style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
              gap: 1, background: 'var(--line)', border: '1px solid var(--line)', margin: '0 0 28px',
            }}>
              {metrics.map((m, i) => (
                <div key={i} style={{ padding: 16, background: 'var(--bg-1)', minWidth: 0 }}>
                  <dt className="mono" style={{ fontSize: 12, color: 'var(--ink-2)', letterSpacing: '0.04em', marginBottom: 6 }}>{m.l}</dt>
                  <dd style={{ margin: 0, fontFamily: 'var(--f-mono)', fontSize: 'clamp(18px, 2vw, 22px)', color: 'var(--ink)', letterSpacing: '-0.01em', overflowWrap: 'anywhere' }}>{m.v}</dd>
                </div>
              ))}
            </dl>

            <div style={{ display: 'grid', gap: 24, marginBottom: 28 }}>
              {sections.map(([key, label, body], i) => (
                <section key={key} aria-labelledby={`m-${key}`} style={{
                  display: 'grid', gridTemplateColumns: 'minmax(0, 150px) minmax(0, 1fr)', gap: 20,
                  borderTop: '1px solid var(--line)', paddingTop: 16,
                }} className="modal-row">
                  <h3 id={`m-${key}`} className="label-accent" style={{ margin: 0, fontWeight: 400 }}>
                    {String(i + 1).padStart(2, '0')} · {label}
                  </h3>
                  <div style={{ minWidth: 0 }}>{body}</div>
                </section>
              ))}
            </div>

            <h3 className="label-accent" style={{ margin: '0 0 10px', fontWeight: 400 }}>{M.techStack}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 28 }}>
              {project.tags.map(tag => <Tag key={tagLabel(t, tag)}>{tagLabel(t, tag)}</Tag>)}
            </div>

            <div style={{
              borderTop: '1px solid var(--line)', paddingTop: 18,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            }}>
              <a href="#contacto" onClick={onClose} className="btn primary">
                {t('hero.ctaContact')}
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(i18n.title || project.id)}&body=${encodeURIComponent(shareUrl)}`}
                className="mono text-link">
                {M.share} <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
