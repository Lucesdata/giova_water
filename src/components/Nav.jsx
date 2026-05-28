import React, { useState, useEffect } from 'react';
import { Logo, StatusDot } from './primitives.jsx';
import { useT, useLang } from '../i18n.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';

export default function Nav({ active }) {
  const t = useT();
  const [lang, setLang, supported] = useLang();
  const { isMobile } = useBreakpoint();
  const items = [
    { id: 'inicio', n: '00' },
    { id: 'sobre', n: '01' },
    { id: 'proyectos', n: '02' },
    { id: 'gemelos', n: '03' },
    { id: 'contacto', n: '04' },
  ];
  const [time, setTime] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const z = (n) => String(n).padStart(2, '0');
      setTime(`${z(d.getUTCHours())}:${z(d.getUTCMinutes())}:${z(d.getUTCSeconds())} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <>
      <nav aria-label="Principal" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        backdropFilter: 'blur(10px)',
        background: 'color-mix(in srgb, var(--bg) 78%, transparent)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 32px', borderBottom: '1px solid var(--line)',
          fontFamily: 'var(--f-mono)', fontSize: 10.5, color: 'var(--ink-3)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {isMobile ? (
            <StatusDot label={t('nav.banner.available')} />
          ) : (
            <>
              <div style={{ display: 'flex', gap: 18 }}>
                <span>41.3879°N &nbsp; 2.0456°E</span>
                <span style={{ color: 'var(--ink-2)' }}>· {t('nav.banner.location')}</span>
              </div>
              <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                <StatusDot label={t('nav.banner.available')} />
                <span>{time}</span>
              </div>
            </>
          )}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '12px 16px' : '14px 32px',
        }}>
          <Logo />
          {isMobile ? (
            <button
              onClick={() => setOpen(o => !o)}
              aria-label={open ? 'Menú abierto' : 'Abrir menú'}
              aria-expanded={open}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 5, padding: 4,
              }}
            >
              {open ? (
                <span style={{ color: 'var(--ink-1)', fontSize: 18, lineHeight: 1 }}>✕</span>
              ) : (
                <>
                  <div style={{ width: 20, height: 1.5, background: 'var(--ink-1)' }}/>
                  <div style={{ width: 20, height: 1.5, background: 'var(--ink-1)' }}/>
                  <div style={{ width: 14, height: 1.5, background: 'var(--ink-1)' }}/>
                </>
              )}
            </button>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {items.map(it => (
                  <a key={it.id} href={`#${it.id}`} aria-current={active === it.id ? 'page' : undefined} style={{
                    padding: '8px 14px',
                    fontFamily: 'var(--f-mono)', fontSize: 11.5,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    textDecoration: 'none',
                    color: active === it.id ? 'var(--accent)' : 'var(--ink-1)',
                    borderBottom: active === it.id ? '1px solid var(--accent)' : '1px solid transparent',
                    display: 'flex', gap: 8, alignItems: 'baseline',
                    transition: 'color 160ms',
                  }}>
                    <span style={{ fontSize: 9.5, color: active === it.id ? 'var(--accent)' : 'var(--ink-3)' }}>
                      {it.n}
                    </span>
                    {t(`nav.items.${it.id}`)}
                  </a>
                ))}
              </div>
              <div role="group" aria-label="Selector de idioma" style={{
                display: 'flex', border: '1px solid var(--line-2)',
                fontFamily: 'var(--f-mono)', fontSize: 11,
              }}>
                {supported.map(l => (
                  <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} style={{
                    padding: '6px 12px',
                    background: lang === l ? 'var(--accent)' : 'transparent',
                    color: lang === l ? 'var(--bg)' : 'var(--ink-1)',
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 'inherit',
                  }}>{l.toUpperCase()}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </nav>

      {isMobile && open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'var(--bg)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid var(--line)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <Logo />
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-1)', fontSize: 18, lineHeight: 1 }}
            >✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {items.map(it => (
              <a
                key={it.id}
                href={`#${it.id}`}
                onClick={() => setOpen(false)}
                aria-current={active === it.id ? 'page' : undefined}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 20px', borderBottom: '1px solid var(--line)',
                  fontFamily: 'var(--f-mono)', fontSize: 13,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  textDecoration: 'none',
                  color: active === it.id ? 'var(--accent)' : 'var(--ink)',
                  background: active === it.id ? 'var(--bg-1)' : 'transparent',
                }}
              >
                <span>{t(`nav.items.${it.id}`)}</span>
                <span style={{ fontSize: 10, color: active === it.id ? 'var(--accent)' : 'var(--ink-3)' }}>
                  {it.n}{active === it.id ? ' ●' : ''}
                </span>
              </a>
            ))}
          </div>
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 8, letterSpacing: '0.1em', color: 'var(--ink-3)', marginRight: 4 }}>IDIOMA</span>
            {supported.map(l => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} style={{
                padding: '3px 10px', fontSize: 10,
                background: lang === l ? 'var(--accent)' : 'transparent',
                color: lang === l ? 'var(--bg)' : 'var(--ink-2)',
                border: `1px solid ${lang === l ? 'var(--accent)' : 'var(--line-2)'}`,
                fontFamily: 'var(--f-mono)', cursor: 'pointer',
              }}>{l.toUpperCase()}</button>
            ))}
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 8, letterSpacing: '0.06em', color: 'var(--line-hi)' }}>
              41.3879°N · 2.0456°E
            </span>
          </div>
        </div>
      )}
    </>
  );
}
