import React, { useState, useEffect, useRef } from 'react';
import { Logo } from './primitives.jsx';
import { useT, useLang } from '../i18n.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';
import { useNavHeight } from '../hooks/useNavigation.js';
import { NAV_SECTIONS } from '../data/sections.js';

export default function Nav({ active }) {
  const t = useT();
  const [lang, setLang, supported] = useLang();
  const { isMobile } = useBreakpoint();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);
  const navRef = useRef(null);
  const wasOpen = useRef(false);
  useNavHeight(navRef);

  // Escape closes the menu; Tab stays inside it while it is open.
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key !== 'Tab' || !menuRef.current) return;
      const f = menuRef.current.querySelectorAll('a[href], button:not([disabled])');
      if (!f.length) return;
      const first = f[0]; const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Move focus into the menu when it opens and back to the toggle when it closes.
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      menuRef.current?.querySelector('a[href], button')?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      toggleRef.current?.focus();
    }
  }, [open]);

  // Leaving the mobile layout while the menu is open must not leave it stuck.
  useEffect(() => { if (!isMobile) setOpen(false); }, [isMobile]);

  const langButtons = supported.map((l) => (
    <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l} className="lang-btn">
      {l.toUpperCase()}
    </button>
  ));

  return (
    <>
      <nav ref={navRef} aria-label={t('nav.aria.main')} className="site-nav">
        <div className="site-nav-inner">
          <Logo label={t('nav.aria.home')} />
          {isMobile ? (
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-label={t('nav.aria.openMenu')}
              aria-expanded={open}
              aria-controls="menu-movil"
              className="icon-btn"
            >
              <span aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ width: 22, height: 2, background: 'var(--ink-1)' }}/>
                <span style={{ width: 22, height: 2, background: 'var(--ink-1)' }}/>
                <span style={{ width: 22, height: 2, background: 'var(--ink-1)' }}/>
              </span>
            </button>
          ) : (
            <>
              <div className="nav-links">
                {NAV_SECTIONS.map((it) => (
                  <a key={it.id} href={`#${it.id}`} aria-current={active === it.id ? 'page' : undefined} className="nav-link">
                    {t(`nav.items.${it.id}`)}
                  </a>
                ))}
              </div>
              <div role="group" aria-label={t('nav.aria.langGroup')} className="lang-group">
                {langButtons}
              </div>
            </>
          )}
        </div>
      </nav>

      {isMobile && open && (
        <div id="menu-movil" ref={menuRef} role="dialog" aria-modal="true" aria-label={t('nav.aria.openMenu')} className="mobile-menu">
          <div className="mobile-menu-head">
            <Logo label={t('nav.aria.home')} />
            <button type="button" onClick={() => setOpen(false)} aria-label={t('nav.aria.closeMenu')} className="icon-btn"
              style={{ color: 'var(--ink-1)', fontSize: 22, lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {NAV_SECTIONS.map((it) => (
              <a
                key={it.id}
                href={`#${it.id}`}
                onClick={() => setOpen(false)}
                aria-current={active === it.id ? 'page' : undefined}
                className="menu-link"
              >
                {t(`nav.items.${it.id}`)}
              </a>
            ))}
          </div>
          <div role="group" aria-label={t('nav.aria.langGroup')} className="mobile-menu-langs">
            <span className="label" style={{ marginRight: 4 }}>{t('nav.aria.langLabel')}</span>
            <div className="lang-group">{langButtons}</div>
          </div>
        </div>
      )}
    </>
  );
}
