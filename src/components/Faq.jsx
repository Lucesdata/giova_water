import React from 'react';
import { SectionIndex, Reveal } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';
import { sectionNumber } from '../data/sections.js';

export default function Faq() {
  const { isMobile } = useBreakpoint();
  const t = useT();
  const items = t('faq.items');
  return (
    <section id="faq" className="section" aria-labelledby="faq-title">
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: isMobile ? 16 : 32, marginBottom: 32 }}>
        <SectionIndex n={sectionNumber('faq')} kicker={t('faq.kicker')} title={t('faq.title')} />
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <h2 id="faq-title" className="h2">
            {t('faq.h2a')} <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', color: 'var(--ink-1)' }}>{t('faq.h2b')}</span>
          </h2>
        </div>
      </div>

      <Reveal style={{ maxWidth: 820, marginBottom: 0 }}>
        {(Array.isArray(items) ? items : []).map((it, i) => (
          <details key={i} className="faq-item">
            <summary>
              <span>{it.q}</span>
              <span className="faq-icon" aria-hidden="true">+</span>
            </summary>
            <p className="prose" style={{ margin: '0 0 20px', maxWidth: 680 }}>{it.a}</p>
          </details>
        ))}
      </Reveal>
    </section>
  );
}
