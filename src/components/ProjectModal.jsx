import React, { useEffect, useRef } from 'react';
import { Tag, Copyable, useBodyScrollLock } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import ProjectScheme from './ProjectScheme.jsx';
import { tagLabel } from './Projects.jsx';
import { projectUrl } from '../data/projects.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/* Budgets of the monitoring and automation project. Each amount keeps its own
   scope (institutional, technical, definitive, supervision, delivery target):
   they are listed apart, never added and never presented as comparable. */
function Budgets({ b }) {
  if (!b || !Array.isArray(b.items)) return null;
  return (
    <section aria-labelledby="m-budgets" style={{ margin: '0 0 28px', border: '1px solid var(--line-hi)', background: 'var(--bg-2)', padding: 20 }}>
      <h3 id="m-budgets" className="label-accent" style={{ margin: '0 0 6px', fontWeight: 400 }}>{b.label}</h3>
      <p style={{ margin: '0 0 8px', fontFamily: 'var(--f-mono)', fontSize: 17, color: 'var(--ink)' }}>{b.title}</p>
      <p className="prose" style={{ margin: '0 0 16px', maxWidth: 720 }}>{b.intro}</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))' }}>
        {b.items.map((it, i) => (
          <li key={i} style={{ border: '1px solid var(--line)', background: 'var(--bg-1)', padding: 16, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <span className="label-accent">{it.tag}</span>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 18, color: 'var(--ink)', overflowWrap: 'anywhere' }}>{it.v}</span>
            <span style={{ color: 'var(--ink-1)', fontSize: 15, lineHeight: 1.55 }}>{it.d}</span>
          </li>
        ))}
      </ul>
      <p className="prose" style={{ margin: '16px 0 0', maxWidth: 720, color: 'var(--ink)' }}><strong style={{ fontWeight: 500 }}>{b.participationLabel}</strong> {b.participation}</p>
      <p className="prose" style={{ margin: '10px 0 0', maxWidth: 720, fontSize: 15, color: 'var(--ink-2)' }}>{b.note}</p>
    </section>
  );
}

/* Phases of the programme. The first `done` items are delivered; the rest is
   plan. The status is always written out, never carried by colour alone. */
function Timeline({ tl, done, statusLabel }) {
  if (!tl || !Array.isArray(tl.items)) return null;
  return (
    <section aria-labelledby="m-phases" style={{ margin: '0 0 28px' }}>
      <h3 id="m-phases" className="label-accent" style={{ margin: '0 0 6px', fontWeight: 400 }}>{tl.label}</h3>
      <p style={{ margin: '0 0 8px', fontFamily: 'var(--f-mono)', fontSize: 17, color: 'var(--ink)' }}>{tl.title}</p>
      <p className="prose" style={{ margin: '0 0 16px', maxWidth: 720 }}>{tl.intro}</p>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
        {tl.items.map((it, i) => {
          const isDone = i < done;
          return (
            <li key={it.year} style={{
              display: 'grid', gridTemplateColumns: 'minmax(0, 64px) minmax(0, 1fr) auto', gap: 14, alignItems: 'baseline',
              border: `1px ${isDone ? 'solid' : 'dashed'} ${isDone ? 'var(--line-hi)' : 'var(--line)'}`,
              background: isDone ? 'var(--bg-2)' : 'transparent', padding: '12px 14px',
            }}>
              <span className="mono" style={{ fontSize: 16, color: isDone ? 'var(--accent)' : 'var(--ink-1)' }}>{it.year}</span>
              <span style={{ color: 'var(--ink)', fontSize: 15, lineHeight: 1.5 }}>{it.text}</span>
              <span className="mono" aria-label={`${statusLabel}: ${it.status}`} style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: isDone ? 'var(--accent)' : 'var(--ink-2)' }}>
                <span aria-hidden="true">{isDone ? '● ' : '○ '}</span>{it.status}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* Real photographs of the project, each with its own description. */
function Photos({ photos, texts }) {
  if (!photos.length) return null;
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, columnWidth: 220, columnGap: 14 }}>
      {photos.map((ph, i) => (
        <li key={ph.src} style={{ margin: '0 0 14px', minWidth: 0, breakInside: 'avoid' }}>
          <figure style={{ margin: 0, display: 'grid', gap: 6 }}>
            <a href={ph.src} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
              <img src={ph.src} alt={texts[i]?.alt || ''} width={ph.w} height={ph.h} loading="lazy"
                   style={{ width: '100%', height: 'auto', display: 'block' }} />
            </a>
            <figcaption style={{ color: 'var(--ink-1)', fontSize: 14, lineHeight: 1.45 }}>{texts[i]?.caption}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}

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
      if (opener && opener !== document.body) opener.focus?.({ preventScroll: true });
    };
  }, [projectId]);

  if (!project) return null;

  const i18n = t(`projects.data.${project.id}`) || {};
  const M = t('projects.modal');
  const metrics = Array.isArray(i18n.metrics) ? i18n.metrics : [];
  const evidence = Array.isArray(i18n.evidence) ? i18n.evidence : [];
  const files = Array.isArray(project.files) ? project.files : [];
  const fileTexts = Array.isArray(i18n.files) ? i18n.files : [];
  const photos = Array.isArray(project.photos) ? project.photos : [];
  const photoTexts = Array.isArray(i18n.photos) ? i18n.photos : [];
  const shareUrl = projectUrl(project);

  const sections = [
    ['challenge', M.challenge, <p key="c" className="modal-text">{i18n.challenge}</p>],
    ['responsibility', M.responsibility, <p key="r" className="modal-text">{i18n.responsibility}</p>],
    ['solution', M.solution, <p key="s" className="modal-text">{i18n.solution}</p>],
    ['result', M.result, <p key="x" className="modal-text">{i18n.resultFull}</p>],
    ['evidence', M.evidence, (
      <div key="e" style={{ display: 'grid', gap: 12 }}>
        <Photos photos={photos} texts={photoTexts} />
        {files.length > 0 ? (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
            {files.map((f, i) => (
              <li key={f.href} className="modal-text" style={{ margin: 0 }}>
                <a href={f.href} target="_blank" rel="noopener noreferrer" className="mono text-link">{fileTexts[i]?.name || f.href} <span aria-hidden="true">↗</span></a>
                <br />{fileTexts[i]?.proves}
              </li>
            ))}
          </ul>
        ) : photos.length === 0 && (
          <p className="modal-text" style={{ color: 'var(--ink)' }}>{M.noFiles}</p>
        )}
        <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
          {evidence.map((ev, i) => <li key={i} className="modal-text" style={{ margin: 0 }}>{ev}</li>)}
        </ul>
      </div>
    )],
    ['tech', M.techStack, (
      <div key="t" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {project.tags.map(tag => <Tag key={tagLabel(t, tag)}>{tagLabel(t, tag)}</Tag>)}
      </div>
    )],
    ['contact', M.contact, (
      <div key="k" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <a href="#contacto" onClick={(e) => { e.preventDefault(); onClose('#contacto'); }} className="btn primary">
          {t('hero.ctaContact')}
        </a>
        <Copyable value={shareUrl} ariaLabel={`${M.copyLink}: ${shareUrl}`}>
          <span className="mono" style={{ fontSize: 13 }}>{M.copyLink}</span>
        </Copyable>
        <a
          href={`mailto:?subject=${encodeURIComponent(i18n.title || project.id)}&body=${encodeURIComponent(shareUrl)}`}
          className="mono text-link">
          {M.share} <span aria-hidden="true">↗</span>
        </a>
      </div>
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
        <div className="modal-head" style={{
          padding: '8px 8px 8px 20px',
          borderBottom: '1px solid var(--line-hi)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
          fontFamily: 'var(--f-mono)', fontSize: 13,
        }}>
          <span style={{ color: 'var(--ink-2)', letterSpacing: '0.08em' }}>
            {project.id} · <span style={{ color: 'var(--accent)' }}>{i18n.cat}</span>
          </span>
          <button ref={closeRef} type="button" onClick={() => onClose()} className="btn" style={{ padding: '8px 14px' }}>
            {M.close} <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ position: 'relative', borderBottom: '1px solid var(--line)', background: 'var(--bg-2)', height: 'clamp(140px, 22vw, 240px)' }}>
            {project.cover ? (
              <>
                <img src={project.cover} alt={photoTexts[0]?.alt || i18n.title} width={922} height={518}
                     style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <span className="chip" style={{ position: 'absolute', left: 12, bottom: 12 }}>{M.photoBadge}</span>
              </>
            ) : (
              <>
                <ProjectScheme type={project.scheme} label={`${t('projects.schemeBadge')}: ${i18n.title}`} />
                <span className="chip" style={{ position: 'absolute', left: 12, bottom: 12 }}>{t('projects.schemeNote')}</span>
              </>
            )}
          </div>

          <div className="modal-body">
            <h2 id="modal-title" style={{
              margin: '0 0 8px', fontFamily: 'var(--f-mono)', fontWeight: 500,
              fontSize: 'clamp(22px, 3vw, 32px)', letterSpacing: '-0.02em', lineHeight: 1.15, textWrap: 'balance',
            }}>{i18n.title}</h2>
            <p className="mono" style={{ margin: '0 0 24px', fontSize: 15, color: 'var(--accent)', lineHeight: 1.5 }}>{i18n.role}</p>

            <dl style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 16, margin: '0 0 24px',
              borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '14px 0',
            }}>
              {[[M.location, i18n.loc], [M.period, project.year], [M.category, i18n.cat]].map(([k, v]) => (
                <div key={k}>
                  <dt className="label" style={{ marginBottom: 4 }}>{k}</dt>
                  <dd className="mono" style={{ margin: 0, fontSize: 15, color: 'var(--ink)' }}>{v}</dd>
                </div>
              ))}
            </dl>

            <h3 className="label-accent" style={{ margin: '0 0 10px', fontWeight: 400 }}>{M.specs}</h3>
            <dl className="cells" style={{ '--n': Math.max(metrics.length, 1), margin: '0 0 28px' }}>
              {metrics.map((m, i) => (
                <div key={i}>
                  <dt className="mono" style={{ fontSize: 13, color: 'var(--ink-2)', letterSpacing: '0.04em', marginBottom: 6 }}>{m.l}</dt>
                  <dd style={{ margin: 0, fontFamily: 'var(--f-mono)', fontSize: 'clamp(18px, 2vw, 22px)', color: 'var(--ink)', letterSpacing: '-0.01em', overflowWrap: 'anywhere' }}>{m.v}</dd>
                </div>
              ))}
            </dl>

            <Timeline tl={i18n.timeline} done={project.milestonesDone || 0} statusLabel={M.phasesStatus} />
            <Budgets b={i18n.budgets} />

            <div style={{ display: 'grid', gap: 24, marginBottom: 12 }}>
              {sections.map(([key, label, body], i) => (
                <section key={key} aria-labelledby={`m-${key}`} style={{
                  display: 'grid', gridTemplateColumns: 'minmax(0, 170px) minmax(0, 1fr)', gap: 20,
                  borderTop: '1px solid var(--line)', paddingTop: 16,
                }} className="modal-row">
                  <h3 id={`m-${key}`} className="label-accent" style={{ margin: 0, fontWeight: 400 }}>
                    {String(i + 1).padStart(2, '0')} · {label}
                  </h3>
                  <div style={{ minWidth: 0 }}>{body}</div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
