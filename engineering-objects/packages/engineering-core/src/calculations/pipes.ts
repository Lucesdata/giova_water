/**
 * Serie de diámetros nominales (ISO 6708). En prediseño se aproxima el diámetro interior por el DN;
 * el diámetro interior real depende del material y la serie, y debe confirmarse al seleccionar la tubería.
 */
export const DN_SERIES_MM = [80, 100, 125, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1200] as const;

export interface DnSelection {
  readonly dn: number;
  readonly innerDiameterM: number;
  readonly velocityAtDesignM_s: number;
  /** true si ningún DN de la serie cumple la velocidad máxima. */
  readonly exhausted: boolean;
}

/**
 * Selecciona el menor DN, no inferior a `minDn`, cuya velocidad a `flowM3s` no supere `maxVelocity`.
 */
export function selectDn(flowM3s: number, maxVelocity: number, minDn = 0): DnSelection {
  const candidates = DN_SERIES_MM.filter((d) => d >= minDn);
  for (const dn of candidates) {
    const d = dn / 1000;
    const v = flowM3s / ((Math.PI * d * d) / 4);
    if (v <= maxVelocity) return { dn, innerDiameterM: d, velocityAtDesignM_s: v, exhausted: false };
  }
  const dn: number = candidates[candidates.length - 1] ?? DN_SERIES_MM[DN_SERIES_MM.length - 1]!;
  const d = dn / 1000;
  return { dn, innerDiameterM: d, velocityAtDesignM_s: flowM3s / ((Math.PI * d * d) / 4), exhausted: true };
}
