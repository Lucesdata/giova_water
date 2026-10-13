import React from 'react';
import { SectionIndex, Reveal } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';

export default function Faq() {
  const { isMobile } = useBreakpoint();
  const t = useT();
  const items = t('faq.items');
  return (
    <section id="faq" className="section" aria-labelledby="faq-title">
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: 32, marginBottom: 40 }}>
        <SectionIndex n="FAQ" kicker={t('faq.kicker')} title={t('faq.title')} />
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <h2 id="faq-title" className="h2">
            {t('faq.h2a')} <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', color: 'var(--ink-1)' }}>{t('faq.h2b')}</span>
          </h2>
        </div>
      </div>

      <Reveal style={{ maxWidth: 820, marginBottom: 56 }}>
        {(Array.isArray(items) ? items : []).map((it, i) => (
          <details key={i} className="faq-item">
            <summary>
              <span>{it.q}</span>
              <span className="faq-icon" aria-hidden="true">+</span>
            </summary>
            <p style={{ margin: '0 0 20px', maxWidth: 680, color: 'var(--ink-1)', fontSize: 15, lineHeight: 1.7, textWrap: 'pretty' }}>{it.a}</p>
          </details>
        ))}
      </Reveal>

      <Reveal style={{
        border: '1px solid var(--line-hi)', background: 'var(--bg-1)', padding: isMobile ? 24 : 40,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap',
      }}>
        <p style={{ margin: 0, fontFamily: 'var(--f-mono)', fontSize: 'clamp(20px, 2.4vw, 28px)', letterSpacing: '-0.02em', maxWidth: 560, textWrap: 'balance' }}>
          {t('faq.cta.title')}
        </p>
        <a href="#contacto" className="btn primary">{t('hero.ctaContact')}</a>
      </Reveal>
    </section>
  );
}
