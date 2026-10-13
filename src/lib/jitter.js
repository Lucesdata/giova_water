/* Seeded pseudo-random jitter: base ± amp, the same for the same seed. */
export function jitter(base, amp, seed) {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  const r = s - Math.floor(s);
  return base + (r - 0.5) * 2 * amp;
}
