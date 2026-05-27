import React, { useState, useEffect } from 'react';
import { useActiveSection, useScrollProgress } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import Nav from './Nav.jsx';
import Hero from './Hero.jsx';
import About from './About.jsx';
import Projects from './Projects.jsx';
import ProjectModal from './ProjectModal.jsx';
import DigitalTwins from './DigitalTwins.jsx';
import { Contact, Footer } from './Contact.jsx';

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
        writingMode: 'vertical-rl', fontSize: 9.5, color: 'var(--ink-3)',
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
          <a key={s.id} href={`#${s.id}`} title={s.id} style={{
            fontFamily: 'var(--f-mono)', fontSize: 9.5,
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
        <span style={{ fontSize: 11, color: 'var(--ink)' }}>{t('common.tweaks')}</span>
        <button onClick={onClose} aria-label={t('common.closeAria')} style={{ background: 'none', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', fontSize: 14 }}>×</button>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ marginBottom: 16 }}>
          <div className="label-accent" style={{ marginBottom: 8 }}>{t('common.heroVariant')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
            {[
              { v: 'schematic', l: 'SCHEMATIC' },
              { v: 'typographic', l: 'TYPO' },
              { v: 'terminal', l: 'TERMINAL' },
            ].map(opt => (
              <button key={opt.v}
                onClick={() => setTweaks({ ...tweaks, hero: opt.v })}
                aria-pressed={tweaks.hero === opt.v}
                style={{
                  padding: '6px 4px', fontSize: 10, letterSpacing: '0.08em',
                  background: tweaks.hero === opt.v ? 'var(--accent)' : 'transparent',
                  color: tweaks.hero === opt.v ? 'var(--bg)' : 'var(--ink-1)',
                  border: '1px solid ' + (tweaks.hero === opt.v ? 'var(--accent)' : 'var(--line-2)'),
                  fontFamily: 'inherit', cursor: 'pointer',
                }}>{opt.l}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div className="label-accent" style={{ marginBottom: 8 }}>{t('common.palette')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[
              { v: 'instrument', l: 'CYAN', c: '#4ee8d1' },
              { v: 'teal', l: 'TEAL', c: '#3dd9a8' },
              { v: 'copper', l: 'COPPER', c: '#e89558' },
              { v: 'paper', l: 'PAPER', c: '#0e6354' },
            ].map(opt => (
              <button key={opt.v}
                onClick={() => setTweaks({ ...tweaks, palette: opt.v })}
                aria-pressed={tweaks.palette === opt.v}
                style={{
                  padding: '6px 8px', fontSize: 10, textAlign: 'left',
                  background: tweaks.palette === opt.v ? 'var(--bg-3)' : 'transparent',
                  color: 'var(--ink-1)',
                  border: '1px solid ' + (tweaks.palette === opt.v ? 'var(--accent)' : 'var(--line-2)'),
                  fontFamily: 'inherit', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                <span aria-hidden="true" style={{ width: 8, height: 8, background: opt.c, border: '1px solid rgba(255,255,255,0.2)' }}/>
                {opt.l}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <div className="label-accent" style={{ marginBottom: 8 }}>{t('common.gridBackdrop')}</div>
          <label style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--ink-1)', cursor: 'pointer' }}>
            <input type="checkbox" checked={tweaks.grid} onChange={e => setTweaks({ ...tweaks, grid: e.target.checked })}/>
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
    <button onClick={onClick} aria-label={t('common.tweaksAria')} title="Tweaks" style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 99,
      width: 40, height: 40,
      background: 'var(--bg-1)', border: '1px solid var(--line-hi)',
      color: 'var(--accent)', cursor: 'pointer',
      fontFamily: 'var(--f-mono)', fontSize: 14,
    }}>⚙</button>
  );
}

const TWEAK_DEFAULTS = { hero: 'schematic', palette: 'instrument', grid: true };
const TWEAKS_STORAGE = 'giova_water:tweaks';

export default function App() {
  const active = useActiveSection(['inicio', 'sobre', 'proyectos', 'gemelos', 'contacto']);
  const [tweaks, setTweaks] = useState(() => {
    if (typeof window === 'undefined') return TWEAK_DEFAULTS;
    try {
      const saved = window.localStorage?.getItem(TWEAKS_STORAGE);
      return saved ? { ...TWEAK_DEFAULTS, ...JSON.parse(saved) } : TWEAK_DEFAULTS;
    } catch { return TWEAK_DEFAULTS; }
  });
  const [panelOpen, setPanelOpen] = useState(false);
  const [openProject, setOpenProject] = useState(null);

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
      <a href="#main" className="skip-link">Saltar al contenido</a>
      {tweaks.grid && <div className="grid-bg" aria-hidden="true"/>}
      <Nav active={active} />
      <ScrollRail active={active} />
      <main id="main" style={{ position: 'relative', zIndex: 1, padding: '120px 64px 0', maxWidth: 1440, margin: '0 auto' }}>
        <section id="inicio" aria-label="Inicio">
          <Hero variant={tweaks.hero}/>
        </section>
        <About />
        <Projects onOpen={setOpenProject} />
        <DigitalTwins />
        <Contact />
        <Footer />
      </main>
      <TweaksToggle onClick={() => setPanelOpen(o => !o)} />
      <TweaksPanel open={panelOpen} tweaks={tweaks} setTweaks={setTweaks} onClose={() => setPanelOpen(false)} />
      <ProjectModal project={openProject} onClose={() => setOpenProject(null)} />
    </>
  );
}
