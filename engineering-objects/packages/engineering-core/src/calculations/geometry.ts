/**
 * Volúmenes y superficies analíticas de sólidos de revolución sencillos (eje vertical).
 */

/** Volumen del cilindro. */
export function cylinderVolume(radius: number, height: number): number {
  return Math.PI * radius * radius * height;
}

/**
 * Volumen bajo la cota 0 de un fondo cónico con poceta:
 *   profundidad d(r) = s·(rs − r) para rp ≤ r ≤ rs ; d(r) = s·(rs − rp) para r < rp
 * (no incluye el volumen de la poceta bajo su borde).
 *   V = 2π·s·[rs·r²/2 − r³/3]_{rp}^{rs} + π·rp²·s·(rs − rp)
 */
export function conicalFloorVolume(slope: number, slopeStartRadius: number, sumpRadius: number): number {
  const rs = slopeStartRadius;
  const rp = Math.min(sumpRadius, rs);
  const F = (r: number) => (rs * r * r) / 2 - (r * r * r) / 3;
  return 2 * Math.PI * slope * (F(rs) - F(rp)) + Math.PI * rp * rp * slope * (rs - rp);
}

/** Superficie lateral del tronco de cono entre radios r1 < r2 con caída vertical dy. */
export function frustumLateralArea(r1: number, r2: number, dy: number): number {
  const slant = Math.hypot(r2 - r1, dy);
  return Math.PI * (r1 + r2) * slant;
}
