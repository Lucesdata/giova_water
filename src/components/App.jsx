import React, { useState, useEffect, useCallback } from 'react';
import { useActiveSection, useScrollProgress } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import Nav from './Nav.jsx';
import Hero from './Hero.jsx';
import About from './About.jsx';
import Projects from './Projects.jsx';
import ProjectModal from './ProjectModal.jsx';
import DigitalTwins from './DigitalTwins.jsx';
import { Contact, Footer } from './Contact.jsx';
import { ScrollBackground } from './ScrollBackground.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';

function ScrollRail({ active }) {
  const p = useScrollProgress();
  const sections = [
    { id: 'inicio', n: '00' },
    { id: 'sobre', n: '01' },
    { id: 'proyectos', n: '02' },
    { id: 'gemelos', n: '03' },
    { id: 'contacto', n: '04' },
  ];
  return (
    <div aria-hidden="true" style={{
      position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)',
      zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    }}>
      <div className="mono" style={{
        writingMode: 'vertical-rl', fontSize: 11, color: 'var(--ink-3)',
        letterSpacing: '0.2em', marginBottom: 6,
      }}>SCROLL · {(p * 100).toFixed(0)}%</div>
      <div style={{ position: 'relative', width: 2, height: 180, background: 'var(--line)' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, width: 2,
          height: `${p * 100}%`, background: 'var(--accent)',
          transition: 'height 120ms linear',
        }}/>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {sections.map(s => (
          <a key={s.id} href={`#${s.id}`} tabIndex={-1} style={{
            fontFamily: 'var(--f-mono)', fontSize: 11,
            color: active === s.id ? 'var(--accent)' : 'var(--ink-3)',
            textDecoration: 'none',
          }}>{s.n}</a>
        ))}
      </div>
    </div>
  );
}

function TweaksPanel({ open, tweaks, setTweaks, onClose }) {
  const t = useT();
  if (!open) return null;
  return (
    <div role="dialog" aria-label={t('common.tweaks')} style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 100,
      width: 280, background: 'var(--bg-1)', border: '1px solid var(--line-hi)',
      fontFamily: 'var(--f-mono)',
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--ink)' }}>{t('common.tweaks')}</span>
        <button onClick={onClose} aria-label={t('common.closeAria')} className="icon-btn" style={{ color: 'var(--ink-1)', fontSize: 18 }}>×</button>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ marginBottom: 16 }}>
          <div className="label-accent" style={{ marginBottom: 8 }}>{t('common.palette')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[
              { v: 'instrument', c: '#4ee8d1' },
              { v: 'teal', c: '#3dd9a8' },
              { v: 'copper', c: '#e89558' },
              { v: 'paper', c: '#0e6354' },
            ].map(opt => (
              <button key={opt.v}
                onClick={() => setTweaks({ ...tweaks, palette: opt.v })}
                aria-pressed={tweaks.palette === opt.v}
                style={{
                  padding: '8px 10px', fontSize: 12, textAlign: 'left', minHeight: 44,
                  background: tweaks.palette === opt.v ? 'var(--bg-3)' : 'transparent',
                  color: 'var(--ink-1)',
                  border: '1px solid ' + (tweaks.palette === opt.v ? 'var(--accent)' : 'var(--line-2)'),
                  fontFamily: 'inherit', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                <span aria-hidden="true" style={{ width: 8, height: 8, background: opt.c, border: '1px solid rgba(255,255,255,0.2)' }}/>
                {t(`common.palettes.${opt.v}`)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <div className="label-accent" style={{ marginBottom: 8 }}>{t('common.gridBackdrop')}</div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: 'var(--ink-1)', cursor: 'pointer', minHeight: 44 }}>
            <input type="checkbox" style={{ width: 20, minHeight: 0, padding: 0 }} checked={tweaks.grid} onChange={e => setTweaks({ ...tweaks, grid: e.target.checked })}/>
            {t('common.gridLabel')}
          </label>
        </div>
      </div>
    </div>
  );
}

function TweaksToggle({ onClick }) {
  const t = useT();
  return (
    <button onClick={onClick} aria-label={t('common.tweaksAria')} title={t('common.tweaks')} style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 99,
      width: 44, height: 44,
      background: 'var(--bg-1)', border: '1px solid var(--line-hi)',
      color: 'var(--accent)', cursor: 'pointer',
      fontFamily: 'var(--f-mono)', fontSize: 14,
    }}>⚙</button>
  );
}

const TWEAK_DEFAULTS = { palette: 'instrument', grid: true };
const TWEAKS_STORAGE = 'giova_water:tweaks';

export default function App() {
  const active = useActiveSection(['inicio', 'sobre', 'proyectos', 'gemelos', 'contacto']);
  const { isMobile } = useBreakpoint();
  const [tweaks, setTweaks] = useState(() => {
    if (typeof window === 'undefined') return TWEAK_DEFAULTS;
    try {
      const saved = window.localStorage?.getItem(TWEAKS_STORAGE);
      if (!saved) return TWEAK_DEFAULTS;
      const { palette, grid } = JSON.parse(saved);   // drops the retired `hero` key
      return { ...TWEAK_DEFAULTS, ...(palette ? { palette } : {}), ...(typeof grid === 'boolean' ? { grid } : {}) };
    } catch { return TWEAK_DEFAULTS; }
  });
  const [panelOpen, setPanelOpen] = useState(false);
  const [openProject, setOpenProject] = useState(null);
  const t = useT();
  const closeProject = useCallback(() => setOpenProject(null), []);

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', tweaks.palette);
    try { window.localStorage?.setItem(TWEAKS_STORAGE, JSON.stringify(tweaks)); } catch {}
  }, [tweaks]);

  useEffect(() => {
    const handler = (e) => {
      const d = e.data;
      if (!d) return;
      if (d.type === '__activate_edit_mode') setPanelOpen(true);
      if (d.type === '__deactivate_edit_mode') setPanelOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">{t('nav.aria.skip')}</a>
      {tweaks.grid && <div className="grid-bg" aria-hidden="true"/>}
      <ScrollBackground />
      <Nav active={active} />
      {!isMobile && <ScrollRail active={active} />}
      <main id="main" style={{ position: 'relative', zIndex: 1, padding: isMobile ? '104px 16px 0' : '112px 64px 0', maxWidth: 1440, margin: '0 auto' }}>
        <section id="inicio" aria-label={t('nav.items.inicio')}>
          <Hero />
        </section>
        <About onOpenProject={setOpenProject} />
        <Projects onOpen={setOpenProject} />
        <DigitalTwins />
        <Contact />
        <Footer />
      </main>
      {!isMobile && <TweaksToggle onClick={() => setPanelOpen(o => !o)} />}
      {!isMobile && <TweaksPanel open={panelOpen} tweaks={tweaks} setTweaks={setTweaks} onClose={() => setPanelOpen(false)} />}
      <ProjectModal project={openProject} onClose={closeProject} />
    </>
  );
}
