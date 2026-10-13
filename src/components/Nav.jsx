import React, { useState, useEffect, useRef } from 'react';
import { Logo, StatusDot } from './primitives.jsx';
import { useT, useLang } from '../i18n.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';
import { useNavHeight } from '../hooks/useNavigation.js';
import { SECTIONS } from '../data/sections.js';

const ITEMS = SECTIONS;

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

  const langButtons = (compact) => supported.map(l => (
    <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className="lang-btn" style={{
      background: lang === l ? 'var(--accent)' : 'transparent',
      color: lang === l ? 'var(--bg)' : 'var(--ink-1)',
      border: compact ? `1px solid ${lang === l ? 'var(--accent)' : 'var(--line-2)'}` : 'none',
    }}>{l.toUpperCase()}</button>
  ));

  return (
    <>
      <nav ref={navRef} aria-label={t('nav.aria.main')} style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        backdropFilter: 'blur(10px)',
        background: 'color-mix(in srgb, var(--bg) 82%, transparent)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'flex-end' : 'space-between',
          padding: isMobile ? '4px 16px' : '4px 32px', borderBottom: '1px solid var(--line)',
          fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink-2)',
        }}>
          {!isMobile && <span>{t('nav.banner.location')}</span>}
          <a href="#contacto" className="nav-avail"><StatusDot label={t('nav.banner.available')} /></a>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '4px 16px' : '6px 32px',
        }}>
          <Logo label={t('nav.aria.home')} />
          {isMobile ? (
            <button
              ref={toggleRef}
              onClick={() => setOpen(o => !o)}
              aria-label={t('nav.aria.openMenu')}
              aria-expanded={open}
              aria-controls="menu-movil"
              className="icon-btn"
            >
              <span aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ width: 22, height: 2, background: 'var(--ink-1)' }}/>
                <span style={{ width: 22, height: 2, background: 'var(--ink-1)' }}/>
                <span style={{ width: 15, height: 2, background: 'var(--ink-1)' }}/>
              </span>
            </button>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {ITEMS.map(it => (
                  <a key={it.id} href={`#${it.id}`} aria-current={active === it.id ? 'page' : undefined} className="nav-link" style={{
                    color: active === it.id ? 'var(--accent)' : 'var(--ink-1)',
                    borderBottom: active === it.id ? '2px solid var(--accent)' : '2px solid transparent',
                  }}>
                    <span style={{ fontSize: 12, color: active === it.id ? 'var(--accent)' : 'var(--ink-3)' }}>
                      {it.n}
                    </span>
                    {t(`nav.items.${it.id}`)}
                  </a>
                ))}
              </div>
              <div role="group" aria-label={t('nav.aria.langGroup')} style={{ display: 'flex', border: '1px solid var(--line-2)' }}>
                {langButtons(false)}
              </div>
            </>
          )}
        </div>
      </nav>

      {isMobile && open && (
        <div id="menu-movil" ref={menuRef} role="dialog" aria-modal="true" aria-label={t('nav.aria.openMenu')} style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'var(--bg)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '4px 16px', borderBottom: '1px solid var(--line)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <Logo label={t('nav.aria.home')} />
            <button onClick={() => setOpen(false)} aria-label={t('nav.aria.closeMenu')} className="icon-btn"
              style={{ color: 'var(--ink-1)', fontSize: 22, lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {ITEMS.map(it => (
              <a
                key={it.id}
                href={`#${it.id}`}
                onClick={() => setOpen(false)}
                aria-current={active === it.id ? 'page' : undefined}
                className="menu-link"
                style={{
                  color: active === it.id ? 'var(--accent)' : 'var(--ink)',
                  background: active === it.id ? 'var(--bg-1)' : 'transparent',
                }}
              >
                <span>{t(`nav.items.${it.id}`)}</span>
                <span style={{ fontSize: 12, color: active === it.id ? 'var(--accent)' : 'var(--ink-3)' }}>
                  {it.n}{active === it.id ? ' ●' : ''}
                </span>
              </a>
            ))}
          </div>
          <div role="group" aria-label={t('nav.aria.langGroup')} style={{ padding: '16px 20px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="label" style={{ marginRight: 4 }}>{t('nav.aria.langLabel')}</span>
            {langButtons(true)}
          </div>
        </div>
      )}
    </>
  );
}
