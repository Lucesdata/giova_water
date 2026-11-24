import React from 'react';
import { useT } from '../i18n.jsx';
import Method, { KeyFigures } from './Cycle.jsx';

export default function Hero() {
  const t = useT();
  const facts = t('hero.facts');
  // The closing phrase of the headline takes the accent colour; if a language
  // does not provide it the headline is shown as plain text.
  const h1 = t('hero.h1');
  const accent = t('hero.h1Accent');
  const split = typeof accent === 'string' && typeof h1 === 'string' && h1.endsWith(accent) && accent !== h1;

  // No entry animation here: the first screen reads immediately.
  return (
    <div>
      <div className="hero">
        <div className="hero-photo">
          <img src="/assets/giovanni-field.jpg" alt="" width="1600" height="1066" fetchpriority="high" />
        </div>
        <div className="hero-copy">
          <p className="hero-kicker">
            <span className="hero-name">{t('hero.kicker')}</span>
            <span className="hero-role">{t('hero.role')}</span>
          </p>
          <h1 className="h1">
            {split ? <>{h1.slice(0, h1.length - accent.length)}<span className="accent-text">{accent}</span></> : h1}
          </h1>
          <p className="prose hero-intro">{t('hero.intro')}</p>
          <div className="hero-actions">
            <a href="#proyectos" className="btn primary">{t('hero.ctaProjects')} <span aria-hidden="true">→</span></a>
            <a href="#contacto" className="btn hero-secondary">{t('hero.ctaContact')}</a>
          </div>
          {Array.isArray(facts) && (
            <ul className="hero-facts">
              {facts.map((f) => <li key={f}>{f}</li>)}
            </ul>
          )}
        </div>
      </div>

      <KeyFigures />
      <Method />
    </div>
  );
}
