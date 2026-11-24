import React, { useState, useEffect, useRef } from 'react';

/* prefers-reduced-motion, kept in sync with the OS setting */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

/* True while the element is on screen AND the tab is visible. It flips back to
   false, so media can stop when nobody sees it. */
export function useOnScreen(ref, rootMargin = '80px') {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setOn(true); return undefined; }
    let intersecting = false;
    let visible = typeof document === 'undefined' || document.visibilityState !== 'hidden';
    const update = () => setOn(intersecting && visible);
    const io = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update(); }, { rootMargin });
    io.observe(el);
    const onVis = () => { visible = document.visibilityState !== 'hidden'; update(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  }, [ref, rootMargin]);
  return on;
}

/* Short fade-up (opacity + 12 px, 200 ms) when the element enters the viewport.
   One IntersectionObserver per element (no scroll listeners). The content is
   shown at once with reduced motion or without IntersectionObserver. */
export function Reveal({ as: Tag = 'div', className = '', style, children, ...rest }) {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (reduced || !el || typeof IntersectionObserver === 'undefined') { setShown(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0, rootMargin: '0px 0px -4% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);
  return (
    <Tag ref={ref} className={`reveal${shown ? ' is-in' : ''} ${className}`.trim()} style={style} {...rest}>
      {children}
    </Tag>
  );
}

/* Active section from scroll position. A section becomes active once its top
   is above the header height plus 30 % of the viewport, so an anchor jump (which
   puts the section right under the header) always activates the target. At the
   very bottom of the page the last section wins, because it may be too short to
   ever reach the top. */
export function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join(',');
  useEffect(() => {
    const list = key.split(',');
    let raf = 0;
    const compute = () => {
      raf = 0;
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 0;
      const line = header + window.innerHeight * 0.3;
      const doc = document.documentElement;
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) { setActive(list[list.length - 1]); return; }
      for (let i = list.length - 1; i >= 0; i--) {
        const el = document.getElementById(list[i]);
        if (el && el.getBoundingClientRect().top <= line) { setActive(list[i]); return; }
      }
      setActive(list[0]);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(compute); };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [key]);
  return active;
}

/* Lock body scroll while a modal is open */
export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [locked]);
}

/* Logo: mark + name */
export function Logo({ label = 'giova_water' }) {
  return (
    <a href="#inicio" aria-label={label} className="logo">
      <svg width="24" height="24" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="21" height="21" rx="4" stroke="currentColor" opacity="0.35"/>
        <path d="M6 15 L11 5 L16 15" stroke="var(--accent)" strokeWidth="1.5" fill="none"/>
        <circle cx="11" cy="11" r="1.5" fill="var(--accent)"/>
      </svg>
      <span>giova<span style={{ color: 'var(--accent)' }}>_</span>water</span>
    </a>
  );
}

/* Section header: eyebrow, title and an optional lead paragraph. */
export function SectionHeader({ id, eyebrow, title, lead, aside }) {
  return (
    <Reveal className="section-head">
      <div className="section-head-row">
        <div style={{ minWidth: 0 }}>
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={id} className="h2">{title}</h2>
        </div>
        {aside}
      </div>
      {lead && <p className="prose section-lead">{lead}</p>}
    </Reveal>
  );
}

/* Tech tag */
export function Tag({ children }) {
  return <span className="chip">{children}</span>;
}

/* Copy button */
export function Copyable({ value, children, ariaLabel }) {
  const [copied, setCopied] = useState(false);
  const onClick = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel || value} className="copyable">
      {children}
      <span className="mono" aria-hidden="true" style={{ fontSize: 12, color: copied ? 'var(--accent)' : 'var(--ink-3)' }}>
        {copied ? '✓' : '⎘'}
      </span>
    </button>
  );
}
