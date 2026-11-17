/* GSAP + Flip, loaded on demand so they stay out of the initial bundle.
   The first call starts the download; later calls reuse the same promise.
   If loading fails the layout still changes, it just isn't animated. */
let pending = null;

export function loadFlip() {
  if (!pending) {
    pending = Promise.all([import('gsap'), import('gsap/Flip')])
      .then(([{ gsap }, { Flip }]) => {
        gsap.registerPlugin(Flip);
        return Flip;
      })
      .catch(() => { pending = null; return null; });
  }
  return pending;
}

/* Same budget as the entry animations (tests/e2e "movimiento"): ≤ 250 ms,
   no delay, no stagger. */
export const FLIP_VARS = { duration: 0.24, ease: 'power2.out', simple: true };
