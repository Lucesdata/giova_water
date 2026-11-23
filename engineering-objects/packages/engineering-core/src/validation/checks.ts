/**
 * Validación en cuatro niveles (spec §11).
 */
export type CheckStatus = 'PASS' | 'WARNING' | 'FAIL' | 'NOT_EVALUATED';

export type ValidationLevel = 1 | 2 | 3 | 4;

export const LEVEL_NAMES: Record<ValidationLevel, string> = {
  1: 'Datos',
  2: 'Hidráulica',
  3: 'Geometría',
  4: 'Ingeniería constructiva',
};

export interface CheckResult {
  readonly id: string;
  readonly level: ValidationLevel;
  readonly status: CheckStatus;
  readonly title: string;
  readonly message: string;
  readonly value?: number;
  readonly limit?: string;
  readonly unit?: string;
  readonly componentIds?: readonly string[];
  readonly sourceId?: string;
  /** Una comprobación crítica sin evaluar impide declarar el equipo validado. */
  readonly critical: boolean;
}

/**
 * Estado global de una variante:
 *  - FAILED: al menos un FAIL.
 *  - INCOMPLETE: sin FAIL, pero con comprobaciones críticas NOT_EVALUATED (p. ej. estructura).
 *  - VALIDATED_WITH_WARNINGS / VALIDATED.
 */
export type ValidationStatus = 'FAILED' | 'INCOMPLETE' | 'VALIDATED_WITH_WARNINGS' | 'VALIDATED';

export interface ValidationSummary {
  readonly status: ValidationStatus;
  readonly counts: Readonly<Record<CheckStatus, number>>;
  readonly byLevel: Readonly<Record<ValidationLevel, Readonly<Record<CheckStatus, number>>>>;
  readonly pendingCritical: readonly string[];
  readonly failures: readonly string[];
}

const emptyCounts = (): Record<CheckStatus, number> => ({ PASS: 0, WARNING: 0, FAIL: 0, NOT_EVALUATED: 0 });

export function summarize(checks: readonly CheckResult[]): ValidationSummary {
  const counts = emptyCounts();
  const byLevel = { 1: emptyCounts(), 2: emptyCounts(), 3: emptyCounts(), 4: emptyCounts() };
  for (const c of checks) {
    counts[c.status]++;
    byLevel[c.level][c.status]++;
  }
  const failures = checks.filter((c) => c.status === 'FAIL').map((c) => c.id);
  const pendingCritical = checks.filter((c) => c.critical && c.status === 'NOT_EVALUATED').map((c) => c.id);
  let status: ValidationStatus;
  if (failures.length > 0) status = 'FAILED';
  else if (pendingCritical.length > 0) status = 'INCOMPLETE';
  else if (counts.WARNING > 0) status = 'VALIDATED_WITH_WARNINGS';
  else status = 'VALIDATED';
  return { status, counts, byLevel, pendingCritical, failures };
}

/** Utilidad para construir comprobaciones sin repetir campos. */
export class CheckList {
  private readonly items: CheckResult[] = [];

  add(c: Omit<CheckResult, 'critical'> & { critical?: boolean }): CheckResult {
    if (this.items.some((x) => x.id === c.id)) throw new Error(`Comprobación duplicada: ${c.id}`);
    const full: CheckResult = { ...c, critical: c.critical ?? false };
    this.items.push(full);
    return full;
  }

  list(): CheckResult[] {
    return [...this.items];
  }
}
