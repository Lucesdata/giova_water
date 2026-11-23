/**
 * Sistema de unidades explícito.
 *
 * Convención interna (spec §3.2):
 *  - longitudes en m, ángulos en rad, caudales de cálculo en m³/s o m³/h,
 *  - toda conversión pasa por este módulo; ningún factor mágico en otro sitio.
 */

export type Dimension =
  | 'length'
  | 'area'
  | 'volume'
  | 'flow'
  | 'velocity'
  | 'surfaceLoading'
  | 'weirLoading'
  | 'time'
  | 'concentration'
  | 'temperature'
  | 'angle'
  | 'mass'
  | 'density'
  | 'stress'
  | 'slope'
  | 'massFlow'
  | 'solidsLoading'
  | 'turbidity'
  | 'rate'
  | 'power'
  | 'angularSpeed'
  | 'viscosity'
  | 'dimensionless';

interface UnitDef {
  readonly dimension: Dimension;
  /** Factor para pasar a la unidad base de la dimensión. */
  readonly toBase: number;
  readonly label: string;
}

/** Unidad base por dimensión: m, m², m³, m³/s, m/s, m/s, m²/s, s, kg/m³, K-offset no lineal (°C se trata aparte), rad, kg, kg/m³, Pa, m/m. */
const UNITS = {
  m: { dimension: 'length', toBase: 1, label: 'm' },
  mm: { dimension: 'length', toBase: 1e-3, label: 'mm' },
  m2: { dimension: 'area', toBase: 1, label: 'm²' },
  m3: { dimension: 'volume', toBase: 1, label: 'm³' },
  L: { dimension: 'volume', toBase: 1e-3, label: 'L' },
  'm3/s': { dimension: 'flow', toBase: 1, label: 'm³/s' },
  'm3/h': { dimension: 'flow', toBase: 1 / 3600, label: 'm³/h' },
  'm3/d': { dimension: 'flow', toBase: 1 / 86400, label: 'm³/d' },
  'L/s': { dimension: 'flow', toBase: 1e-3, label: 'L/s' },
  'm/s': { dimension: 'velocity', toBase: 1, label: 'm/s' },
  /** Carga hidráulica superficial m³/(m²·h) ≡ m/h. */
  'm3/(m2.h)': { dimension: 'surfaceLoading', toBase: 1 / 3600, label: 'm³/(m²·h)' },
  'm3/(m2.d)': { dimension: 'surfaceLoading', toBase: 1 / 86400, label: 'm³/(m²·d)' },
  'm3/(m.d)': { dimension: 'weirLoading', toBase: 1 / 86400, label: 'm³/(m·d)' },
  'm3/(m.h)': { dimension: 'weirLoading', toBase: 1 / 3600, label: 'm³/(m·h)' },
  s: { dimension: 'time', toBase: 1, label: 's' },
  min: { dimension: 'time', toBase: 60, label: 'min' },
  h: { dimension: 'time', toBase: 3600, label: 'h' },
  d: { dimension: 'time', toBase: 86400, label: 'd' },
  'mg/L': { dimension: 'concentration', toBase: 1e-3, label: 'mg/L' },
  'kg/m3': { dimension: 'density', toBase: 1, label: 'kg/m³' },
  'kg/d': { dimension: 'massFlow', toBase: 1 / 86400, label: 'kg/d' },
  'kg/h': { dimension: 'massFlow', toBase: 1 / 3600, label: 'kg/h' },
  /** Carga de sólidos superficial kg/(m²·d). */
  'kg/(m2.d)': { dimension: 'solidsLoading', toBase: 1 / 86400, label: 'kg/(m²·d)' },
  'kg/(m2.h)': { dimension: 'solidsLoading', toBase: 1 / 3600, label: 'kg/(m²·h)' },
  NTU: { dimension: 'turbidity', toBase: 1, label: 'NTU' },
  /** Gradiente de velocidad G. */
  '1/s': { dimension: 'rate', toBase: 1, label: 's⁻¹' },
  W: { dimension: 'power', toBase: 1, label: 'W' },
  kW: { dimension: 'power', toBase: 1000, label: 'kW' },
  'rad/s': { dimension: 'angularSpeed', toBase: 1, label: 'rad/s' },
  rpm: { dimension: 'angularSpeed', toBase: (2 * Math.PI) / 60, label: 'rpm' },
  'Pa.s': { dimension: 'viscosity', toBase: 1, label: 'Pa·s' },
  degC: { dimension: 'temperature', toBase: 1, label: '°C' },
  rad: { dimension: 'angle', toBase: 1, label: 'rad' },
  deg: { dimension: 'angle', toBase: Math.PI / 180, label: '°' },
  kg: { dimension: 'mass', toBase: 1, label: 'kg' },
  t: { dimension: 'mass', toBase: 1000, label: 't' },
  Pa: { dimension: 'stress', toBase: 1, label: 'Pa' },
  MPa: { dimension: 'stress', toBase: 1e6, label: 'MPa' },
  GPa: { dimension: 'stress', toBase: 1e9, label: 'GPa' },
  'm/m': { dimension: 'slope', toBase: 1, label: 'm/m' },
  '%': { dimension: 'dimensionless', toBase: 0.01, label: '%' },
  '-': { dimension: 'dimensionless', toBase: 1, label: '—' },
} as const satisfies Record<string, UnitDef>;

export type UnitId = keyof typeof UNITS;

export function unitLabel(u: UnitId): string {
  return UNITS[u].label;
}

export function dimensionOf(u: UnitId): Dimension {
  return UNITS[u].dimension;
}

export class UnitError extends Error {
  override name = 'UnitError';
}

/** Conversión genérica. Lanza si las dimensiones no coinciden: nunca convierte en silencio. */
export function convert(value: number, from: UnitId, to: UnitId): number {
  const a = UNITS[from];
  const b = UNITS[to];
  if (a.dimension !== b.dimension) {
    throw new UnitError(`No se puede convertir ${a.label} (${a.dimension}) a ${b.label} (${b.dimension})`);
  }
  return (value * a.toBase) / b.toBase;
}

// Conversiones nombradas usadas por los motores (spec §5.1: Q[m³/h] = 3,6·Q[L/s]).
export const lpsToM3h = (q: number): number => convert(q, 'L/s', 'm3/h');
export const lpsToM3s = (q: number): number => convert(q, 'L/s', 'm3/s');
export const m3hToM3d = (q: number): number => convert(q, 'm3/h', 'm3/d');
export const m3sToM3h = (q: number): number => convert(q, 'm3/s', 'm3/h');
export const degToRad = (a: number): number => convert(a, 'deg', 'rad');

/** Constantes físicas con su origen. */
export const PHYSICAL = {
  /** Aceleración de la gravedad estándar, m/s² (CGPM 1901 / ISO 80000-3). */
  g: 9.80665,
} as const;
