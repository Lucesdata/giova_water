import { useEffect, useLayoutEffect } from 'react';
import { projectFromHash } from '../data/projects.js';

/* Publishes the real height of the fixed header as --nav-h. CSS turns it into
   scroll-padding-top (anchor links, browser fragment scroll) and into the top
   padding of the page, so the offset exists in exactly one place and follows the
   header at every breakpoint and language. */
export function useNavHeight(ref) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const root = document.documentElement;
    const publish = () => root.style.setProperty('--nav-h', `${Math.round(el.getBoundingClientRect().height)}px`);
    publish();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', publish);
      return () => window.removeEventListener('resize', publish);
    }
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
}

const idFromHash = (hash) => {
  if (!hash || hash.length < 2) return '';
  try { return decodeURIComponent(hash.slice(1)); } catch { return ''; }
};

/* The page is rendered by React, so when it is opened on a URL with a fragment
   the browser has no target yet and does not scroll. Scroll once the sections
   exist, then again after fonts and images settle the layout, but only if the
   visitor has not scrolled by themselves in the meantime. Project addresses
   (#proyecto/<slug>) open the project and are not section anchors. */
export function useInitialHashScroll() {
  useEffect(() => {
    const id = idFromHash(window.location.hash);
    const target = id && !projectFromHash(window.location.hash) ? document.getElementById(id) : null;
    if (!target) return undefined;
    let userMoved = false;
    const stop = () => { userMoved = true; };
    const align = () => {
      if (userMoved) return;
      document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' });
    };
    const events = ['wheel', 'touchstart', 'keydown', 'mousedown'];
    events.forEach((e) => window.addEventListener(e, stop, { passive: true, once: true }));
    align();
    const timers = [setTimeout(align, 250), setTimeout(align, 900)];
    document.fonts?.ready?.then(align);
    window.addEventListener('load', align, { once: true });
    return () => {
      events.forEach((e) => window.removeEventListener(e, stop));
      window.removeEventListener('load', align);
      timers.forEach(clearTimeout);
    };
  }, []);
}

/* Scroll to a section and keep it under the header until the layout settles.
   Content above the target keeps changing size while (and after) the page
   scrolls past it: reveal-on-scroll blocks, the scope tiles and their animated
   dots, late fonts. A single scrollIntoView aims at where the section was when
   it started, so it lands tens of pixels off (or, for a long smooth scroll, has
   not arrived yet). This re-aligns instantly once scrolling has gone quiet, and
   stops as soon as the visitor scrolls, taps or types, or after the layout has
   been still for a while. `behavior: 'smooth'` means "the browser is already
   smooth-scrolling there": nothing is corrected until that scroll has ended. */
let stopAlignment = null;

export function alignToSection(id, { behavior = 'instant' } = {}) {
  stopAlignment?.();
  const target = () => document.getElementById(id);
  if (!target()) return;

  const root = document.documentElement;
  const QUIET_MS = 1000;    // stop after this long with no scrolling and nothing to fix
  const IDLE_MS = 120;      // a scroll this old is over
  const MAX_MS = 8000;      // never hold the page longer than this
  const start = performance.now();
  let lastScroll = start;
  let lastActivity = start;
  let armed = behavior !== 'smooth';
  let raf = 0;
  let armTimer = 0;

  const offset = () => target().getBoundingClientRect().top - (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0);
  const canMove = (d) => (d > 0 ? root.scrollTop < root.scrollHeight - root.clientHeight - 1 : root.scrollTop > 0);
  const align = () => target()?.scrollIntoView({ block: 'start', behavior: 'instant' });

  const onScroll = () => { lastScroll = performance.now(); lastActivity = lastScroll; };
  const onScrollEnd = () => { armed = true; };
  const userEvents = ['wheel', 'touchstart', 'keydown', 'mousedown'];
  const stop = () => {
    cancelAnimationFrame(raf);
    clearTimeout(armTimer);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('scrollend', onScrollEnd);
    userEvents.forEach((e) => window.removeEventListener(e, stop));
    if (stopAlignment === stop) stopAlignment = null;
  };
  stopAlignment = stop;

  const tick = (now) => {
    if (!target()) { stop(); return; }
    if (armed && now - lastScroll > IDLE_MS) {
      const d = offset();
      if (Math.abs(d) > 1 && canMove(d)) { align(); lastActivity = now; }
    }
    if (now - lastActivity > QUIET_MS || now - start > MAX_MS) { stop(); return; }
    raf = requestAnimationFrame(tick);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scrollend', onScrollEnd);
  userEvents.forEach((e) => window.addEventListener(e, stop, { passive: true }));
  // Browsers without `scrollend` (or a smooth scroll that never starts because
  // the page is already there) still get corrected.
  if (!armed) armTimer = setTimeout(() => { armed = true; }, 1500);
  if (behavior !== 'smooth') align();
  raf = requestAnimationFrame(tick);
}

/* In-page links (#section) are followed by the browser with the smooth scroll
   from the CSS; this keeps the section aligned once that scroll ends. Links that
   handle themselves (preventDefault) or point at a project are left alone. */
export function useSectionLinkAlignment() {
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.('a[href^="#"]');
      if (!a) return;
      const id = idFromHash(a.getAttribute('href'));
      if (!id || projectFromHash(`#${id}`) || !document.getElementById(id)) return;
      const smooth = getComputedStyle(document.documentElement).scrollBehavior === 'smooth';
      alignToSection(id, { behavior: smooth ? 'smooth' : 'instant' });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
}
