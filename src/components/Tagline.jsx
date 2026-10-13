import React, { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n.jsx';
import { usePrefersReducedMotion } from './primitives.jsx';

/* Large statement. Each word goes from muted to full colour, one at a time, as
   it crosses a trigger line at ~60% of the viewport height. One
   IntersectionObserver per word: no scroll listener. */
export default function Tagline() {
  const t = useT();
  const reduced = usePrefersReducedMotion();
  const words = String(t('tagline.text')).split(' ');
  const refs = useRef([]);
  const [on, setOn] = useState(() => new Set());

  useEffect(() => {
    if (reduced || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => {
      // IntersectionObserver only reports a word when it enters or leaves the
      // band, so a jump (anchor link, End key, reload mid-page) would skip the
      // words it passed over. Recompute every word against the trigger line
      // whenever anything reports.
      const line = entries[0]?.rootBounds ? entries[0].rootBounds.bottom : window.innerHeight * 0.6;
      const next = new Set();
      refs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top < line) next.add(i);
      });
      setOn((prev) => (prev.size === next.size && [...next].every((i) => prev.has(i)) ? prev : next));
    }, { rootMargin: '0px 0px -40% 0px' });
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [reduced, words.length]);

  return (
    <section id="eslogan" className="tagline" aria-label={t('tagline.label')} style={{ padding: '120px 0', borderTop: '1px solid var(--line)' }}>
      <p style={{
        margin: 0, maxWidth: 880,
        fontFamily: 'var(--f-mono)', fontWeight: 500,
        fontSize: 'clamp(30px, 4.6vw, 60px)', lineHeight: 1.15, letterSpacing: '-0.03em',
        color: 'var(--ink)', textWrap: 'balance',
      }}>
        {words.map((w, i) => (
          <React.Fragment key={i}>
            <span ref={(el) => { refs.current[i] = el; }} data-i={i} className={`tagline-word${reduced || on.has(i) ? ' on' : ''}`}>{w}</span>{' '}
          </React.Fragment>
        ))}
      </p>
    </section>
  );
}
