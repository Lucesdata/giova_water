import React, { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';
import { usePrefersReducedMotion, Reveal } from './primitives.jsx';

const VH_PER_STEP = 55;

function StepCard({ n, s, current }) {
  return (
    <li className="cycle-item" aria-current={current ? 'step' : undefined}
        style={{ border: '1px solid var(--line)', background: 'var(--bg-1)', padding: 16 }}>
      <div className="mono" style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 8 }}>{String(n).padStart(2, '0')}</div>
      <div className="cycle-item-title" style={{ fontFamily: 'var(--f-mono)', fontSize: 14, color: 'var(--ink)', marginBottom: 6 }}>{s.t}</div>
      <p style={{ margin: 0, color: 'var(--ink-1)', fontSize: 13, lineHeight: 1.55 }}>{s.d}</p>
    </li>
  );
}

/* The 7-step work cycle. On wide screens it is a sticky stage that follows the
   scroll (one step per ~55vh, driven by IntersectionObserver sentinels, no
   scroll listener). On small screens, or with reduced motion, it is a plain list. */
export default function CycleFlow({ cycle }) {
  const t = useT();
  const { isMobile } = useBreakpoint();
  const reduced = usePrefersReducedMotion();
  const steps = Array.isArray(cycle.steps) ? cycle.steps : [];
  const scrolly = !isMobile && !reduced;
  const [active, setActive] = useState(0);
  const sentinels = useRef([]);

  useEffect(() => {
    if (!scrolly || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(Number(e.target.dataset.i));
    }, { rootMargin: '-45% 0px -45% 0px' });
    sentinels.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [scrolly, steps.length]);

  const head = (
    <>
      <h3 className="label-accent" style={{ margin: '0 0 8px', fontWeight: 400 }}>{cycle.label}</h3>
      <p style={{ margin: '0 0 12px', fontFamily: 'var(--f-mono)', fontSize: 'clamp(20px, 2.2vw, 28px)', color: 'var(--ink)', maxWidth: 640, letterSpacing: '-0.02em', textWrap: 'balance' }}>{cycle.title}</p>
    </>
  );
  const note = <p style={{ margin: '16px 0 0', color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.55, maxWidth: 620 }}>{cycle.note}</p>;

  if (!scrolly) {
    return (
      <div>
        <Reveal>{head}</Reveal>
        <ol style={{ listStyle: 'none', margin: '16px 0 0', padding: 0, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}>
          {steps.map((s, i) => (
            <Reveal as="li" key={i} delay={(i % 4) * 80} className="cycle-item"
                    style={{ border: '1px solid var(--line)', background: 'var(--bg-1)', padding: 16 }}>
              <div className="mono" style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 8 }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 14, color: 'var(--ink)', marginBottom: 6 }}>{s.t}</div>
              <p style={{ margin: 0, color: 'var(--ink-1)', fontSize: 13, lineHeight: 1.55 }}>{s.d}</p>
            </Reveal>
          ))}
        </ol>
        {note}
      </div>
    );
  }

  const cur = steps[active] || steps[0] || { t: '', d: '' };
  return (
    <div>
      {head}
      <div style={{ position: 'relative', height: `${steps.length * VH_PER_STEP}vh`, marginTop: 8 }}>
        {steps.map((_, i) => (
          <div key={i} ref={(el) => { sentinels.current[i] = el; }} data-i={i} aria-hidden="true"
               style={{ position: 'absolute', left: 0, right: 0, top: `${i * VH_PER_STEP}vh`, height: `${VH_PER_STEP}vh`, pointerEvents: 'none' }} />
        ))}
        <div className="cycle-stage">
          <div aria-hidden="true">
            <div className="cycle-big mono" key={active} style={{ fontSize: 'clamp(72px, 9vw, 140px)', lineHeight: 1, color: 'var(--accent)', letterSpacing: '-0.04em' }}>
              {String(active + 1).padStart(2, '0')}
            </div>
            <div className="label" style={{ margin: '12px 0 12px' }}>
              {t('about.cycle.stage', { n: active + 1, total: steps.length })}
            </div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 'clamp(24px, 3vw, 40px)', color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 16, textWrap: 'balance' }}>{cur.t}</div>
            <p style={{ margin: 0, color: 'var(--ink-1)', fontSize: 16, lineHeight: 1.6, maxWidth: 440 }}>{cur.d}</p>
            <div style={{ marginTop: 28, height: 2, background: 'var(--line)', maxWidth: 440 }}>
              <div style={{ height: '100%', width: `${((active + 1) / steps.length) * 100}%`, background: 'var(--accent)', transition: 'width 600ms var(--ease-heavy)' }} />
            </div>
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {steps.map((s, i) => <StepCard key={i} n={i + 1} s={s} current={i === active} />)}
          </ol>
        </div>
      </div>
      {note}
    </div>
  );
}
