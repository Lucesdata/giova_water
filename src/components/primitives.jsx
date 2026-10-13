import React, { useState, useEffect, useRef } from 'react';

/* Utility: tick hook for live data */
export function useTick(interval = 1000, enabled = true) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => setT(v => v + 1), interval);
    return () => clearInterval(id);
  }, [interval, enabled]);
  return t;
}

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

/* True while the element is on screen AND the tab is visible. Unlike useInView
   it flips back to false, so animations can stop when nobody sees them. */
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

/* Utility: seeded pseudo-random jitter */
export function jitter(base, amp, seed) {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  const r = s - Math.floor(s);
  return base + (r - 0.5) * 2 * amp;
}

/* Animated number (ease-in toward target when visible) */
export function AnimatedNumber({ value, duration = 1200, format = (v) => v.toFixed(0), trigger = true }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let raf;
    const start = performance.now();
    const to = value;
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(to * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, trigger, duration]);
  return <span>{format(v)}</span>;
}

/* IntersectionObserver hook */
export function useInView(opts = { threshold: 0.2 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, opts);
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, inView];
}

/* Scroll progress (0-1) */
export function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? h.scrollTop / max : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return p;
}

/* Active section from scroll position */
export function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + window.innerHeight * 0.3;
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i]);
        if (el && el.offsetTop <= y) {
          setActive(ids[i]);
          return;
        }
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [ids.join(',')]);
  return active;
}

/* Lock body scroll while a modal is open */
export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [locked]);
}

/* Logo mark */
export function Logo({ label = 'giova_water' }) {
  return (
    <a href="#inicio" aria-label={label} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--ink)' }}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="21" height="21" stroke="currentColor" opacity="0.35"/>
        <path d="M6 15 L11 5 L16 15" stroke="var(--accent)" strokeWidth="1.5" fill="none"/>
        <circle cx="11" cy="11" r="1.5" fill="var(--accent)"/>
      </svg>
      <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 600, fontSize: 13, letterSpacing: '0.02em' }}>
        giova<span style={{ color: 'var(--accent)' }}>_</span>water
      </span>
    </a>
  );
}

/* Section index label (01, 02...) */
export function SectionIndex({ n, title, kicker }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--accent)',
          letterSpacing: '0.14em', borderTop: '1px solid var(--accent-line)',
          paddingTop: 6,
        }}>§ {n}</div>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
      </div>
      <div className="label" style={{ color: 'var(--ink-2)' }}>{kicker}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-1)', fontFamily: 'var(--f-mono)' }}>{title}</div>
    </div>
  );
}

/* Status light */
export function StatusDot({ color = 'var(--accent)', label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink-1)' }}>
      <span className="blink" aria-hidden="true" style={{
        width: 7, height: 7, borderRadius: '50%',
        background: color, boxShadow: `0 0 8px ${color}`,
      }}/>
      {label}
    </span>
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
    <button onClick={onClick} aria-label={ariaLabel || value} className="copyable">
      {children}
      <span className="mono" aria-hidden="true" style={{ fontSize: 12, color: copied ? 'var(--accent)' : 'var(--ink-3)' }}>
        {copied ? '✓' : '⎘'}
      </span>
    </button>
  );
}

/* Sparkline */
export function Sparkline({ data, color = 'var(--accent)', height = 32, width = 120, fill = true, label = '' }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const path = `M ${pts.join(' L ')}`;
  const fillPath = fill ? `${path} L ${width},${height} L 0,${height} Z` : '';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} style={{ display: 'block', width: '100%', height: 'auto', maxWidth: width }}>
      {fill && <path d={fillPath} fill={color} opacity="0.1"/>}
      <path d={path} stroke={color} strokeWidth="1.25" fill="none"/>
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="2" fill={color}/>
    </svg>
  );
}
