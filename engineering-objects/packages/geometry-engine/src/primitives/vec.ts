import type { Vec3 } from './shapes.js';

export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const length = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
export const dist = (a: Vec3, b: Vec3): number => length(sub(a, b));

/** Rotación alrededor de Y (sentido antihorario visto desde +Y, convención Three.js). */
export function rotateY(p: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c * p[0] + s * p[2], p[1], -s * p[0] + c * p[2]];
}

/** Punto en coordenadas cilíndricas (r, θ, y) → cartesianas, con θ medido desde +X hacia −Z (igual que rotateY). */
export function polar(r: number, theta: number, y: number): Vec3 {
  return rotateY([r, y, 0], theta);
}
