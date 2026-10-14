// Timeline of the callouts over the SCADA clip. Pure functions, no React: the
// clock is always the video's own currentTime, so the callouts cannot drift.
export const SEG = 2.2;              // seconds per variable
export const N = 6;                  // variables
export const END = 2.8;              // seconds of the closing card
const r3 = (x) => Math.round(x * 1000) / 1000;   // 2.2 * 6 is 13.200000000000001 in floating point
const BODY = r3(SEG * N);                        // seconds taken by the six variables
export const LOOP = r3(BODY + END);              // 16 s, the length of the clip

// Where each callout points, in % of the video box (x, y), over the HMI screen.
export const ANCHORS = [[31, 23], [37.5, 25], [27, 29], [31, 29], [27, 36], [33, 36]];
// Generic ISA instrument tags: they label the kind of instrument, not a real tag of the plant.
export const TAGS = ['FT', 'LT', 'AT · NTU', 'AT · pH', 'AT · O₂', 'AT · Cl₂'];
export const UNITS = ['L/s', '%', 'NTU', '', 'mg/L', 'mg/L'];

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const wrap = (t) => {
  const x = Number.isFinite(t) ? t : 0;
  return ((x % LOOP) + LOOP) % LOOP;
};

/* Which callout is on screen at time t.
   index: 0..5 a variable, -1 the closing card. phase: 0..1 inside its slot.
   fade: 0..1 opacity (in over the first 12 %, out over the last 10 %; the
   closing card 10 % / 8 %). */
export function cueAt(t) {
  const u = wrap(t);
  if (u < BODY) {
    const index = Math.min(N - 1, Math.floor(u / SEG + 1e-9));
    const phase = clamp01((u - index * SEG) / SEG);
    return { index, phase, fade: clamp01(Math.min(phase / 0.12, (1 - phase) / 0.10)) };
  }
  const phase = clamp01((u - BODY) / END);
  return { index: -1, phase, fade: clamp01(Math.min(phase / 0.10, (1 - phase) / 0.08)) };
}

/* Fill 0..1 of each of the 7 progress segments (six variables + closing card). */
export function progress(t) {
  const u = wrap(t);
  return Array.from({ length: N + 1 }, (_, i) => {
    const start = i * SEG;
    const len = i < N ? SEG : END;
    return clamp01((u - start) / len);
  });
}

// Time to seek to for a variable (a little after its start so the callout is already in).
export const seekTime = (index) => index * SEG + 0.3;
