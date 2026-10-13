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
