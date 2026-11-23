import React from 'react';
import { SectionIndex, Reveal } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';
import { sectionNumber } from '../data/sections.js';

/* Interactive lab published as a static app under public/engineering-objects/
   (built from engineering-objects/apps/object-lab with `npm run lab:publish`). */
export const LAB_URL = '/engineering-objects/';
const labLink = (equipmentId) => `${LAB_URL}?equipo=${equipmentId}`;

function EquipmentCard({ item, openLabel, isMobile }) {
  return (
    <article className="eo-card" style={{ border: '1px solid var(--line-hi)', background: 'var(--bg-1)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <a href={labLink(item.id)} aria-label={`${openLabel}: ${item.name}`} style={{ display: 'block', background: 'var(--bg-2)', borderBottom: '1px solid var(--line)' }}>
        <img src={item.img} alt={item.imgAlt} loading="lazy" width="1200" height="960" style={{ display: 'block', width: '100%', height: 'auto' }}/>
      </a>
      <div style={{ padding: isMobile ? 16 : 20, display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <div>
          <div className="label-accent" style={{ marginBottom: 6 }}>{item.tag}</div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{item.name}</h3>
        </div>
        <p className="prose" style={{ margin: 0 }}>{item.summary}</p>
        <dl className="eo-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px 16px', margin: 0, padding: '14px 0 0', borderTop: '1px solid var(--line)' }}>
          {(Array.isArray(item.metrics) ? item.metrics : []).map((m) => (
            <div key={m.label} style={{ minWidth: 0 }}>
              <dt className="label">{m.label}</dt>
              <dd className="mono" style={{ margin: '2px 0 0', fontSize: 15, color: 'var(--ink)' }}>{m.value}</dd>
            </div>
          ))}
        </dl>
        <div style={{ marginTop: 'auto' }}>
          <a href={labLink(item.id)} className="btn" style={{ width: '100%', justifyContent: 'center' }}>{openLabel} →</a>
        </div>
      </div>
    </article>
  );
}

export default function EngineeringObjects() {
  const { isMobile } = useBreakpoint();
  const t = useT();
  const items = t('objects.equipment');
  const features = t('objects.features');

  return (
    <section id="objetos" className="section" aria-labelledby="objects-title">
      <Reveal style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: isMobile ? 16 : 32, marginBottom: 24 }}>
        <SectionIndex n={sectionNumber('objetos')} kicker={t('objects.kicker')} title={t('objects.title')} />
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <h2 id="objects-title" className="h2">
            {t('objects.h2a')} <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', color: 'var(--ink-1)' }}>{t('objects.h2b')}</span>
          </h2>
        </div>
      </Reveal>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <span className="chip accent">{t('objects.badge')}</span>
        <span className="chip">{t('objects.stack')}</span>
      </div>
      <p className="prose" style={{ maxWidth: 760, margin: '0 0 32px', fontSize: 17 }}>{t('objects.intro')}</p>

      <div className="eo-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: isMobile ? 20 : 24, marginBottom: 32 }}>
        {(Array.isArray(items) ? items : []).map((item) => (
          <EquipmentCard key={item.id} item={item} openLabel={t('objects.open')} isMobile={isMobile} />
        ))}
      </div>

      <h3 className="label-accent" style={{ margin: '0 0 14px', fontWeight: 400 }}>{t('objects.featuresLabel')}</h3>
      <ol className="eo-features" style={{ listStyle: 'none', margin: '0 0 28px', padding: 0, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }}>
        {(Array.isArray(features) ? features : []).map((f, i) => (
          <li key={f.t} style={{ background: 'var(--bg-1)', padding: isMobile ? 16 : 20 }}>
            <div className="mono" style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 6 }}>{String(i + 1).padStart(2, '0')}</div>
            <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 500, color: 'var(--ink)' }}>{f.t}</h4>
            <p className="prose" style={{ margin: 0, fontSize: 15 }}>{f.d}</p>
          </li>
        ))}
      </ol>

      <p className="prose" style={{ maxWidth: 760, margin: '0 0 20px', fontSize: 15, color: 'var(--ink-2)' }}>{t('objects.note')}</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <a href={LAB_URL} className="btn primary">{t('objects.cta')} →</a>
        <span className="mono" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{t('objects.desktopHint')}</span>
      </div>
    </section>
  );
}
