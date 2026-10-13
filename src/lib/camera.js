// Camera for the plant journey. The scene is an 800×440 SVG; each key says
// which point sits at the centre and how far we are zoomed in. Key 0 is the
// overview, keys 1..n are the stages in order.
export const CAMERA = [
  { x: 400, y: 240, s: 1 },     // overview
  { x: 110, y: 240, s: 2.7 },   // intake
  { x: 295, y: 240, s: 2.5 },   // coagulation / flocculation
  { x: 430, y: 240, s: 2.3 },   // sedimentation
  { x: 555, y: 240, s: 2.7 },   // filtration
  { x: 660, y: 240, s: 2.9 },   // disinfection
  { x: 735, y: 240, s: 2.9 },   // storage
];
export const STAGES = CAMERA.length - 1;

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
// Smoothstep with a plateau: the camera rests at each stage for ~30% of the
// segment on either side and glides in the middle.
const glide = (t) => { const u = clamp((t - 0.3) / 0.4, 0, 1); return u * u * (3 - 2 * u); };

/** f: 0 = overview … STAGES = last stage. Returns the interpolated camera. */
export function cameraAt(f) {
  const c = clamp(f, 0, STAGES);
  const i = Math.min(Math.floor(c), STAGES - 1);
  const t = glide(c - i);
  const a = CAMERA[i]; const b = CAMERA[i + 1];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, s: a.s + (b.s - a.s) * t };
}

/** Scroll progress through the tall container (0..1) -> position along the stages. */
export const progressToF = (p) => clamp(p, 0, 1) * STAGES;
/** Which stage the text should show: 0 = overview, 1..STAGES. */
export const activeStage = (f) => clamp(Math.round(f), 0, STAGES);
/** SVG transform that puts camera point (x, y) at the scene centre at zoom s. */
export const cameraTransform = ({ x, y, s }) => `translate(400 220) scale(${s.toFixed(3)}) translate(${(-x).toFixed(2)} ${(-y).toFixed(2)})`;
