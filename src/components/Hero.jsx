import React, { useState, useEffect, useRef } from 'react';
import { useOnScreen, usePrefersReducedMotion } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import Cycle, { Scope } from './Cycle.jsx';
import ScadaOverlay from './ScadaOverlay.jsx';
import { cueAt, seekTime } from '../lib/scadaCues.js';

/* Real footage of a plant's supervision screen, silent and short. It plays only
   while it is on screen, never with reduced motion unless the person starts it,
   and always has a pause button (WCAG 2.2.2). The poster is the still frame.
   The callouts (ScadaOverlay) read the clip's own currentTime, so video,
   callouts and the variable buttons below always agree. */
function ScadaVideo({ labels }) {
  const ref = useRef(null);
  const boxRef = useRef(null);
  const reduced = usePrefersReducedMotion();
  const onScreen = useOnScreen(boxRef);
  const [choice, setChoice] = useState(null); // null = automatic, 'play' | 'pause' = the person decided
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [jumped, setJumped] = useState(null);  // variable the person picked; announced to screen readers
  const wants = choice ? choice === 'play' : !reduced;
  const run = onScreen && wants;
  const cue = cueAt(time);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      if (run) { const p = el.play?.(); p?.catch?.(() => {}); } else el.pause?.();
    } catch { /* media playback is not available (tests, old browsers): the poster stays */ }
  }, [run]);

  // The clock is the video's currentTime: read on timeupdate/seeked and, while it
  // plays on screen, every frame. Off screen or paused there is no loop.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => setTime(el.currentTime || 0);
    el.addEventListener('timeupdate', read);
    el.addEventListener('seeked', read);
    let raf;
    const loop = () => { read(); raf = requestAnimationFrame(loop); };
    if (run && playing) raf = requestAnimationFrame(loop);
    return () => {
      el.removeEventListener('timeupdate', read);
      el.removeEventListener('seeked', read);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [run, playing]);

  // The automatic cycle moving on ends the announcement of a picked variable.
  useEffect(() => { if (jumped !== null && cue.index !== jumped) setJumped(null); }, [cue.index, jumped]);

  const jump = (index) => {
    const el = ref.current;
    const to = seekTime(index);
    setJumped(index);
    setTime(to);
    if (el) { try { el.currentTime = to; } catch { /* metadata not loaded yet: the callout still follows */ } }
  };

  const names = Array.isArray(labels.vars) ? labels.vars : [];
  return (
    <>
      <div ref={boxRef} className="hero-video">
        <video ref={ref} muted loop playsInline preload="metadata" poster="/assets/video/scada-ptap-poster.jpg"
               width="640" height="360" aria-label={labels.alt}
               onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}>
          <source src="/assets/video/scada-ptap.webm" type="video/webm" />
          <source src="/assets/video/scada-ptap.mp4" type="video/mp4" />
        </video>
        <ScadaOverlay t={time} playing={playing} labels={labels} announce={jumped !== null} />
        <span className="chip hero-video-badge">{labels.badge}</span>
        <button type="button" className="hero-video-toggle" aria-pressed={!playing}
                onClick={() => setChoice(playing ? 'pause' : 'play')}>
          <span aria-hidden="true">{playing ? '❚❚' : '▶'}</span> {playing ? labels.pause : labels.play}
        </button>
      </div>
      <div className="hero-vars">
        <span className="label">{labels.varsLabel}</span>
        <ul>
          {names.map((x, i) => (
            <li key={x}>
              <button type="button" aria-pressed={cue.index === i} onClick={() => jump(i)}>{x}</button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default function Hero() {
  const t = useT();
  const stats = t('hero.stats');
  const video = t('hero.video');
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
          <span className="chip hero-photo-note">{t('hero.imageNote')}</span>
        </div>
        <div className="hero-copy">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <span className="label-accent">{t('hero.kicker')}</span>
            <span aria-hidden="true" style={{ flex: 1, height: 1, background: 'var(--accent-line)', minWidth: 24 }}/>
            <span className="label" style={{ color: 'var(--ink-1)' }}>{t('hero.role')}</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--f-mono)',
            fontSize: 'clamp(28px, 3.4vw, 48px)',
            lineHeight: 1.06,
            letterSpacing: '-0.03em',
            fontWeight: 600,
            margin: '0 0 14px',
            textWrap: 'balance',
          }}>
            {split ? <>{h1.slice(0, h1.length - accent.length)}<span style={{ color: 'var(--accent)', whiteSpace: 'nowrap' }}>{accent}</span></> : h1}
          </h1>
          <p className="prose" style={{ maxWidth: 560, fontSize: 17, margin: '0 0 22px', color: 'var(--ink)' }}>
            {t('hero.intro')}
          </p>
          <div className="hero-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#proyectos" className="btn primary">{t('hero.ctaProjects')} <span aria-hidden="true">→</span></a>
            <a href="#contacto" className="btn hero-secondary">{t('hero.ctaContact')} <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </div>

      <div className="hero-below">
        <div className="hero-side">
        <dl className="hero-stats">
          {(Array.isArray(stats) ? stats : []).map((s, i) => (
            <div key={i}>
              <dt style={{ fontFamily: 'var(--f-mono)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{s.v}</dt>
              <dd className="label" style={{ margin: '4px 0 0' }}>{s.l}</dd>
            </div>
          ))}
        </dl>
        <Scope />
        </div>

        <figure style={{ margin: 0, minWidth: 0 }}>
          <figcaption style={{
            display: 'flex', justifyContent: 'space-between', gap: 4, flexWrap: 'wrap', marginBottom: 12,
            fontFamily: 'var(--f-mono)', fontSize: 13, color: 'var(--ink-1)',
          }}>
            <span>{video.fig}</span>
            <span style={{ color: 'var(--accent)' }}>{video.note}</span>
          </figcaption>
          <ScadaVideo labels={video} />
        </figure>
      </div>

      <Cycle />
    </div>
  );
}
