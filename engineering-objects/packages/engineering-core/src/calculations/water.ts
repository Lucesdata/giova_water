/**
 * Propiedades físicas del agua pura a presión atmosférica (CRC Handbook of Chemistry and Physics).
 * Interpolación lineal entre puntos tabulados cada 5 °C; fuera de 0–40 °C se rechaza.
 */
const T = [0, 5, 10, 15, 20, 25, 30, 35, 40] as const;
/** Viscosidad dinámica, mPa·s */
const MU = [1.792, 1.519, 1.307, 1.138, 1.002, 0.89, 0.798, 0.719, 0.653] as const;
/** Densidad, kg/m³ */
const RHO = [999.84, 999.97, 999.7, 999.1, 998.21, 997.05, 995.65, 994.03, 992.22] as const;

function interp(table: readonly number[], tempC: number): number {
  if (!(tempC >= T[0] && tempC <= T[T.length - 1]!)) {
    throw new RangeError(`Temperatura del agua fuera del rango tabulado 0–40 °C: ${tempC}`);
  }
  const i = Math.min(Math.floor(tempC / 5), T.length - 2);
  const t0 = T[i]!;
  const f = (tempC - t0) / 5;
  return table[i]! + (table[i + 1]! - table[i]!) * f;
}

/** Viscosidad dinámica del agua, Pa·s. */
export function waterDynamicViscosity(tempC: number): number {
  return interp(MU, tempC) * 1e-3;
}

/** Densidad del agua, kg/m³. */
export function waterDensity(tempC: number): number {
  return interp(RHO, tempC);
}
