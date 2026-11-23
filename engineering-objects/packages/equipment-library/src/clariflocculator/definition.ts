import { type CalculationResult, type EngineeringObject, type ValidationResult } from '@eo/engineering-core';
import { z } from 'zod';
import {
  compareVariantValues,
  createBaseVariantOf,
  createVariantOf,
  exportVariantOf,
  importVariantOf,
  regenerateOf,
  reproducesOf,
  type ComparisonRow,
  type EquipmentDefinition,
  type EquipmentVariant,
  type ImportResult,
  type VariantOptions,
} from '../shared/variants.js';
import type { EngineeringComponent } from '../primary-clarifier/definition/design.js';
import { DECISION_GROUP, RESIZE_GROUPS, type ResizeGroup } from '../primary-clarifier/definition/engine.js';
import { groupsRequiredFor } from '../primary-clarifier/definition/inputGroups.js';
import type { DeepPartial } from '../primary-clarifier/definition/schema.js';
import { designClariflocculator, type ClariflocculatorDesign, type ClfDecisions } from './design.js';
import { CLF_SCHEMA_VERSION, parseClfInput, type ClfInput, type ClfInputRaw } from './schema.js';
import { CLF_MODEL_VERSION } from './strategy.js';

export const CLF_OBJECT_TYPE = 'clariflocculator/circular-center-feed';
export const CLF_EXPORT_FORMAT = 'engineering-objects/clariflocculator-variant';
export const CLF_RESIZE_GROUPS: readonly ResizeGroup[] = [...RESIZE_GROUPS, 'flocculator'];

export type ClariflocculatorVariant = EquipmentVariant<ClfInput, ClfDecisions>;

/**
 * Entradas propias del clarifloculador que definen geometría instalada. La cámara usa el grupo
 * `feedwell` (ocupa su lugar); el agitador, el grupo `flocculator`. Tiempos, G, temperatura y velocidad
 * de las paletas son criterios u operación: se pueden cambiar con todo bloqueado.
 */
const CLF_GEOMETRY_INPUTS: Record<string, readonly ResizeGroup[]> = {
  'flocculation.chamberDepthM': ['feedwell'],
  'flocculation.chamberWallThicknessM': ['feedwell'],
  'flocculation.chamberMinInnerDiameterM': ['feedwell'],
  'flocculation.paddles.armCount': ['flocculator'],
  'flocculation.paddles.bladeWidthM': ['flocculator'],
  'flocculation.paddles.bladeHeightRatio': ['flocculator'],
  'flocculation.paddles.wallClearanceM': ['flocculator'],
  'flocculation.paddles.sleeveClearanceM': ['flocculator'],
  'flocculation.paddles.sleeveWallThicknessM': ['flocculator'],
  'flocculation.paddles.bladeThicknessM': ['flocculator'],
  'flocculation.drive.footprintM': ['flocculator'],
  'flocculation.drive.heightM': ['flocculator'],
};

export function clfGroupsRequiredFor(path: string): readonly ResizeGroup[] {
  return CLF_GEOMETRY_INPUTS[path] ?? groupsRequiredFor(path);
}

const dn = z.number().int().positive();
const lockSchema = z
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
    paddleRings: z.number().int().nonnegative(),
  } satisfies Record<keyof ClfDecisions, z.ZodTypeAny>)
  .partial()
  .strict();

export const CLARIFLOCCULATOR_DEFINITION: EquipmentDefinition<ClfInput, ClfDecisions, ClariflocculatorDesign> = {
  objectType: CLF_OBJECT_TYPE,
  exportFormat: CLF_EXPORT_FORMAT,
  schemaVersion: CLF_SCHEMA_VERSION,
  modelVersion: CLF_MODEL_VERSION,
  resizeGroups: CLF_RESIZE_GROUPS,
  decisionGroups: { ...DECISION_GROUP, paddleRings: 'flocculator' },
  lockSchema,
  parse: parseClfInput,
  tagOf: (i) => i.tag,
  design: (input, options) => designClariflocculator(input, options),
  groupsRequiredFor: clfGroupsRequiredFor,
};
const DEF = CLARIFLOCCULATOR_DEFINITION;

export const createClfBaseVariant = (raw: ClfInputRaw, opts: { objectId?: string; createdAt?: string; variantId?: string } = {}): ClariflocculatorVariant => createBaseVariantOf(DEF, raw, opts);
export const createClfVariant = (parent: ClariflocculatorVariant, changes: DeepPartial<ClfInputRaw>, opts: VariantOptions = {}): ClariflocculatorVariant => createVariantOf(DEF, parent, changes, opts);
export const regenerateClf = (v: ClariflocculatorVariant): ClariflocculatorDesign => regenerateOf(DEF, v);
export const reproducesClf = (v: ClariflocculatorVariant): boolean => reproducesOf(DEF, v);
export const exportClfVariant = (v: ClariflocculatorVariant): string => exportVariantOf(DEF, v);
export const importClfVariant = (json: string): ImportResult<ClfInput, ClfDecisions> => importVariantOf(DEF, json);

export const CLF_COMPARISON_KEYS = [
  'flow.avg.Ls',
  'flow.peak.Ls',
  'floc.volume.required',
  'feedwell.diameter',
  'floc.time.design',
  'floc.G',
  'floc.Gt',
  'floc.paddle.rpm',
  'floc.paddle.rings',
  'floc.power.delivered',
  'area.required',
  'tank.diameter',
  'settling.area',
  'loading.surface.avg',
  'hrt.avg',
  'loading.weir.peak',
  'inlet.dn',
  'bridge.span',
] as const;

export function compareClfVariants(variants: readonly ClariflocculatorVariant[], keys: readonly string[] = CLF_COMPARISON_KEYS): ComparisonRow[] {
  return compareVariantValues(variants, keys);
}

/** Contrato EngineeringObject para el clarifloculador. */
export class Clariflocculator implements EngineeringObject<ClfInput, DeepPartial<ClfInputRaw>, EngineeringComponent, VariantOptions> {
  readonly type = CLF_OBJECT_TYPE;
  readonly definitionVersion = CLF_MODEL_VERSION;
  private cached?: ClariflocculatorDesign;

  constructor(readonly variant: ClariflocculatorVariant) {}

  static create(input: ClfInputRaw, opts?: { createdAt?: string }): Clariflocculator {
    return new Clariflocculator(createClfBaseVariant(input, opts));
  }

  get id(): string {
    return this.variant.variantId;
  }
  get schemaVersion(): string {
    return this.variant.schemaVersion;
  }
  get parameters(): Readonly<ClfInput> {
    return this.variant.designInputs;
  }
  get design(): ClariflocculatorDesign {
    return (this.cached ??= regenerateClf(this.variant));
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
  createVariant(changes: DeepPartial<ClfInputRaw>, options?: VariantOptions): Clariflocculator {
    return new Clariflocculator(createClfVariant(this.variant, changes, options));
  }
}
