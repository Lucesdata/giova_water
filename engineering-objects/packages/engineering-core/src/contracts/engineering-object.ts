import type { CheckResult, ValidationStatus, ValidationSummary } from '../validation/checks.js';
import type { TracedValue } from '../parameters/traced.js';

/**
 * Contrato público de un objeto de ingeniería (spec §9.3), con tipos concretos.
 * Las instancias son inmutables: createVariant devuelve un objeto nuevo y nunca altera el original.
 */
export interface ValidationResult {
  readonly status: ValidationStatus;
  readonly checks: readonly CheckResult[];
  readonly summary: ValidationSummary;
}

export interface CalculationResult {
  readonly engineeringModelVersion: string;
  readonly values: Readonly<Record<string, TracedValue>>;
}

export interface EngineeringObject<TParameters, TChanges, TComponent, TVariantOptions = unknown> {
  readonly id: string;
  readonly type: string;
  readonly schemaVersion: string;
  readonly definitionVersion: string;
  readonly parameters: Readonly<TParameters>;
  readonly components: readonly TComponent[];
  validate(): ValidationResult;
  calculate(): CalculationResult;
  createVariant(changes: TChanges, options?: TVariantOptions): EngineeringObject<TParameters, TChanges, TComponent, TVariantOptions>;
}

/** Identidad de variante (spec §9.4). */
export interface VariantIdentity {
  readonly objectId: string;
  readonly variantId: string;
  readonly parentVariantId: string | null;
  readonly schemaVersion: string;
  readonly engineeringModelVersion: string;
  readonly createdAt: string;
}
