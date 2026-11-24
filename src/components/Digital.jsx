import React, { useState, useEffect, useRef } from 'react';
import { SectionHeader, Reveal, useOnScreen, usePrefersReducedMotion } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import { projectById, projectHash } from '../data/projects.js';

/* Interactive lab published as a static app under public/engineering-objects/
   (built from engineering-objects/apps/object-lab). */
export const LAB_URL = '/engineering-objects/';
const labLink = (equipmentId) => `${LAB_URL}?equipo=${equipmentId}`;

/* Real footage of a plant's supervision screen, silent and short. It plays only
   while it is on screen, never with reduced motion unless the person starts it,
   and always has a pause button (WCAG 2.2.2). The poster is the still frame. */
function ScadaVideo({ labels }) {
  const ref = useRef(null);
  const boxRef = useRef(null);
  const reduced = usePrefersReducedMotion();
  const onScreen = useOnScreen(boxRef);
  const [choice, setChoice] = useState(null); // null = automatic, 'play' | 'pause' = the person decided
  const [playing, setPlaying] = useState(false);
  const wants = choice ? choice === 'play' : !reduced;
  const run = onScreen && wants;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      if (run) { const p = el.play?.(); p?.catch?.(() => {}); } else el.pause?.();
    } catch { /* media playback is not available (tests, old browsers): the poster stays */ }
  }, [run]);

  return (
    <div ref={boxRef} className="media-frame video-frame">
      <video ref={ref} muted loop playsInline preload="metadata" poster="/assets/video/scada-ptap-poster.jpg"
             width="640" height="360" aria-label={labels.alt}
             onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}>
        <source src="/assets/video/scada-ptap.webm" type="video/webm" />
        <source src="/assets/video/scada-ptap.mp4" type="video/mp4" />
      </video>
      <span className="chip media-badge-top">{labels.badge}</span>
      <button type="button" className="video-toggle" aria-pressed={!playing}
              onClick={() => setChoice(playing ? 'pause' : 'play')}>
        <span aria-hidden="true">{playing ? '❚❚' : '▶'}</span> {playing ? labels.pause : labels.play}
      </button>
    </div>
  );
}

function ScadaBlock() {
  const t = useT();
  const s = t('digital.scada');
  const p7 = projectById('P-007');
  return (
    <Reveal as="article" className="feature-row" aria-labelledby="scada-title">
      <figure style={{ margin: 0, minWidth: 0 }}>
        <ScadaVideo labels={s} />
        <figcaption className="media-caption">{s.fig}</figcaption>
      </figure>
      <div className="feature-text">
        <p className="eyebrow">{s.kicker}</p>
        <h3 id="scada-title" className="h3">{s.title}</h3>
        <p className="prose">{s.body}</p>
        <div>
          <p className="label" style={{ margin: '0 0 8px' }}>{s.varsLabel}</p>
          <ul className="pill-list">
            {(Array.isArray(s.vars) ? s.vars : []).map((v) => <li key={v}>{v}</li>)}
          </ul>
        </div>
        <a href={projectHash(p7)} className="text-link">{s.cta} <span aria-hidden="true">→</span></a>
      </div>
    </Reveal>
  );
}

function TwinBlock() {
  const t = useT();
  const twin = projectById('P-003');
  const data = t(`projects.data.${twin.id}`);
  const real = t('digital.twin');
  const photo = data?.photos?.[0];
  if (!twin.photos?.length || !photo) return null;
  // Key facts of the capture: number of sensors and variable types, from the sheet.
  const facts = (Array.isArray(data.metrics) ? data.metrics : []).slice(0, 2);
  return (
    <Reveal as="article" className="feature-row is-reversed" aria-labelledby="twin-title">
      <figure style={{ margin: 0, minWidth: 0 }}>
        <div className="media-frame">
          <img src={twin.photos[0].src} alt={photo.alt} width={twin.photos[0].w} height={twin.photos[0].h} loading="lazy" />
          <span className="chip media-badge">{t('projects.modal.captureBadge')}</span>
        </div>
        <figcaption className="media-caption">{photo.caption}</figcaption>
      </figure>
      <div className="feature-text">
        <p className="eyebrow">{real.kicker}</p>
        <h3 id="twin-title" className="h3">{real.title}</h3>
        <p className="prose">{real.body}</p>
        <dl className="facts">
          {facts.map((f) => (
            <div key={f.l}>
              <dt className="label">{f.l}</dt>
              <dd>{f.v}</dd>
            </div>
          ))}
        </dl>
        <a href={projectHash(twin)} className="text-link">{real.cta} <span aria-hidden="true">→</span></a>
      </div>
    </Reveal>
  );
}

function EquipmentCard({ item, openLabel }) {
  return (
    <article className="card eo-card">
      <a href={labLink(item.id)} aria-label={`${openLabel}: ${item.name}`} className="eo-media">
        <img src={item.img} alt={item.imgAlt} loading="lazy" width="1200" height="960" />
      </a>
      <div className="card-body">
        <div>
          <p className="eyebrow" style={{ marginBottom: 6 }}>{item.tag}</p>
          <h4 className="card-title">{item.name}</h4>
        </div>
        <p className="prose" style={{ margin: 0, fontSize: 15 }}>{item.summary}</p>
        <dl className="eo-metrics">
          {(Array.isArray(item.metrics) ? item.metrics : []).map((m) => (
            <div key={m.label} style={{ minWidth: 0 }}>
              <dt className="label">{m.label}</dt>
              <dd className="mono">{m.value}</dd>
            </div>
          ))}
        </dl>
        <a href={labLink(item.id)} className="btn" style={{ marginTop: 'auto', justifyContent: 'center' }}>{openLabel} <span aria-hidden="true">→</span></a>
      </div>
    </article>
  );
}

function Lab() {
  const t = useT();
  const items = t('objects.equipment');
  return (
    <div id="objetos" className="lab" aria-labelledby="objects-title" role="region">
      <Reveal className="lab-head">
        <div style={{ minWidth: 0 }}>
          <p className="eyebrow">{t('objects.kicker')}</p>
          <h3 id="objects-title" className="h3">{t('objects.h2')}</h3>
          <p className="prose" style={{ margin: '10px 0 0', maxWidth: 720 }}>{t('objects.intro')}</p>
        </div>
        <span className="chip">{t('objects.stack')}</span>
      </Reveal>

      <div className="eo-grid">
        {(Array.isArray(items) ? items : []).map((item) => (
          <EquipmentCard key={item.id} item={item} openLabel={t('objects.open')} />
        ))}
      </div>

      <div className="lab-foot">
        <p className="prose" style={{ margin: 0, fontSize: 14, color: 'var(--ink-2)', maxWidth: 720 }}>{t('objects.note')}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <a href={LAB_URL} className="btn primary">{t('objects.cta')} <span aria-hidden="true">→</span></a>
          <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{t('objects.desktopHint')}</span>
        </div>
      </div>
    </div>
  );
}

/* Digital operation: three real pieces of work, no simulated panel.
   SCADA footage (UAESP), the digital twin capture (La Soledad) and the 3D lab. */
export default function Digital() {
  const t = useT();
  return (
    <section id="gemelos" className="section" aria-labelledby="digital-title">
      <SectionHeader id="digital-title" eyebrow={t('digital.kicker')} title={t('digital.h2')} lead={t('digital.intro')} />
      <div className="feature-stack">
        <ScadaBlock />
        <TwinBlock />
      </div>
      <Lab />
    </section>
  );
}
