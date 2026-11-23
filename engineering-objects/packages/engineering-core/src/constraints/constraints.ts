import type { CheckStatus } from '../validation/checks.js';

/**
 * Restricción de rango sobre un valor. `min`/`max` son límites duros (FAIL);
 * `warnMin`/`warnMax` delimitan la banda recomendada (WARNING fuera de ella).
 */
export interface RangeConstraint {
  readonly min?: number;
  readonly max?: number;
  readonly warnMin?: number;
  readonly warnMax?: number;
}

export interface RangeEvaluation {
  readonly status: CheckStatus;
  readonly limit: string;
}

const fmt = (n: number) => (Math.abs(n) >= 100 ? n.toFixed(0) : Number(n.toPrecision(4)).toString());

/** Tolerancia relativa para no fallar por el último bit de coma flotante. */
const EPS = 1e-9;

export function evaluateRange(value: number, c: RangeConstraint): RangeEvaluation {
  const parts: string[] = [];
  if (c.min !== undefined) parts.push(`≥ ${fmt(c.min)}`);
  if (c.max !== undefined) parts.push(`≤ ${fmt(c.max)}`);
  if (c.warnMin !== undefined || c.warnMax !== undefined) {
    parts.push(`recomendado ${c.warnMin !== undefined ? fmt(c.warnMin) : '—'}…${c.warnMax !== undefined ? fmt(c.warnMax) : '—'}`);
  }
  const limit = parts.join('; ') || 'sin límite definido';
  if (!Number.isFinite(value)) return { status: 'FAIL', limit };
  const tol = (x: number) => Math.abs(x) * EPS + EPS;
  if (c.min !== undefined && value < c.min - tol(c.min)) return { status: 'FAIL', limit };
  if (c.max !== undefined && value > c.max + tol(c.max)) return { status: 'FAIL', limit };
  if (c.warnMin !== undefined && value < c.warnMin - tol(c.warnMin)) return { status: 'WARNING', limit };
  if (c.warnMax !== undefined && value > c.warnMax + tol(c.warnMax)) return { status: 'WARNING', limit };
  return { status: 'PASS', limit };
}

/** Holgura geométrica: distancia real frente a mínima. */
export function evaluateClearance(actual: number, required: number): RangeEvaluation {
  return evaluateRange(actual, { min: required });
}
