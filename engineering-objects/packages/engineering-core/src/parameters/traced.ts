import type { UnitId } from '../units/units.js';
import type { CheckStatus } from '../validation/checks.js';

/**
 * Valor calculado trazable (spec §2.4): valor, unidad, parámetros de origen, ecuación,
 * versión del método, estado y advertencias.
 */
export interface TracedValue {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly unit: UnitId;
  /** Parámetros de entrada o valores trazados de los que depende (por clave). */
  readonly inputs: readonly string[];
  /** Ecuación o regla en texto legible. */
  readonly equation: string;
  readonly methodVersion: string;
  /** Origen del valor: calculado, adoptado (redondeo/normalización), fijado por restricción o dato. */
  readonly origin: 'CALCULATED' | 'ADOPTED' | 'FIXED_BY_CONSTRAINT' | 'INPUT';
  readonly status: CheckStatus;
  readonly warnings: readonly string[];
}

export interface TraceOptions {
  label: string;
  unit: UnitId;
  inputs?: readonly string[];
  equation: string;
  origin?: TracedValue['origin'];
  status?: CheckStatus;
  warnings?: readonly string[];
}

/**
 * Registro de cálculo. Cada valor que produce un motor se registra aquí; el orden de inserción
 * es el orden de cálculo y sirve directamente para la memoria de cálculo.
 */
export class CalcTrace {
  private readonly values = new Map<string, TracedValue>();

  constructor(readonly methodVersion: string) {}

  record(key: string, value: number, opts: TraceOptions): number {
    if (!Number.isFinite(value)) {
      throw new Error(`Valor no finito al calcular "${key}" (${opts.equation}): ${value}`);
    }
    if (this.values.has(key)) throw new Error(`Valor trazado duplicado: ${key}`);
    for (const dep of opts.inputs ?? []) {
      if (!dep.startsWith('input.') && !this.values.has(dep)) {
        throw new Error(`"${key}" depende de "${dep}", que no se ha calculado antes`);
      }
    }
    this.values.set(key, {
      key,
      label: opts.label,
      value,
      unit: opts.unit,
      inputs: opts.inputs ?? [],
      equation: opts.equation,
      methodVersion: this.methodVersion,
      origin: opts.origin ?? 'CALCULATED',
      status: opts.status ?? 'PASS',
      warnings: opts.warnings ?? [],
    });
    return value;
  }

  get(key: string): number {
    const v = this.values.get(key);
    if (!v) throw new Error(`Valor trazado inexistente: ${key}`);
    return v.value;
  }

  has(key: string): boolean {
    return this.values.has(key);
  }

  entry(key: string): TracedValue | undefined {
    return this.values.get(key);
  }

  toRecord(): Record<string, TracedValue> {
    return Object.fromEntries(this.values);
  }

  list(): TracedValue[] {
    return [...this.values.values()];
  }

  /** Cierre transitivo de dependencias de un valor (para "¿de qué depende el diámetro?"). */
  dependenciesOf(key: string): string[] {
    const out = new Set<string>();
    const visit = (k: string) => {
      const v = this.values.get(k);
      for (const d of v?.inputs ?? []) {
        if (!out.has(d)) {
          out.add(d);
          visit(d);
        }
      }
    };
    visit(key);
    return [...out].sort();
  }
}
