import { type CalculationResult, type EngineeringObject, type ValidationResult } from '@eo/engineering-core';
import { z } from 'zod';
import {
  compareVariantValues,
  createBaseVariantOf,
  createVariantOf,
  expectedLockKeysOf,
  exportVariantOf,
  importVariantOf,
  regenerateOf,
  reproducesOf,
  type CalculatedOutputs as GenericCalculatedOutputs,
  type ComparisonRow,
  type EquipmentDefinition,
  type EquipmentVariant,
  type ImportResult as GenericImportResult,
  type VariantMode,
  type VariantOptions,
} from '../../shared/variants.js';
import { designClarifier, type ClarifierDesign, type EngineeringComponent } from './design.js';
import { DECISION_GROUP, ENGINEERING_MODEL_VERSION, RESIZE_GROUPS, type ResizeGroup, type SizingDecisions } from './engine.js';
import { groupsRequiredFor } from './inputGroups.js';
import { SCHEMA_VERSION, parseDesignInput, type DeepPartial, type DesignInput, type DesignInputRaw } from './schema.js';

export { mergeInputs, VariantLibrary, type ComparisonRow, type VariantMode, type VariantOptions } from '../../shared/variants.js';

export const OBJECT_TYPE = 'primary-clarifier/circular-center-feed';
export const EXPORT_FORMAT = 'engineering-objects/primary-clarifier-variant';

export type CalculatedOutputs = GenericCalculatedOutputs<SizingDecisions>;
export type ClarifierVariant = EquipmentVariant<DesignInput, SizingDecisions>;
export type ImportResult = GenericImportResult<DesignInput, SizingDecisions>;

const dn = z.number().int().positive();
/** Forma en tiempo de ejecución de las decisiones bloqueadas: nombres y dominios de valor. */
const lockedDecisionsSchema = z
  .object({
    diameterM: z.number().finite().positive(),
    sideWaterDepthM: z.number().finite().positive(),
    inletDn: dn,
    portHeightM: z.number().finite().positive(),
    feedwellDiameterM: z.number().finite().positive(),
    notchCount: z.number().int().nonnegative(),
    effluentDn: dn,
    sludgeDn: dn,
    referenceWaterAvgY: z.number().finite(),
    referenceWaterPeakY: z.number().finite(),
  } satisfies Record<keyof SizingDecisions, z.ZodTypeAny>)
  .partial()
  .strict();

/** Definición del decantador primario para el ciclo de vida de variantes común. */
export const PRIMARY_CLARIFIER_DEFINITION: EquipmentDefinition<DesignInput, SizingDecisions, ClarifierDesign> = {
  objectType: OBJECT_TYPE,
  exportFormat: EXPORT_FORMAT,
  schemaVersion: SCHEMA_VERSION,
  modelVersion: ENGINEERING_MODEL_VERSION,
  resizeGroups: RESIZE_GROUPS,
  decisionGroups: DECISION_GROUP,
  lockSchema: lockedDecisionsSchema,
  parse: parseDesignInput,
  tagOf: (i) => i.tag,
  design: (input, options) => designClarifier(input, options),
  groupsRequiredFor,
};
const DEF = PRIMARY_CLARIFIER_DEFINITION;

/** Decisiones que deben venir bloqueadas según el modo (contrato de una variante válida). */
export function expectedLockKeys(mode: VariantMode, allowedResize: readonly ResizeGroup[] | null): (keyof SizingDecisions)[] {
  return expectedLockKeysOf(DECISION_GROUP, mode, allowedResize) as (keyof SizingDecisions)[];
}

export function createBaseVariant(rawInput: DesignInputRaw, opts: { objectId?: string; createdAt?: string; variantId?: string } = {}): ClarifierVariant {
  return createBaseVariantOf(DEF, rawInput, opts);
}

/** Genera una variante nueva. La variante padre es inmutable (congelada) y no se modifica. */
export function createVariant(parent: ClarifierVariant, changes: DeepPartial<DesignInputRaw>, opts: VariantOptions = {}): ClarifierVariant {
  return createVariantOf(DEF, parent, changes, opts);
}

/** Regenera el diseño completo (geometría incluida) de una variante. Determinista. */
export function regenerate(v: ClarifierVariant): ClarifierDesign {
  return regenerateOf(DEF, v);
}

/** ¿La variante se reproduce bit a bit con el modelo actual? */
export function reproduces(v: ClarifierVariant): boolean {
  return reproducesOf(DEF, v);
}

export function exportVariant(v: ClarifierVariant): string {
  return exportVariantOf(DEF, v);
}

/**
 * Importa una variante: valida el sobre y las entradas, aplica migraciones y RECALCULA.
 * Nunca se confía en las salidas almacenadas: se comparan con las recalculadas.
 */
export function importVariant(json: string): ImportResult {
  return importVariantOf(DEF, json);
}

export const COMPARISON_KEYS = [
  'flow.avg.Ls',
  'flow.peak.Ls',
  'area.required',
  'tank.diameter.theoretical',
  'tank.diameter',
  'tank.depth',
  'volume.effective',
  'hrt.avg',
  'loading.surface.avg',
  'loading.surface.peak',
  'loading.weir.peak',
  'weir.notchCount',
  'weir.head.peak',
  'inlet.dn',
  'effluent.dn',
  'sludge.dn',
  'feedwell.diameter',
  'arm.length',
  'bridge.span',
  'civil.channelOuterDiameter',
] as const;

export function compareVariants(variants: readonly EquipmentVariant<unknown, unknown>[], keys: readonly string[] = COMPARISON_KEYS): ComparisonRow[] {
  return compareVariantValues(variants, keys);
}

/**
 * Implementación del contrato EngineeringObject para el decantador primario. Envuelve una
 * variante inmutable; el diseño completo (geometría) se regenera bajo demanda y se memoiza.
 */
export class PrimaryClarifier implements EngineeringObject<DesignInput, DeepPartial<DesignInputRaw>, EngineeringComponent, VariantOptions> {
  readonly type = OBJECT_TYPE;
  readonly definitionVersion = ENGINEERING_MODEL_VERSION;
  private cached?: ClarifierDesign;

  constructor(readonly variant: ClarifierVariant) {}

  static create(input: DesignInputRaw, opts?: { createdAt?: string }): PrimaryClarifier {
    return new PrimaryClarifier(createBaseVariant(input, opts));
  }

  get id(): string {
    return this.variant.variantId;
  }
  get schemaVersion(): string {
    return this.variant.schemaVersion;
  }
  get parameters(): Readonly<DesignInput> {
    return this.variant.designInputs;
  }
  get design(): ClarifierDesign {
    return (this.cached ??= regenerate(this.variant));
  }
  get components(): readonly EngineeringComponent[] {
    return this.design.components;
  }

  validate(): ValidationResult {
    const o = this.variant.calculatedOutputs;
    return { status: this.variant.validationStatus, checks: o.checks, summary: o.summary };
  }

  calculate(): CalculationResult {
    return { engineeringModelVersion: this.variant.engineeringModelVersion, values: this.variant.calculatedOutputs.values };
  }

  createVariant(changes: DeepPartial<DesignInputRaw>, options?: VariantOptions): PrimaryClarifier {
    return new PrimaryClarifier(createVariant(this.variant, changes, options));
  }
}
